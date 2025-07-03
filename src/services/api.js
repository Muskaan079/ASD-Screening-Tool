const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const API_KEY = process.env.REACT_APP_API_KEY || '';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (API_KEY) {
    headers['x-api-key'] = API_KEY;
  }
  
  return headers;
};

export const api = {
  // Test Results
  saveTestResult: async (testData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/test-results`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(testData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error saving test result:', error);
      throw error;
    }
  },

  getTestResults: async (patientId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/test-results/${patientId}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching test results:', error);
      throw error;
    }
  },

  // Test Resources
  getEmotionTestData: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tests/emotion-data`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching emotion test data:', error);
      throw error;
    }
  },

  getPatternTestData: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tests/pattern-data`);
      if (!response.ok) {
        throw new Error('Failed to fetch pattern test data');
      }
      const data = await response.json();
      
      // Validate the data structure
      if (!data.patterns || !Array.isArray(data.patterns)) {
        throw new Error('Invalid pattern test data format');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching pattern test data:', error);
      throw error;
    }
  },

  // Clinical Report
  generateReport: async (reportData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Add auth token if required
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();

      // Validate the report structure
      if (!data.report || !data.report.patientInfo || !data.report.scores) {
        throw new Error('Invalid report format received');
      }

      return data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  },

  // LLM Integration - Real OpenAI API calls
  analyzeMultimodalContext: async (context) => {
    try {
      const response = await fetch(`${API_BASE_URL}/llm/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ context }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze multimodal context');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error analyzing multimodal context:', error);
      throw error;
    }
  },

  generateClinicalReport: async (sessionData, criteria = {}, format = 'pdf') => {
    try {
      const response = await fetch(`${API_BASE_URL}/llm/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ sessionData, criteria, format }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate clinical report');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating clinical report:', error);
      throw error;
    }
  },

  generateDevelopmentalProjection: async (testData, projectionYears = 3, modelType = 'llm') => {
    try {
      const response = await fetch(`${API_BASE_URL}/llm/project-development`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ testData, projectionYears, modelType }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate developmental projection');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating developmental projection:', error);
      throw error;
    }
  },

  generateExplainabilityData: async (analysisData, explainabilityType = 'feature_importance') => {
    try {
      const response = await fetch(`${API_BASE_URL}/llm/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ analysisData, explainabilityType }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate explainability data');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating explainability data:', error);
      throw error;
    }
  },

  streamAnalysis: async (context) => {
    try {
      const response = await fetch(`${API_BASE_URL}/llm/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ context }),
      });

      if (!response.ok) {
        throw new Error('Failed to start streaming analysis');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      return {
        async *[Symbol.asyncIterator]() {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    yield data;
                  } catch (parseError) {
                    console.warn('Failed to parse SSE data:', parseError);
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        }
      };
    } catch (error) {
      console.error('Error streaming analysis:', error);
      throw error;
    }
  },

  // Health check
  checkHealth: async () => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`);
      return await response.json();
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  },
}; 