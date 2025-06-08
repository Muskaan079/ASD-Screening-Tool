import React, { createContext, useContext, useReducer } from 'react';

const TestContext = createContext();

const initialState = {
  currentTest: null,
  testProgress: 0,
  score: 0,
  answers: [],
  isTestStarted: false,
  isTestComplete: false,
  timeSpent: 0,
};

const testReducer = (state, action) => {
  switch (action.type) {
    case 'START_TEST':
      return {
        ...state,
        currentTest: action.payload,
        isTestStarted: true,
        testProgress: 0,
        score: 0,
        answers: [],
        timeSpent: 0,
      };
    case 'SUBMIT_ANSWER':
      return {
        ...state,
        answers: [...state.answers, action.payload],
        score: state.score + (action.payload.isCorrect ? 1 : 0),
        testProgress: state.testProgress + 1,
      };
    case 'COMPLETE_TEST':
      return {
        ...state,
        isTestComplete: true,
      };
    case 'UPDATE_TIME':
      return {
        ...state,
        timeSpent: action.payload,
      };
    case 'RESET_TEST':
      return initialState;
    default:
      return state;
  }
};

export const TestProvider = ({ children }) => {
  const [state, dispatch] = useReducer(testReducer, initialState);

  const value = {
    state,
    dispatch,
    startTest: (testType) => {
      dispatch({ type: 'START_TEST', payload: testType });
    },
    submitAnswer: (answer) => {
      dispatch({ type: 'SUBMIT_ANSWER', payload: answer });
    },
    completeTest: () => {
      dispatch({ type: 'COMPLETE_TEST' });
    },
    updateTime: (time) => {
      dispatch({ type: 'UPDATE_TIME', payload: time });
    },
    resetTest: () => {
      dispatch({ type: 'RESET_TEST' });
    },
  };

  return <TestContext.Provider value={value}>{children}</TestContext.Provider>;
};

export const useTest = () => {
  const context = useContext(TestContext);
  if (!context) {
    throw new Error('useTest must be used within a TestProvider');
  }
  return context;
}; 