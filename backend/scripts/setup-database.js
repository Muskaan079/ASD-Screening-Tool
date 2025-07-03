#!/usr/bin/env node

import dotenv from 'dotenv';
import { supabase, supabaseAdmin } from '../src/config/supabase.js';

dotenv.config();

const setupDatabase = async () => {
  console.log('🔧 Setting up Supabase database for ASD Screening Tool...\n');

  try {
    // Test connection
    console.log('1. Testing Supabase connection...');
    const { data, error } = await supabase.from('screening_sessions').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      console.log('\n📋 Please ensure:');
      console.log('   - SUPABASE_URL is set in your .env file');
      console.log('   - SUPABASE_ANON_KEY is set in your .env file');
      console.log('   - Your Supabase project is active');
      console.log('   - You have run the SQL migration in your Supabase SQL editor');
      process.exit(1);
    }

    console.log('✅ Connection successful!');

    // Check if tables exist
    console.log('\n2. Checking database tables...');
    
    const tables = [
      'users',
      'screening_sessions', 
      'session_responses',
      'emotion_history',
      'motion_history',
      'clinical_reports'
    ];

    for (const table of tables) {
      try {
        const { error: tableError } = await supabase.from(table).select('*').limit(1);
        if (tableError) {
          console.log(`❌ Table '${table}' not found`);
        } else {
          console.log(`✅ Table '${table}' exists`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' not found`);
      }
    }

    // Create sample data for testing
    console.log('\n3. Creating sample data for testing...');
    
    // Create a sample user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        name: 'Test Patient',
        email: 'test@example.com',
        age: 25,
        gender: 'other',
        role: 'patient'
      })
      .select()
      .single();

    if (userError && !userError.message.includes('duplicate')) {
      console.log('⚠️  Could not create sample user:', userError.message);
    } else {
      console.log('✅ Sample user created or already exists');
    }

    // Create a sample session
    const { data: session, error: sessionError } = await supabase
      .from('screening_sessions')
      .insert({
        patient_info: {
          name: 'Test Patient',
          age: 25,
          gender: 'other'
        },
        status: 'completed',
        total_questions: 20,
        adaptive_data: {
          currentCategory: 'social',
          difficultyLevel: 'medium'
        }
      })
      .select()
      .single();

    if (sessionError && !sessionError.message.includes('duplicate')) {
      console.log('⚠️  Could not create sample session:', sessionError.message);
    } else {
      console.log('✅ Sample session created or already exists');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start your backend server: npm start');
    console.log('   2. Test the API endpoints');
    console.log('   3. Connect your frontend to the backend');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export default setupDatabase; 