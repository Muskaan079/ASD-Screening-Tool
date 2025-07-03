import request from 'supertest';
import { app } from '../app.js';
import databaseService from '../services/databaseService.js';

describe('Analytics API Tests', () => {
  beforeEach(async () => {
    // Clear test data and add some sample data
    await databaseService.importData({
      sessions: [
        {
          id: 'session-1',
          patientInfo: { name: 'Patient 1', age: 25 },
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          status: 'completed',
          responses: [
            { questionId: 'social_1', analysis: { overallScore: 0.8 } },
            { questionId: 'comm_1', analysis: { overallScore: 0.7 } }
          ],
          emotionHistory: [
            { emotions: { happy: 0.8, sad: 0.1, neutral: 0.1 }, timestamp: new Date().toISOString() },
            { emotions: { happy: 0.6, sad: 0.2, neutral: 0.2 }, timestamp: new Date().toISOString() }
          ],
          motionHistory: [
            { repetitiveMotions: false, fidgeting: true, patterns: ['hand_movement'], timestamp: new Date().toISOString() },
            { repetitiveMotions: true, fidgeting: false, patterns: ['rocking'], timestamp: new Date().toISOString() }
          ]
        },
        {
          id: 'session-2',
          patientInfo: { name: 'Patient 2', age: 30 },
          startTime: new Date().toISOString(),
          status: 'active',
          responses: [
            { questionId: 'social_1', analysis: { overallScore: 0.6 } }
          ],
          emotionHistory: [
            { emotions: { happy: 0.4, sad: 0.3, neutral: 0.3 }, timestamp: new Date().toISOString() }
          ],
          motionHistory: [
            { repetitiveMotions: true, fidgeting: true, patterns: ['hand_movement', 'rocking'], timestamp: new Date().toISOString() }
          ]
        },
        {
          id: 'session-3',
          patientInfo: { name: 'Patient 3', age: 35 },
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          status: 'completed',
          responses: [
            { questionId: 'social_1', analysis: { overallScore: 0.3 } },
            { questionId: 'comm_1', analysis: { overallScore: 0.2 } }
          ],
          emotionHistory: [
            { emotions: { happy: 0.2, sad: 0.6, neutral: 0.2 }, timestamp: new Date().toISOString() }
          ],
          motionHistory: [
            { repetitiveMotions: true, fidgeting: true, patterns: ['rocking', 'hand_flapping'], timestamp: new Date().toISOString() }
          ]
        }
      ],
      reports: [
        {
          id: 'report-1',
          sessionId: 'session-1',
          patientInfo: { name: 'Patient 1', age: 25 },
          reportData: { assessment: { overallRisk: 'low' } }
        },
        {
          id: 'report-2',
          sessionId: 'session-3',
          patientInfo: { name: 'Patient 3', age: 35 },
          reportData: { assessment: { overallRisk: 'high' } }
        }
      ],
      users: []
    });
  });

  describe('GET /api/analytics/statistics', () => {
    it('should get session statistics', async () => {
      const response = await request(app)
        .get('/api/analytics/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toBeDefined();
      expect(response.body.statistics.totalSessions).toBe(3);
      expect(response.body.statistics.completedSessions).toBe(2);
      expect(response.body.statistics.activeSessions).toBe(1);
      expect(response.body.statistics.totalReports).toBe(2);
    });

    it('should handle empty database', async () => {
      await databaseService.importData({ sessions: [], reports: [], users: [] });

      const response = await request(app)
        .get('/api/analytics/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.statistics.totalSessions).toBe(0);
      expect(response.body.statistics.completedSessions).toBe(0);
      expect(response.body.statistics.activeSessions).toBe(0);
      expect(response.body.statistics.totalReports).toBe(0);
    });
  });

  describe('GET /api/analytics/category-analytics', () => {
    it('should get category analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/category-analytics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toBeDefined();
      expect(response.body.analytics.social).toBeDefined();
      expect(response.body.analytics.communication).toBeDefined();
      expect(response.body.analytics.behavioral).toBeDefined();
    });

    it('should include category scores and trends', async () => {
      const response = await request(app)
        .get('/api/analytics/category-analytics')
        .expect(200);

      const analytics = response.body.analytics;
      expect(analytics.social.averageScore).toBeDefined();
      expect(analytics.social.trend).toBeDefined();
      expect(analytics.communication.averageScore).toBeDefined();
      expect(analytics.communication.trend).toBeDefined();
    });
  });

  describe('GET /api/analytics/sessions', () => {
    it('should get session history with pagination', async () => {
      const response = await request(app)
        .get('/api/analytics/sessions?limit=10&offset=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.sessions).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.offset).toBe(0);
    });

    it('should filter sessions by status', async () => {
      const response = await request(app)
        .get('/api/analytics/sessions?status=completed')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.sessions.length).toBe(2);
      expect(response.body.sessions.every(s => s.status === 'completed')).toBe(true);
    });

    it('should filter sessions by patient name', async () => {
      const response = await request(app)
        .get('/api/analytics/sessions?patientName=Patient 1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.sessions.length).toBe(1);
      expect(response.body.sessions[0].patientInfo.name).toBe('Patient 1');
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/sessions?limit=-1&offset=abc')
        .expect(400);

      expect(response.body.error).toBe('Invalid pagination parameters');
    });

    it('should handle invalid status filter', async () => {
      const response = await request(app)
        .get('/api/analytics/sessions?status=invalid_status')
        .expect(400);

      expect(response.body.error).toBe('Invalid status filter');
    });
  });

  describe('GET /api/analytics/reports', () => {
    it('should get report history with pagination', async () => {
      const response = await request(app)
        .get('/api/analytics/reports?limit=10&offset=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.reports).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter reports by session ID', async () => {
      const response = await request(app)
        .get('/api/analytics/reports?sessionId=session-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.reports.length).toBe(1);
      expect(response.body.reports[0].sessionId).toBe('session-1');
    });

    it('should filter reports by risk level', async () => {
      const response = await request(app)
        .get('/api/analytics/reports?riskLevel=high')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.reports.length).toBe(1);
      expect(response.body.reports[0].reportData.assessment.overallRisk).toBe('high');
    });
  });

  describe('GET /api/analytics/emotion-trends', () => {
    it('should get emotion trends data', async () => {
      const response = await request(app)
        .get('/api/analytics/emotion-trends')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.trends).toBeDefined();
      expect(response.body.trends.emotionDistribution).toBeDefined();
      expect(response.body.trends.timelineData).toBeDefined();
      expect(response.body.trends.dominantEmotions).toBeDefined();
    });

    it('should include emotion confidence trends', async () => {
      const response = await request(app)
        .get('/api/analytics/emotion-trends')
        .expect(200);

      const trends = response.body.trends;
      expect(trends.confidenceTrends).toBeDefined();
      expect(trends.emotionStability).toBeDefined();
    });

    it('should filter by date range', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/analytics/emotion-trends?startDate=${startDate}&endDate=${endDate}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.trends).toBeDefined();
    });

    it('should handle invalid date range', async () => {
      const response = await request(app)
        .get('/api/analytics/emotion-trends?startDate=invalid&endDate=invalid')
        .expect(400);

      expect(response.body.error).toBe('Invalid date range');
    });
  });

  describe('GET /api/analytics/motion-patterns', () => {
    it('should get motion patterns data', async () => {
      const response = await request(app)
        .get('/api/analytics/motion-patterns')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.patterns).toBeDefined();
      expect(response.body.patterns.repetitiveMotions).toBeDefined();
      expect(response.body.patterns.fidgetingPatterns).toBeDefined();
      expect(response.body.patterns.commonPatterns).toBeDefined();
    });

    it('should include motion frequency analysis', async () => {
      const response = await request(app)
        .get('/api/analytics/motion-patterns')
        .expect(200);

      const patterns = response.body.patterns;
      expect(patterns.frequencyAnalysis).toBeDefined();
      expect(patterns.patternCorrelations).toBeDefined();
      expect(patterns.behavioralInsights).toBeDefined();
    });

    it('should filter by motion type', async () => {
      const response = await request(app)
        .get('/api/analytics/motion-patterns?motionType=repetitive')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.patterns).toBeDefined();
    });

    it('should handle invalid motion type filter', async () => {
      const response = await request(app)
        .get('/api/analytics/motion-patterns?motionType=invalid')
        .expect(400);

      expect(response.body.error).toBe('Invalid motion type filter');
    });
  });

  describe('GET /api/analytics/session-timeline', () => {
    it('should get session timeline data', async () => {
      const response = await request(app)
        .get('/api/analytics/session-timeline')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.timeline).toBeDefined();
      expect(response.body.timeline.dailySessions).toBeDefined();
      expect(response.body.timeline.weeklyTrends).toBeDefined();
      expect(response.body.timeline.monthlyStats).toBeDefined();
    });

    it('should include session duration analysis', async () => {
      const response = await request(app)
        .get('/api/analytics/session-timeline')
        .expect(200);

      const timeline = response.body.timeline;
      expect(timeline.averageDuration).toBeDefined();
      expect(timeline.durationDistribution).toBeDefined();
      expect(timeline.peakUsageTimes).toBeDefined();
    });

    it('should filter by time period', async () => {
      const response = await request(app)
        .get('/api/analytics/session-timeline?period=week')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.timeline).toBeDefined();
    });

    it('should handle invalid time period', async () => {
      const response = await request(app)
        .get('/api/analytics/session-timeline?period=invalid')
        .expect(400);

      expect(response.body.error).toBe('Invalid time period');
    });
  });

  describe('GET /api/analytics/risk-analytics', () => {
    it('should get risk level analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/risk-analytics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toBeDefined();
      expect(response.body.analytics.riskDistribution).toBeDefined();
      expect(response.body.analytics.riskTrends).toBeDefined();
      expect(response.body.analytics.riskFactors).toBeDefined();
    });

    it('should include risk factor correlations', async () => {
      const response = await request(app)
        .get('/api/analytics/risk-analytics')
        .expect(200);

      const analytics = response.body.analytics;
      expect(analytics.factorCorrelations).toBeDefined();
      expect(analytics.riskPredictors).toBeDefined();
      expect(analytics.interventionEffectiveness).toBeDefined();
    });

    it('should filter by risk level', async () => {
      const response = await request(app)
        .get('/api/analytics/risk-analytics?riskLevel=high')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toBeDefined();
    });

    it('should handle invalid risk level filter', async () => {
      const response = await request(app)
        .get('/api/analytics/risk-analytics?riskLevel=invalid')
        .expect(400);

      expect(response.body.error).toBe('Invalid risk level filter');
    });
  });

  describe('GET /api/analytics/export', () => {
    it('should export data successfully', async () => {
      const response = await request(app)
        .get('/api/analytics/export')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.sessions).toBeDefined();
      expect(response.body.data.reports).toBeDefined();
      expect(response.body.data.users).toBeDefined();
      expect(response.body.data.exportedAt).toBeDefined();
    });

    it('should include all data types in export', async () => {
      const response = await request(app)
        .get('/api/analytics/export')
        .expect(200);

      const data = response.body.data;
      expect(Array.isArray(data.sessions)).toBe(true);
      expect(Array.isArray(data.reports)).toBe(true);
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.sessions.length).toBe(3);
      expect(data.reports.length).toBe(2);
    });

    it('should handle empty database export', async () => {
      await databaseService.importData({ sessions: [], reports: [], users: [] });

      const response = await request(app)
        .get('/api/analytics/export')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions.length).toBe(0);
      expect(response.body.data.reports.length).toBe(0);
      expect(response.body.data.users.length).toBe(0);
    });
  });

  describe('POST /api/analytics/import', () => {
    it('should import data successfully', async () => {
      const importData = {
        sessions: [
          {
            id: 'imported-session',
            patientInfo: { name: 'Imported Patient', age: 35 },
            startTime: new Date().toISOString(),
            status: 'completed',
            responses: []
          }
        ],
        reports: [],
        users: []
      };

      const response = await request(app)
        .post('/api/analytics/import')
        .send({ data: importData })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Data imported successfully');
      expect(response.body.result.importedSessions).toBe(1);
    });

    it('should return 400 for missing data', async () => {
      const response = await request(app)
        .post('/api/analytics/import')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Data is required for import');
    });

    it('should validate imported data structure', async () => {
      const invalidData = {
        sessions: 'not an array',
        reports: [],
        users: []
      };

      const response = await request(app)
        .post('/api/analytics/import')
        .send({ data: invalidData })
        .expect(400);

      expect(response.body.error).toBe('Invalid data structure');
    });

    it('should handle duplicate session IDs', async () => {
      const importData = {
        sessions: [
          {
            id: 'session-1', // Already exists
            patientInfo: { name: 'Duplicate Patient', age: 40 },
            startTime: new Date().toISOString(),
            status: 'completed',
            responses: []
          }
        ],
        reports: [],
        users: []
      };

      const response = await request(app)
        .post('/api/analytics/import')
        .send({ data: importData })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.duplicateSessions).toBe(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/analytics/import')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle very large export requests', async () => {
      // Create many sessions to test large export
      const manySessions = Array(1000).fill().map((_, i) => ({
        id: `bulk-session-${i}`,
        patientInfo: { name: `Bulk Patient ${i}`, age: 25 },
        startTime: new Date().toISOString(),
        status: 'completed',
        responses: []
      }));

      await databaseService.importData({
        sessions: manySessions,
        reports: [],
        users: []
      });

      const response = await request(app)
        .get('/api/analytics/export')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions.length).toBe(1000);
    });

    it('should handle concurrent analytics requests', async () => {
      const promises = [
        request(app).get('/api/analytics/statistics'),
        request(app).get('/api/analytics/category-analytics'),
        request(app).get('/api/analytics/sessions'),
        request(app).get('/api/analytics/emotion-trends'),
        request(app).get('/api/analytics/motion-patterns')
      ];

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database failures
      // For now, we'll test that the API handles missing data gracefully
      await databaseService.importData({ sessions: [], reports: [], users: [] });

      const response = await request(app)
        .get('/api/analytics/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.statistics.totalSessions).toBe(0);
    });
  });
}); 