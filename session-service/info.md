# 🔌 Session Service - Setup & API Documentation

## 📁 Complete File Structure Created

```
backend/
├── session-service/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── session.controller.js    ✅ Created
│   │   ├── services/
│   │   │   ├── baileys.service.js       ✅ Created
│   │   │   └── session.service.js       ✅ Created
│   │   ├── models/
│   │   │   └── session.model.js         ✅ Created
│   │   ├── routes/
│   │   │   └── session.routes.js        ✅ Created
│   │   ├── middleware/
│   │   │   └── validation.js            ✅ Created
│   │   ├── events/
│   │   │   └── whatsapp.events.js       ✅ Created
│   │   └── server.js                    ✅ Created
│   ├── baileys_auth/                    📁 Will be auto-created
│   ├── logs/                            📁 Will be auto-created
│   ├── package.json                     ✅ Created
│   ├── .env.example                     ✅ Created
│   └── Dockerfile                       ✅ Created
```

---

## 🚀 Setup Instructions

### **Step 1: Install Dependencies**

```bash
cd backend/session-service
npm install
```

### **Step 2: Setup Environment**

```bash
cp .env.example .env
nano .env
```

Make sure to use the **same JWT_SECRET** as Auth Service!

### **Step 3: Start Session Service**

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### **Step 4: Verify Service is Running**

```bash
curl http://localhost:8002/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "session-service",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "database": "connected"
}
```

---

## 📡 API Endpoints

### **Base URL**: `http://localhost:8002`
### **All endpoints require Bearer token authentication**

---

### 1️⃣ **Create Session (Generate QR)**

**POST** `/sessions`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request Body:**
```json
{
  "phoneNumber": "+919876543210",
  "sessionName": "My Business WhatsApp"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Session created successfully. Scan QR code to connect.",
  "data": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "sessionId": "session_65a1b2c3_1705318200000",
    "userId": "65a1b2c3d4e5f6a7b8c9d0e1",
    "phoneNumber": "+919876543210",
    "sessionName": "My Business WhatsApp",
    "status": "initializing",
    "isActive": true,
    "retryCount": 0,
    "createdAt": "2024-01-15T12:00:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  },
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

---

### 2️⃣ **Get QR Code**

**GET** `/sessions/:sessionId/qr`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "message": "QR code generated",
  "data": {
    "qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "text": "2@abc123def456..."
  },
  "timestamp": "2024-01-15T12:01:00.000Z"
}
```

---

### 3️⃣ **Get All Sessions**

**GET** `/sessions`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "sessions": [
      {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
        "sessionId": "session_65a1b2c3_1705318200000",
        "userId": "65a1b2c3d4e5f6a7b8c9d0e1",
        "phoneNumber": "+919876543210",
        "sessionName": "My Business WhatsApp",
        "status": "connected",
        "isActive": true,
        "connectedAt": "2024-01-15T12:05:00.000Z",
        "lastSeen": "2024-01-15T12:30:00.000Z"
      }
    ],
    "count": 1
  },
  "timestamp": "2024-01-15T12:30:00.000Z"
}
```

---

### 4️⃣ **Get Session Details**

**GET** `/sessions/:sessionId`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "sessionId": "session_65a1b2c3_1705318200000",
    "userId": "65a1b2c3d4e5f6a7b8c9d0e1",
    "phoneNumber": "+919876543210",
    "sessionName": "My Business WhatsApp",
    "status": "connected",
    "isActive": true,
    "connectedAt": "2024-01-15T12:05:00.000Z",
    "lastSeen": "2024-01-15T12:30:00.000Z",
    "metadata": {
      "waVersion": "2.2350.5",
      "platform": "smba"
    }
  },
  "timestamp": "2024-01-15T12:30:00.000Z"
}
```

---

### 5️⃣ **Get Session Status**

**GET** `/sessions/:sessionId/status`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "sessionId": "session_65a1b2c3_1705318200000",
    "status": "connected",
    "connectedAt": "2024-01-15T12:05:00.000Z",
    "lastSeen": "2024-01-15T12:30:00.000Z"
  },
  "timestamp": "2024-01-15T12:30:00.000Z"
}
```

**Possible Status Values:**
- `initializing` - Session is starting
- `qr_waiting` - Waiting for QR scan
- `connected` - Successfully connected
- `disconnected` - Disconnected
- `error` - Error occurred

---

### 6️⃣ **Update Session**

**PUT** `/sessions/:sessionId`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request Body:**
```json
{
  "sessionName": "Updated Session Name"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Session updated successfully",
  "data": {
    "sessionId": "session_65a1b2c3_1705318200000",
    "sessionName": "Updated Session Name",
    "status": "connected"
  },
  "timestamp": "2024-01-15T12:35:00.000Z"
}
```

---

### 7️⃣ **Logout Session**

**POST** `/sessions/:sessionId/logout`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "message": "Session logged out successfully",
  "data": {
    "message": "Session logged out successfully"
  },
  "timestamp": "2024-01-15T12:40:00.000Z"
}
```

---

### 8️⃣ **Delete Session**

