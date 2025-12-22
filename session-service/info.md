# WhatsApp Session Management API Documentation

## Base URL
```
http://localhost:8002/sessions
```

---

## 📋 Table of Contents
1. [Create Session](#1-create-session)
2. [Get Session Status](#2-get-session-status)
3. [Delete Session](#3-delete-session)
4. [List Active Sessions](#4-list-active-sessions)
5. [Get All Sessions from DB](#5-get-all-sessions-from-db)
6. [Restore Sessions](#6-restore-sessions)
7. [Health Check](#7-health-check)

---

## 1. Create Session

Creates a new WhatsApp session and generates a QR code for authentication.

### Endpoint
```
POST /api/sessions/create
```

### Request Body
```json
{
  "id": "user123"
}
```

### Request Parameters
| Field | Type   | Required | Description           |
|-------|--------|----------|-----------------------|
| id    | string | Yes      | Unique session identifier |

### Success Responses

#### Case 1: QR Code Generated
**Status Code:** `200 OK`
```json
{
  "success": true,
  "message": "QR generated",
  "data": {
    "sessionId": "user123",
    "status": "qr_ready",
    "qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

#### Case 2: Already Connected
**Status Code:** `200 OK`
```json
{
  "success": true,
  "message": "Session already connected",
  "data": {
    "status": "connected",
    "phoneNumber": "919876543210"
  }
}
```

#### Case 3: Device Connected During Wait
**Status Code:** `200 OK`
```json
{
  "success": true,
  "message": "Device connected",
  "data": {
    "status": "connected",
    "phoneNumber": "919876543210"
  }
}
```

### Error Responses

#### Missing Session ID
**Status Code:** `400 Bad Request`
```json
{
  "success": false,
  "message": "Session ID required"
}
```

#### QR Generation Timeout
**Status Code:** `504 Gateway Timeout`
```json
{
  "success": false,
  "message": "QR generation timeout. Try again."
}
```

#### Server Error
**Status Code:** `500 Internal Server Error`
```json
{
  "success": false,
  "message": "Failed to create session",
  "error": "Error details here"
}
```

### cURL Example
```bash
curl -X POST http://localhost:8002/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"id": "user123"}'
```

---

## 2. Get Session Status

Retrieves the current status of a WhatsApp session.

### Endpoint
```
GET /api/sessions/status/:sessionId
```

### URL Parameters
| Parameter | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| sessionId | string | Yes      | Session identifier    |

### Success Responses

#### Connected Session
**Status Code:** `200 OK`
```json
{
  "success": true,
  "status": "connected",
  "data": {
    "phone": "919876543210",
    "lastConnected": "2024-12-22T10:30:00.000Z",
    "retryCount": 0
  }
}
```

#### Session Not Connected
**Status Code:** `400 Bad Request`
```json
{
  "success": false,
  "status": "initializing",
  "message": "Session not connected",
  "data": {
    "retryCount": 2,
    "qrGenerated": true
  }
}
```

**Note:** Status can be: `initializing`, `qr_waiting`, `disconnected`

### Error Responses

#### Session Not Found
**Status Code:** `404 Not Found`
```json
{
  "success": false,
  "status": "no_session",
  "data": {
    "lastDisconnected": "2024-12-22T09:00:00.000Z",
    "lastPhone": "919876543210"
  }
}
```

#### Server Error
**Status Code:** `500 Internal Server Error`
```json
{
  "success": false,
  "message": "Error getting session status",
  "error": "Error details here"
}
```

### cURL Example
```bash
curl -X GET http://localhost:8002/sessions/status/user123
```

---

## 3. Delete Session

Deletes a WhatsApp session and removes authentication data.

### Endpoint
```
DELETE /api/sessions/:sessionId
```

### URL Parameters
| Parameter | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| sessionId | string | Yes      | Session identifier    |

### Success Response
**Status Code:** `200 OK`
```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

### Error Response
**Status Code:** `500 Internal Server Error`
```json
{
  "success": false,
  "message": "Error deleting session",
  "error": "Error details here"
}
```

### cURL Example
```bash
curl -X DELETE http://localhost:8002/sessions/user123
```

---

## 4. List Active Sessions

Returns all currently active WhatsApp sessions.

### Endpoint
```
GET /api/sessions/list
```

### Success Response
**Status Code:** `200 OK`
```json
{
  "success": true,
  "count": 3,
  "sessions": [
    {
      "sessionId": "user123",
      "status": "connected",
      "phoneNumber": "919876543210",
      "isActive": true
    },
    {
      "sessionId": "user456",
      "status": "qr_waiting",
      "phoneNumber": null,
      "isActive": true
    },
    {
      "sessionId": "user789",
      "status": "initializing",
      "phoneNumber": null,
      "isActive": true
    }
  ]
}
```

### Response Fields
| Field       | Type    | Description                           |
|-------------|---------|---------------------------------------|
| sessionId   | string  | Unique session identifier             |
| status      | string  | Current session status                |
| phoneNumber | string  | WhatsApp phone number (if connected)  |
| isActive    | boolean | Whether session is active             |

### Possible Status Values
- `initializing` - Session is starting up
- `qr_waiting` - Waiting for QR code scan
- `connected` - Successfully connected
- `disconnected` - Session disconnected
- `no_session` - No session exists

### Error Response
**Status Code:** `500 Internal Server Error`
```json
{
  "success": false,
  "message": "Error listing sessions",
  "error": "Error details here"
}
```

### cURL Example
```bash
curl -X GET http://localhost:8002/sessions/list
```

---

## 5. Get All Sessions from DB

Retrieves all sessions from the database, including inactive ones.

### Endpoint
```
GET /api/sessions/db/all
```

### Success Response
**Status Code:** `200 OK`
```json
{
  "success": true,
  "count": 5,
  "sessions": [
    {
      "_id": "6765abc123def456789012",
      "sessionId": "user123",
      "status": "connected",
      "phoneNumber": "919876543210",
      "lastConnected": "2024-12-22T10:30:00.000Z",
      "lastDisconnected": null,
      "qrGenerated": true,
      "retryCount": 0,
      "isActive": true,
      "metadata": {},
      "createdAt": "2024-12-22T09:00:00.000Z",
      "updatedAt": "2024-12-22T10:30:00.000Z"
    },
    {
      "_id": "6765abc123def456789013",
      "sessionId": "user456",
      "status": "disconnected",
      "phoneNumber": "918765432109",
      "lastConnected": "2024-12-21T15:00:00.000Z",
      "lastDisconnected": "2024-12-22T08:00:00.000Z",
      "qrGenerated": true,
      "retryCount": 5,
      "isActive": false,
      "metadata": {},
      "createdAt": "2024-12-21T14:00:00.000Z",
      "updatedAt": "2024-12-22T08:00:00.000Z"
    }
  ]
}
```

### Response Fields
| Field            | Type    | Description                              |
|------------------|---------|------------------------------------------|
| _id              | string  | MongoDB document ID                      |
| sessionId        | string  | Unique session identifier                |
| status           | string  | Current session status                   |
| phoneNumber      | string  | WhatsApp phone number                    |
| lastConnected    | date    | Last connection timestamp                |
| lastDisconnected | date    | Last disconnection timestamp             |
| qrGenerated      | boolean | Whether QR was generated                 |
| retryCount       | number  | Number of reconnection attempts          |
| isActive         | boolean | Whether session is currently active      |
| metadata         | object  | Additional metadata (key-value pairs)    |
| createdAt        | date    | Session creation timestamp               |
| updatedAt        | date    | Last update timestamp                    |

### Error Response
**Status Code:** `500 Internal Server Error`
```json
{
  "success": false,
  "message": "Error fetching sessions from DB",
  "error": "Error details here"
}
```

### cURL Example
```bash
curl -X GET http://localhost:8002/sessions/db/all
```

---

## 6. Restore Sessions

Restores all active sessions after a server restart. This endpoint is automatically called on server startup.

### Endpoint
```
POST /api/sessions/restore
```

### Success Response
**Status Code:** `200 OK`
```json
{
  "success": true,
  "message": "Sessions restoration initiated"
}
```

### Error Response
**Status Code:** `500 Internal Server Error`
```json
{
  "success": false,
  "message": "Error restoring sessions",
  "error": "Error details here"
}
```

### Notes
- This endpoint scans the database for sessions with `status: "connected"` and `isActive: true`
- For each found session, it checks if authentication files exist
- If files exist, it attempts to reconnect the session
- If files don't exist, it marks the session as inactive in the database
- This process happens automatically on server startup

### cURL Example
```bash
curl -X POST http://localhost:8002/sessions/restore
```

---

## 7. Health Check

Checks if the API server is running.

### Endpoint
```
GET /health
```

### Success Response
**Status Code:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-12-22T10:30:00.000Z"
}
```

### cURL Example
```bash
curl -X GET http://localhost:3000/health
```

---

## 🔄 Session Lifecycle

```
1. Create Session (POST /create)
   ↓
2. QR Generated (status: qr_waiting)
   ↓
3. User Scans QR
   ↓
4. Connected (status: connected)
   ↓
5. Active Session
   ↓
6. Disconnection / Logout
   ↓
7. Delete Session (DELETE /:sessionId)
```

---

## 📊 Status Flow Diagram

```
no_session → initializing → qr_waiting → connected
                ↓              ↓            ↓
            disconnected ← disconnected ← disconnected
                ↓
            no_session (after max retries)
```

---

## 🔐 Session Status Codes

| Status        | Description                                      | HTTP Code |
|---------------|--------------------------------------------------|-----------|
| connected     | Session active and ready to send messages       | 200       |
| initializing  | Session starting up, not ready yet              | 400       |
| qr_waiting    | QR code generated, waiting for scan             | 400       |
| disconnected  | Session disconnected, attempting reconnect      | 400       |
| no_session    | No session found or permanently disconnected    | 404       |

---

## 🧪 Testing with Postman

### Import Collection
Create a new Postman collection with these endpoints:

1. **Create Session**
   - Method: POST
   - URL: `{{baseUrl}}/api/sessions/create`
   - Body: `{"id": "test123"}`

2. **Get Status**
   - Method: GET
   - URL: `{{baseUrl}}/api/sessions/status/test123`

3. **List Sessions**
   - Method: GET
   - URL: `{{baseUrl}}/api/sessions/list`

4. **Delete Session**
   - Method: DELETE
   - URL: `{{baseUrl}}/api/sessions/test123`

### Environment Variables
```
baseUrl: http://localhost:3000
```

---

## 🐛 Common Error Codes

| Code | Meaning                | Possible Cause                          |
|------|------------------------|-----------------------------------------|
| 400  | Bad Request            | Missing required fields                 |
| 404  | Not Found              | Session doesn't exist                   |
| 500  | Internal Server Error  | Database or service error               |
| 504  | Gateway Timeout        | QR generation took too long             |

---

## 📝 Notes

- QR codes expire after a certain time and need to be regenerated
- Maximum retry attempts: 5
- Reconnect delay: 2 seconds
- Keep-alive interval: 30 seconds
- QR generation timeout: 20 seconds
- Sessions are automatically restored on server restart if authentication files exist

---

## 🔗 Example Integration

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Create session
async function createSession(sessionId) {
  try {
    const response = await axios.post('http://localhost:8002/sessions/create', {
      id: sessionId
    });
    
    if (response.data.data.qr) {
      console.log('QR Code:', response.data.data.qr);
      // Display QR code to user
    }
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// Check status
async function checkStatus(sessionId) {
  const response = await axios.get(`http://localhost:8002/sessions/status/${sessionId}`);
  return response.data;
}

// Delete session
async function deleteSession(sessionId) {
  await axios.delete(`http://localhost:8002/sessions/${sessionId}`);
}
```

### Python
```python
import requests

BASE_URL = "http://localhost:8002/sessions"

# Create session
def create_session(session_id):
    response = requests.post(f"{BASE_URL}/create", json={"id": session_id})
    return response.json()

# Check status
def check_status(session_id):
    response = requests.get(f"{BASE_URL}/status/{session_id}")
    return response.json()

# Delete session
def delete_session(session_id):
    response = requests.delete(f"{BASE_URL}/{session_id}")  
    return response.json()
```

---

## 🎯 Best Practices

1. **Session ID Naming**: Use unique, descriptive IDs (e.g., user ID, phone number)
2. **Error Handling**: Always check response status codes
3. **QR Code Display**: Show QR codes to users immediately after generation
4. **Status Polling**: Poll status endpoint every 2-3 seconds while waiting for connection
5. **Cleanup**: Delete sessions when no longer needed to free resources
6. **Security**: Implement authentication middleware before deploying to production
7. **Rate Limiting**: Add rate limiting to prevent abuse
8. **Monitoring**: Track active sessions and connection success rate