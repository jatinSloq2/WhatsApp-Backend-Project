# 🏗️ Microservices Architecture - Complete Setup

Great choice! Let's build this with **Next.js** (frontend) and **microservices backend**. This is the modern, scalable approach.

---

## 🎯 **Technology Stack Decision**

### **Frontend: Next.js 14+ (App Router)**

- ✅ Server-Side Rendering (SSR)
- ✅ API Routes (can act as BFF - Backend for Frontend)
- ✅ File-based routing
- ✅ Built-in optimization
- ✅ TypeScript support
- ✅ Easy deployment (Vercel)

### **Backend: Node.js Microservices**

- ✅ Each service is independent
- ✅ Easy to scale individually
- ✅ Technology flexibility per service
- ✅ Fault isolation

### **Communication Between Services**

- **Synchronous**: REST APIs / gRPC
- **Asynchronous**: RabbitMQ / Redis Pub/Sub
- **API Gateway**: Kong / Express Gateway / Custom

---

## 📐 **Microservices Architecture Design**

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│              Next.js Frontend (Port 3000)                        │
│              - SSR Pages                                         │
│              - Client Components                                 │
│              - API Routes (BFF Pattern)                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                       API GATEWAY                                │
│                    (Port 8000)                                   │
│  - Request routing                                               │
│  - Authentication                                                │
│  - Rate limiting                                                 │
│  - Load balancing                                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑
┌─────────────────────────────────────────────────────────────────┐
│                    MICROSERVICES LAYER                           │
├────────────────┬────────────────┬────────────────┬──────────────┤
│                │                │                │              │
│  Auth Service  │ Session Service│ Message Service│ Bulk Service │
│  (Port 8001)   │  (Port 8002)   │  (Port 8003)   │ (Port 8004) │
│                │                │                │              │
│  - Register    │  - Create      │  - Send msg    │  - Campaigns │
│  - Login       │  - Get QR      │  - Receive msg │  - Scheduling│
│  - JWT tokens  │  - Status      │  - Store msg   │  - Queue mgmt│
│                │  - WhatsApp    │  - Media       │              │
│                │    connection  │                │              │
└────────────────┴────────────────┴────────────────┴──────────────┘
        ↓↑              ↓↑              ↓↑              ↓↑
┌────────────────┬────────────────┬────────────────┬──────────────┐
│  Chatbot       │  Contact       │  Analytics     │  Notification│
│  Service       │  Service       │  Service       │  Service     │
│  (Port 8005)   │  (Port 8006)   │  (Port 8007)   │  (Port 8008) │
│                │                │                │              │
│  - Bot builder │  - Manage      │  - Dashboard   │  - Email     │
│  - Flows       │    contacts    │  - Reports     │  - Push      │
│  - Triggers    │  - Import/     │  - Metrics     │  - Webhooks  │
│                │    Export      │                │              │
└────────────────┴────────────────┴────────────────┴──────────────┘
                              ↓↑
