// ============================================
// FILE 1: backend/shared/config/database.js (FIXED)
// ============================================
import mongoose from "mongoose";

// Increase buffer timeout to handle model registration
mongoose.set('bufferTimeoutMS', 30000); // 30 seconds

class Database {
  constructor() {
    this.connection = null;
  }

  async connect(uri) {
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return mongoose.connection;
    }

    try {
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      // Connect using the default connection
      await mongoose.connect(uri, options);
      
      // Store reference to the default connection
      this.connection = mongoose.connection;

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

      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
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

  getConnection() {
    return mongoose.connection;
  }
}

const database = new Database();
export default database;