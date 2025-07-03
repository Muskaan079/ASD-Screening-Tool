// Test setup file
import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import databaseService from '../services/databaseService.js';

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
  useTestDatabase: process.env.NODE_ENV === 'test' && process.env.DATABASE_URL,
  testTimeout: 10000
};

// Clean up test data
export const cleanupTestData = async () => {
  if (!TEST_CONFIG.useTestDatabase) return;

  try {
    // Clean up old sessions (this will cascade delete related data)
    await databaseService.cleanupExpiredSessions();
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
    }
  };

  const finalData = { ...defaultData, ...sessionData };

  if (TEST_CONFIG.useTestDatabase) {
    const sessionId = 'test-session-' + Date.now();
    await databaseService.createSession(sessionId, finalData.patientInfo);
    return await databaseService.getSession(sessionId);
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
    return await databaseService.getSession(sessionId);
  } else {
    // Fallback for in-memory tests
    return null;
  }
};

// Global test setup
beforeAll(async () => {
  if (TEST_CONFIG.useTestDatabase) {
    console.log('🧪 Using PostgreSQL test database');
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