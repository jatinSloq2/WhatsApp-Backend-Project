// server.js or app.js
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import database from '../../shared/config/database.js';
import { errorHandler, notFoundHandler } from '../../shared/middleware/errorHandler.js';
import sessionRoutes from './routes/session.routes.js';
import messageRoutes from './routes/message.routes.js';
import logger from '../../shared/utils/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/sessions', sessionRoutes);
app.use('/messages', messageRoutes);

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


// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'Session Service',
    version: '1.0.0',
    status: 'running'
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
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    await database.connect(process.env.MONGODB_URI);

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║   🚀 Session Service Started                  ║
║   Port: ${PORT}                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}    ║
║   URL: http://localhost:${PORT}            ║
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
  await database.disconnect();
  process.exit(0);
});