┌─────────────────────────────────────────────────────────────────┐
│                    MESSAGE BROKER / EVENT BUS                    │
│                   RabbitMQ / Redis Pub/Sub                       │
│  - Inter-service communication                                   │
│  - Event-driven architecture                                     │
│  - Asynchronous messaging                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
├───────────────────┬──────────────────┬──────────────────────────┤
│                   │                  │                          │
│  PostgreSQL       │  Redis           │  MongoDB (Optional)      │
│  (Shared DB)      │  - Cache         │  - Logs                  │
│  OR               │  - Sessions      │  - Analytics             │
│  Database Per     │  - Queue         │                          │
│  Service          │                  │                          │
│                   │                  │                          │
└───────────────────┴──────────────────┴──────────────────────────┘
```

---

## 🗂️ **Project Structure**

```
whatsapp-manager/
│
├── frontend/                          # Next.js Frontend
│   ├── src/
│   │   ├── app/                      # App Router
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── sessions/
│   │   │   │   ├── messages/
│   │   │   │   ├── campaigns/
│   │   │   │   └── chatbots/
│   │   │   ├── api/                  # API Routes (BFF)
│   │   │   │   ├── auth/
│   │   │   │   ├── sessions/
│   │   │   │   └── messages/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── sessions/
│   │   │   │   ├── messages/
│   │   │   │   └── campaigns/
│   │   │   └── layout/
│   │   ├── lib/
│   │   │   ├── api-client.ts         # Axios instance
│   │   │   ├── socket.ts             # Socket.io client
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useSocket.ts
│   │   │   └── useMessages.ts
│   │   ├── store/                    # Zustand/Redux
│   │   │   ├── authStore.ts
│   │   │   ├── sessionStore.ts
│   │   │   └── messageStore.ts
│   │   └── types/
│   ├── public/
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
│
├── backend/                           # Backend Microservices
│   │
│   ├── api-gateway/                  # API Gateway Service
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.js
│   │   │   │   ├── rateLimit.middleware.js
│   │   │   │   └── cors.middleware.js
│   │   │   ├── config/
│   │   │   ├── utils/
│   │   │   └── server.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── auth-service/                 # Authentication Service
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   └── auth.controller.js
│   │   │   ├── services/
│   │   │   │   └── auth.service.js
│   │   │   ├── models/
│   │   │   │   └── user.model.js
│   │   │   ├── routes/
│   │   │   │   └── auth.routes.js
│   │   │   ├── middleware/
│   │   │   ├── utils/
│   │   │   │   ├── jwt.util.js
│   │   │   │   └── bcrypt.util.js
│   │   │   ├── config/
│   │   │   │   └── database.js
│   │   │   └── server.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── session-service/              # WhatsApp Session Service
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   └── session.controller.js
│   │   │   ├── services/
│   │   │   │   ├── baileys.service.js  # (Your existing file)
│   │   │   │   └── session.service.js
│   │   │   ├── models/
│   │   │   │   └── session.model.js
│   │   │   ├── routes/
│   │   │   ├── events/               # Socket.io events
│   │   │   │   └── session.events.js
│   │   │   ├── config/
│   │   │   ├── baileys_auth/         # Session storage
│   │   │   └── server.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── message-service/              # Message Service
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   └── message.controller.js
│   │   │   ├── services/
│   │   │   │   └── message.service.js
│   │   │   ├── models/
│   │   │   │   └── message.model.js
│   │   │   ├── routes/
│   │   │   ├── events/
│   │   │   │   └── message.events.js
│   │   │   ├── config/
│   │   │   └── server.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── bulk-service/                 # Bulk Message/Campaign Service
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   └── campaign.controller.js
│   │   │   ├── services/
│   │   │   │   ├── campaign.service.js
│   │   │   │   └── queue.service.js
│   │   │   ├── models/
│   │   │   │   ├── campaign.model.js
│   │   │   │   └── recipient.model.js
│   │   │   ├── workers/
│   │   │   │   └── message.worker.js
│   │   │   ├── routes/
│   │   │   ├── config/
│   │   │   └── server.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── chatbot-service/              # Chatbot Service
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   └── chatbot.controller.js
│   │   │   ├── services/
│   │   │   │   ├── chatbot.service.js
│   │   │   │   └── flow.service.js
│   │   │   ├── models/
│   │   │   │   ├── chatbot.model.js
│   │   │   │   └── conversation.model.js
│   │   │   ├── routes/
│   │   │   ├── config/
│   │   │   └── server.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── contact-service/              # Contact Service
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   └── server.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── analytics-service/            # Analytics Service
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   └── server.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── notification-service/         # Notification Service
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   │   ├── email.service.js
│   │   │   │   ├── webhook.service.js
│   │   │   │   └── push.service.js
│   │   │   ├── routes/
│   │   │   └── server.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── shared/                       # Shared utilities
│       ├── database/
│       │   └── postgres.js
│       ├── redis/
│       │   └── redis.js
│       ├── rabbitmq/
│       │   └── rabbitmq.js
│       ├── utils/
│       │   ├── logger.js
│       │   └── errors.js
│       └── constants/
│           └── events.js
│
├── docker-compose.yml                # Docker orchestration
├── nginx.conf                        # Nginx config
└── README.md
```

---

## 🔧 **Each Microservice Structure (Detailed)**

### **Standard Microservice Template**

```
service-name/
├── src/
│   ├── controllers/          # Request handlers
│   │   └── *.controller.js
│   ├── services/             # Business logic
│   │   └── *.service.js
│   ├── models/               # Database models
│   │   └── *.model.js
│   ├── routes/               # API routes
│   │   └── *.routes.js
│   ├── middleware/           # Middleware
│   │   ├── auth.middleware.js
│   │   └── validation.middleware.js
│   ├── events/               # Event handlers (for message broker)
│   │   └── *.events.js
│   ├── workers/              # Background workers
│   │   └── *.worker.js
│   ├── utils/                # Utility functions
│   │   ├── logger.js
│   │   └── response.js
│   ├── config/               # Configuration
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── index.js
│   ├── tests/                # Unit tests
│   └── server.js             # Entry point
├── package.json
├── Dockerfile
├── .env.example
└── README.md
```

---

## 🚀 **Service Communication Pattern**

### **1. Synchronous Communication (REST API)**

```javascript
// Example: Message Service calls Session Service

