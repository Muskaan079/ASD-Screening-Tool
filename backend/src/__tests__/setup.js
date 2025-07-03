// Test setup file
import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import { supabase } from '../config/supabase.js';

dotenv.config();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test timeout
jest.setTimeout(10000);

// Global test utilities
global.testUtils = {
  createMockSession: (overrides = {}) => ({
    id: 'test-session-id',
    patientInfo: { name: 'Test Patient', age: 25 },
    startTime: new Date().toISOString(),
    status: 'active',
    responses: [],
    emotionHistory: [],
    motionHistory: [],
    currentQuestion: null,
    lastUpdated: new Date().toISOString(),
    totalQuestions: 20,
    adaptiveData: {
      difficultyLevel: 1,
      categoryFocus: 'social',
      responsePatterns: {},
      emotionTrends: {},
      motionPatterns: {}
    },
    ...overrides
  }),

  createMockResponse: (overrides = {}) => ({
    questionId: 'social_1',
    answer: 'Somewhat comfortable',
    confidence: 0.8,
    responseTime: 3000,
    emotionData: { emotions: { happy: 0.7, neutral: 0.3 } },
    motionData: { repetitiveMotions: false, fidgeting: false },
    voiceData: { clarity: 0.8, tone: 0.7, pace: 0.6 },
    analysis: { overallScore: 0.75 },
    timestamp: new Date().toISOString(),
    ...overrides
  })
};

// Test configuration
export const TEST_CONFIG = {
  // Use test database or in-memory for tests
  useTestDatabase: process.env.NODE_ENV === 'test' && process.env.SUPABASE_URL,
  testTimeout: 10000
};

// Clean up test data
export const cleanupTestData = async () => {
  if (!TEST_CONFIG.useTestDatabase) return;

  try {
    // Delete test data in reverse order of dependencies
    await supabase.from('clinical_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('motion_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('emotion_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('session_responses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('screening_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (error) {
    console.warn('Test cleanup warning:', error.message);
  }
};

// Create test session
export const createTestSession = async (sessionData = {}) => {
  const defaultData = {
    patientInfo: {
      name: 'Test Patient',
      age: 25,
      gender: 'other'
    },
    startTime: new Date().toISOString(),
    status: 'active',
    totalQuestions: 20,
    adaptiveData: {
      difficultyLevel: 1,
      categoryFocus: 'social'
    }
  };

  const finalData = { ...defaultData, ...sessionData };

  if (TEST_CONFIG.useTestDatabase) {
    const { data, error } = await supabase
      .from('screening_sessions')
      .insert({
        patient_info: finalData.patientInfo,
        start_time: finalData.startTime,
        status: finalData.status,
        total_questions: finalData.totalQuestions,
        adaptive_data: finalData.adaptiveData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Fallback to in-memory for tests without database
    return {
      id: 'test-session-' + Date.now(),
      ...finalData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
};

// Get test session
export const getTestSession = async (sessionId) => {
  if (TEST_CONFIG.useTestDatabase) {
    const { data, error } = await supabase
      .from('screening_sessions')
      .select(`
        *,
        session_responses (*),
        emotion_history (*),
        motion_history (*)
      `)
      .eq('id', sessionId)
      .single();

    if (error) return null;
    return data;
  } else {
    // Fallback for in-memory tests
    return null;
  }
};

// Global test setup
beforeAll(async () => {
  if (TEST_CONFIG.useTestDatabase) {
    console.log('🧪 Using Supabase test database');
    await cleanupTestData();
  } else {
    console.log('🧪 Using in-memory test storage');
  }
});

// Global test teardown
afterAll(async () => {
  if (TEST_CONFIG.useTestDatabase) {
    await cleanupTestData();
  }
}); 