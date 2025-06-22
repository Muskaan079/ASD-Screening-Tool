import React, { createContext, useContext, useReducer } from 'react';

// Initial state
const initialState = {
  currentSession: null,
  currentReport: null,
  adaptiveData: null,
  multimodalContext: null,
  llmAnalysis: null,
  explainabilityData: null,
  developmentalProjection: null,
  loading: false,
  error: null,
  questionHistory: [],
  sessionHistory: []
};

// Action types
const ACTIONS = {
  SET_CURRENT_SESSION: 'SET_CURRENT_SESSION',
  SET_CURRENT_REPORT: 'SET_CURRENT_REPORT',
  SET_ADAPTIVE_DATA: 'SET_ADAPTIVE_DATA',
  SET_MULTIMODAL_CONTEXT: 'SET_MULTIMODAL_CONTEXT',
  SET_LLM_ANALYSIS: 'SET_LLM_ANALYSIS',
  SET_EXPLAINABILITY_DATA: 'SET_EXPLAINABILITY_DATA',
  SET_DEVELOPMENTAL_PROJECTION: 'SET_DEVELOPMENTAL_PROJECTION',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_QUESTION_RESPONSE: 'ADD_QUESTION_RESPONSE',
  UPDATE_ADAPTIVE_DATA: 'UPDATE_ADAPTIVE_DATA'
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_CURRENT_SESSION:
      return { ...state, currentSession: action.payload };
    case ACTIONS.SET_CURRENT_REPORT:
      return { ...state, currentReport: action.payload };
    case ACTIONS.SET_ADAPTIVE_DATA:
      return { ...state, adaptiveData: action.payload };
    case ACTIONS.SET_MULTIMODAL_CONTEXT:
      return { ...state, multimodalContext: action.payload };
    case ACTIONS.SET_LLM_ANALYSIS:
      return { ...state, llmAnalysis: action.payload };
    case ACTIONS.SET_EXPLAINABILITY_DATA:
      return { ...state, explainabilityData: action.payload };
    case ACTIONS.SET_DEVELOPMENTAL_PROJECTION:
      return { ...state, developmentalProjection: action.payload };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.ADD_QUESTION_RESPONSE:
      return { 
        ...state, 
        questionHistory: [...state.questionHistory, action.payload] 
      };
    case ACTIONS.UPDATE_ADAPTIVE_DATA:
      return { 
        ...state, 
        adaptiveData: { ...state.adaptiveData, ...action.payload } 
      };
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Action creators
  const actions = {
    setCurrentSession: (session) => 
      dispatch({ type: ACTIONS.SET_CURRENT_SESSION, payload: session }),
    
    setCurrentReport: (report) => 
      dispatch({ type: ACTIONS.SET_CURRENT_REPORT, payload: report }),
    
    setAdaptiveData: (data) => 
      dispatch({ type: ACTIONS.SET_ADAPTIVE_DATA, payload: data }),
    
    setMultimodalContext: (context) => 
      dispatch({ type: ACTIONS.SET_MULTIMODAL_CONTEXT, payload: context }),
    
    setLLMAnalysis: (analysis) => 
      dispatch({ type: ACTIONS.SET_LLM_ANALYSIS, payload: analysis }),
    
    setExplainabilityData: (data) => 
      dispatch({ type: ACTIONS.SET_EXPLAINABILITY_DATA, payload: data }),
    
    setDevelopmentalProjection: (projection) => 
      dispatch({ type: ACTIONS.SET_DEVELOPMENTAL_PROJECTION, payload: projection }),
    
    setLoading: (loading) => 
      dispatch({ type: ACTIONS.SET_LOADING, payload: loading }),
    
    setError: (error) => 
      dispatch({ type: ACTIONS.SET_ERROR, payload: error }),
    
    addQuestionResponse: (response) => 
      dispatch({ type: ACTIONS.ADD_QUESTION_RESPONSE, payload: response }),
    
    updateAdaptiveData: (updates) => 
      dispatch({ type: ACTIONS.UPDATE_ADAPTIVE_DATA, payload: updates })
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use the store
export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  
  const { state, actions } = context;
  
  return {
    // State
    currentSession: state.currentSession,
    currentReport: state.currentReport,
    adaptiveData: state.adaptiveData,
    multimodalContext: state.multimodalContext,
    llmAnalysis: state.llmAnalysis,
    explainabilityData: state.explainabilityData,
    developmentalProjection: state.developmentalProjection,
    loading: state.loading,
    error: state.error,
    questionHistory: state.questionHistory,
    sessionHistory: state.sessionHistory,
    
    // Actions
    setCurrentSession: actions.setCurrentSession,
    setCurrentReport: actions.setCurrentReport,
    setAdaptiveData: actions.setAdaptiveData,
    setMultimodalContext: actions.setMultimodalContext,
    setLLMAnalysis: actions.setLLMAnalysis,
    setExplainabilityData: actions.setExplainabilityData,
    setDevelopmentalProjection: actions.setDevelopmentalProjection,
    setLoading: actions.setLoading,
    setError: actions.setError,
    addQuestionResponse: actions.addQuestionResponse,
    updateAdaptiveData: actions.updateAdaptiveData
  };
}; 