// message-service/src/services/message.service.js
const axios = require("axios");

class MessageService {
  async sendMessage(sessionId, to, message) {
    // 1. Get session from session-service
    const session = await axios.get(
      `http://session-service:8002/internal/sessions/${sessionId}`
    );

    if (!session.data.isConnected) {
      throw new Error("Session not connected");
    }

    // 2. Send message via session-service
    const result = await axios.post(
      `http://session-service:8002/internal/messages/send`,
      { sessionId, to, message }
    );

    // 3. Store message in database
    const savedMessage = await this.saveMessage({
      sessionId,
      to,
      message,
      waMessageId: result.data.messageId,
    });

    // 4. Publish event to message broker
    await this.publishEvent("message.sent", savedMessage);

    return savedMessage;
  }
}
```

### **2. Asynchronous Communication (Message Broker)**

```javascript
// Using RabbitMQ for event-driven communication

// Publisher (Session Service)
// When message received from WhatsApp
async function onMessageReceived(message) {
  // Publish event
  await rabbitmq.publish("message.received", {
    sessionId: "session_123",
    from: "919876543210@s.whatsapp.net",
    message: "Hello!",
    timestamp: new Date(),
  });
}

// Subscriber (Message Service)
// Listen for message.received events
rabbitmq.subscribe("message.received", async (data) => {
  // Save to database
  await saveMessageToDatabase(data);

  // Emit to Socket.io clients
  io.to(data.sessionId).emit("new_message", data);

  // Check if chatbot should respond
  await rabbitmq.publish("chatbot.check", data);
});

