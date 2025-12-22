// controllers/session.controller.js
import * as whatsapp from '../services/baileys.service.js';
import QRCode from 'qrcode';
import Session from '../models/session.model.js'

export const createSession = async (req, res) => {
    const { id } = req.body;

    console.log(`[CREATE] Request received for session: ${id}`);

    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Session ID required"
        });
    }

    try {
        // Check if session exists in DB
        let dbSession = await Session.findOne({ sessionId: id });
        
        // Check current status
        const statusInfo = await whatsapp.getSessionStatus(id);
        const existingStatus = statusInfo.status;

        if (existingStatus === "connected") {
            console.log(`[CREATE] Session already connected: ${id}`);
            
            // Update DB if needed
            if (dbSession) {
                await dbSession.updateStatus('connected', statusInfo.phoneNumber);
            }
            
            return res.json({
                success: true,
                message: "Session already connected",
                data: { 
                    status: "connected",
                    phoneNumber: statusInfo.phoneNumber
                }
            });
        }

        // If session exists but not connected, delete it
        if (existingStatus !== "no_session") {
            console.log(`[CREATE] Cleaning up existing session: ${id}`);
            await whatsapp.deleteSession(id);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Create/update session in DB
        if (!dbSession) {
            dbSession = await Session.create({
                sessionId: id,
                status: 'initializing',
                isActive: true
            });
            console.log(`[CREATE] Created new session in DB: ${id}`);
        } else {
            dbSession.status = 'initializing';
            dbSession.isActive = true;
            dbSession.retryCount = 0;
            await dbSession.save();
            console.log(`[CREATE] Updated existing session in DB: ${id}`);
        }

        console.log(`[CREATE] Starting new session: ${id}`);
        await whatsapp.createSession(id);

        console.log(`[CREATE] Waiting for QR...`);

        let qrString = null;
        const maxWait = 20000;       // 20 seconds
        const interval = 500;        // check every 0.5 sec
        let waited = 0;

        while (waited < maxWait) {
            qrString = whatsapp.getQR(id);

            if (qrString) break;

            // If session suddenly connects, stop waiting
            const currentStatus = await whatsapp.getSessionStatus(id);
            if (currentStatus.status === "connected") {
                // Update DB
                await dbSession.updateStatus('connected', currentStatus.phoneNumber);
                
                return res.json({
                    success: true,
                    message: "Device connected",
                    data: { 
                        status: "connected",
                        phoneNumber: currentStatus.phoneNumber
                    }
                });
            }

            await new Promise(resolve => setTimeout(resolve, interval));
            waited += interval;
        }

        if (!qrString) {
            // Update DB: timeout
            dbSession.status = 'disconnected';
            await dbSession.save();
            
            return res.status(504).json({
                success: false,
                message: "QR generation timeout. Try again."
            });
        }

        // Update DB: QR ready
        dbSession.status = 'qr_waiting';
        dbSession.qrGenerated = true;
        await dbSession.save();

        const qrBase64 = await QRCode.toDataURL(qrString);

        return res.json({
            success: true,
            message: "QR generated",
            data: {
                sessionId: id,
                status: "qr_ready",
                qr: qrBase64
            }
        });

    } catch (error) {
        console.error(`[CREATE] Error:`, error);
        
        // Update DB on error
        try {
            const dbSession = await Session.findOne({ sessionId: id });
            if (dbSession) {
                dbSession.status = 'disconnected';
                await dbSession.save();
            }
        } catch (dbError) {
            console.error(`[CREATE] DB error:`, dbError);
        }
        
        return res.status(500).json({
            success: false,
            message: "Failed to create session",
            error: error.message
        });
    }
};

export const getSessionStatus = async (req, res) => {
    const { sessionId } = req.params;

    console.log(`[STATUS] Request for session status: ${sessionId}`);

    try {
        const statusInfo = await whatsapp.getSessionStatus(sessionId);
        const sock = whatsapp.getSession(sessionId);
        
        // Also get DB info
        const dbSession = await Session.findOne({ sessionId });

        console.log(`[STATUS] Current status of ${sessionId}: ${statusInfo.status}`);

        // If connected → return 200
        if (statusInfo.status === "connected") {
            // Ensure DB is synced
            if (dbSession && dbSession.status !== 'connected') {
                await dbSession.updateStatus('connected', statusInfo.phoneNumber);
            }
            
            return res.status(200).json({
                success: true,
                status: "connected",
                data: {
                    phone: statusInfo.phoneNumber || sock?.user?.id,
                    lastConnected: dbSession?.lastConnected,
                    retryCount: dbSession?.retryCount || 0
                }
            });
        }

        if (statusInfo.status === "no_session") {
            return res.status(404).json({
                success: false,
                status: "no_session",
                data: dbSession ? {
                    lastDisconnected: dbSession.lastDisconnected,
                    lastPhone: dbSession.phoneNumber
                } : null
            });
        }

        // Any other status → return 400
        return res.status(400).json({
            success: false,
            status: statusInfo.status,
            message: "Session not connected",
            data: dbSession ? {
                retryCount: dbSession.retryCount,
                qrGenerated: dbSession.qrGenerated
            } : null
        });

    } catch (error) {
        console.error(`[STATUS] Error getting status for ${sessionId}:`, error);

        return res.status(500).json({
            success: false,
            message: "Error getting session status",
            error: error.message
        });
    }
};

export const deleteSession = async (req, res) => {
    const { sessionId } = req.params;

    console.log(`[DELETE] Request to delete session: ${sessionId}`);

    try {
        // Delete from service (memory + auth files)
        await whatsapp.deleteSession(sessionId);
        
        // Mark as inactive in DB (already done in service, but double-check)
        await Session.markInactive(sessionId);

        console.log(`[DELETE] Session deleted: ${sessionId}`);

        return res.json({ 
            success: true, 
            message: "Session deleted successfully"
        });
    } catch (error) {
        console.error(`[DELETE] Error deleting session ${sessionId}:`, error);
        return res.status(500).json({
            success: false,
            message: "Error deleting session",
            error: error.message
        });
    }
};

export const listSessions = async (req, res) => {
    console.log(`[LIST] Request to list all sessions`);

    try {
        // Get sessions from service (includes memory state)
        const list = await whatsapp.listSessions();

        console.log(`[LIST] Total sessions: ${list.length}`);

        return res.json({
            success: true,
            count: list.length,
            sessions: list
        });
    } catch (error) {
        console.error("[LIST] Error listing sessions:", error);
        return res.status(500).json({
            success: false,
            message: "Error listing sessions",
            error: error.message
        });
    }
};

// Get all sessions from DB (including inactive)
export const getAllSessionsFromDB = async (req, res) => {
    console.log(`[DB_LIST] Request to list all DB sessions`);

    try {
        const sessions = await Session.find({})
            .sort({ updatedAt: -1 })
            .select('-__v');

        return res.json({
            success: true,
            count: sessions.length,
            sessions
        });
    } catch (error) {
        console.error("[DB_LIST] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching sessions from DB",
            error: error.message
        });
    }
};

// Restore sessions on server restart
export const restoreSessions = async (req, res) => {
    console.log(`[RESTORE] Request to restore sessions`);

    try {
        await whatsapp.restoreSessions();

        return res.json({
            success: true,
            message: "Sessions restoration initiated"
        });
    } catch (error) {
        console.error("[RESTORE] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Error restoring sessions",
            error: error.message
        });
    }
};