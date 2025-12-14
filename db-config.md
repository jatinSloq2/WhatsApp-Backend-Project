```js
// backend/shared/database/mongodb.js
// MongoDB Connection Configuration

const mongoose = require('mongoose');

// ============================================
// DATABASE CONNECTION
// ============================================

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp_manager';
      
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4 // Use IPv4, skip trying IPv6
      };

      this.connection = await mongoose.connect(MONGODB_URI, options);

      console.log(`
╔════════════════════════════════════════════╗
║   MongoDB Connected Successfully           ║
║   Database: ${mongoose.connection.db.databaseName}                  ║
║   Host: ${mongoose.connection.host}                ║
╚════════════════════════════════════════════╝
      `);

      // Connection events
      mongoose.connection.on('connected', () => {
        console.log('✅ Mongoose connected to DB');
      });

      mongoose.connection.on('error', (err) => {
        console.error('❌ Mongoose connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ Mongoose disconnected');
      });

      // Graceful shutdown
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
      console.log('MongoDB connection closed through app termination');
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    }
  }

  getConnection() {
    return this.connection;
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

const database = new Database();

module.exports = database;

// ============================================
// USAGE IN SERVICES
// ============================================

/*
// In your service's server.js:

const database = require('./shared/database/mongodb');

async function startServer() {
  // Connect to database
  await database.connect();
  
  // Start your Express server
  app.listen(PORT, () => {
    console.log(`Service running on port ${PORT}`);
  });
}

startServer();
*/
```