// Core Types for ASD Screening Application

export interface User {
  id: string;
  name: string;
  age: number;
  email: string;
  role: 'patient' | 'practitioner' | 'admin';
  createdAt: Date;
}

export interface TestSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'paused';
  currentTest?: string;
  adaptiveData: AdaptiveQuestioningData;
}

// 1. Real-Time Adaptive Questioning Types
export interface AdaptiveQuestioningData {
  voiceTone: VoiceAnalysis;
  facialExpression: FacialAnalysis;
  responseMetrics: ResponseMetrics;
  currentDifficulty: 'easy' | 'medium' | 'hard';
  questionHistory: QuestionResponse[];
}

export interface VoiceAnalysis {
  prosody: {
    pitch: number;
    volume: number;
    speechRate: number;
    clarity: number;
  };
  emotion: 'neutral' | 'confused' | 'frustrated' | 'excited' | 'anxious';
  confidence: number;
  timestamp: Date;
}

export interface FacialAnalysis {
  expressions: {
    happy: number;
    sad: number;
    angry: number;
    surprised: number;
    fearful: number;
    disgusted: number;
    neutral: number;
  };
  dominantEmotion: string;
  confusion: number;
  attention: number;
  timestamp: Date;
}

export interface ResponseMetrics {
  responseTime: number;
  accuracy: number;
  confidence: number;
  hesitation: number;
  corrections: number;
}

export interface QuestionResponse {
  questionId: string;
  question: string;
  response: string;
  responseTime: number;
  accuracy: number;
  difficulty: string;
  adaptiveFactors: {
    voiceTone: VoiceAnalysis;
    facialExpression: FacialAnalysis;
  };
}

// 2. Multimodal LLM Integration Types
export interface MultimodalContext {
  text: string;
  speech: {
    transcript: string;
    confidence: number;
    emotion: string;
  };
  facial: {
    expressions: Record<string, number>;
    dominantEmotion: string;
    attention: number;
  };
  behavioral: {
    responseTime: number;
    accuracy: number;
    engagement: number;
  };
  timestamp: Date;
}

export interface LLMAnalysis {
  response: string;
  confidence: number;
  nextAction: 'continue' | 'adjust_difficulty' | 'repeat' | 'move_to_next';
  reasoning: string;
  suggestedQuestion?: string;
}

// 3. Clinical Report Types (DSM-5/ICD-11 aligned)
export interface ClinicalReport {
  id: string;
  sessionId: string;
  patientId: string;
  practitionerId: string;
  date: Date;
  
  // DSM-5 Criteria Assessment
  dsm5Criteria: {
    socialCommunication: {
      socialEmotionalReciprocity: number;
      nonverbalCommunication: number;
      relationships: number;
    };
    restrictedRepetitive: {
      stereotypedRepetitive: number;
      insistenceOnSameness: number;
      restrictedInterests: number;
      sensoryHyperreactivity: number;
    };
  };
  
  // ICD-11 Criteria
  icd11Criteria: {
    socialInteraction: number;
    communication: number;
    repetitiveBehaviors: number;
    sensoryIssues: number;
  };
  
  // Test Results
  testResults: {
    emotionRecognition: TestResult;
    patternRecognition: TestResult;
    reactionTime: TestResult;
    adaptiveQuestioning: AdaptiveQuestioningData;
  };
  
  // AI Analysis
  aiAnalysis: {
    summary: string;
    observations: string[];
    riskFactors: string[];
    recommendations: string[];
    confidence: number;
  };
  
  // Report Metadata
  metadata: {
    totalDuration: number;
    questionsAnswered: number;
    adaptiveAdjustments: number;
    exportFormat: 'pdf' | 'json';
  };
}

export interface TestResult {
  score: number;
  maxScore: number;
  percentage: number;
  timeTaken: number;
  accuracy: number;
  ageNorm: number;
  percentile: number;
}

// 4. Visual Model Explainability Types
export interface ExplainabilityData {
  featureImportance: Record<string, number>;
  attentionWeights: number[];
  confidenceHeatmap: number[][];
  decisionPath: string[];
  modelVersion: string;
}

// 5. Predictive Simulation Types
export interface DevelopmentalProjection {
  timeline: {
    age: number;
    projectedSkills: string[];
    riskFactors: string[];
    interventions: string[];
  }[];
  confidence: number;
  modelType: 'rnn' | 'llm' | 'ensemble';
}

// 6. Multi-Test UX Types
export interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: Test[];
  adaptiveConfig: AdaptiveConfig;
  ageRange: {
    min: number;
    max: number;
  };
}

export interface Test {
  id: string;
  name: string;
  type: 'cognitive' | 'emotional' | 'social';
  difficulty: 'easy' | 'medium' | 'hard';
  adaptive: boolean;
  config: TestConfig;
}

export interface TestConfig {
  timeLimit?: number;
  questionCount: number;
  adaptiveThresholds: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface AdaptiveConfig {
  enabled: boolean;
  adjustmentRate: number;
  minDifficulty: string;
  maxDifficulty: string;
  performanceWindow: number;
}

// 7. PDF Export Types
export interface PDFExportConfig {
  template: 'clinical' | 'summary' | 'detailed';
  includeCharts: boolean;
  includeExplainability: boolean;
  practitionerSignature?: string;
  clinicInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

// WebSocket Event Types
export interface WebSocketEvents {
  'session:start': TestSession;
  'session:update': Partial<TestSession>;
  'session:end': TestSession;
  'adaptive:question': QuestionResponse;
  'multimodal:data': MultimodalContext;
  'llm:analysis': LLMAnalysis;
  'explainability:update': ExplainabilityData;
  'error': { message: string; code: string };
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} 