// services/baileys.service.js
// Compatible with @whiskeysockets/baileys v6+
// With MongoDB integration

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";

import P from "pino";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Session from "../models/Session.model.js";

/* ------------------------------------------------------------------ */
/* __dirname replacement for ES modules */
/* ------------------------------------------------------------------ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ------------------------------------------------------------------ */

const SESSION_DIR = path.join(__dirname, "../baileys_auth");
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

// ======= Configuration =======
const MAX_RETRIES = 5;
const RECONNECT_DELAY = 2000;        // ms
const KEEP_ALIVE_INTERVAL = 30_000;  // ms
const PONG_TIMEOUT = 60_000;         // ms
const STORE_BACKUP_INTERVAL = 120_000;

// ======= Internal state =======
const sessions = new Map();
const qrStore = new Map();
const retries = new Map();
const intentionalDeletions = new Set();

const socketActive = new Map();
const startLocks = new Set();
const deleteLocks = new Set();

// ======= Helpers =======
function ts() {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: false
  });
}

function log(sessionId, message) {
  console.log(`[${ts()}] [${sessionId}] ${message}`);
}

function authPathFor(sessionId) {
  return path.join(SESSION_DIR, sessionId);
}

// ======= DB Sync Helpers =======
async function updateSessionInDB(sessionId, updates) {
  try {
    const session = await Session.findOne({ sessionId });
    if (session) {
      Object.assign(session, updates);
      await session.save();
      log(sessionId, `DB updated: ${JSON.stringify(updates)}`);
    }
  } catch (error) {
    log(sessionId, `DB update error: ${error.message}`);
  }
}

// ======= Retry logic =======
function shouldReconnect(sessionId) {
  if (intentionalDeletions.has(sessionId)) {
    log(sessionId, "shouldReconnect: intentional deletion -> false");
    return false;
  }

  const attempts = retries.get(sessionId) ?? 0;
  if (attempts < MAX_RETRIES) {
    retries.set(sessionId, attempts + 1);
    log(sessionId, `Reconnect attempt ${attempts + 1}/${MAX_RETRIES}`);
    
    // Update retry count in DB
    updateSessionInDB(sessionId, { retryCount: attempts + 1 });
    
    return true;
  }

  log(sessionId, `Max reconnect attempts reached (${MAX_RETRIES})`);
  return false;
}

function resetRetries(sessionId) {
  retries.delete(sessionId);
  updateSessionInDB(sessionId, { retryCount: 0 });
}

// ======= Internal start =======
async function _startSocketInternal(sessionId) {
  const authPath = authPathFor(sessionId);
  if (!fs.existsSync(authPath)) fs.mkdirSync(authPath, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version } = await fetchLatestBaileysVersion();

  log(sessionId, "Starting WhatsApp socket (internal)...");

  // Update DB: initializing
  await updateSessionInDB(sessionId, { status: 'initializing' });

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    syncFullHistory: false,
    markOnlineOnConnect: false
  });

  const meta = {
    keepAliveIntervalId: null,
    backupIntervalId: null,
    lastPong: Date.now()
  };

  sessions.set(sessionId, { sock, meta });

  sock.ev.on("creds.update", saveCreds);

  // ===== Keep Alive =====
  function startKeepAlive() {
    if (meta.keepAliveIntervalId) {
      clearInterval(meta.keepAliveIntervalId);
    }

    try {
      sock.ws?.on("pong", () => {
        meta.lastPong = Date.now();
        log(sessionId, "PONG received");
      });
    } catch {}

    meta.keepAliveIntervalId = setInterval(async () => {
      if (sock?.user) {
        try { await sock.sendPresenceUpdate("available"); } catch {}
        try { sock.ws?.ping(); } catch {}
      }

      if (Date.now() - meta.lastPong > PONG_TIMEOUT) {
        log(sessionId, "No PONG received — forcing reconnect");
        try { sock.ws?.close(); } catch {}
      }
    }, KEEP_ALIVE_INTERVAL);
  }

  startKeepAlive();

  // ===== Backup =====
  meta.backupIntervalId = setInterval(() => {
    try {
      fs.writeFileSync(
        path.join(authPath, ".alive"),
        `${new Date().toISOString()}\n`,
        "utf8"
      );
    } catch (e) {
      log(sessionId, `Backup error: ${e?.message}`);
    }
  }, STORE_BACKUP_INTERVAL);

  // ===== Events =====
  sock.ev.on("messages.upsert", () => {
    meta.lastPong = Date.now();
  });

  sock.ev.on("connection.update", async update => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrStore.set(sessionId, qr);
      log(sessionId, "QR Generated");
      
      // Update DB: QR waiting
      await updateSessionInDB(sessionId, { 
        status: 'qr_waiting',
        qrGenerated: true 
      });
    }

    if (connection === "open") {
      resetRetries(sessionId);
      qrStore.delete(sessionId);
      intentionalDeletions.delete(sessionId);
      meta.lastPong = Date.now();
      log(sessionId, "Connected");
      
      // Update DB: connected
      const phoneNumber = sock.user?.id?.split(':')[0] || null;
      await updateSessionInDB(sessionId, { 
        status: 'connected',
        phoneNumber,
        lastConnected: new Date(),
        isActive: true,
        retryCount: 0
      });
    }

    if (connection === "close") {
      socketActive.set(sessionId, false);

      const code =
        lastDisconnect?.error?.output?.statusCode ??
        lastDisconnect?.error?.statusCode ??
        0;

      sessions.delete(sessionId);
      
      // Update DB: disconnected
      await updateSessionInDB(sessionId, { 
        status: 'disconnected',
        lastDisconnected: new Date()
      });

      if (
        code === DisconnectReason.loggedOut ||
        code === DisconnectReason.badSession ||
        code === DisconnectReason.connectionReplaced
      ) {
        await deleteSession(sessionId);
        return;
      }

      if (shouldReconnect(sessionId)) {
        setTimeout(() => startSocket(sessionId), RECONNECT_DELAY);
      } else {
        await deleteSession(sessionId);
      }
    }
  });

  socketActive.set(sessionId, true);
  return sock;
}

