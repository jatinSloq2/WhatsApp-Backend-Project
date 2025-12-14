# ============================================
# .env.example (ROOT)
# Copy this to .env and fill in your values
# ============================================

# Environment
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/whatsapp_manager
# For production with MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whatsapp_manager

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key
REFRESH_TOKEN_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Service URLs (for local development)
API_GATEWAY_URL=http://localhost:8000
AUTH_SERVICE_URL=http://localhost:8001
SESSION_SERVICE_URL=http://localhost:8002
MESSAGE_SERVICE_URL=http://localhost:8003
BULK_SERVICE_URL=http://localhost:8004
CHATBOT_SERVICE_URL=http://localhost:8005
CONTACT_SERVICE_URL=http://localhost:8006
ANALYTICS_SERVICE_URL=http://localhost:8007
NOTIFICATION_SERVICE_URL=http://localhost:8008

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@whatsappmanager.com

# File Upload
MAX_FILE_SIZE=16777216
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# ============================================
# backend/api-gateway/.env.example
# ============================================

NODE_ENV=development
PORT=8000

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Frontend
FRONTEND_URL=http://localhost:3000

# Microservices URLs
AUTH_SERVICE_URL=http://localhost:8001
SESSION_SERVICE_URL=http://localhost:8002
MESSAGE_SERVICE_URL=http://localhost:8003
BULK_SERVICE_URL=http://localhost:8004
CHATBOT_SERVICE_URL=http://localhost:8005
CONTACT_SERVICE_URL=http://localhost:8006
ANALYTICS_SERVICE_URL=http://localhost:8007
NOTIFICATION_SERVICE_URL=http://localhost:8008

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# backend/auth-service/.env.example
# ============================================

NODE_ENV=development
PORT=8001
SERVICE_NAME=auth-service

# Database
MONGODB_URI=mongodb://localhost:27017/whatsapp_manager

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key
REFRESH_TOKEN_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@whatsappmanager.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# ============================================
# backend/session-service/.env.example
# ============================================

NODE_ENV=development
PORT=8002
SERVICE_NAME=session-service

# Database
MONGODB_URI=mongodb://localhost:27017/whatsapp_manager

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# Baileys Configuration
MAX_RETRIES=5
RECONNECT_DELAY=2000
KEEP_ALIVE_INTERVAL=30000
PONG_TIMEOUT=60000

# Session Storage Path
SESSION_STORAGE_PATH=./baileys_auth

# ============================================
# backend/message-service/.env.example
# ============================================

NODE_ENV=development
PORT=8003
SERVICE_NAME=message-service

# Database
MONGODB_URI=mongodb://localhost:27017/whatsapp_manager

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# Other Services
SESSION_SERVICE_URL=http://localhost:8002

# File Upload
MAX_FILE_SIZE=16777216
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4,application/pdf

# ============================================
# backend/bulk-service/.env.example
# ============================================

NODE_ENV=development
PORT=8004
SERVICE_NAME=bulk-service

# Database
MONGODB_URI=mongodb://localhost:27017/whatsapp_manager

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# Other Services
MESSAGE_SERVICE_URL=http://localhost:8003
SESSION_SERVICE_URL=http://localhost:8002

# Campaign Settings
DEFAULT_MESSAGE_DELAY=3000
MAX_DAILY_MESSAGES=250
MAX_CAMPAIGN_SIZE=1000

# ============================================
# backend/chatbot-service/.env.example
# ============================================

NODE_ENV=development
PORT=8005
SERVICE_NAME=chatbot-service

# Database
MONGODB_URI=mongodb://localhost:27017/whatsapp_manager

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# Other Services
MESSAGE_SERVICE_URL=http://localhost:8003

# ============================================
# backend/contact-service/.env.example
# ============================================

NODE_ENV=development
PORT=8006
SERVICE_NAME=contact-service

# Database
MONGODB_URI=mongodb://localhost:27017/whatsapp_manager

# Redis
REDIS_URL=redis://localhost:6379

# File Upload (for CSV import)
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# ============================================
# backend/analytics-service/.env.example
# ============================================

NODE_ENV=development
PORT=8007
SERVICE_NAME=analytics-service

# Database
MONGODB_URI=mongodb://localhost:27017/whatsapp_manager

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# Analytics Settings
ANALYTICS_RETENTION_DAYS=90
CRON_SCHEDULE=0 0 * * *

# ============================================
# backend/notification-service/.env.example
# ============================================

NODE_ENV=development
PORT=8008
SERVICE_NAME=notification-service

# Database
MONGODB_URI=mongodb://localhost:27017/whatsapp_manager

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@whatsappmanager.com

# Webhook Settings
WEBHOOK_TIMEOUT=5000
WEBHOOK_RETRY_ATTEMPTS=3

# ============================================
# frontend/.env.local
# ============================================

# API Gateway URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# App Configuration
NEXT_PUBLIC_APP_NAME=WhatsApp Manager
NEXT_PUBLIC_APP_VERSION=1.0.0

# Feature Flags
NEXT_PUBLIC_ENABLE_CHATBOTS=true
NEXT_PUBLIC_ENABLE_CAMPAIGNS=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# ============================================
# docker-compose.override.yml
# For local development overrides
# ============================================

# This file is automatically loaded by docker-compose
# Add local development specific configurations here