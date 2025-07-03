import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

// Create Supabase client with anon key for general operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase client with service role key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

// Database table names
export const TABLES = {
  SESSIONS: 'screening_sessions',
  REPORTS: 'clinical_reports',
  USERS: 'users',
  EMOTION_HISTORY: 'emotion_history',
  MOTION_HISTORY: 'motion_history',
  RESPONSES: 'session_responses'
};

// Initialize database tables if they don't exist
export const initializeDatabase = async () => {
  try {
    console.log('Initializing database tables...');
    
    // Create sessions table
    const { error: sessionsError } = await supabaseAdmin.rpc('create_sessions_table', {});
    if (sessionsError && !sessionsError.message.includes('already exists')) {
      console.error('Error creating sessions table:', sessionsError);
    }

    // Create reports table
    const { error: reportsError } = await supabaseAdmin.rpc('create_reports_table', {});
    if (reportsError && !reportsError.message.includes('already exists')) {
      console.error('Error creating reports table:', reportsError);
    }

    // Create users table
    const { error: usersError } = await supabaseAdmin.rpc('create_users_table', {});
    if (usersError && !usersError.message.includes('already exists')) {
      console.error('Error creating users table:', usersError);
    }

    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}; 