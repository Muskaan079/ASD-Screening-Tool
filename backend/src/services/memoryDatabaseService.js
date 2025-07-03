// Simple in-memory database service
class MemoryDatabaseService {
  constructor() {
    this.sessions = new Map();
    this.responses = new Map();
    this.emotionHistory = new Map();
    this.motionHistory = new Map();
    this.analytics = [];
  }

  // Session management
  async createSession(sessionId, patientInfo = null) {
    const session = {
      id: sessionId,
      patientInfo,
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
      }
    };
    
    this.sessions.set(sessionId, session);
    console.log(`✅ Created session: ${sessionId}`);
    return session;
  }

  async getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.log(`❌ Session not found: ${sessionId}`);
      return null;
    }
    return session;
  }

  async updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Handle different types of updates
    if (updates.patientInfo !== undefined) {
      session.patientInfo = updates.patientInfo;
    }
    if (updates.status !== undefined) {
      session.status = updates.status;
    }
    if (updates.responses !== undefined) {
      session.responses = updates.responses;
    }
    if (updates.emotionHistory !== undefined) {
      session.emotionHistory = updates.emotionHistory;
    }
    if (updates.motionHistory !== undefined) {
      session.motionHistory = updates.motionHistory;
    }
    if (updates.currentQuestion !== undefined) {
      session.currentQuestion = updates.currentQuestion;
    }

    session.lastUpdated = new Date().toISOString();
    this.sessions.set(sessionId, session);
    return session;
  }

  async deleteSession(sessionId) {
    const deleted = this.sessions.delete(sessionId);
    this.responses.delete(sessionId);
    this.emotionHistory.delete(sessionId);
    this.motionHistory.delete(sessionId);
    console.log(`🗑️ Deleted session: ${sessionId}`);
    return deleted;
  }

  // Analytics tracking
  async trackEvent(sessionId, eventType, eventData = {}) {
    const event = {
      id: Date.now().toString(),
      sessionId,
      eventType,
      eventData,
      timestamp: new Date().toISOString()
    };
    
    this.analytics.push(event);
    console.log(`📊 Tracked event: ${eventType} for session ${sessionId}`);
    return event;
  }

  async getAnalytics(sessionId = null, eventType = null, limit = 100) {
    let filtered = this.analytics;
    
    if (sessionId) {
      filtered = filtered.filter(event => event.sessionId === sessionId);
    }
    if (eventType) {
      filtered = filtered.filter(event => event.eventType === eventType);
    }
    
    return filtered.slice(0, limit);
  }

  // Cleanup old sessions (older than 24 hours)
  async cleanupExpiredSessions() {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);
    
    let cleanedCount = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (new Date(session.startTime) < cutoffTime) {
        this.deleteSession(sessionId);
        cleanedCount++;
      }
    }
    
    console.log(`🧹 Cleaned up ${cleanedCount} old sessions`);
    return cleanedCount;
  }

  // Get session statistics
  async getSessionStats() {
    const sessions = Array.from(this.sessions.values());
    return {
      total_sessions: sessions.length,
      active_sessions: sessions.filter(s => s.status === 'active').length,
      completed_sessions: sessions.filter(s => s.status === 'completed').length,
      abandoned_sessions: sessions.filter(s => s.status === 'abandoned').length
    };
  }

  // Get analytics summary
  async getAnalyticsSummary() {
    const eventCounts = {};
    for (const event of this.analytics) {
      eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
    }
    
    return Object.entries(eventCounts).map(([eventType, count]) => ({
      event_type: eventType,
      event_count: count,
      first_occurrence: this.analytics.find(e => e.eventType === eventType)?.timestamp,
      last_occurrence: this.analytics.filter(e => e.eventType === eventType).pop()?.timestamp
    }));
  }

  // Additional methods for analytics controller
  async getSessionStatistics() {
    return this.getSessionStats();
  }

  async getCategoryAnalytics() {
    const sessions = Array.from(this.sessions.values());
    const categories = {};
    
    for (const session of sessions) {
      for (const response of session.responses || []) {
        const category = response.analysis?.category || 'unknown';
        if (!categories[category]) {
          categories[category] = { count: 0, correct: 0, incorrect: 0 };
        }
        categories[category].count++;
        if (response.analysis?.isCorrect) {
          categories[category].correct++;
        } else {
          categories[category].incorrect++;
        }
      }
    }
    
    return Object.entries(categories).map(([category, data]) => ({
      category,
      total_questions: data.count,
      correct_answers: data.correct,
      incorrect_answers: data.incorrect,
      accuracy_rate: data.count > 0 ? (data.correct / data.count) * 100 : 0
    }));
  }

  async listSessions(filters = {}) {
    let sessions = Array.from(this.sessions.values());
    
    if (filters.status) {
      sessions = sessions.filter(s => s.status === filters.status);
    }
    if (filters.patientName) {
      sessions = sessions.filter(s => 
        s.patientInfo?.name?.toLowerCase().includes(filters.patientName.toLowerCase())
      );
    }
    if (filters.startDate) {
      sessions = sessions.filter(s => new Date(s.startTime) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      sessions = sessions.filter(s => new Date(s.startTime) <= new Date(filters.endDate));
    }
    
    return sessions.map(session => ({
      id: session.id,
      patientInfo: session.patientInfo,
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status,
      responses: session.responses?.length || 0,
      lastUpdated: session.lastUpdated
    }));
  }

  async listReports(filters = {}) {
    const sessions = Array.from(this.sessions.values())
      .filter(s => s.status === 'completed' && s.report);
    
    let reports = sessions.map(session => ({
      sessionId: session.id,
      patientName: session.patientInfo?.name || 'Unknown',
      generatedAt: session.endTime,
      report: session.report
    }));
    
    if (filters.sessionId) {
      reports = reports.filter(r => r.sessionId === filters.sessionId);
    }
    if (filters.patientName) {
      reports = reports.filter(r => 
        r.patientName.toLowerCase().includes(filters.patientName.toLowerCase())
      );
    }
    
    return reports;
  }

  async exportData() {
    return {
      sessions: Array.from(this.sessions.values()),
      analytics: this.analytics,
      exportedAt: new Date().toISOString()
    };
  }

  async importData(data) {
    if (data.sessions) {
      for (const session of data.sessions) {
        this.sessions.set(session.id, session);
      }
    }
    if (data.analytics) {
      this.analytics.push(...data.analytics);
    }
    return { success: true, imported: data.sessions?.length || 0 };
  }

  // Initialize database (no-op for in-memory)
  async initializeTables() {
    console.log('✅ In-memory database initialized');
  }

  // Close database (no-op for in-memory)
  async close() {
    console.log('🔌 In-memory database closed');
  }
}

export default new MemoryDatabaseService(); 