// Subscriber (Chatbot Service)
rabbitmq.subscribe("chatbot.check", async (data) => {
  const bot = await getBotForSession(data.sessionId);

  if (bot && bot.shouldRespond(data.message)) {
    const response = await bot.generateResponse(data);
    await rabbitmq.publish("message.send", response);
  }
});
```

---

## 🌐 **API Gateway Setup**

The API Gateway is the **single entry point** for all client requests.

### **Key Responsibilities:**

1. ✅ Route requests to appropriate services
2. ✅ Authentication & Authorization
3. ✅ Rate limiting
4. ✅ Request/Response transformation
5. ✅ Load balancing
6. ✅ Caching
7. ✅ Logging & Monitoring---

## 📦 **Service-to-Service Communication Library**---

## 🔌 **Message Broker (RabbitMQ) Setup**---

## 🐳 **Docker Compose Setup**---

## 📱 **Next.js Frontend Structure**

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                  # Auth route group
│   │   │   ├── layout.tsx           # Auth layout
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── forgot-password/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/             # Dashboard route group
│   │   │   ├── layout.tsx           # Dashboard layout with sidebar
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx         # Main dashboard
│   │   │   ├── sessions/
│   │   │   │   ├── page.tsx         # Sessions list
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx     # Session details
│   │   │   │   └── new/
│   │   │   │       └── page.tsx     # Add new session
│   │   │   ├── messages/
│   │   │   │   ├── page.tsx         # Messages (chat interface)
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx     # Specific session chat
│   │   │   ├── campaigns/
│   │   │   │   ├── page.tsx         # Campaigns list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx     # Create campaign
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     # Campaign details
│   │   │   ├── chatbots/
│   │   │   │   ├── page.tsx         # Chatbots list
│   │   │   │   ├── builder/
│   │   │   │   │   └── page.tsx     # Chatbot builder
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     # Edit chatbot
│   │   │   ├── contacts/
│   │   │   │   └── page.tsx
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                     # API Routes (BFF Pattern)
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   └── register/
│   │   │   │       └── route.ts
│   │   │   ├── sessions/
│   │   │   │   └── route.ts
│   │   │   └── messages/
│   │   │       └── route.ts
│   │   │
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Landing page
│   │   ├── globals.css
│   │   └── providers.tsx            # Context providers
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   ├── features/                # Feature-specific components
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   ├── sessions/
│   │   │   │   ├── SessionCard.tsx
│   │   │   │   ├── QRCodeDisplay.tsx
│   │   │   │   └── SessionList.tsx
│   │   │   ├── messages/
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── MessageInput.tsx
│   │   │   │   └── ContactList.tsx
│   │   │   ├── campaigns/
│   │   │   │   ├── CampaignForm.tsx
│   │   │   │   ├── CampaignCard.tsx
│   │   │   │   └── RecipientUpload.tsx
│   │   │   └── chatbots/
│   │   │       ├── FlowBuilder.tsx
│   │   │       ├── FlowNode.tsx
│   │   │       └── BotTester.tsx
│   │   │
│   │   └── layout/                  # Layout components
│   │       ├── Navbar.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Footer.tsx
│   │       └── DashboardLayout.tsx
│   │
│   ├── lib/                         # Utilities
│   │   ├── api/
│   │   │   ├── client.ts           # Axios instance
│   │   │   ├── auth.api.ts
│   │   │   ├── sessions.api.ts
│   │   │   ├── messages.api.ts
│   │   │   └── campaigns.api.ts
│   │   ├── socket.ts               # Socket.io client
│   │   ├── utils.ts                # General utilities
│   │   └── constants.ts
│   │
│   ├── hooks/                       # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useSocket.ts
│   │   ├── useSessions.ts
│   │   ├── useMessages.ts
│   │   └── useRealtime.ts
│   │
│   ├── store/                       # State management (Zustand)
│   │   ├── authStore.ts
│   │   ├── sessionStore.ts
│   │   ├── messageStore.ts
│   │   └── uiStore.ts
│   │
│   └── types/                       # TypeScript types
│       ├── auth.types.ts
│       ├── session.types.ts
│       ├── message.types.ts
│       ├── campaign.types.ts
│       └── api.types.ts
│
├── public/
│   ├── images/
│   └── icons/
│
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
└── Dockerfile
```

---

## 🎯 **Development Workflow**

### **Step 1: Start Infrastructure**

```bash
# Start databases and message broker
docker-compose up -d postgres redis rabbitmq
```

### **Step 2: Start Backend Services**

```bash
# Option A: Run all services with Docker
docker-compose up -d

# Option B: Run services individually (for development)
cd backend/auth-service && npm run dev
cd backend/session-service && npm run dev
cd backend/message-service && npm run dev
# ... etc
```

### **Step 3: Start Frontend**

```bash
cd frontend
npm run dev
```

### **Access Points:**

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **RabbitMQ Management**: http://localhost:15672
- **Individual Services**: 8001-8008

---

## 📊 **Service Responsibilities Summary**

| Service                  | Port | Responsibilities                 |
| ------------------------ | ---- | -------------------------------- |
| **API Gateway**          | 8000 | Routing, Auth, Rate limiting     |
| **Auth Service**         | 8001 | User auth, JWT tokens            |
| **Session Service**      | 8002 | WhatsApp connections, QR codes   |
| **Message Service**      | 8003 | Send/receive messages, storage   |
| **Bulk Service**         | 8004 | Campaigns, bulk messaging, queue |
| **Chatbot Service**      | 8005 | Bot logic, flows, triggers       |
| **Contact Service**      | 8006 | Contact management               |
| **Analytics Service**    | 8007 | Statistics, reports              |
| **Notification Service** | 8008 | Emails, webhooks, push           |

