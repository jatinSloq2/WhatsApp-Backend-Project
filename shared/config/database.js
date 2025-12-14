// ============================================
// FILE 1: backend/shared/config/database.js
// ============================================

import mongoose from "mongoose";


mongoose.set('bufferCommands', false);

class Database {
  constructor() {
    this.connection = null;
  }

  async connect(uri) {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    try {
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      this.connection = await mongoose.connect(uri, options);
      // ✅ ENSURE FULL READINESS
      await mongoose.connection.asPromise();
      console.log(`
╔════════════════════════════════════════════╗
║   MongoDB Connected Successfully           ║
║   Database: ${mongoose.connection.db.databaseName}       ║
║   Host: ${mongoose.connection.host}                ║
╚════════════════════════════════════════════╝
      `);

      mongoose.connection.on('error', (err) => {
        console.error('❌ Mongoose connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ Mongoose disconnected');
      });

      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    }
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

const database = new Database();
export default database;