// ======= Public APIs =======
async function startSocket(sessionId) {
  if (socketActive.get(sessionId) || startLocks.has(sessionId)) {
    return sessions.get(sessionId)?.sock ?? null;
  }

  startLocks.add(sessionId);
  try {
    return await _startSocketInternal(sessionId);
  } finally {
    startLocks.delete(sessionId);
  }
}

export async function createSession(sessionId) {
  // Create or update session in DB
  await Session.findOrCreate(sessionId);
  
  retries.delete(sessionId);
  return startSocket(sessionId);
}

export function getSession(sessionId) {
  return sessions.get(sessionId)?.sock ?? null;
}

export function getQR(sessionId) {
  return qrStore.get(sessionId) ?? null;
}

export async function deleteSession(sessionId) {
  if (deleteLocks.has(sessionId)) return;

  deleteLocks.add(sessionId);
  intentionalDeletions.add(sessionId);

  try {
    const ent = sessions.get(sessionId);
    if (ent?.sock) {
      try { await ent.sock.logout(); } catch {}
      try { ent.sock.ws?.close(); } catch {}
    }

    sessions.delete(sessionId);
    qrStore.delete(sessionId);
    retries.delete(sessionId);

    const authPath = authPathFor(sessionId);
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
    }
    
    // Mark as inactive in DB
    await Session.markInactive(sessionId);
    
  } finally {
    socketActive.set(sessionId, false);
    intentionalDeletions.delete(sessionId);
    deleteLocks.delete(sessionId);
  }
}

export async function getSessionStatus(sessionId) {
  const ent = sessions.get(sessionId);
  
  let status;
  if (!ent) {
    status = qrStore.has(sessionId) ? "qr_waiting" : "no_session";
  } else if (ent.sock?.user) {
    status = "connected";
  } else {
    status = "initializing";
  }
  
  // Also fetch from DB for consistency
  const dbSession = await Session.findOne({ sessionId });
  
  return {
    status,
    dbStatus: dbSession?.status || 'no_session',
    phoneNumber: dbSession?.phoneNumber || ent?.sock?.user?.id?.split(':')[0] || null,
    isActive: dbSession?.isActive || false
  };
}

export async function listSessions() {
  // Get active sessions from memory
  const memorySessions = [...new Set([...sessions.keys(), ...qrStore.keys()])];
  
  // Get all sessions from DB
  const dbSessions = await Session.find({ isActive: true });
  
  // Merge and return
  const allSessionIds = new Set([
    ...memorySessions,
    ...dbSessions.map(s => s.sessionId)
  ]);
  
  return Promise.all(
    [...allSessionIds].map(async id => {
      const statusInfo = await getSessionStatus(id);
      return {
        sessionId: id,
        status: statusInfo.status,
        phoneNumber: statusInfo.phoneNumber,
        isActive: statusInfo.isActive
      };
    })
  );
}

// ======= Restore sessions on startup =======
export async function restoreSessions() {
  try {
    const activeSessions = await Session.find({ 
      isActive: true,
      status: 'connected'
    });
    
    log('SYSTEM', `Found ${activeSessions.length} active sessions to restore`);
    
    for (const session of activeSessions) {
      const authPath = authPathFor(session.sessionId);
      
      // Only restore if auth files exist
      if (fs.existsSync(authPath)) {
        log(session.sessionId, 'Restoring session...');
        await createSession(session.sessionId);
      } else {
        log(session.sessionId, 'Auth files not found, marking inactive');
        await Session.markInactive(session.sessionId);
      }
    }
  } catch (error) {
    log('SYSTEM', `Error restoring sessions: ${error.message}`);
  }
}