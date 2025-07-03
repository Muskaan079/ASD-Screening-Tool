import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClinicalDashboard from './ClinicalDashboard';

// Mock fetch for API calls
global.fetch = jest.fn();

const mockApiResponse = {
  statistics: {
    totalSessions: 150,
    completedSessions: 120,
    activeSessions: 20,
    averageQuestionsPerSession: 18.5,
    averageSessionDuration: 25.3,
    totalReports: 120,
    completionRate: 80
  },
  sessions: [
    {
      id: 'session-1',
      patientInfo: { name: 'John Doe', age: 25, gender: 'male' },
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T10:30:00Z',
      status: 'completed',
      responses: [],
      progress: { questionsAnswered: 20, totalQuestions: 20, percentage: 100 }
    }
  ],
  analytics: {
    social: { responses: 50, averageScore: 0.7 },
    communication: { responses: 45, averageScore: 0.6 },
    behavior: { responses: 40, averageScore: 0.8 }
  },
  emotionTrends: {
    emotionCounts: { happy: 30, neutral: 20, sad: 10 },
    timeSeries: [
      { date: '2024-01-01', happy: 10, neutral: 5, sad: 2 },
      { date: '2024-01-02', happy: 8, neutral: 7, sad: 3 }
    ],
    averageConfidence: { happy: 0.8, neutral: 0.7, sad: 0.6 }
  },
  motionPatterns: {
    patternCounts: { 'hand_movement': 25, 'fidgeting': 15, 'repetitive': 10 },
    repetitiveMotionTrends: [
      { date: '2024-01-01', percentage: 15 },
      { date: '2024-01-02', percentage: 12 }
    ],
    fidgetingTrends: [
      { date: '2024-01-01', percentage: 20 },
      { date: '2024-01-02', percentage: 18 }
    ]
  },
  timeline: [
    { date: '2024-01-01', total: 10, completed: 8, active: 1, ended: 1 },
    { date: '2024-01-02', total: 12, completed: 10, active: 1, ended: 1 }
  ],
  riskAnalytics: {
    riskLevels: { low: 80, medium: 30, high: 10 },
    categoryRisks: { social: 0.6, communication: 0.7, behavior: 0.5 },
    timeTrends: [
      { date: '2024-01-01', averageRisk: 0.6 },
      { date: '2024-01-02', averageRisk: 0.5 }
    ]
  }
};

describe('ClinicalDashboard', () => {
  beforeEach(() => {
    // Reset fetch mock
    (fetch as jest.Mock).mockClear();
    
    // Mock successful API responses
    (fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ success: true, ...mockApiResponse })
    });
  });

  it('renders dashboard with loading state initially', () => {
    render(<ClinicalDashboard />);
    expect(screen.getByText(/Clinical Dashboard/i)).toBeInTheDocument();
  });

  it('displays statistics cards after data loads', async () => {
    render(<ClinicalDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // Total sessions
      expect(screen.getByText('120')).toBeInTheDocument(); // Completed sessions
      expect(screen.getByText('80%')).toBeInTheDocument(); // Completion rate
    });
  });

  it('shows tab navigation', async () => {
    render(<ClinicalDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Emotion Trends')).toBeInTheDocument();
      expect(screen.getByText('Motion Patterns')).toBeInTheDocument();
      expect(screen.getByText('Session Timeline')).toBeInTheDocument();
      expect(screen.getByText('Risk Analysis')).toBeInTheDocument();
      expect(screen.getByText('Sessions')).toBeInTheDocument();
    });
  });

  it('allows switching between tabs', async () => {
    render(<ClinicalDashboard />);
    
    await waitFor(() => {
      const emotionTab = screen.getByText('Emotion Trends');
      fireEvent.click(emotionTab);
      expect(emotionTab).toHaveClass('bg-blue-100');
    });
  });

  it('displays filter controls', async () => {
    render(<ClinicalDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByText('Time Range')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Risk Level')).toBeInTheDocument();
      expect(screen.getByText('Patient Name')).toBeInTheDocument();
    });
  });

  it('allows filtering by status', async () => {
    render(<ClinicalDashboard />);
    
    await waitFor(() => {
      const statusSelect = screen.getByDisplayValue('All Status');
      fireEvent.change(statusSelect, { target: { value: 'completed' } });
      expect(statusSelect).toHaveValue('completed');
    });
  });

  it('allows filtering by patient name', async () => {
    render(<ClinicalDashboard />);
    
    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('Search by name...');
      fireEvent.change(nameInput, { target: { value: 'John' } });
      expect(nameInput).toHaveValue('John');
    });
  });

  it('displays sessions table in sessions tab', async () => {
    render(<ClinicalDashboard />);
    
    await waitFor(() => {
      const sessionsTab = screen.getByText('Sessions');
      fireEvent.click(sessionsTab);
      
      expect(screen.getByText('Recent Sessions')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Age: 25')).toBeInTheDocument();
    });
  });

  it('shows clear filters button', async () => {
    render(<ClinicalDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<ClinicalDashboard />);
    
    // Should not crash and should show some content
    await waitFor(() => {
      expect(screen.getByText(/Clinical Dashboard/i)).toBeInTheDocument();
    });
  });

  it('displays emotion trends when emotion tab is selected', async () => {
    render(<ClinicalDashboard />);
    
    await waitFor(() => {
      const emotionTab = screen.getByText('Emotion Trends');
      fireEvent.click(emotionTab);
      
      expect(screen.getByText('Emotion Distribution')).toBeInTheDocument();
      expect(screen.getByText('Emotion Trends Over Time')).toBeInTheDocument();
    });
  });

  it('displays motion patterns when motion tab is selected', async () => {
    render(<ClinicalDashboard />);
    
    await waitFor(() => {
      const motionTab = screen.getByText('Motion Patterns');
      fireEvent.click(motionTab);
      
      expect(screen.getByText('Motion Patterns')).toBeInTheDocument();
      expect(screen.getByText('Repetitive Motion & Fidgeting Trends')).toBeInTheDocument();
    });
  });

  it('displays risk analysis when risk tab is selected', async () => {
    render(<ClinicalDashboard />);
    
    await waitFor(() => {
      const riskTab = screen.getByText('Risk Analysis');
      fireEvent.click(riskTab);
      
      expect(screen.getByText('Risk Level Distribution')).toBeInTheDocument();
      expect(screen.getByText('Category Risk Analysis')).toBeInTheDocument();
    });
  });
}); 