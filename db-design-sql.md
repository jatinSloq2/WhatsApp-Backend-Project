-- =============================================
-- COMPLETE DATABASE SCHEMA
-- =============================================

-- 1. USERS TABLE
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    subscription_tier VARCHAR(50) DEFAULT 'free', -- free, pro, business
    subscription_status VARCHAR(50) DEFAULT 'active', -- active, expired, cancelled
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,
    is_email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription_tier, subscription_status);

-- 2. WHATSAPP SESSIONS TABLE
CREATE TABLE whatsapp_sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    session_name VARCHAR(255),
    qr_code TEXT,
    status VARCHAR(50) DEFAULT 'disconnected', -- connected, disconnected, qr_waiting, initializing
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMP,
    connected_at TIMESTAMP,
    disconnected_at TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB, -- store additional session info
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, phone_number)
);

CREATE INDEX idx_sessions_user ON whatsapp_sessions(user_id);
CREATE INDEX idx_sessions_status ON whatsapp_sessions(status);
CREATE INDEX idx_sessions_phone ON whatsapp_sessions(phone_number);

-- 3. MESSAGES TABLE
CREATE TABLE messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) NOT NULL REFERENCES whatsapp_sessions(session_id) ON DELETE CASCADE,
    wa_message_id VARCHAR(255), -- WhatsApp's message ID
    from_number VARCHAR(100) NOT NULL,
    to_number VARCHAR(100) NOT NULL,
    message_type VARCHAR(50) NOT NULL, -- text, image, video, audio, document, sticker, location, contact
    content TEXT, -- message text or caption
    media_url TEXT, -- URL to media file if any
    media_mime_type VARCHAR(100),
    media_size BIGINT, -- in bytes
    is_incoming BOOLEAN NOT NULL,
    is_from_me BOOLEAN DEFAULT false,
    is_group BOOLEAN DEFAULT false,
    group_id VARCHAR(100),
    quoted_message_id UUID REFERENCES messages(message_id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, read, failed
    error_message TEXT,
    metadata JSONB, -- additional message data
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_from ON messages(from_number);
CREATE INDEX idx_messages_to ON messages(to_number);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_wa_id ON messages(wa_message_id);

-- 4. CONTACTS TABLE
CREATE TABLE contacts (
    contact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) NOT NULL REFERENCES whatsapp_sessions(session_id) ON DELETE CASCADE,
    phone_number VARCHAR(100) NOT NULL,
    name VARCHAR(255),
    profile_pic_url TEXT,
    is_business BOOLEAN DEFAULT false,
    is_blocked BOOLEAN DEFAULT false,
    tags TEXT[], -- array of tags
    custom_fields JSONB, -- custom data
    last_message_at TIMESTAMP,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, phone_number)
);

CREATE INDEX idx_contacts_session ON contacts(session_id);
CREATE INDEX idx_contacts_phone ON contacts(phone_number);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);

