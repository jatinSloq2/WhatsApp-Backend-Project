// ============================================
// FILE: backend/message-service/src/server.js
// ============================================

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import messageRoutes, { webhookRouter } from './routes/message.routes.js';
import { errorHandler } from '../../shared/middleware/error.middleware.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/messages', messageRoutes);
app.use(webhookRouter);

// Error handler
app.use(errorHandler);

// Socket.io authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);

  // Join session room
  socket.on('join_session', ({ sessionId }) => {
    socket.join(`session:${sessionId}`);
    console.log(`User ${socket.userId} joined session:${sessionId}`);
  });

  // Join chat room
  socket.on('join_chat', ({ sessionId, chatId }) => {
    socket.join(`chat:${sessionId}:${chatId}`);
    console.log(`User ${socket.userId} joined chat:${sessionId}:${chatId}`);
  });

  // Leave chat room
  socket.on('leave_chat', ({ sessionId, chatId }) => {
    socket.leave(`chat:${sessionId}:${chatId}`);
  });

  // Typing indicator
  socket.on('typing', ({ sessionId, chatId, isTyping }) => {
    socket.to(`chat:${sessionId}:${chatId}`).emit('user_typing', {
      userId: socket.userId,
      isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    const PORT = process.env.PORT || 8003;
    httpServer.listen(PORT, () => {
      console.log(`✅ Message Service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Export io for use in other modules
export { io };