**DELETE** `/sessions/:sessionId`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "message": "Session deleted successfully",
  "data": {
    "message": "Session deleted successfully"
  },
  "timestamp": "2024-01-15T12:45:00.000Z"
}
```

---

## 🔌 WebSocket Events (Socket.io)

### **Connection**

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:8002', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected to Session Service');
});
```

---

### **Subscribe to Session Updates**

```javascript
// Subscribe to specific session
socket.emit('subscribe_session', {
  sessionId: 'session_65a1b2c3_1705318200000'
});
```

---

### **Listen for QR Code**

```javascript
socket.on('qr_code', (data) => {
  console.log('QR Code:', data);
  // {
  //   sessionId: 'session_65a1b2c3_1705318200000',
  //   qr: '2@abc123def456...'
  // }
  
  // Display QR code to user
  displayQRCode(data.qr);
});
```

---

### **Listen for Session Status**

```javascript
socket.on('session_status', (data) => {
  console.log('Session Status:', data);
  // {
  //   sessionId: 'session_65a1b2c3_1705318200000',
  //   status: 'connected',
  //   user: {
  //     id: '919876543210:1@s.whatsapp.net',
  //     name: 'John Doe'
  //   }
  // }
  
  if (data.status === 'connected') {
    console.log('WhatsApp connected successfully!');
  }
});
```

---

### **Listen for Incoming Messages**

```javascript
socket.on('messages_received', (data) => {
  console.log('Messages Received:', data);
  // {
  //   sessionId: 'session_65a1b2c3_1705318200000',
  //   messages: [...],
  //   type: 'notify'
  // }
  
  data.messages.forEach(msg => {
    console.log('New message:', msg.message.conversation);
  });
});
```

---

### **Listen for Message Status Updates**

```javascript
socket.on('message_status', (data) => {
  console.log('Message Status Update:', data);
  // {
  //   sessionId: 'session_65a1b2c3_1705318200000',
  //   updates: [
  //     { key: {...}, update: { status: 2 } } // 2 = delivered
  //   ]
  // }
});
```

---

### **Unsubscribe from Session**

```javascript
socket.emit('unsubscribe_session', {
  sessionId: 'session_65a1b2c3_1705318200000'
});
```

---

## 🧪 Testing Flow

### **1. Create Session and Get QR**

```bash
# Step 1: Create session
curl -X POST http://localhost:8002/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919876543210",
    "sessionName": "Test Session"
  }'

# Step 2: Get QR code
curl -X GET http://localhost:8002/sessions/SESSION_ID/qr \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **2. Check Status**

```bash
curl -X GET http://localhost:8002/sessions/SESSION_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **3. List All Sessions**

```bash
curl -X GET http://localhost:8002/sessions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Session Lifecycle

```
1. Create Session → status: initializing
   ↓
2. QR Generated → status: qr_waiting
   ↓
3. User Scans QR → status: connected
   ↓
4. Active Session → Real-time messaging
   ↓
5. Logout/Delete → status: disconnected
```

---

## 🔥 Key Features

✅ **Multi-session support** - Multiple WhatsApp numbers per user
✅ **QR code generation** - Base64 data URLs
✅ **Real-time updates** - Socket.io events
✅ **Auto-reconnection** - Handles disconnects
✅ **Keep-alive** - Maintains connection
✅ **Session persistence** - MongoDB storage
✅ **Session restoration** - Restores on server restart
✅ **Baileys v6+** - Latest WhatsApp Web API

---

## ⚠️ Important Notes

1. **Same JWT Secret**: Auth Service and Session Service must use the same `JWT_SECRET`
2. **Phone Format**: Use international format with country code (e.g., +919876543210)
3. **QR Expiry**: QR codes expire after ~60 seconds, generate new ones if needed
4. **Session Limits**: Based on user subscription tier (free: 1, pro: 3, business: 10)
5. **Auto-restore**: Active sessions are restored when server restarts

---

## 🔗 Integration with Frontend

```javascript
// Example: React component for WhatsApp connection

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import QRCode from 'react-qr-code';

function WhatsAppConnect() {
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState('disconnected');
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    
    // Connect to Socket.io
    const socket = io('http://localhost:8002', {
      auth: { token }
    });

    // Create session
    axios.post('http://localhost:8002/sessions', {
      phoneNumber: '+919876543210',
      sessionName: 'My WhatsApp'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const sid = res.data.data.sessionId;
      setSessionId(sid);
      
      // Subscribe to session events
      socket.emit('subscribe_session', { sessionId: sid });
    });

    // Listen for QR
    socket.on('qr_code', (data) => {
      setQr(data.qr);
      setStatus('qr_waiting');
    });

    // Listen for status
    socket.on('session_status', (data) => {
      setStatus(data.status);
      if (data.status === 'connected') {
        setQr(null);
      }
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div>
      <h2>WhatsApp Connection</h2>
      <p>Status: {status}</p>
      
      {qr && status === 'qr_waiting' && (
        <div>
          <h3>Scan QR Code with WhatsApp:</h3>
          <QRCode value={qr} />
        </div>
      )}
      
      {status === 'connected' && (
        <div>
          <h3>✅ Connected Successfully!</h3>
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Next Steps

✅ Auth Service - Complete
✅ Session Service - Complete
⏭️ Next: **Message Service** (send/receive messages with storage)

Ready for Message Service? 🚀