// API service for connecting to the backend
const API_BASE_URL = 'https://asd-screening-backend.onrender.com/api';

// API Secret Key for authentication
const API_SECRET_KEY = 'asd_screening_secure_key_2024';

interface PatientInfo {
  name: string;
  age: number;
  gender?: string;
  parentName?: string;
  contactInfo?: string;
}

interface ScreeningSession {
  id: string;
  patientInfo: PatientInfo;
  startTime: string;
  status: string;
}

interface Question {
  id: string;
  text: string;
  type: string;
  category: string;
  options?: string[];
  difficulty: number;
}

interface Response {
  questionId: string;
  answer: any;
  confidence?: number;
  responseTime?: number;
  emotionData?: any;
  motionData?: any;
  voiceData?: any;
}

interface EmotionData {
  dominant_emotion: string;
  confidence: number;
  emotions: Record<string, number>;
  timestamp: string;
}

interface MotionData {
  repetitive_motions: boolean;
  fidgeting: boolean;
  patterns: string[];
  motion_data: any;
  timestamp: string;
}

interface VoiceData {
  prosody: {
    pitch: number;
    volume: number;
    speechRate: number;
    clarity: number;
  };
  voiceEmotion: string;
  speechPatterns: string[];
  timestamp: string;
}

class APIService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-API-Key': API_SECRET_KEY,
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async checkHealth(): Promise<{ status: string; timestamp: string; environment: string }> {
    return this.makeRequest('/health');
  }

  // Start a new screening session
  async startScreening(patientInfo: PatientInfo): Promise<{ success: boolean; sessionId: string; session: ScreeningSession }> {
    return this.makeRequest('/screening/start', {
      method: 'POST',
      body: JSON.stringify({ patientInfo }),
    });
  }

  // Start a new comprehensive screening session
  async startComprehensiveScreening(patientInfo: PatientInfo): Promise<{ success: boolean; sessionId: string; session: ScreeningSession }> {
    return this.makeRequest('/comprehensive-screening/start', {
      method: 'POST',
      body: JSON.stringify({ patientInfo }),
    });
  }

  // Get next question for the session
  async getNextQuestion(sessionId: string, currentResponse?: Response, emotionData?: EmotionData, motionData?: MotionData): Promise<{
    success: boolean;
    question: Question;
    sessionProgress: {
      questionsAnswered: number;
      totalQuestions: number;
      progress: number;
    };
  }> {
    return this.makeRequest('/screening/next-question', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        currentResponse,
        emotionData,
        motionData,
      }),
    });
  }

  // Submit an answer
  async submitAnswer(sessionId: string, questionId: string, answer: any, options?: {
    confidence?: number;
    responseTime?: number;
    emotionData?: EmotionData;
    motionData?: MotionData;
    voiceData?: any;
  }): Promise<{
    success: boolean;
    analysis: any;
    sessionProgress: {
      questionsAnswered: number;
      totalQuestions: number;
      progress: number;
    };
  }> {
    return this.makeRequest('/screening/submit-answer', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        questionId,
        answer,
        ...options,
      }),
    });
  }

  // Update emotion data
  async updateEmotionData(sessionId: string, emotionData: EmotionData): Promise<{ success: boolean; message: string }> {
    return this.makeRequest('/screening/emotion-data', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        emotionData,
      }),
    });
  }

  // Update comprehensive emotion data
  async updateComprehensiveEmotionData(sessionId: string, emotionData: EmotionData): Promise<{ success: boolean; message: string; emotionCount: number }> {
    return this.makeRequest('/comprehensive-screening/emotion-data', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        emotionData,
      }),
    });
  }

  // Update motion data
  async updateMotionData(sessionId: string, motionData: MotionData): Promise<{ success: boolean; message: string }> {
    return this.makeRequest('/screening/motion-data', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        motionData,
      }),
    });
  }

  // Update comprehensive motion data
  async updateComprehensiveMotionData(sessionId: string, motionData: MotionData): Promise<{ success: boolean; message: string; motionCount: number }> {
    return this.makeRequest('/comprehensive-screening/motion-data', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        motionData,
      }),
    });
  }

  // Update comprehensive voice data
  async updateComprehensiveVoiceData(sessionId: string, voiceData: VoiceData): Promise<{ success: boolean; message: string; voiceCount: number }> {
    return this.makeRequest('/comprehensive-screening/voice-data', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        voiceData,
      }),
    });
  }

  // Get screening status
  async getScreeningStatus(sessionId: string): Promise<{
    success: boolean;
    session: {
      id: string;
      patientInfo: PatientInfo;
      status: string;
      startTime: string;
      lastUpdated: string;
      progress: {
        questionsAnswered: number;
        totalQuestions: number;
        percentage: number;
      };
      currentQuestion: Question | null;
    };
  }> {
    return this.makeRequest(`/screening/status/${sessionId}`);
  }

  // Get comprehensive screening status
  async getComprehensiveScreeningStatus(sessionId: string): Promise<{
    success: boolean;
    session: {
      id: string;
      patientInfo: PatientInfo;
      status: string;
      phase: string;
      startTime: string;
      lastUpdated: string;
      duration: number;
      dataCounts: {
        emotionData: number;
        motionData: number;
        voiceData: number;
        textResponses: number;
      };
    };
  }> {
    return this.makeRequest(`/comprehensive-screening/status/${sessionId}`);
  }

  // Get real-time analysis
  async getRealTimeAnalysis(sessionId: string): Promise<{
    success: boolean;
    realTimeAnalysis: {
      emotion: any;
      gesture: any;
      voice: any;
      dataAvailable: {
        emotion: boolean;
        motion: boolean;
        voice: boolean;
      };
    };
  }> {
    return this.makeRequest(`/comprehensive-screening/analysis/${sessionId}`);
  }

  // Generate final report
  async generateReport(sessionId: string, practitionerInfo?: any): Promise<{
    success: boolean;
    report: any;
    sessionId: string;
  }> {
    return this.makeRequest('/screening/generate-report', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        practitionerInfo,
      }),
    });
  }

  // Generate comprehensive report
  async generateComprehensiveReport(sessionId: string, practitionerInfo?: any): Promise<{
    success: boolean;
    report: any;
    sessionId: string;
    assessment: any;
    message: string;
  }> {
    return this.makeRequest('/comprehensive-screening/generate-report', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        practitionerInfo,
      }),
    });
  }

  // End screening session
  async endScreening(sessionId: string): Promise<{ success: boolean; message: string; sessionId: string }> {
    return this.makeRequest('/screening/end', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  // Get analytics data
  async getAnalytics(sessionId?: string, eventType?: string, limit?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (sessionId) params.append('sessionId', sessionId);
    if (eventType) params.append('eventType', eventType);
    if (limit) params.append('limit', limit.toString());

    return this.makeRequest(`/analytics/events?${params.toString()}`);
  }

  // Get session statistics
  async getSessionStats(): Promise<{
    success: boolean;
    statistics: {
      total_sessions: number;
      active_sessions: number;
      completed_sessions: number;
      abandoned_sessions: number;
    };
  }> {
    return this.makeRequest('/analytics/session-stats');
  }
}

// Create singleton instance
const apiService = new APIService();

export default apiService;
export type { PatientInfo, ScreeningSession, Question, Response, EmotionData, MotionData, VoiceData }; 