---

## 🔥 **Key Advantages of This Architecture**

1. ✅ **Scalability**: Scale services independently
2. ✅ **Fault Isolation**: One service failure doesn't crash others
3. ✅ **Technology Flexibility**: Each service can use different tech
4. ✅ **Easy Deployment**: Deploy services separately
5. ✅ **Team Distribution**: Teams can work on different services
6. ✅ **Maintainability**: Easier to understand and maintain
7. ✅ **Testability**: Test services in isolation

---

## 🚀 **Next Steps**

Would you like me to create:

1. **Complete Auth Service** implementation?
2. **Session Service** with Baileys integration?
3. **Message Service** implementation?
4. **Next.js frontend** pages and components?
5. **API documentation** with Swagger?

```js
// api-gateway/src/server.js
// Central API Gateway for all microservices

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 8000;

// ============================================
// MIDDLEWARE
// ============================================

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan("combined"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
});
app.use("/api/", limiter);

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Routes that don't require authentication
const publicRoutes = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

// Apply auth middleware to all routes except public
app.use((req, res, next) => {
  if (publicRoutes.some((route) => req.path.startsWith(route))) {
    return next();
  }
  return authenticateToken(req, res, next);
});

// ============================================
// SERVICE CONFIGURATION
// ============================================

const services = {
  auth: {
    url: process.env.AUTH_SERVICE_URL || "http://localhost:8001",
    routes: ["/api/auth"],
  },
  session: {
    url: process.env.SESSION_SERVICE_URL || "http://localhost:8002",
    routes: ["/api/sessions"],
  },
  message: {
    url: process.env.MESSAGE_SERVICE_URL || "http://localhost:8003",
    routes: ["/api/messages", "/api/sessions/:sessionId/messages"],
  },
  bulk: {
    url: process.env.BULK_SERVICE_URL || "http://localhost:8004",
    routes: ["/api/campaigns"],
  },
  chatbot: {
    url: process.env.CHATBOT_SERVICE_URL || "http://localhost:8005",
    routes: ["/api/chatbots"],
  },
  contact: {
    url: process.env.CONTACT_SERVICE_URL || "http://localhost:8006",
    routes: ["/api/contacts", "/api/sessions/:sessionId/contacts"],
  },
  analytics: {
    url: process.env.ANALYTICS_SERVICE_URL || "http://localhost:8007",
    routes: ["/api/analytics"],
  },
  notification: {
    url: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:8008",
    routes: ["/api/webhooks", "/api/notifications"],
  },
};

// ============================================
// PROXY CONFIGURATION
// ============================================

const proxyOptions = (serviceUrl) => ({
  target: serviceUrl,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    // Remove /api prefix when forwarding to services
    return path.replace("/api", "");
  },
  onProxyReq: (proxyReq, req, res) => {
    // Forward user info to services
    if (req.user) {
      proxyReq.setHeader("X-User-Id", req.user.userId);
      proxyReq.setHeader("X-User-Email", req.user.email);
      proxyReq.setHeader("X-User-Tier", req.user.subscriptionTier);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add custom headers to response
    proxyRes.headers["X-Gateway"] = "WhatsApp-Manager-Gateway";
  },
  onError: (err, req, res) => {
    console.error("Proxy Error:", err);
    res.status(502).json({
      error: "Service Unavailable",
      message: "The requested service is currently unavailable",
      service: req.baseUrl,
    });
  },
});

// ============================================
// ROUTE PROXYING
// ============================================

// Setup proxy for each service
Object.entries(services).forEach(([serviceName, config]) => {
  config.routes.forEach((route) => {
    console.log(`Proxying ${route} -> ${config.url}`);
    app.use(route, createProxyMiddleware(proxyOptions(config.url)));
  });
});

// ============================================
// HEALTH CHECK
// ============================================

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: Object.keys(services),
  });
});

// Service health check
app.get("/health/services", async (req, res) => {
  const axios = require("axios");
  const healthChecks = {};

  for (const [name, config] of Object.entries(services)) {
    try {
      const response = await axios.get(`${config.url}/health`, {
        timeout: 3000,
      });
      healthChecks[name] = {
        status: "healthy",
        responseTime: response.headers["x-response-time"],
      };
    } catch (error) {
      healthChecks[name] = {
        status: "unhealthy",
        error: error.message,
      };
    }
  }

  res.json({
    gateway: "healthy",
    services: healthChecks,
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested endpoint does not exist",
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Gateway Error:", err);

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════╗
  ║   API Gateway Running                      ║
  ║   Port: ${PORT}                           ║
  ║   Environment: ${process.env.NODE_ENV || "development"}    ║
  ╚════════════════════════════════════════════╝
  `);

  console.log("\nRegistered Services:");
  Object.entries(services).forEach(([name, config]) => {
    console.log(`  - ${name.toUpperCase()}: ${config.url}`);
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  app.close(() => {
    console.log("HTTP server closed");
  });
});
```

```js
// backend/shared/utils/service-client.js
// Utility for inter-service communication

