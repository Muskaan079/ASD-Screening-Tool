import React from 'react';
import { render, screen } from '@testing-library/react';
import LiveGestureAnalysis from './LiveGestureAnalysis';

// Mock the dependencies
jest.mock('face-api.js', () => ({
  nets: {
    tinyFaceDetector: {
      loadFromUri: jest.fn().mockResolvedValue(true)
    },
    faceExpressionNet: {
      loadFromUri: jest.fn().mockResolvedValue(true)
    }
  },
  detectAllFaces: jest.fn().mockResolvedValue([])
}));

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    startScreening: jest.fn().mockResolvedValue({ sessionId: 'test-session-123' }),
    updateEmotionData: jest.fn().mockResolvedValue(true),
    updateMotionData: jest.fn().mockResolvedValue(true),
    generateReport: jest.fn().mockResolvedValue({ report: 'Test report' })
  }
}));

// Mock MediaPipe
global.MediaStream = jest.fn().mockImplementation(() => ({
  getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }])
}));

describe('LiveGestureAnalysis', () => {
  const defaultProps = {
    patientInfo: {
      name: 'Test Patient',
      age: 8,
      gender: 'Male'
    },
    sessionDuration: 60,
    onAnalysisComplete: jest.fn()
  };

  beforeEach(() => {
    // Mock getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue(new MediaStream())
      },
      writable: true
    });
  });

  it('renders loading state initially', () => {
    render(<LiveGestureAnalysis {...defaultProps} />);
    expect(screen.getByText(/Loading gesture analysis models/)).toBeInTheDocument();
  });

  it('renders with patient information', () => {
    render(<LiveGestureAnalysis {...defaultProps} />);
    expect(screen.getByText(/Test Patient/)).toBeInTheDocument();
  });

  it('shows session duration', () => {
    render(<LiveGestureAnalysis {...defaultProps} sessionDuration={120} />);
    expect(screen.getByText(/1:00/)).toBeInTheDocument();
  });
}); 