-- 5. CAMPAIGNS TABLE (Bulk Messages)
CREATE TABLE campaigns (
    campaign_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) NOT NULL REFERENCES whatsapp_sessions(session_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    campaign_name VARCHAR(255) NOT NULL,
    message_type VARCHAR(50) NOT NULL, -- text, image, video, document
    message_content TEXT NOT NULL,
    media_url TEXT,
    total_recipients INTEGER NOT NULL,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    pending_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, running, paused, completed, failed
    schedule_time TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    delay_between_messages INTEGER DEFAULT 3000, -- in milliseconds
    personalize BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaigns_session ON campaigns(session_id);
CREATE INDEX idx_campaigns_user ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- 6. CAMPAIGN RECIPIENTS TABLE
CREATE TABLE campaign_recipients (
    recipient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
    phone_number VARCHAR(100) NOT NULL,
    name VARCHAR(255),
    custom_data JSONB, -- for personalization
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, failed
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    error_message TEXT,
    message_id UUID REFERENCES messages(message_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX idx_recipients_status ON campaign_recipients(status);

-- 7. CHATBOTS TABLE
CREATE TABLE chatbots (
    bot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) NOT NULL REFERENCES whatsapp_sessions(session_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    bot_name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL, -- keyword, always, pattern, command
    trigger_value TEXT,
    is_active BOOLEAN DEFAULT true,
    flows JSONB NOT NULL, -- conversation flows
    variables JSONB, -- bot variables
    fallback_message TEXT,
    welcome_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chatbots_session ON chatbots(session_id);
CREATE INDEX idx_chatbots_active ON chatbots(is_active);

-- 8. CHATBOT CONVERSATIONS TABLE
CREATE TABLE chatbot_conversations (
    conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID NOT NULL REFERENCES chatbots(bot_id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL REFERENCES whatsapp_sessions(session_id) ON DELETE CASCADE,
    user_phone VARCHAR(100) NOT NULL,
    current_flow_id VARCHAR(100),
    conversation_data JSONB, -- store conversation state
    is_active BOOLEAN DEFAULT true,
    last_interaction TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_bot ON chatbot_conversations(bot_id);
CREATE INDEX idx_conversations_phone ON chatbot_conversations(user_phone);
CREATE INDEX idx_conversations_active ON chatbot_conversations(is_active);

-- 9. MESSAGE TEMPLATES TABLE
CREATE TABLE message_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- marketing, support, notification
    message_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    variables TEXT[], -- list of variables like {name}, {company}
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_templates_user ON message_templates(user_id);
CREATE INDEX idx_templates_category ON message_templates(category);

-- 10. WEBHOOKS TABLE
CREATE TABLE webhooks (
    webhook_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    session_id VARCHAR(100) REFERENCES whatsapp_sessions(session_id) ON DELETE CASCADE,
    webhook_url TEXT NOT NULL,
    webhook_name VARCHAR(255),
    events TEXT[] NOT NULL, -- message_received, message_sent, session_status
    is_active BOOLEAN DEFAULT true,
    secret_key VARCHAR(255),
    headers JSONB,
    retry_count INTEGER DEFAULT 3,
    last_triggered TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhooks_user ON webhooks(user_id);
CREATE INDEX idx_webhooks_active ON webhooks(is_active);

-- 11. ANALYTICS TABLE
CREATE TABLE analytics (
    analytics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    session_id VARCHAR(100) REFERENCES whatsapp_sessions(session_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    messages_sent INTEGER DEFAULT 0,
    messages_received INTEGER DEFAULT 0,
    messages_delivered INTEGER DEFAULT 0,
    messages_failed INTEGER DEFAULT 0,
    unique_contacts INTEGER DEFAULT 0,
    active_chatbots INTEGER DEFAULT 0,
    campaign_messages INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, session_id, date)
);

CREATE INDEX idx_analytics_user_date ON analytics(user_id, date DESC);
CREATE INDEX idx_analytics_session_date ON analytics(session_id, date DESC);

-- 12. SUBSCRIPTION PAYMENTS TABLE
CREATE TABLE subscription_payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_method VARCHAR(50), -- stripe, razorpay, paypal
    transaction_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) NOT NULL, -- pending, completed, failed, refunded
    subscription_tier VARCHAR(50),
    billing_period_start DATE,
    billing_period_end DATE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_user ON subscription_payments(user_id);
CREATE INDEX idx_payments_status ON subscription_payments(status);

-- 13. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- login, logout, send_message, create_campaign
    entity_type VARCHAR(100), -- session, campaign, chatbot
    entity_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- 14. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50), -- info, warning, error, success
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- 15. API KEYS TABLE (for Business tier)
CREATE TABLE api_keys (
    key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    key_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    permissions TEXT[], -- read, write, admin
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_key ON api_keys(api_key);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON whatsapp_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chatbots_updated_at BEFORE UPDATE ON chatbots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VIEWS
-- =============================================

-- Session statistics view
CREATE VIEW session_stats AS
SELECT 
    ws.session_id,
    ws.user_id,
    ws.phone_number,
    ws.status,
    COUNT(DISTINCT m.message_id) as total_messages,
    COUNT(DISTINCT CASE WHEN m.is_incoming = true THEN m.message_id END) as received_messages,
    COUNT(DISTINCT CASE WHEN m.is_incoming = false THEN m.message_id END) as sent_messages,
    COUNT(DISTINCT c.contact_id) as total_contacts,
    MAX(m.timestamp) as last_message_at
FROM whatsapp_sessions ws
LEFT JOIN messages m ON ws.session_id = m.session_id
LEFT JOIN contacts c ON ws.session_id = c.session_id
GROUP BY ws.session_id, ws.user_id, ws.phone_number, ws.status;

-- User dashboard view
CREATE VIEW user_dashboard AS
SELECT 
    u.user_id,
    u.email,
    u.subscription_tier,
    COUNT(DISTINCT ws.session_id) as total_sessions,
    COUNT(DISTINCT CASE WHEN ws.status = 'connected' THEN ws.session_id END) as active_sessions,
    COUNT(DISTINCT m.message_id) as total_messages_today,
    COUNT(DISTINCT c.campaign_id) as total_campaigns,
    COUNT(DISTINCT cb.bot_id) as total_chatbots
FROM users u
LEFT JOIN whatsapp_sessions ws ON u.user_id = ws.user_id
LEFT JOIN messages m ON ws.session_id = m.session_id AND DATE(m.timestamp) = CURRENT_DATE
LEFT JOIN campaigns c ON u.user_id = c.user_id
LEFT JOIN chatbots cb ON u.user_id = cb.user_id
GROUP BY u.user_id, u.email, u.subscription_tier;