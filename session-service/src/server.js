// ============================================
// FILE 8: backend/session-service/src/server.js
// ============================================

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import database from '../../shared/config/database.js';
import sessionRoutes from './routes/session.routes.js';
import { errorHandler, notFoundHandler } from '../../shared/middleware/errorHandler.js';
import logger from '../../shared/utils/logger.js';
import { setupWhatsAppEvents } from './events/whatsapp.events.js';
import sessionService from './services/session.service.js';
import { verifyToken } from '../../shared/utils/jwt.util.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 8002;

// ============================================
// SOCKET.IO SETUP
// ============================================

const io = new SocketIO(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Socket.io authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = verifyToken(token);
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;
    
    next();
  } catch (error) {
    next(new Error('Invalid authentication token'));
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id} (User: ${socket.userEmail})`);

  // Join user's personal room
  socket.join(`user_${socket.userId}`);

  // Subscribe to session updates
  socket.on('subscribe_session', ({ sessionId }) => {
    socket.join(sessionId);
    console.log(`Socket ${socket.id} subscribed to session: ${sessionId}`);
  });

  // Unsubscribe from session updates
  socket.on('unsubscribe_session', ({ sessionId }) => {
    socket.leave(sessionId);
    console.log(`Socket ${socket.id} unsubscribed from session: ${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Setup WhatsApp events
setupWhatsAppEvents(io);

// Make io available in request object
app.set('io', io);

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// ============================================
// ROUTES
// ============================================

app.use('/sessions', sessionRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'Session Service',
    version: '1.0.0',
    status: 'running'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'session-service',
    timestamp: new Date().toISOString(),
    database: database.isConnected() ? 'connected' : 'disconnected'
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    // Connect to database
    await database.connect();

    // Restore active sessions
    await sessionService.restoreSessions();

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║   🚀 Session Service Started               ║
║   Port: ${PORT}                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}    ║
║   HTTP: http://localhost:${PORT}           ║
║   WebSocket: ws://localhost:${PORT}        ║
╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
  await database.disconnect();
  process.exit(0);
});
