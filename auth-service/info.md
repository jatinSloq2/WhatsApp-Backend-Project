# 🔐 Auth Service - Setup & API Documentation

## 📁 Complete File Structure Created

```
backend/
├── shared/
│   ├── config/
│   │   └── database.js              ✅ Created
│   ├── middleware/
│   │   ├── auth.middleware.js       ✅ Created
│   │   └── errorHandler.js          ✅ Created
│   └── utils/
│       ├── jwt.util.js              ✅ Created
│       ├── response.util.js         ✅ Created
│       └── logger.js                ✅ Created
│
└── auth-service/
    ├── src/
    │   ├── controllers/
    │   │   └── auth.controller.js   ✅ Created
    │   ├── services/
    │   │   └── auth.service.js      ✅ Created
    │   ├── models/
    │   │   └── user.model.js        ✅ Created
    │   ├── routes/
    │   │   └── auth.routes.js       ✅ Created
    │   ├── middleware/
    │   │   └── validation.js        ✅ Created
    │   └── server.js                ✅ Created
    ├── logs/                         📁 Will be auto-created
    ├── package.json                  ✅ Created
    ├── .env.example                  ✅ Created
    └── Dockerfile                    ✅ Created
```

---

## 🚀 Setup Instructions

### **Step 1: Install Dependencies**

```bash
cd backend/auth-service
npm install
```

### **Step 2: Setup Environment**

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env with your values
nano .env
```

### **Step 3: Start MongoDB**

```bash
# Using Docker
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  mongo:7

# Or use local MongoDB
mongod --dbpath /path/to/data
```

### **Step 4: Start Auth Service**

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### **Step 5: Verify Service is Running**

```bash
curl http://localhost:8001/auth/health
```

Expected response:

```json
{
  "status": "healthy",
  "service": "auth-service",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 📡 API Endpoints

### **Base URL**: `http://localhost:8001`

---

### 1️⃣ **Register New User**

**POST** `/auth/register`

**Request Body:**

```json
{
  "email": "john@example.com",
  "username": "johndoe",
  "password": "SecurePass123",
  "fullName": "John Doe",
  "phone": "+1234567890"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "email": "john@example.com",
      "username": "johndoe",
      "fullName": "John Doe",
      "phone": "+1234567890",
      "subscriptionTier": "free",
      "subscriptionStatus": "active",
      "isEmailVerified": false,
      "isActive": true,
      "limits": {
        "maxSessions": 1,
        "maxMessagesPerDay": 50,
        "maxCampaignsPerMonth": 5,
        "maxChatbots": 1
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "verificationToken": "abc123..." // Only in development
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 2️⃣ **Login**

**POST** `/auth/login`

**Request Body:**

```json
{
  "identifier": "john@example.com", // or "johndoe"
  "password": "SecurePass123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "email": "john@example.com",
      "username": "johndoe",
      "fullName": "John Doe",
      "subscriptionTier": "free",
      "lastLogin": "2024-01-15T10:35:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

---

### 3️⃣ **Refresh Access Token**

**POST** `/auth/refresh-token`

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-15T10:40:00.000Z"
}
```

---

### 4️⃣ **Get Profile** (Protected)

**GET** `/auth/me`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "email": "john@example.com",
    "username": "johndoe",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "subscriptionTier": "free",
    "limits": {
      "maxSessions": 1,
      "maxMessagesPerDay": 50,
      "maxCampaignsPerMonth": 5,
      "maxChatbots": 1
    }
  },
  "timestamp": "2024-01-15T10:45:00.000Z"
}
```

---

### 5️⃣ **Update Profile** (Protected)

**PUT** `/auth/me`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "fullName": "John Updated Doe",
  "phone": "+9876543210",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "email": "john@example.com",
    "username": "johndoe",
    "fullName": "John Updated Doe",
    "phone": "+9876543210",
    "avatarUrl": "https://example.com/avatar.jpg"
  },
  "timestamp": "2024-01-15T10:50:00.000Z"
}
```

---

### 6️⃣ **Logout** (Protected)

**POST** `/auth/logout`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {
    "message": "Logged out successfully"
  },
  "timestamp": "2024-01-15T10:55:00.000Z"
}
```

---

### 7️⃣ **Forgot Password**

**POST** `/auth/forgot-password`

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "message": "Password reset link sent to email",
    "resetToken": "abc123..." // Only in development
  },
  "timestamp": "2024-01-15T11:00:00.000Z"
}
```

---

### 8️⃣ **Reset Password**

**POST** `/auth/reset-password`

**Request Body:**

```json
{
  "token": "abc123...",
  "password": "NewSecurePass123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "message": "Password reset successfully"
  },
  "timestamp": "2024-01-15T11:05:00.000Z"
}
```

---

### 9️⃣ **Verify Email**

**GET** `/auth/verify-email/:token`

**Example:** `/auth/verify-email/abc123def456`

**Response (200):**

```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "message": "Email verified successfully"
  },
  "timestamp": "2024-01-15T11:10:00.000Z"
}
```

---

## 🧪 Testing with cURL

### Register

```bash
curl -X POST http://localhost:8001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test@1234",
    "fullName": "Test User"
  }'
```

### Login

```bash
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "Test@1234"
  }'
```

### Get Profile (Replace TOKEN)

```bash
curl -X GET http://localhost:8001/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔐 JWT Token Structure

### Access Token Payload

```json
{
  "userId": "65a1b2c3d4e5f6a7b8c9d0e1",
  "email": "john@example.com",
  "subscriptionTier": "free",
  "iat": 1705318200,
  "exp": 1705319100
}
```

### Refresh Token Payload

```json
{
  "userId": "65a1b2c3d4e5f6a7b8c9d0e1",
  "iat": 1705318200,
  "exp": 1705922600
}
```

---

## 🛡️ Password Requirements

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

---

## 📊 Subscription Tiers & Limits

| Tier     | Sessions | Messages/Day | Campaigns/Month | Chatbots |
| -------- | -------- | ------------ | --------------- | -------- |
| Free     | 1        | 50           | 5               | 1        |
| Pro      | 3        | 250          | 20              | 5        |
| Business | 10       | 1000         | Unlimited       | 20       |

---

## 🐛 Common Errors

### 400 Bad Request

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ],
  "timestamp": "2024-01-15T11:15:00.000Z"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Invalid credentials",
  "errors": null,
  "timestamp": "2024-01-15T11:20:00.000Z"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Route not found",
  "errors": null,
  "timestamp": "2024-01-15T11:25:00.000Z"
}
```

---

## 📝 Next Steps

1. ✅ Auth Service is complete
2. ⏭️ Next: Build **Session Service** (WhatsApp integration)
3. 🔄 Then: Build **Message Service**

Ready to create the Session Service with Baileys integration? 🚀
