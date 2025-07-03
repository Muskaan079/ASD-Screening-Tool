import request from 'supertest';
import { app } from '../app.js';
import databaseService from '../services/databaseService.js';

describe('Screening API Tests', () => {
  let testSessionId;

  beforeEach(async () => {
    // Clear test data before each test
    await databaseService.importData({ sessions: [], reports: [], users: [] });
  });

  describe('POST /api/screening/start', () => {
    it('should start a new screening session', async () => {
      const patientInfo = {
        name: 'Test Patient',
        age: 25,
        gender: 'female'
      };

      const response = await request(app)
        .post('/api/screening/start')
        .send({ patientInfo })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.sessionId).toBeDefined();
      expect(response.body.session.patientInfo).toEqual(patientInfo);
      expect(response.body.session.status).toBe('active');

      testSessionId = response.body.sessionId;
    });

    it('should return 400 for missing patient information', async () => {
      const response = await request(app)
        .post('/api/screening/start')
        .send({ patientInfo: { name: 'Test' } }) // Missing age
        .expect(400);

      expect(response.body.error).toBe('Missing required patient information');
    });

    it('should return 400 for invalid age', async () => {
      const response = await request(app)
        .post('/api/screening/start')
        .send({ patientInfo: { name: 'Test', age: -5 } })
        .expect(400);

      expect(response.body.error).toBe('Invalid patient age');
    });

    it('should return 400 for missing patient name', async () => {
      const response = await request(app)
        .post('/api/screening/start')
        .send({ patientInfo: { age: 25 } })
        .expect(400);

      expect(response.body.error).toBe('Missing required patient information');
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/screening/start')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Patient information is required');
    });
  });

  describe('POST /api/screening/next-question', () => {
    beforeEach(async () => {
      // Create a test session
      const patientInfo = { name: 'Test Patient', age: 25 };
      const session = await databaseService.createSession({
        id: 'test-session-1',
        patientInfo,
        startTime: new Date().toISOString(),
        status: 'active',
        responses: [],
        adaptiveData: { difficultyLevel: 1, categoryFocus: 'social' }
      });
      testSessionId = session.id;
    });

    it('should get the next question for a session', async () => {
      const response = await request(app)
        .post('/api/screening/next-question')
        .send({ sessionId: testSessionId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.question).toBeDefined();
      expect(response.body.question.id).toBeDefined();
      expect(response.body.question.text).toBeDefined();
      expect(response.body.sessionProgress).toBeDefined();
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .post('/api/screening/next-question')
        .send({ sessionId: 'non-existent' })
        .expect(404);

      expect(response.body.error).toBe('Screening session not found');
    });

    it('should return 400 for missing session ID', async () => {
      const response = await request(app)
        .post('/api/screening/next-question')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Session ID is required');
    });

    it('should return 400 for completed session', async () => {
      // Update session to completed
      await databaseService.updateSession(testSessionId, { status: 'completed' });

      const response = await request(app)
        .post('/api/screening/next-question')
        .send({ sessionId: testSessionId })
        .expect(400);

      expect(response.body.error).toBe('Screening session is already completed');
    });
  });

  describe('POST /api/screening/submit-answer', () => {
    beforeEach(async () => {
      // Create a test session
      const patientInfo = { name: 'Test Patient', age: 25 };
      const session = await databaseService.createSession({
        id: 'test-session-2',
        patientInfo,
        startTime: new Date().toISOString(),
        status: 'active',
        responses: [],
        adaptiveData: { difficultyLevel: 1, categoryFocus: 'social' }
      });
      testSessionId = session.id;
    });

    it('should submit an answer successfully', async () => {
      const answerData = {
        sessionId: testSessionId,
        questionId: 'social_1',
        answer: 'Somewhat comfortable',
        confidence: 0.8,
        responseTime: 3000
      };

      const response = await request(app)
        .post('/api/screening/submit-answer')
        .send(answerData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analysis).toBeDefined();
      expect(response.body.sessionProgress).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/screening/submit-answer')
        .send({ sessionId: testSessionId, questionId: 'social_1' }) // Missing answer
        .expect(400);

      expect(response.body.error).toBe('Session ID, question ID, and answer are required');
    });

    it('should return 400 for invalid confidence score', async () => {
      const answerData = {
        sessionId: testSessionId,
        questionId: 'social_1',
        answer: 'Somewhat comfortable',
        confidence: 1.5, // Invalid confidence > 1
        responseTime: 3000
      };

      const response = await request(app)
        .post('/api/screening/submit-answer')
        .send(answerData)
        .expect(400);

      expect(response.body.error).toBe('Confidence score must be between 0 and 1');
    });

    it('should return 400 for negative response time', async () => {
      const answerData = {
        sessionId: testSessionId,
        questionId: 'social_1',
        answer: 'Somewhat comfortable',
        confidence: 0.8,
        responseTime: -1000
      };

      const response = await request(app)
        .post('/api/screening/submit-answer')
        .send(answerData)
        .expect(400);

      expect(response.body.error).toBe('Response time must be positive');
    });

    it('should return 404 for non-existent session', async () => {
      const answerData = {
        sessionId: 'non-existent',
        questionId: 'social_1',
        answer: 'Somewhat comfortable'
      };

      const response = await request(app)
        .post('/api/screening/submit-answer')
        .send(answerData)
        .expect(404);

      expect(response.body.error).toBe('Screening session not found');
    });
  });

  describe('POST /api/screening/emotion-data', () => {
    beforeEach(async () => {
      // Create a test session
      const patientInfo = { name: 'Test Patient', age: 25 };
      const session = await databaseService.createSession({
        id: 'test-session-3',
        patientInfo,
        startTime: new Date().toISOString(),
        status: 'active',
        responses: [],
        adaptiveData: { difficultyLevel: 1, categoryFocus: 'social' }
      });
      testSessionId = session.id;
    });

    it('should update emotion data successfully', async () => {
      const emotionData = {
        sessionId: testSessionId,
        emotionData: {
          emotions: { happy: 0.8, sad: 0.1, neutral: 0.1 },
          dominantEmotion: 'happy',
          confidence: 0.9
        }
      };

      const response = await request(app)
        .post('/api/screening/emotion-data')
        .send(emotionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Emotion data updated successfully');
    });

    it('should return 400 for missing session ID', async () => {
      const emotionData = {
        emotionData: {
          emotions: { happy: 0.8, sad: 0.1, neutral: 0.1 },
          dominantEmotion: 'happy',
          confidence: 0.9
        }
      };

      const response = await request(app)
        .post('/api/screening/emotion-data')
        .send(emotionData)
        .expect(400);

      expect(response.body.error).toBe('Session ID and emotion data are required');
    });

    it('should return 400 for invalid emotion confidence', async () => {
      const emotionData = {
        sessionId: testSessionId,
        emotionData: {
          emotions: { happy: 0.8, sad: 0.1, neutral: 0.1 },
          dominantEmotion: 'happy',
          confidence: 1.5 // Invalid confidence > 1
        }
      };

      const response = await request(app)
        .post('/api/screening/emotion-data')
        .send(emotionData)
        .expect(400);

      expect(response.body.error).toBe('Emotion confidence must be between 0 and 1');
    });

    it('should return 404 for non-existent session', async () => {
      const emotionData = {
        sessionId: 'non-existent',
        emotionData: {
          emotions: { happy: 0.8, sad: 0.1, neutral: 0.1 },
          dominantEmotion: 'happy',
          confidence: 0.9
        }
      };

      const response = await request(app)
        .post('/api/screening/emotion-data')
        .send(emotionData)
        .expect(404);

      expect(response.body.error).toBe('Screening session not found');
    });
  });

  describe('POST /api/screening/motion-data', () => {
    beforeEach(async () => {
      // Create a test session
      const patientInfo = { name: 'Test Patient', age: 25 };
      const session = await databaseService.createSession({
        id: 'test-session-4',
        patientInfo,
        startTime: new Date().toISOString(),
        status: 'active',
        responses: [],
        adaptiveData: { difficultyLevel: 1, categoryFocus: 'social' }
      });
      testSessionId = session.id;
    });

    it('should update motion data successfully', async () => {
      const motionData = {
        sessionId: testSessionId,
        motionData: {
          repetitiveMotions: false,
          fidgeting: true,
          patterns: ['hand_movement']
        }
      };

      const response = await request(app)
        .post('/api/screening/motion-data')
        .send(motionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Motion data updated successfully');
    });

    it('should return 400 for missing session ID', async () => {
      const motionData = {
        motionData: {
          repetitiveMotions: false,
          fidgeting: true,
          patterns: ['hand_movement']
        }
      };

      const response = await request(app)
        .post('/api/screening/motion-data')
        .send(motionData)
        .expect(400);

      expect(response.body.error).toBe('Session ID and motion data are required');
    });

    it('should return 404 for non-existent session', async () => {
      const motionData = {
        sessionId: 'non-existent',
        motionData: {
          repetitiveMotions: false,
          fidgeting: true,
          patterns: ['hand_movement']
        }
      };

      const response = await request(app)
        .post('/api/screening/motion-data')
        .send(motionData)
        .expect(404);

      expect(response.body.error).toBe('Screening session not found');
    });
  });

  describe('GET /api/screening/status/:sessionId', () => {
    beforeEach(async () => {
      // Create a test session
      const patientInfo = { name: 'Test Patient', age: 25 };
      const session = await databaseService.createSession({
        id: 'test-session-5',
        patientInfo,
        startTime: new Date().toISOString(),
        status: 'active',
        responses: [],
        adaptiveData: { difficultyLevel: 1, categoryFocus: 'social' }
      });
      testSessionId = session.id;
    });

    it('should get session status successfully', async () => {
      const response = await request(app)
        .get(`/api/screening/status/${testSessionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.session).toBeDefined();
      expect(response.body.session.id).toBe(testSessionId);
      expect(response.body.session.status).toBe('active');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/api/screening/status/non-existent')
        .expect(404);

      expect(response.body.error).toBe('Screening session not found');
    });
  });

  describe('POST /api/screening/generate-report', () => {
    beforeEach(async () => {
      // Create a test session with responses
      const patientInfo = { name: 'Test Patient', age: 25 };
      const session = await databaseService.createSession({
        id: 'test-session-6',
        patientInfo,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        status: 'completed',
        responses: [
          {
            questionId: 'social_1',
            answer: 'Somewhat comfortable',
            analysis: { overallScore: 0.8 }
          },
          {
            questionId: 'comm_1',
            answer: 'Very comfortable',
            analysis: { overallScore: 0.9 }
          }
        ],
        adaptiveData: { difficultyLevel: 1, categoryFocus: 'social' }
      });
      testSessionId = session.id;
    });

    it('should generate report successfully', async () => {
      const reportData = {
        sessionId: testSessionId,
        practitionerInfo: {
          name: 'Dr. Smith',
          credentials: 'MD, PhD',
          organization: 'Test Clinic'
        }
      };

      const response = await request(app)
        .post('/api/screening/generate-report')
        .send(reportData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.report).toBeDefined();
      expect(response.body.report.sessionId).toBe(testSessionId);
      expect(response.body.report.reportData).toBeDefined();
      expect(response.body.report.assessment).toBeDefined();
      expect(response.body.report.recommendations).toBeDefined();
    });

    it('should return 400 for missing session ID', async () => {
      const reportData = {
        practitionerInfo: {
          name: 'Dr. Smith',
          credentials: 'MD, PhD',
          organization: 'Test Clinic'
        }
      };

      const response = await request(app)
        .post('/api/screening/generate-report')
        .send(reportData)
        .expect(400);

      expect(response.body.error).toBe('Session ID and practitioner information are required');
    });

    it('should return 404 for non-existent session', async () => {
      const reportData = {
        sessionId: 'non-existent',
        practitionerInfo: {
          name: 'Dr. Smith',
          credentials: 'MD, PhD',
          organization: 'Test Clinic'
        }
      };

      const response = await request(app)
        .post('/api/screening/generate-report')
        .send(reportData)
        .expect(404);

      expect(response.body.error).toBe('Screening session not found');
    });

    it('should return 400 for incomplete session', async () => {
      // Create an incomplete session
      const patientInfo = { name: 'Test Patient 2', age: 30 };
      const incompleteSession = await databaseService.createSession({
        id: 'test-session-incomplete',
        patientInfo,
        startTime: new Date().toISOString(),
        status: 'active',
        responses: [],
        adaptiveData: { difficultyLevel: 1, categoryFocus: 'social' }
      });

      const reportData = {
        sessionId: incompleteSession.id,
        practitionerInfo: {
          name: 'Dr. Smith',
          credentials: 'MD, PhD',
          organization: 'Test Clinic'
        }
      };

      const response = await request(app)
        .post('/api/screening/generate-report')
        .send(reportData)
        .expect(400);

      expect(response.body.error).toBe('Cannot generate report for incomplete session');
    });
  });

  describe('POST /api/screening/end/:sessionId', () => {
    beforeEach(async () => {
      // Create a test session
      const patientInfo = { name: 'Test Patient', age: 25 };
      const session = await databaseService.createSession({
        id: 'test-session-7',
        patientInfo,
        startTime: new Date().toISOString(),
        status: 'active',
        responses: [],
        adaptiveData: { difficultyLevel: 1, categoryFocus: 'social' }
      });
      testSessionId = session.id;
    });

    it('should end session successfully', async () => {
      const response = await request(app)
        .post(`/api/screening/end/${testSessionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Screening session ended successfully');
      expect(response.body.session.status).toBe('ended');
      expect(response.body.session.endTime).toBeDefined();
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .post('/api/screening/end/non-existent')
        .expect(404);

      expect(response.body.error).toBe('Screening session not found');
    });

    it('should return 400 for already ended session', async () => {
      // End the session first
      await request(app)
        .post(`/api/screening/end/${testSessionId}`)
        .expect(200);

      // Try to end it again
      const response = await request(app)
        .post(`/api/screening/end/${testSessionId}`)
        .expect(400);

      expect(response.body.error).toBe('Screening session is already ended');
    });

    it('should return 400 for completed session', async () => {
      // Update session to completed
      await databaseService.updateSession(testSessionId, { status: 'completed' });

      const response = await request(app)
        .post(`/api/screening/end/${testSessionId}`)
        .expect(400);

      expect(response.body.error).toBe('Cannot end completed session');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/screening/start')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle very large request bodies', async () => {
      const largeData = {
        patientInfo: {
          name: 'A'.repeat(10000), // Very long name
          age: 25
        }
      };

      const response = await request(app)
        .post('/api/screening/start')
        .send(largeData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle concurrent session creation', async () => {
      const patientInfo = { name: 'Test Patient', age: 25 };
      
      const promises = Array(5).fill().map(() => 
        request(app)
          .post('/api/screening/start')
          .send({ patientInfo })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.sessionId).toBeDefined();
      });
    });
  });
}); 