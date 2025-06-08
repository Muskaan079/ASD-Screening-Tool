const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const api = {
  // Test Results
  saveTestResult: async (testData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/test-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
}; 