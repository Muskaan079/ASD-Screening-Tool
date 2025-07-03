-- Initial database schema for ASD Screening Tool
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE,
  name VARCHAR NOT NULL,
  age INTEGER,
  gender VARCHAR(10),
  role VARCHAR(20) DEFAULT 'patient',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screening sessions table
CREATE TABLE IF NOT EXISTS screening_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES users(id),
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

-- Session responses table
CREATE TABLE IF NOT EXISTS session_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES screening_sessions(id) ON DELETE CASCADE,
  question_id VARCHAR NOT NULL,
  answer TEXT,
  confidence DECIMAL(3,2),
  response_time INTEGER,
  emotion_data JSONB,
  motion_data JSONB,
  voice_data JSONB,
  analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emotion history table
CREATE TABLE IF NOT EXISTS emotion_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES screening_sessions(id) ON DELETE CASCADE,
  emotions JSONB NOT NULL,
  dominant_emotion VARCHAR(50),
  confidence DECIMAL(3,2),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Motion history table
CREATE TABLE IF NOT EXISTS motion_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES screening_sessions(id) ON DELETE CASCADE,
  motion_data JSONB NOT NULL,
  repetitive_motions BOOLEAN DEFAULT FALSE,
  fidgeting BOOLEAN DEFAULT FALSE,
  patterns JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clinical reports table
CREATE TABLE IF NOT EXISTS clinical_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES screening_sessions(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES users(id),
  practitioner_info JSONB,
  report_data JSONB NOT NULL,
  assessment JSONB,
  recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_patient_id ON screening_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON screening_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON screening_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON session_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON session_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_emotion_session_id ON emotion_history(session_id);
CREATE INDEX IF NOT EXISTS idx_motion_session_id ON motion_history(session_id);
CREATE INDEX IF NOT EXISTS idx_reports_session_id ON clinical_reports(session_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON screening_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE motion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_reports ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you can customize these based on your auth requirements)
CREATE POLICY "Allow all operations for authenticated users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON screening_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON session_responses FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON emotion_history FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON motion_history FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON clinical_reports FOR ALL USING (true); 