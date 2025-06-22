import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  TestSession,
  AdaptiveQuestioningData,
  MultimodalContext,
  LLMAnalysis,
  ClinicalReport,
  ExplainabilityData,
  DevelopmentalProjection,
  User
} from '../types';

interface AppState {
  // User Management
  currentUser: User | null;
  isAuthenticated: boolean;
  
  // Test Session Management
  currentSession: TestSession | null;
  sessionHistory: TestSession[];
  
  // Adaptive Questioning
  adaptiveData: AdaptiveQuestioningData | null;
  questionHistory: any[];
  
  // Multimodal Analysis
  multimodalContext: MultimodalContext | null;
  llmAnalysis: LLMAnalysis | null;
  
  // Clinical Reports
  currentReport: ClinicalReport | null;
  reportHistory: ClinicalReport[];
  
  // Explainability
  explainabilityData: ExplainabilityData | null;
  
  // Predictive Simulation
  developmentalProjection: DevelopmentalProjection | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  currentTest: string | null;
  testProgress: number;
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  setAuthenticated: (status: boolean) => void;
  
  startSession: (userId: string) => void;
  updateSession: (updates: Partial<TestSession>) => void;
  endSession: () => void;
  
  updateAdaptiveData: (data: Partial<AdaptiveQuestioningData>) => void;
  addQuestionResponse: (response: any) => void;
  
  setMultimodalContext: (context: MultimodalContext) => void;
  setLLMAnalysis: (analysis: LLMAnalysis) => void;
  
  setCurrentReport: (report: ClinicalReport) => void;
  addReportToHistory: (report: ClinicalReport) => void;
  
  setExplainabilityData: (data: ExplainabilityData) => void;
  setDevelopmentalProjection: (projection: DevelopmentalProjection) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentTest: (test: string | null) => void;
  setTestProgress: (progress: number) => void;
  
  reset: () => void;
}

const initialState = {
  currentUser: null,
  isAuthenticated: false,
  currentSession: null,
  sessionHistory: [],
  adaptiveData: null,
  questionHistory: [],
  multimodalContext: null,
  llmAnalysis: null,
  currentReport: null,
  reportHistory: [],
  explainabilityData: null,
  developmentalProjection: null,
  isLoading: false,
  error: null,
  currentTest: null,
  testProgress: 0,
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // User Management Actions
        setCurrentUser: (user) => set({ currentUser: user }),
        setAuthenticated: (status) => set({ isAuthenticated: status }),
        
        // Session Management Actions
        startSession: (userId) => {
          const session: TestSession = {
            id: `session_${Date.now()}`,
            userId,
            startTime: new Date(),
            status: 'active',
            adaptiveData: {
              voiceTone: {
                prosody: { pitch: 0, volume: 0, speechRate: 0, clarity: 0 },
                emotion: 'neutral',
                confidence: 0,
                timestamp: new Date()
              },
              facialExpression: {
                expressions: {
                  happy: 0, sad: 0, angry: 0, surprised: 0,
                  fearful: 0, disgusted: 0, neutral: 1
                },
                dominantEmotion: 'neutral',
                confusion: 0,
                attention: 1,
                timestamp: new Date()
              },
              responseMetrics: {
                responseTime: 0,
                accuracy: 0,
                confidence: 0,
                hesitation: 0,
                corrections: 0
              },
              currentDifficulty: 'medium',
              questionHistory: []
            }
          };
          set({ currentSession: session });
        },
        
        updateSession: (updates) => {
          const { currentSession } = get();
          if (currentSession) {
            set({ currentSession: { ...currentSession, ...updates } });
          }
        },
        
        endSession: () => {
          const { currentSession } = get();
          if (currentSession) {
            const endedSession = {
              ...currentSession,
              endTime: new Date(),
              status: 'completed' as const
            };
            set({
              currentSession: null,
              sessionHistory: [...get().sessionHistory, endedSession]
            });
          }
        },
        
        // Adaptive Questioning Actions
        updateAdaptiveData: (data) => {
          const { adaptiveData } = get();
          if (adaptiveData) {
            set({ adaptiveData: { ...adaptiveData, ...data } });
          }
        },
        
        addQuestionResponse: (response) => {
          const { questionHistory } = get();
          set({ questionHistory: [...questionHistory, response] });
        },
        
        // Multimodal Analysis Actions
        setMultimodalContext: (context) => set({ multimodalContext: context }),
        setLLMAnalysis: (analysis) => set({ llmAnalysis: analysis }),
        
        // Clinical Report Actions
        setCurrentReport: (report) => set({ currentReport: report }),
        addReportToHistory: (report) => {
          const { reportHistory } = get();
          set({ reportHistory: [...reportHistory, report] });
        },
        
        // Explainability Actions
        setExplainabilityData: (data) => set({ explainabilityData: data }),
        setDevelopmentalProjection: (projection) => set({ developmentalProjection: projection }),
        
        // UI State Actions
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        setCurrentTest: (test) => set({ currentTest: test }),
        setTestProgress: (progress) => set({ testProgress: progress }),
        
        // Reset Action
        reset: () => set(initialState),
      }),
      {
        name: 'asd-screening-store',
        partialize: (state) => ({
          currentUser: state.currentUser,
          isAuthenticated: state.isAuthenticated,
          sessionHistory: state.sessionHistory,
          reportHistory: state.reportHistory,
        }),
      }
    ),
    {
      name: 'asd-screening-store',
    }
  )
); 