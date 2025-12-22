import axios from "axios";
import Session from "../models/session.model.js";
import * as whatsappService from "../services/baileys.service.js";
import Campaign from "../models/campaign.model.js"

/* -------------------------------------------------------------------------- */
/*                        SESSION VALIDATION (FINAL)                           */
/* -------------------------------------------------------------------------- */

export const validateActiveSession = async (sessionId) => {
  if (!sessionId) {
    return {
      ok: false,
      status: 400,
      message: "Session ID is required",
    };
  }

  // 1. DB check
  const dbSession = await Session.findOne({
    sessionId,
    isActive: true,
  });

  if (!dbSession) {
    return {
      ok: false,
      status: 404,
      message: "Session does not exist or is inactive",
    };
  }

  // 2. Service status check
  const statusInfo = await whatsappService.getSessionStatus(sessionId);

  if (statusInfo.status !== "connected") {
    return {
      ok: false,
      status: 400,
      message: `Session not connected (status: ${statusInfo.status})`,
    };
  }

  // 3. Socket existence check
  const sock = whatsappService.getSession(sessionId);
  if (!sock) {
    return {
      ok: false,
      status: 404,
      message: "Session not loaded in memory",
    };
  }

  return {
    ok: true,
    sock,
    dbSession,
    statusInfo,
  };
};

/* -------------------------------------------------------------------------- */
/*                                HELPERS                                     */
/* -------------------------------------------------------------------------- */

const downloadMedia = async (url) => {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data);
};

const formatPhoneNumber = (number) => {
  let clean = String(number).replace(/\D/g, "");

  if (clean.length === 10) clean = "91" + clean;
  if (clean.length < 10) return null;

  return `${clean}@s.whatsapp.net`;
};

const isNumberOnWhatsApp = async (sock, jid) => {
  try {
    const [result] = await sock.onWhatsApp(jid);
    return Boolean(result?.exists);
  } catch {
    return false;
  }
};

/* -------------------------------------------------------------------------- */
/*                             SEND SINGLE MESSAGE                             */
/* -------------------------------------------------------------------------- */

export const sendMessage = async (req, res) => {

  let campaign;

  try {
    const { id } = req.query;
    const { receiver, message } = req.body;

    if (!receiver || !message || typeof message !== "object") {
      return res.status(400).json({
        success: false,
        message: "receiver and message object are required",
      });
    }

    // ✅ CENTRAL SESSION VALIDATION
    const sessionCheck = await validateActiveSession(id);
    if (!sessionCheck.ok) {
      return res.status(sessionCheck.status).json({
        success: false,
        message: sessionCheck.message,
      });
    }

    const { sock } = sessionCheck;

    campaign = await Campaign.create({
      sessionId: id,
      type: "single",
      receiver,
      message,
      total: 1,
      status: "running",
    });

    const jid = formatPhoneNumber(receiver);
    if (!jid) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    const exists = await isNumberOnWhatsApp(sock, jid);
    if (!exists) {
      return res.status(400).json({
        success: false,
        message: "Number not registered on WhatsApp",
      });
    }

    let payload = null;

    if (message.text) payload = { text: message.text };

    const mediaUrl =
      message?.image?.url ||
      message?.video?.url ||
      message?.audio?.url ||
      message?.document?.url ||
      null;

    if (mediaUrl) {
      const buffer = await downloadMedia(mediaUrl);
      const caption = message.caption || "";
      const mimetype = message.mimetype || "";

      if (message.image?.url) payload = { image: buffer, caption };
      else if (message.video?.url) payload = { video: buffer, caption };
      else if (message.audio?.url) payload = { audio: buffer, mimetype };
      else if (message.document?.url) {
        payload = {
          document: buffer,
          mimetype,
          caption,
          fileName: mediaUrl.split("/").pop() || "file",
        };
      }
    }

    if (!payload) {
      return res.status(400).json({
        success: false,
        message: "Unsupported message payload",
      });
    }

    const sent = await sock.sendMessage(jid, payload);

    await Campaign.findByIdAndUpdate(campaign._id, {
      sentCount: 1,
      status: "completed",
    });

    return res.json({
      success: true,
      message: "Message sent successfully",
      data: {
        messageId: sent.key.id,
        to: jid,
        timestamp: sent.messageTimestamp,
      },
    });
  } catch (error) {
    if (campaign?._id) {
      await Campaign.findByIdAndUpdate(campaign._id, {
        failedCount: 1,
        status: "failed",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

/* -------------------------------------------------------------------------- */
/*                             BULK MESSAGE SENDER                             */
/* -------------------------------------------------------------------------- */

export const bulkMessageSender = async (req, res) => {

  let campaign;
  try {
    const { id, numbers, message, delay = 2000 } = req.body;

    if (!Array.isArray(numbers) || numbers.length === 0 || !message) {
      return res.status(400).json({
        success: false,
        message: "id, numbers array and message are required",
      });
    }

    // ✅ CENTRAL SESSION VALIDATION
    const sessionCheck = await validateActiveSession(id);
    if (!sessionCheck.ok) {
      return res.status(sessionCheck.status).json({
        success: false,
        message: sessionCheck.message,
      });
    }

    const { sock } = sessionCheck;

    campaign = await Campaign.create({
      sessionId: id,
      type: "bulk",
      numbers,
      message,
      total: numbers.length,
      status: "running",
    });

    res.json({
      success: true,
      message: "Bulk request accepted",
      totalNumbers: numbers.length,
    });

    const mediaUrl =
      message?.image?.url ||
      message?.video?.url ||
      message?.audio?.url ||
      message?.document?.url ||
      null;

    let mediaBuffer = null;
    let mediaType = null;
    const caption = message.caption || "";
    const mimetype = message.mimetype || "";

    if (mediaUrl) {
      mediaBuffer = await downloadMedia(mediaUrl);
      if (message.image?.url) mediaType = "image";
      else if (message.video?.url) mediaType = "video";
      else if (message.audio?.url) mediaType = "audio";
      else if (message.document?.url) mediaType = "document";
    }

    (async () => {
      for (let i = 0; i < numbers.length; i++) {
        try {
          const jid = formatPhoneNumber(numbers[i]);
          if (!jid) continue;

          const exists = await isNumberOnWhatsApp(sock, jid);
          if (!exists) continue;

          let payload = null;

          if (message.text) payload = { text: message.text };

          if (mediaBuffer) {
            if (mediaType === "image") payload = { image: mediaBuffer, caption };
            else if (mediaType === "video") payload = { video: mediaBuffer, caption };
            else if (mediaType === "audio") payload = { audio: mediaBuffer, mimetype };
            else if (mediaType === "document") {
              payload = {
                document: mediaBuffer,
                mimetype,
                caption,
                fileName: mediaUrl.split("/").pop() || "file",
              };
            }
          }

          if (!payload) continue;

          await sock.sendMessage(jid, payload);

          
          if (i < numbers.length - 1) {
            await new Promise((r) => setTimeout(r, delay));
          }
          await Campaign.findByIdAndUpdate(campaign._id, {
            $inc: { sentCount: 1 },
          });
        } catch (err) {
          await Campaign.findByIdAndUpdate(campaign._id, {
            $inc: { failedCount: 1 },
          });
          continue;
        }
      }
      await Campaign.findByIdAndUpdate(campaign._id, {
        status: "completed",
      });
    })();



  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Bulk sending failed",
        error: error.message,
      });
    }
  }
};
