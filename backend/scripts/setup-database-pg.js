#!/usr/bin/env node

import dotenv from 'dotenv';
import { initializeDatabase, testConnection, pool } from '../src/config/database.js';
import databaseService from '../src/services/databaseService.js';

dotenv.config();

const setupDatabase = async () => {
  console.log('🔧 Setting up PostgreSQL database for ASD Screening Tool...\n');

  try {
    // Test connection
    console.log('1. Testing PostgreSQL connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Connection failed!');
      console.log('\n📋 Please ensure:');
      console.log('   - DATABASE_URL is set correctly in your .env file');
      console.log('   - Your Supabase database password is correct');
      console.log('   - Your IP is allowed in Supabase database settings');
      console.log('   - The database exists and is accessible');
      process.exit(1);
    }

    console.log('✅ Connection successful!');

    // Initialize database tables
    console.log('\n2. Creating database tables...');
    await initializeDatabase();
    console.log('✅ Tables created successfully!');

    // Test database service
    console.log('\n3. Testing database service...');
    
    // Create a test session
    const testSessionId = 'test-setup-' + Date.now();
    const testPatientInfo = {
      name: 'Test Patient',
      age: 25,
      gender: 'other'
    };

    await databaseService.createSession(testSessionId, testPatientInfo);
    console.log('✅ Test session created');

    // Get the session back
    const session = await databaseService.getSession(testSessionId);
    if (session) {
      console.log('✅ Session retrieval works');
      console.log(`   Session ID: ${session.id}`);
      console.log(`   Patient: ${session.patientInfo.name}`);
    } else {
      console.log('❌ Session retrieval failed');
    }

    // Test analytics tracking
    await databaseService.trackEvent(testSessionId, 'test_event', { test: true });
    console.log('✅ Analytics tracking works');

    // Get analytics
    const analytics = await databaseService.getAnalytics(testSessionId);
    if (analytics.length > 0) {
      console.log('✅ Analytics retrieval works');
    } else {
      console.log('❌ Analytics retrieval failed');
    }

    // Clean up test data
    await databaseService.deleteSession(testSessionId);
    console.log('✅ Test cleanup works');

    // Get session stats
    const stats = await databaseService.getSessionStats();
    console.log('✅ Session statistics:', stats);

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start your backend server: npm start');
    console.log('   2. Test the API endpoints');
    console.log('   3. Connect your frontend to the backend');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await pool.end();
  }
};

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export default setupDatabase; 