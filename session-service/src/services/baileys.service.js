// ============================================
// FILE 2: backend/session-service/src/services/baileys.service.js
// ============================================

import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import P from 'pino';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SESSION_DIR = path.join(__dirname, '../../baileys_auth');
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// Configuration
const MAX_RETRIES = 5;
const RECONNECT_DELAY = 2000;
const KEEP_ALIVE_INTERVAL = 30000;
const PONG_TIMEOUT = 60000;

// Internal state
const sessions = new Map();
const qrStore = new Map();
const retries = new Map();
const intentionalDeletions = new Set();
const socketActive = new Map();
const startLocks = new Set();
const deleteLocks = new Set();

// Event emitter for external listeners
import { EventEmitter } from 'events';
const baileyEvents = new EventEmitter();

// Helpers
function ts() {
  return new Date().toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata', 
    hour12: false 
  });
}

function log(sessionId, message) {
  console.log(`[${ts()}] [${sessionId}] ${message}`);
}

function authPathFor(sessionId) {
  return path.join(SESSION_DIR, sessionId);
}

// Retry logic
function shouldReconnect(sessionId) {
  if (intentionalDeletions.has(sessionId)) {
    log(sessionId, 'shouldReconnect: intentional deletion -> false');
    return false;
  }
  const attempts = retries.get(sessionId) ?? 0;
  if (attempts < MAX_RETRIES) {
    retries.set(sessionId, attempts + 1);
    log(sessionId, `Reconnect attempt ${attempts + 1}/${MAX_RETRIES}`);
    return true;
  }
  log(sessionId, `Max reconnect attempts reached (${MAX_RETRIES})`);
  return false;
}

function resetRetries(sessionId) {
  if (retries.has(sessionId)) retries.delete(sessionId);
}

// Internal start socket
async function _startSocketInternal(sessionId) {
  const authPath = authPathFor(sessionId);
  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version } = await fetchLatestBaileysVersion();

  log(sessionId, 'Starting WhatsApp socket...');

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: 'silent' }),
    syncFullHistory: false,
    markOnlineOnConnect: false
  });

  const meta = {
    keepAliveIntervalId: null,
    lastPong: Date.now()
  };

  sessions.set(sessionId, { sock, meta });

  sock.ev.on('creds.update', saveCreds);

  // Keep-alive
  function startKeepAlive() {
    if (meta.keepAliveIntervalId) {
      clearInterval(meta.keepAliveIntervalId);
      meta.keepAliveIntervalId = null;
    }

    try {
      sock.ws?.on('pong', () => {
        meta.lastPong = Date.now();
        log(sessionId, 'PONG received');
      });
    } catch (e) {
      // Ignore
    }

    meta.keepAliveIntervalId = setInterval(async () => {
      try {
        if (sock?.user) {
          log(sessionId, 'Sending keep-alive');
          try { await sock.sendPresenceUpdate('available'); } catch (e) {}
          try { sock.ws?.ping(); } catch (e) {}
        }

        if (Date.now() - meta.lastPong > PONG_TIMEOUT) {
          log(sessionId, `No PONG for ${PONG_TIMEOUT}ms — forcing reconnect`);
          try { sock.ws?.close(); } catch (e) {}
        }
      } catch (e) {
        log(sessionId, `KeepAlive error: ${e?.message || e}`);
      }
    }, KEEP_ALIVE_INTERVAL);
  }

  startKeepAlive();

  // Message events
  sock.ev.on('messages.upsert', (m) => {
    meta.lastPong = Date.now();
    baileyEvents.emit('messages.upsert', sessionId, m);
  });

  sock.ev.on('messages.update', (m) => {
    baileyEvents.emit('messages.update', sessionId, m);
  });

  // Connection updates
  sock.ev.on('connection.update', async (update) => {
    try {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrStore.set(sessionId, qr);
        log(sessionId, 'QR Generated');
        baileyEvents.emit('qr', sessionId, qr);
      }

      if (connection === 'open') {
        log(sessionId, 'Connected successfully');
        resetRetries(sessionId);
        qrStore.delete(sessionId);
        intentionalDeletions.delete(sessionId);
        meta.lastPong = Date.now();
        baileyEvents.emit('connected', sessionId, sock.user);
      }

      if (connection === 'close') {
        const error = lastDisconnect?.error;
        const code = error?.output?.statusCode ?? 0;

        log(sessionId, `Connection closed with code ${code}`);
        socketActive.set(sessionId, false);

        const isLoggedOut = code === DisconnectReason.loggedOut;
        const isReplaced = code === DisconnectReason.connectionReplaced;
        const isBadSession = code === DisconnectReason.badSession;

        try {
          if (meta.keepAliveIntervalId) {
            clearInterval(meta.keepAliveIntervalId);
            meta.keepAliveIntervalId = null;
          }
        } catch (e) {}

        sessions.delete(sessionId);

        if (isLoggedOut || isBadSession || isReplaced) {
          log(sessionId, 'Terminal disconnect. Deleting session.');
          baileyEvents.emit('disconnected', sessionId, 'terminal');
          await deleteSession(sessionId).catch(err => 
            log(sessionId, `deleteSession error: ${err?.message || err}`)
          );
          return;
        }

        baileyEvents.emit('disconnected', sessionId, 'retry');

        if (shouldReconnect(sessionId)) {
          log(sessionId, `Reconnecting in ${RECONNECT_DELAY}ms...`);
          setTimeout(() => {
            if (socketActive.get(sessionId)) {
              log(sessionId, 'Reconnect aborted: another start in progress');
              return;
            }
            startSocket(sessionId).catch(err => 
              log(sessionId, `Reconnection failed: ${err?.message || err}`)
            );
          }, RECONNECT_DELAY);
          return;
        }

        log(sessionId, 'Max retries reached. Cleaning up.');
        await deleteSession(sessionId).catch(() => {});
      }
    } catch (e) {
      log(sessionId, `connection.update error: ${e?.message || e}`);
    }
  });

  try {
    sock.ws.on('close', (code, reason) => {
      log(sessionId, `ws closed: ${code} ${reason || ''}`);
      socketActive.set(sessionId, false);
    });
    sock.ws.on('error', err => 
      log(sessionId, `ws error: ${err?.message || err}`)
    );
  } catch (e) {
    // Ignore
  }

  socketActive.set(sessionId, true);
  return sock;
}

