import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const GestureAnalysisTest: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...');
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Test backend connection
  useEffect(() => {
    const testBackend = async () => {
      try {
        const health = await apiService.checkHealth();
        setBackendStatus(`✅ Connected - ${health.environment}`);
      } catch (error) {
        setBackendStatus('❌ Connection failed');
        console.error('Backend test failed:', error);
      }
    };
    
    testBackend();
  }, []);

  // Test gesture analysis
  const testGestureAnalysis = async () => {
    setLoading(true);
    try {
      // Create a test session
      const sessionResult = await apiService.startScreening({
        name: 'Test Patient',
        age: 8,
        gender: 'Male'
      });

      const sessionId = sessionResult.sessionId;
      console.log('Test session created:', sessionId);

      // Test emotion data
      const emotionData = {
        dominant_emotion: 'happy',
        confidence: 0.85,
        emotions: { happy: 0.85, neutral: 0.10, sad: 0.05 },
        timestamp: new Date().toISOString()
      };

      await apiService.updateEmotionData(sessionId, emotionData);
      console.log('Emotion data sent successfully');

      // Test motion data
      const motionData = {
        repetitive_motions: true,
        fidgeting: false,
        patterns: ['hand_flapping', 'rocking'],
        motion_data: {
          leftWrist: { x: 100, y: 200, z: 50, confidence: 0.9 },
          rightWrist: { x: 300, y: 200, z: 50, confidence: 0.9 },
          timestamp: Date.now()
        },
        timestamp: new Date().toISOString()
      };

      await apiService.updateMotionData(sessionId, motionData);
      console.log('Motion data sent successfully');

      // Get session status
      const status = await apiService.getScreeningStatus(sessionId);
      console.log('Session status:', status);

      // Generate test report
      const report = await apiService.generateReport(sessionId, {
        practitionerName: 'Dr. Test',
        practice: 'Test Clinic'
      });

      setTestResults({
        sessionId,
        emotionData,
        motionData,
        status,
        report
      });

      console.log('✅ Gesture analysis test completed successfully!');
    } catch (error) {
      console.error('❌ Gesture analysis test failed:', error);
      setTestResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h2>Gesture Analysis Backend Test</h2>
      
      <div style={{ marginBottom: 20 }}>
        <h3>Backend Status</h3>
        <div style={{ 
          padding: 10, 
          background: backendStatus.includes('✅') ? '#d4edda' : '#f8d7da',
          borderRadius: 5,
          border: `1px solid ${backendStatus.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {backendStatus}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button
          onClick={testGestureAnalysis}
          disabled={loading || backendStatus.includes('❌')}
          style={{
            padding: '12px 24px',
            background: loading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 5,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 16
          }}
        >
          {loading ? 'Testing...' : 'Test Gesture Analysis'}
        </button>
      </div>

      {testResults && (
        <div style={{ marginTop: 20 }}>
          <h3>Test Results</h3>
          {testResults.error ? (
            <div style={{ 
              padding: 10, 
              background: '#f8d7da', 
              border: '1px solid #f5c6cb',
              borderRadius: 5,
              color: '#721c24'
            }}>
              ❌ Test Failed: {testResults.error}
            </div>
          ) : (
            <div style={{ 
              padding: 15, 
              background: '#d4edda', 
              border: '1px solid #c3e6cb',
              borderRadius: 5
            }}>
              <h4>✅ Test Completed Successfully!</h4>
              <div style={{ fontSize: 14 }}>
                <p><strong>Session ID:</strong> {testResults.sessionId}</p>
                <p><strong>Emotion Data:</strong> {testResults.emotionData.dominant_emotion} ({(testResults.emotionData.confidence * 100).toFixed(1)}%)</p>
                <p><strong>Motion Data:</strong> Repetitive motions detected: {testResults.motionData.repetitive_motions ? 'Yes' : 'No'}</p>
                <p><strong>Session Status:</strong> {testResults.status.session.status}</p>
                <p><strong>Report Generated:</strong> {testResults.report.success ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 30, fontSize: 14, color: '#666' }}>
        <h4>What This Test Does:</h4>
        <ul>
          <li>Creates a test screening session</li>
          <li>Sends sample emotion data (happy emotion, 85% confidence)</li>
          <li>Sends sample motion data (repetitive hand movements detected)</li>
          <li>Retrieves session status</li>
          <li>Generates a test clinical report</li>
        </ul>
      </div>
    </div>
  );
};

export default GestureAnalysisTest; 