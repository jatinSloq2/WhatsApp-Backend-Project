# 🚀 WhatsApp Manager - Complete Setup Guide

A microservices-based WhatsApp management platform with Next.js frontend and MongoDB database.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Initial Setup](#initial-setup)
4. [Database Setup](#database-setup)
5. [Running Services](#running-services)
6. [Development Workflow](#development-workflow)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## 🛠️ Prerequisites

### Required Software

- **Node.js**: v20+ ([Download](https://nodejs.org/))
- **MongoDB**: v6+ ([Download](https://www.mongodb.com/try/download/community))
- **Redis**: v7+ ([Download](https://redis.io/download))
- **RabbitMQ**: v3+ ([Download](https://www.rabbitmq.com/download.html))
- **Docker & Docker Compose**: (Optional but recommended)

### Check Installations

```bash
node --version    # Should be v20+
npm --version     # Should be v9+
mongod --version  # Should be v6+
redis-cli --version
docker --version
docker-compose --version
```

---

## 📁 Project Structure

```
whatsapp-manager/
├── backend/
│   ├── shared/                    # Shared utilities & models
│   │   ├── models/               # MongoDB models
│   │   ├── database/             # DB connection & seeder
│   │   ├── rabbitmq/             # Event bus
│   │   └── utils/                # Utilities
│   ├── api-gateway/              # API Gateway (Port 8000)
│   ├── auth-service/             # Authentication (Port 8001)
│   ├── session-service/          # WhatsApp Sessions (Port 8002)
│   ├── message-service/          # Messages (Port 8003)
│   ├── bulk-service/             # Bulk/Campaigns (Port 8004)
│   ├── chatbot-service/          # Chatbots (Port 8005)
│   ├── contact-service/          # Contacts (Port 8006)
│   ├── analytics-service/        # Analytics (Port 8007)
│   └── notification-service/     # Notifications (Port 8008)
├── frontend/                      # Next.js Frontend (Port 3000)
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 🚀 Initial Setup

### Option 1: Local Development (Without Docker)

#### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/whatsapp-manager.git
cd whatsapp-manager
```

#### Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

#### Step 3: Setup Environment Variables

```bash
# Copy environment files
cp .env.example .env
cp backend/api-gateway/.env.example backend/api-gateway/.env
cp backend/auth-service/.env.example backend/auth-service/.env
cp backend/session-service/.env.example backend/session-service/.env
cp backend/message-service/.env.example backend/message-service/.env
cp backend/bulk-service/.env.example backend/bulk-service/.env
cp backend/chatbot-service/.env.example backend/chatbot-service/.env
cp backend/contact-service/.env.example backend/contact-service/.env
cp backend/analytics-service/.env.example backend/analytics-service/.env
cp backend/notification-service/.env.example backend/notification-service/.env
cp frontend/.env.local.example frontend/.env.local
```

#### Step 4: Update .env Files

Edit each `.env` file and update:
- MongoDB connection string
- Redis URL
- RabbitMQ URL
- JWT secrets
- SMTP credentials (for emails)

#### Step 5: Start Infrastructure Services

```bash
# Start MongoDB
mongod --dbpath /path/to/data

# Start Redis
redis-server

# Start RabbitMQ
rabbitmq-server
```

---

### Option 2: Docker Development (Recommended)

#### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/whatsapp-manager.git
cd whatsapp-manager
```

#### Step 2: Setup Environment

```bash
cp .env.example .env
# Edit .env with your configurations
```

#### Step 3: Build & Start All Services

```bash
# Build and start everything
docker-compose up --build -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

---

## 💾 Database Setup

### Initialize MongoDB

#### Step 1: Create Database & Seed Data

```bash
# Run seeder script
npm run seed
```

This will:
- ✅ Create all collections with indexes
- ✅ Create test users (admin, demo, free)
- ✅ Create sample data
- ✅ Display login credentials

#### Step 2: Verify Database

```bash
# Connect to MongoDB
mongosh

# Switch to database
use whatsapp_manager

# Check collections
show collections

# Count users
db.users.countDocuments()
```

### Default Login Credentials

After seeding, you can login with:

| Email | Password | Tier |
|-------|----------|------|
| admin@whatsappmanager.com | Admin@123456 | Business |
| demo@whatsappmanager.com | Demo@123456 | Pro |
| free@whatsappmanager.com | Free@123456 | Free |

---

## 🏃 Running Services

### Development Mode (Local)

#### Start Individual Services

```bash
# Terminal 1: API Gateway
npm run dev:gateway

# Terminal 2: Auth Service
npm run dev:auth

# Terminal 3: Session Service
npm run dev:session

# Terminal 4: Message Service
npm run dev:message

# Terminal 5: Frontend
npm run dev:frontend
```

#### Start All Backend Services

```bash
# Start all backend services concurrently
npm run dev
```

#### Start Frontend Separately

```bash
cd frontend
npm run dev
```

### Docker Mode

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart session-service

# View logs for specific service
docker-compose logs -f session-service

# Scale a service
docker-compose up -d --scale message-service=3
```

---

## 🌐 Access Points

Once running, access:

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **RabbitMQ Management**: http://localhost:15672 (admin/admin123)
- **API Documentation**: http://localhost:8000/api-docs (if Swagger enabled)

### Service Health Checks

```bash
# Check API Gateway
curl http://localhost:8000/health

# Check Auth Service
curl http://localhost:8001/health

# Check all services
curl http://localhost:8000/health/services
```

---

## 💻 Development Workflow

### Adding a New Microservice

1. **Create Service Directory**
```bash
mkdir -p backend/new-service/src
cd backend/new-service
```

2. **Initialize Package**
```bash
npm init -y
npm install express mongoose cors helmet morgan dotenv
npm install --save-dev nodemon
```

3. **Create Service Structure**
```bash
mkdir -p src/{controllers,services,models,routes,middleware,config}
touch src/server.js
```

4. **Add to Docker Compose**
```yaml
new-service:
  build:
    context: ./backend/new-service
    dockerfile: Dockerfile
  container_name: whatsapp_new_service
  environment:
    - PORT=8009
    - MONGODB_URI=${MONGODB_URI}
  ports:
    - "8009:8009"
  networks:
    - whatsapp_network
```

5. **Register in API Gateway**

Edit `backend/api-gateway/src/server.js`:
```javascript
const services = {
  // ... existing services
  newService: {
    url: process.env.NEW_SERVICE_URL || 'http://localhost:8009',
    routes: ['/api/new-endpoint']
  }
};
```

### Working with Models

```javascript
// Import model
const { User, Session, Message } = require('./shared/models');

// Create document
const user = new User({
  email: 'user@example.com',
  username: 'user123',
  password: 'Password@123'
});
await user.save();

// Find documents
const users = await User.find({ isActive: true });

// Update document
await User.findByIdAndUpdate(userId, { lastLogin: new Date() });

// Delete document
await User.findByIdAndDelete(userId);
```

### Publishing & Subscribing to Events

```javascript
// Publish event
const eventBus = require('./shared/rabbitmq/event-bus');

eventBus.publish('messages', 'message.sent', {
  sessionId: 'session_123',
  messageId: 'msg_456',
  to: '919876543210',
  content: 'Hello!'
});

// Subscribe to event
eventBus.subscribe('messages', 'message.sent', async (data) => {
  console.log('Message sent:', data);
  // Process the event
});
```

---

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Failed

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

#### Redis Connection Failed

```bash
# Check Redis
redis-cli ping
# Should return: PONG

# Start Redis
redis-server
```

#### RabbitMQ Connection Failed

```bash
# Check RabbitMQ status
sudo rabbitmq-diagnostics status

# Start RabbitMQ
sudo systemctl start rabbitmq-server

# Check RabbitMQ logs
sudo tail -f /var/log/rabbitmq/rabbit@hostname.log
```

#### Port Already in Use

```bash
# Find process using port
lsof -i :8000
# or
netstat -nlp | grep :8000

# Kill process
kill -9 <PID>
```

#### Baileys Session Issues

```bash
# Clear session files
rm -rf backend/session-service/baileys_auth/*

# Restart session service
npm run dev:session
```

#### Docker Issues

```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild everything
docker-compose build --no-cache

# Clean Docker system
docker system prune -a
```

### Debug Logs

Enable debug logs in `.env`:
```bash
LOG_LEVEL=debug
NODE_ENV=development
```

---

## 🚀 Deployment

### Production Deployment Checklist

- [ ] Update all `.env` files with production values
- [ ] Change JWT secrets to strong random values
- [ ] Setup production MongoDB (MongoDB Atlas recommended)
- [ ] Setup production Redis (Redis Cloud/AWS ElastiCache)
- [ ] Configure email service (SendGrid/AWS SES)
- [ ] Setup SSL certificates (Let's Encrypt)
- [ ] Configure domain and DNS
- [ ] Setup monitoring (PM2/New Relic)
- [ ] Configure backups
- [ ] Setup CI/CD pipeline

### Deploy to VPS

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone repository
git clone https://github.com/yourusername/whatsapp-manager.git
cd whatsapp-manager

# Setup environment
cp .env.example .env
nano .env  # Edit with production values

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Setup nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/whatsapp-manager
# Configure nginx (see nginx.conf.example)

# Enable SSL
sudo certbot --nginx -d yourdomain.com
```

### Environment Variables for Production

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
REDIS_URL=redis://production-redis:6379
JWT_SECRET=<STRONG_RANDOM_SECRET>
FRONTEND_URL=https://yourdomain.com
```

---

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [Docker Documentation](https://docs.docker.com/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 💬 Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/whatsapp-manager/issues
- Email: support@whatsappmanager.com

---

**Built with ❤️ using Next.js, Node.js, MongoDB, and Baileys**