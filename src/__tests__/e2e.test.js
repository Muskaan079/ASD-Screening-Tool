import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TestProvider } from '../contexts/TestContext';
import { AuthProvider } from '../contexts/AuthContext';
import App from '../App';
import { api } from '../services/api';

// Mock the API calls
jest.mock('../services/api');

describe('End-to-End Flow Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock successful API responses
    api.generateReport.mockResolvedValue({
      report: {
        patientInfo: {
          name: 'John Doe',
          age: 6,
          gender: 'Male',
          dateOfAssessment: new Date().toISOString(),
        },
        scores: {
          emotionScore: 75,
          reactionScore: 350,
          patternScore: 80,
        },
        interpretations: {
          emotionTest: 'Moderate emotion recognition abilities',
          reactionTest: 'Quick reaction time, within typical range',
          patternTest: 'Strong pattern recognition abilities',
        },
        observations: [
          {
            category: 'Clinical Observation',
            details: 'Test observation',
          },
        ],
        recommendations: ['Test recommendation'],
      },
    });
  });

  const renderApp = () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestProvider>
            <App />
          </TestProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('Complete screening workflow', async () => {
    renderApp();

    // 1. Home Page
    expect(screen.getByText(/Welcome to ASD Screening Tool/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Start Screening/i));

    // 2. Screening Page
    await waitFor(() => {
      expect(screen.getByText(/Interactive Screening/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Continue to Tests/i));

    // 3. Tests Page
    await waitFor(() => {
      expect(screen.getByText(/Available Tests/i)).toBeInTheDocument();
    });

    // 4. Emotion Test
    fireEvent.click(screen.getByText(/Emotion Recognition/i));
    await waitFor(() => {
      expect(screen.getByText(/Emotion Recognition Test/i)).toBeInTheDocument();
    });
    // Complete emotion test
    fireEvent.click(screen.getByText(/Start Test/i));
    // Simulate test completion...

    // 5. Reaction Test
    fireEvent.click(screen.getByText(/Reaction Time/i));
    await waitFor(() => {
      expect(screen.getByText(/Reaction Time Test/i)).toBeInTheDocument();
    });
    // Complete reaction test...

    // 6. Pattern Test
    fireEvent.click(screen.getByText(/Pattern Recognition/i));
    await waitFor(() => {
      expect(screen.getByText(/Pattern Recognition Test/i)).toBeInTheDocument();
    });
    // Complete pattern test...

    // 7. Results Page
    await waitFor(() => {
      expect(screen.getByText(/Clinical Assessment Report/i)).toBeInTheDocument();
    });

    // Verify report content
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/75%/i)).toBeInTheDocument();
    expect(screen.getByText(/350ms/i)).toBeInTheDocument();
    expect(screen.getByText(/80%/i)).toBeInTheDocument();

    // Test PDF download
    const downloadButton = screen.getByText(/Download as PDF/i);
    expect(downloadButton).toBeInTheDocument();
    fireEvent.click(downloadButton);
  });

  test('Error handling in report generation', async () => {
    // Mock API failure
    api.generateReport.mockRejectedValueOnce(new Error('Failed to generate report'));
    
    renderApp();
    
    // Navigate to results page
    // ... (navigation steps)

    await waitFor(() => {
      expect(screen.getByText(/Failed to generate report/i)).toBeInTheDocument();
    });

    // Test retry functionality
    const retryButton = screen.getByText(/Retry Report Generation/i);
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText(/Clinical Assessment Report/i)).toBeInTheDocument();
    });
  });

  test('Authentication flow', async () => {
    renderApp();

    // Attempt to access protected route
    fireEvent.click(screen.getByText(/Results/i));

    // Should be redirected to login
    await waitFor(() => {
      expect(screen.getByText(/Please log in to continue/i)).toBeInTheDocument();
    });

    // Test login
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByText(/Log In/i));

    // Should now have access to protected route
    await waitFor(() => {
      expect(screen.getByText(/Clinical Assessment Report/i)).toBeInTheDocument();
    });
  });
}); 