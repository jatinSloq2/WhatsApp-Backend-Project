```js
// backend/shared/database/seeder.js
// Database Seeder - Create initial data

const database = require('./mongodb');
const models = require('../models');

// ============================================
// SEED DATA
// ============================================

const seedUsers = [
  {
    email: 'admin@whatsappmanager.com',
    username: 'admin',
    password: 'Admin@123456',
    fullName: 'Admin User',
    subscriptionTier: 'business',
    subscriptionStatus: 'active',
    isEmailVerified: true,
    isActive: true
  },
  {
    email: 'demo@whatsappmanager.com',
    username: 'demo_user',
    password: 'Demo@123456',
    fullName: 'Demo User',
    subscriptionTier: 'pro',
    subscriptionStatus: 'active',
    isEmailVerified: true,
    isActive: true
  },
  {
    email: 'free@whatsappmanager.com',
    username: 'free_user',
    password: 'Free@123456',
    fullName: 'Free User',
    subscriptionTier: 'free',
    subscriptionStatus: 'active',
    isEmailVerified: true,
    isActive: true
  }
];

const seedTemplates = [
  {
    templateName: 'Welcome Message',
    category: 'marketing',
    messageType: 'text',
    content: 'Welcome {name}! Thank you for choosing {company}. How can we help you today?',
    variables: ['name', 'company']
  },
  {
    templateName: 'Order Confirmation',
    category: 'transactional',
    messageType: 'text',
    content: 'Hi {name}, your order #{orderId} has been confirmed. Expected delivery: {date}',
    variables: ['name', 'orderId', 'date']
  },
  {
    templateName: 'Support Response',
    category: 'support',
    messageType: 'text',
    content: 'Hello {name}, thank you for contacting support. Your ticket #{ticketId} has been created.',
    variables: ['name', 'ticketId']
  }
];

// ============================================
// SEEDER FUNCTIONS
// ============================================

async function clearDatabase() {
  console.log('🗑️  Clearing database...');
  
  const collections = Object.values(models);
  for (const Model of collections) {
    if (Model.deleteMany) {
      await Model.deleteMany({});
      console.log(`   ✓ Cleared ${Model.collection.name}`);
    }
  }
}

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...\n');

    // Connect to database
    await database.connect();

    // Clear existing data (optional - comment out for production)
    // await clearDatabase();

    // Seed Users
    console.log('📝 Creating users...');
    const createdUsers = [];
    for (const userData of seedUsers) {
      const user = new models.User(userData);
      user.updateLimits(); // Set limits based on subscription tier
      await user.save();
      createdUsers.push(user);
      console.log(`   ✓ Created user: ${user.email}`);
    }

    // Seed Message Templates for first user
    console.log('\n📄 Creating message templates...');
    for (const templateData of seedTemplates) {
      const template = new models.MessageTemplate({
        ...templateData,
        userId: createdUsers[0]._id
      });
      await template.save();
      console.log(`   ✓ Created template: ${template.templateName}`);
    }

    // Create sample session for demo user
    console.log('\n📱 Creating sample session...');
    const sampleSession = new models.Session({
      sessionId: `demo_session_${Date.now()}`,
      userId: createdUsers[1]._id,
      phoneNumber: '+1234567890',
      sessionName: 'Demo Session',
      status: 'disconnected',
      isActive: true
    });
    await sampleSession.save();
    console.log(`   ✓ Created session: ${sampleSession.sessionId}`);

    // Create sample contacts
    console.log('\n👥 Creating sample contacts...');
    const sampleContacts = [
      {
        sessionId: sampleSession.sessionId,
        phoneNumber: '+9876543210',
        name: 'John Doe',
        tags: ['customer', 'vip']
      },
      {
        sessionId: sampleSession.sessionId,
        phoneNumber: '+9876543211',
        name: 'Jane Smith',
        tags: ['customer']
      }
    ];

    for (const contactData of sampleContacts) {
      const contact = new models.Contact(contactData);
      await contact.save();
      console.log(`   ✓ Created contact: ${contact.name}`);
    }

    // Create sample analytics
    console.log('\n📊 Creating sample analytics...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const analytics = new models.Analytics({
      userId: createdUsers[1]._id,
      sessionId: sampleSession.sessionId,
      date: today,
      messagesSent: 25,
      messagesReceived: 30,
      messagesDelivered: 23,
      messagesFailed: 2,
      uniqueContacts: 10,
      activeChatbots: 1,
      campaignMessages: 0
    });
    await analytics.save();
    console.log('   ✓ Created analytics data');

    console.log('\n✅ Database seeded successfully!\n');
    console.log('Login Credentials:');
    console.log('─────────────────────────────────');
    seedUsers.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Tier: ${user.subscriptionTier}`);
      console.log('─────────────────────────────────');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// ============================================
// RUN SEEDER
// ============================================

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, clearDatabase };

// ============================================
// USAGE
// ============================================

/*
Run this file directly to seed the database:

node backend/shared/database/seeder.js

Or import and use in your code:

const { seedDatabase } = require('./shared/database/seeder');
await seedDatabase();
*/
```