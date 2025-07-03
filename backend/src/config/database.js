import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Test database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connection successful');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    return false;
  }
};

// Database table names
export const TABLES = {
  SESSIONS: 'screening_sessions',
  REPORTS: 'clinical_reports',
  USERS: 'users',
  EMOTION_HISTORY: 'emotion_history',
  MOTION_HISTORY: 'motion_history',
  RESPONSES: 'session_responses'
};

// Initialize database tables
export const initializeDatabase = async () => {
  try {
    console.log('🗄️  Initializing database tables...');
    
    const client = await pool.connect();
    
    // Create sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${TABLES.SESSIONS} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_info JSONB NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        end_time TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) DEFAULT 'active',
        current_question JSONB,
        total_questions INTEGER DEFAULT 20,
        adaptive_data JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create responses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${TABLES.RESPONSES} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES ${TABLES.SESSIONS}(id) ON DELETE CASCADE,
        question_id VARCHAR(50) NOT NULL,
        answer TEXT NOT NULL,
        confidence DECIMAL(3,2),
        response_time INTEGER,
        emotion_data JSONB,
        motion_data JSONB,
        voice_data JSONB,
        analysis JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(session_id, question_id)
      );
    `);

    // Create emotion history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${TABLES.EMOTION_HISTORY} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES ${TABLES.SESSIONS}(id) ON DELETE CASCADE,
        emotions JSONB NOT NULL,
        dominant_emotion VARCHAR(20),
        confidence DECIMAL(3,2),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create motion history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${TABLES.MOTION_HISTORY} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES ${TABLES.SESSIONS}(id) ON DELETE CASCADE,
        motion_data JSONB NOT NULL,
        repetitive_motions BOOLEAN DEFAULT FALSE,
        fidgeting BOOLEAN DEFAULT FALSE,
        patterns TEXT[],
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${TABLES.REPORTS} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES ${TABLES.SESSIONS}(id) ON DELETE CASCADE,
        patient_id UUID,
        practitioner_info JSONB,
        report_data JSONB NOT NULL,
        assessment JSONB,
        recommendations JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${TABLES.USERS} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        age INTEGER,
        gender VARCHAR(20),
        role VARCHAR(20) DEFAULT 'patient',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_status ON ${TABLES.SESSIONS}(status);
      CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON ${TABLES.SESSIONS}(start_time);
      CREATE INDEX IF NOT EXISTS idx_responses_session_id ON ${TABLES.RESPONSES}(session_id);
      CREATE INDEX IF NOT EXISTS idx_emotion_session_id ON ${TABLES.EMOTION_HISTORY}(session_id);
      CREATE INDEX IF NOT EXISTS idx_motion_session_id ON ${TABLES.MOTION_HISTORY}(session_id);
      CREATE INDEX IF NOT EXISTS idx_reports_session_id ON ${TABLES.REPORTS}(session_id);
    `);

    client.release();
    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Close database pool
export const closeDatabase = async () => {
  await pool.end();
  console.log('🔌 Database connection pool closed');
}; 