const axios = require("axios");
const CircuitBreaker = require("opossum");

// ============================================
// SERVICE REGISTRY
// ============================================

const SERVICE_REGISTRY = {
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:8001",
  session: process.env.SESSION_SERVICE_URL || "http://localhost:8002",
  message: process.env.MESSAGE_SERVICE_URL || "http://localhost:8003",
  bulk: process.env.BULK_SERVICE_URL || "http://localhost:8004",
  chatbot: process.env.CHATBOT_SERVICE_URL || "http://localhost:8005",
  contact: process.env.CONTACT_SERVICE_URL || "http://localhost:8006",
  analytics: process.env.ANALYTICS_SERVICE_URL || "http://localhost:8007",
  notification: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:8008",
};

// ============================================
// SERVICE CLIENT CLASS
// ============================================

class ServiceClient {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.baseURL = SERVICE_REGISTRY[serviceName];

    if (!this.baseURL) {
      throw new Error(`Service ${serviceName} not found in registry`);
    }

    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: options.timeout || 5000,
      headers: {
        "Content-Type": "application/json",
        "X-Service-Name": options.callerService || "unknown",
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add correlation ID for tracing
        config.headers["X-Correlation-Id"] =
          options.correlationId || this.generateCorrelationId();

        // Add auth token if available
        if (options.authToken) {
          config.headers["Authorization"] = `Bearer ${options.authToken}`;
        }

        console.log(
          `[${this.serviceName}] ${config.method.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error(`[${this.serviceName}] Error:`, error.message);
        return Promise.reject(this.handleError(error));
      }
    );

    // Circuit breaker for resilience
    this.breaker = new CircuitBreaker(
      async (config) => this.client.request(config),
      {
        timeout: options.timeout || 5000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
      }
    );

    this.breaker.on("open", () => {
      console.error(`[${this.serviceName}] Circuit breaker opened!`);
    });

    this.breaker.on("halfOpen", () => {
      console.log(`[${this.serviceName}] Circuit breaker half-open`);
    });

    this.breaker.on("close", () => {
      console.log(`[${this.serviceName}] Circuit breaker closed`);
    });
  }

  generateCorrelationId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  handleError(error) {
    if (error.response) {
      // Server responded with error
      return {
        status: error.response.status,
        message: error.response.data?.message || error.message,
        data: error.response.data,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        status: 503,
        message: `Service ${this.serviceName} unavailable`,
        error: "No response from service",
      };
    } else {
      // Something else happened
      return {
        status: 500,
        message: error.message,
        error: "Request failed",
      };
    }
  }

  // HTTP Methods
  async get(path, config = {}) {
    return this.breaker.fire({
      method: "get",
      url: path,
      ...config,
    });
  }

  async post(path, data, config = {}) {
    return this.breaker.fire({
      method: "post",
      url: path,
      data,
      ...config,
    });
  }

  async put(path, data, config = {}) {
    return this.breaker.fire({
      method: "put",
      url: path,
      data,
      ...config,
    });
  }

  async patch(path, data, config = {}) {
    return this.breaker.fire({
      method: "patch",
      url: path,
      data,
      ...config,
    });
  }

  async delete(path, config = {}) {
    return this.breaker.fire({
      method: "delete",
      url: path,
      ...config,
    });
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Create client for a specific service
function createServiceClient(serviceName, options = {}) {
  return new ServiceClient(serviceName, options);
}

// Call multiple services in parallel
async function callServicesInParallel(calls) {
  const promises = calls.map(({ service, method, path, data }) => {
    const client = createServiceClient(service);
    return client[method](path, data);
  });

  return Promise.allSettled(promises);
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  ServiceClient,
  createServiceClient,
  callServicesInParallel,
  SERVICE_REGISTRY,
};

// ============================================
// USAGE EXAMPLE
// ============================================

/*
// Example 1: Simple service call
const { createServiceClient } = require('./service-client');

const sessionClient = createServiceClient('session', {
  callerService: 'message-service',
  timeout: 3000
});

const response = await sessionClient.get('/sessions/session_123');
console.log(response.data);


// Example 2: With authentication
const authClient = createServiceClient('auth', {
  authToken: 'user_jwt_token'
});

const user = await authClient.get('/users/me');


// Example 3: Parallel calls
const { callServicesInParallel } = require('./service-client');

const results = await callServicesInParallel([
  { service: 'session', method: 'get', path: '/sessions/123' },
  { service: 'contact', method: 'get', path: '/contacts?sessionId=123' },
  { service: 'analytics', method: 'get', path: '/stats/123' }
]);

results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    console.log(`Call ${index} succeeded:`, result.value.data);
  } else {
    console.error(`Call ${index} failed:`, result.reason);
  }
});
*/
```

```js
// backend/shared/rabbitmq/event-bus.js
// Event-driven communication using RabbitMQ

const amqp = require("amqplib");

// ============================================
// EVENT BUS CLASS
// ============================================

class EventBus {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchanges = {
      events: "whatsapp.events", // General events
      messages: "whatsapp.messages", // Message events
      sessions: "whatsapp.sessions", // Session events
      campaigns: "whatsapp.campaigns", // Campaign events
    };
  }

  // ============================================
  // CONNECTION
  // ============================================

  async connect() {
    try {
      const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";

      console.log("Connecting to RabbitMQ...");
      this.connection = await amqp.connect(RABBITMQ_URL);

      this.channel = await this.connection.createChannel();

      // Declare exchanges
      for (const [name, exchange] of Object.entries(this.exchanges)) {
        await this.channel.assertExchange(exchange, "topic", {
          durable: true,
        });
        console.log(`Exchange declared: ${exchange}`);
      }

      console.log("✅ RabbitMQ connected successfully");

      // Handle connection events
      this.connection.on("error", (err) => {
        console.error("RabbitMQ connection error:", err);
      });

      this.connection.on("close", () => {
        console.log("RabbitMQ connection closed");
        // Reconnect after 5 seconds
        setTimeout(() => this.connect(), 5000);
      });
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      // Retry after 5 seconds
      setTimeout(() => this.connect(), 5000);
    }
  }

  // ============================================
  // PUBLISH EVENT
  // ============================================

  async publish(exchange, routingKey, data) {
    try {
      if (!this.channel) {
        throw new Error("RabbitMQ channel not initialized");
      }

      const exchangeName = this.exchanges[exchange] || exchange;

      const message = {
        data,
        timestamp: new Date().toISOString(),
        eventId: this.generateEventId(),
      };

      this.channel.publish(
        exchangeName,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      console.log(`📤 Event published: ${exchangeName} -> ${routingKey}`);
    } catch (error) {
      console.error("Failed to publish event:", error);
      throw error;
    }
  }

  // ============================================
  // SUBSCRIBE TO EVENT
  // ============================================

  async subscribe(exchange, routingKey, handler, queueName) {
    try {
      if (!this.channel) {
        throw new Error("RabbitMQ channel not initialized");
      }

      const exchangeName = this.exchanges[exchange] || exchange;

      // Create queue name if not provided
      const queue = queueName || `${exchangeName}.${routingKey}.${Date.now()}`;

      // Assert queue
      await this.channel.assertQueue(queue, {
        durable: true,
        autoDelete: false,
      });

      // Bind queue to exchange with routing key
      await this.channel.bindQueue(queue, exchangeName, routingKey);

      // Consume messages
      this.channel.consume(
        queue,
        async (msg) => {
          if (msg) {
            try {
              const content = JSON.parse(msg.content.toString());
              console.log(`📥 Event received: ${routingKey}`);

              // Call handler
              await handler(content.data, content);

              // Acknowledge message
              this.channel.ack(msg);
            } catch (error) {
              console.error("Error handling message:", error);
              // Reject and requeue
              this.channel.nack(msg, false, true);
            }
          }
        },
        { noAck: false }
      );

      console.log(`✅ Subscribed: ${exchangeName} -> ${routingKey}`);
    } catch (error) {
      console.error("Failed to subscribe:", error);
      throw error;
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async close() {
    try {
      await this.channel?.close();
      await this.connection?.close();
      console.log("RabbitMQ connection closed");
    } catch (error) {
      console.error("Error closing RabbitMQ:", error);
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

const eventBus = new EventBus();

// ============================================
// EXPORTS
// ============================================

module.exports = eventBus;

// ============================================
// EVENT DEFINITIONS
// ============================================

const EVENTS = {
  // Message Events
  MESSAGE_RECEIVED: "message.received",
  MESSAGE_SENT: "message.sent",
  MESSAGE_DELIVERED: "message.delivered",
  MESSAGE_READ: "message.read",
  MESSAGE_FAILED: "message.failed",

  // Session Events
  SESSION_CONNECTED: "session.connected",
  SESSION_DISCONNECTED: "session.disconnected",
  SESSION_QR_GENERATED: "session.qr.generated",
  SESSION_LOGOUT: "session.logout",

  // Campaign Events
  CAMPAIGN_STARTED: "campaign.started",
  CAMPAIGN_MESSAGE_SENT: "campaign.message.sent",
  CAMPAIGN_COMPLETED: "campaign.completed",
  CAMPAIGN_FAILED: "campaign.failed",

  // Chatbot Events
  CHATBOT_TRIGGERED: "chatbot.triggered",
  CHATBOT_RESPONSE_SENT: "chatbot.response.sent",

  // User Events
  USER_REGISTERED: "user.registered",
  USER_SUBSCRIPTION_CHANGED: "user.subscription.changed",
};

module.exports.EVENTS = EVENTS;

// ============================================
// USAGE EXAMPLES
// ============================================

/*
// Example 1: Initialize in your service

const eventBus = require('./shared/rabbitmq/event-bus');

// Connect on startup
await eventBus.connect();


// Example 2: Publish an event (Session Service)

// When a message is received from WhatsApp
eventBus.publish('messages', 'message.received', {
  sessionId: 'session_123',
  from: '919876543210@s.whatsapp.net',
  message: 'Hello!',
  timestamp: new Date()
});


// Example 3: Subscribe to events (Message Service)

// Listen for incoming messages
eventBus.subscribe(
  'messages',
  'message.received',
  async (data) => {
    console.log('New message:', data);
    
    // Save to database
    await saveMessageToDatabase(data);
    
    // Emit to Socket.io
    io.to(data.sessionId).emit('new_message', data);
  },
  'message-service-queue'
);


// Example 4: Subscribe to events (Chatbot Service)

eventBus.subscribe(
  'messages',
  'message.received',
  async (data) => {
    // Check if bot should respond
    const bot = await getBotForSession(data.sessionId);
    
    if (bot && bot.shouldRespond(data.message)) {
      const response = await bot.generateResponse(data);
      
      // Publish send message event
      eventBus.publish('messages', 'message.send', {
        sessionId: data.sessionId,
        to: data.from,
        message: response
      });
    }
  },
  'chatbot-service-queue'
);


// Example 5: Multiple subscribers (Analytics Service)

// Track all message events
['message.sent', 'message.received', 'message.delivered'].forEach(event => {
  eventBus.subscribe('messages', event, async (data) => {
    await updateAnalytics(data);
  });
});


// Example 6: Wildcard routing

// Subscribe to all session events
eventBus.subscribe('sessions', 'session.*', async (data) => {
  console.log('Session event:', data);
});
*/
```