// Public start socket
async function startSocket(sessionId) {
  if (socketActive.get(sessionId)) {
    log(sessionId, 'startSocket skipped: already active');
    const ent = sessions.get(sessionId);
    return ent?.sock ?? null;
  }

  if (startLocks.has(sessionId)) {
    log(sessionId, 'startSocket skipped: lock present');
    const ent = sessions.get(sessionId);
    return ent?.sock ?? null;
  }

  startLocks.add(sessionId);

  try {
    const existing = sessions.get(sessionId);
    if (existing?.sock) {
      log(sessionId, 'Socket already present');
      socketActive.set(sessionId, true);
      return existing.sock;
    }
    const sock = await _startSocketInternal(sessionId);
    return sock;
  } finally {
    startLocks.delete(sessionId);
  }
}

// Create session
async function createSession(sessionId) {
  const status = getSessionStatus(sessionId);
  log(sessionId, `createSession called (status: ${status})`);
  
  if (status === 'connected' || status === 'initializing' || status === 'qr_waiting') {
    log(sessionId, `Already ${status} — skipping`);
    return;
  }

  retries.delete(sessionId);
  await startSocket(sessionId);
}

// Get session
function getSession(sessionId) {
  return sessions.get(sessionId)?.sock ?? null;
}

// Get QR
function getQR(sessionId) {
  return qrStore.get(sessionId) ?? null;
}

// Delete session
async function deleteSession(sessionId) {
  if (deleteLocks.has(sessionId)) {
    log(sessionId, 'deleteSession skipped: already deleting');
    return;
  }
  
  deleteLocks.add(sessionId);
  intentionalDeletions.add(sessionId);

  try {
    log(sessionId, 'Deleting session...');
    const ent = sessions.get(sessionId);
    const sock = ent?.sock;

    if (sock) {
      try {
        log(sessionId, 'Logging out remotely...');
        await sock.logout();
      } catch (e) {
        log(sessionId, `Logout error: ${e?.message || e}`);
      }
      try {
        log(sessionId, 'Closing ws...');
        sock.ws?.close();
      } catch (e) {
        log(sessionId, `ws close error: ${e?.message || e}`);
      }
    }

    try {
      if (ent?.meta?.keepAliveIntervalId) {
        clearInterval(ent.meta.keepAliveIntervalId);
      }
    } catch (e) {}

    sessions.delete(sessionId);
    retries.delete(sessionId);
    qrStore.delete(sessionId);

    const authPath = authPathFor(sessionId);
    if (fs.existsSync(authPath)) {
      try {
        fs.rmSync(authPath, { recursive: true, force: true });
        log(sessionId, 'Auth folder removed');
      } catch (e) {
        log(sessionId, `Auth removal failed: ${e?.message || e}`);
      }
    }

    log(sessionId, 'Session deleted');
    baileyEvents.emit('session_deleted', sessionId);
    return true;
  } finally {
    intentionalDeletions.delete(sessionId);
    deleteLocks.delete(sessionId);
    socketActive.set(sessionId, false);
  }
}

// Status helpers
function getSessionStatus(sessionId) {
  const ent = sessions.get(sessionId);
  if (!ent) {
    if (qrStore.has(sessionId)) return 'qr_waiting';
    return 'no_session';
  }
  const sock = ent.sock;
  if (sock?.user) return 'connected';
  if (qrStore.has(sessionId)) return 'qr_waiting';
  return 'initializing';
}

function listSessions() {
  const ids = new Set([...sessions.keys(), ...qrStore.keys()]);
  return Array.from(ids).map(id => ({
    sessionId: id,
    status: getSessionStatus(id)
  }));
}

// Send message
async function sendMessage(sessionId, to, message, options = {}) {
  const sock = getSession(sessionId);
  if (!sock) {
    throw new Error('Session not found or not connected');
  }

  try {
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    const result = await sock.sendMessage(jid, { text: message, ...options });
    return result;
  } catch (error) {
    log(sessionId, `sendMessage error: ${error?.message || error}`);
    throw error;
  }
}

// Send media
async function sendMedia(sessionId, to, mediaBuffer, mediaType, caption, options = {}) {
  const sock = getSession(sessionId);
  if (!sock) {
    throw new Error('Session not found or not connected');
  }

  try {
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    
    const mediaMessage = {
      [mediaType]: mediaBuffer,
      caption: caption || '',
      ...options
    };

    const result = await sock.sendMessage(jid, mediaMessage);
    return result;
  } catch (error) {
    log(sessionId, `sendMedia error: ${error?.message || error}`);
    throw error;
  }
}

export default {
  createSession,
  getSession,
  getQR,
  deleteSession,
  listSessions,
  getSessionStatus,
  sendMessage,
  sendMedia,
  baileyEvents
};