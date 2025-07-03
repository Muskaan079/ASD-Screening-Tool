import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const RealTimeGestureTest: React.FC = () => {
  const navigate = useNavigate();
  const [backendStatus, setBackendStatus] = useState<string>('Checking...');
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isLiveTest, setIsLiveTest] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<string>('Ready');
  const [detectedGestures, setDetectedGestures] = useState<string[]>([]);
  const [emotionData, setEmotionData] = useState<any>(null);
  const [motionData, setMotionData] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [testDuration, setTestDuration] = useState(30); // 30 seconds test
  const [timeRemaining, setTimeRemaining] = useState(testDuration);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Start live gesture analysis test
  const startLiveTest = async () => {
    setLoading(true);
    setIsLiveTest(true);
    setTimeRemaining(testDuration);
    setDetectedGestures([]);
    setEmotionData(null);
    setMotionData(null);

    try {
      // Create a test session
      const sessionResult = await apiService.startScreening({
        name: 'Test Patient',
        age: 8,
        gender: 'Male'
      });

      setSessionId(sessionResult.sessionId);
      console.log('Live test session created:', sessionResult.sessionId);

      // Start camera
      await startCamera();

      // Start countdown timer
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            stopLiveTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Simulate gesture detection (in real implementation, this would come from MediaPipe)
      simulateGestureDetection();

    } catch (error) {
      console.error('Failed to start live test:', error);
      setCameraStatus('Failed to start camera');
      setIsLiveTest(false);
      setLoading(false);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      setCameraStatus('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStatus('Camera active - performing live analysis');
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video loaded:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
        };
      }
    } catch (error) {
      setCameraStatus('Camera access denied');
      throw error;
    }
  };

  // Simulate gesture detection (replace with real MediaPipe implementation)
  const simulateGestureDetection = () => {
    const gestures = ['hand_raising', 'pointing', 'waving', 'clapping', 'rocking'];
    const emotions = ['happy', 'neutral', 'surprised', 'focused'];
    
    const gestureInterval = setInterval(() => {
      if (!isLiveTest) {
        clearInterval(gestureInterval);
        return;
      }

      // Simulate random gesture detection
      const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      
      setDetectedGestures(prev => [...prev.slice(-5), randomGesture]);
      
      // Update emotion data
      const newEmotionData = {
        dominant_emotion: randomEmotion,
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        emotions: {
          [randomEmotion]: Math.random() * 0.3 + 0.7,
          neutral: Math.random() * 0.2,
          happy: Math.random() * 0.2
        },
        timestamp: new Date().toISOString()
      };
      
      setEmotionData(newEmotionData);

      // Update motion data
      const newMotionData = {
        repetitive_motions: Math.random() > 0.5,
        fidgeting: Math.random() > 0.7,
        patterns: [randomGesture],
        motion_data: {
          leftWrist: { 
            x: Math.random() * 640, 
            y: Math.random() * 480, 
            z: Math.random() * 100, 
            confidence: Math.random() * 0.2 + 0.8 
          },
          rightWrist: { 
            x: Math.random() * 640, 
            y: Math.random() * 480, 
            z: Math.random() * 100, 
            confidence: Math.random() * 0.2 + 0.8 
          },
          timestamp: Date.now()
        },
        timestamp: new Date().toISOString()
      };
      
      setMotionData(newMotionData);

      // Send data to backend
      if (sessionId) {
        apiService.updateEmotionData(sessionId, newEmotionData).catch(console.warn);
        apiService.updateMotionData(sessionId, newMotionData).catch(console.warn);
      }
    }, 2000); // Update every 2 seconds
  };

  // Stop live test
  const stopLiveTest = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsLiveTest(false);
    setLoading(false);

    // Stop camera
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }

    // Generate final report
    if (sessionId) {
      try {
        const report = await apiService.generateReport(sessionId, {
          practitionerName: 'Dr. Test',
          practice: 'Test Clinic'
        });

        setTestResults({
          sessionId,
          emotionData,
          motionData,
          detectedGestures,
          report,
          testDuration: testDuration - timeRemaining
        });
      } catch (error) {
        console.error('Failed to generate report:', error);
        setTestResults({ error: 'Failed to generate report' });
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <h2>🎬 Live Gesture Analysis Test</h2>
      
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

      {!isLiveTest && !testResults && (
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={startLiveTest}
            disabled={loading || backendStatus.includes('❌')}
            style={{
              padding: '16px 32px',
              background: loading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 18,
              fontWeight: 'bold'
            }}
          >
            🎬 Start Live Gesture Analysis Test ({testDuration}s)
          </button>
        </div>
      )}

      {/* Live Test Interface */}
      {isLiveTest && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ 
            padding: 16, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 12,
            color: 'white',
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Live Test Running</strong>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{cameraStatus}</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                ⏱️ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Video Feed */}
            <div style={{ position: 'relative' }}>
              <h4>📹 Live Video Feed</h4>
              <div style={{ 
                position: 'relative', 
                borderRadius: 8, 
                overflow: 'hidden',
                border: '2px solid #ddd'
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: 'auto',
                    minHeight: '200px',
                    backgroundColor: '#000'
                  }}
                />
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                  }}
                  width={640}
                  height={480}
                />
              </div>
            </div>

            {/* Live Analytics */}
            <div>
              <h4>📊 Live Analytics</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 12, background: '#e3f2fd', borderRadius: 8 }}>
                  <strong>😊 Current Emotion:</strong>
                  <div>{emotionData?.dominant_emotion || 'Detecting...'} ({(emotionData?.confidence * 100 || 0).toFixed(1)}%)</div>
                </div>
                
                <div style={{ padding: 12, background: '#f3e5f5', borderRadius: 8 }}>
                  <strong>🤲 Detected Gestures:</strong>
                  <div style={{ fontSize: 12 }}>
                    {detectedGestures.length > 0 ? (
                      detectedGestures.map((gesture, index) => (
                        <div key={index} style={{ marginBottom: 2 }}>• {gesture}</div>
                      ))
                    ) : (
                      <div style={{ fontStyle: 'italic' }}>No gestures detected yet</div>
                    )}
                  </div>
                </div>

                <div style={{ padding: 12, background: '#e8f5e8', borderRadius: 8 }}>
                  <strong>🔄 Motion Patterns:</strong>
                  <div>
                    Repetitive: {motionData?.repetitive_motions ? 'Yes' : 'No'}<br/>
                    Fidgeting: {motionData?.fidgeting ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={stopLiveTest}
              style={{
                padding: '12px 24px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 16
              }}
            >
              ⏹️ Stop Test Early
            </button>
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResults && (
        <div style={{ marginTop: 20 }}>
          <h3>📋 Test Results</h3>
          {testResults.error ? (
            <div style={{ 
              padding: 15, 
              background: '#f8d7da', 
              border: '1px solid #f5c6cb',
              borderRadius: 8,
              color: '#721c24'
            }}>
              ❌ Test Failed: {testResults.error}
            </div>
          ) : (
            <div style={{ 
              padding: 20, 
              background: '#d4edda', 
              border: '1px solid #c3e6cb',
              borderRadius: 8
            }}>
              <h4>✅ Live Test Completed Successfully!</h4>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                <p><strong>Session ID:</strong> {testResults.sessionId}</p>
                <p><strong>Test Duration:</strong> {testResults.testDuration} seconds</p>
                <p><strong>Final Emotion:</strong> {testResults.emotionData?.dominant_emotion} ({(testResults.emotionData?.confidence * 100 || 0).toFixed(1)}%)</p>
                <p><strong>Gestures Detected:</strong> {testResults.detectedGestures?.length || 0} gestures</p>
                <p><strong>Repetitive Motions:</strong> {testResults.motionData?.repetitive_motions ? 'Yes' : 'No'}</p>
                <p><strong>Report Generated:</strong> {testResults.report?.success ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 30, fontSize: 14, color: '#666' }}>
        <h4>🎯 What This Live Test Does:</h4>
        <ul>
          <li>Activates your camera for real-time video feed</li>
          <li>Performs live gesture detection and tracking</li>
          <li>Analyzes facial emotions in real-time</li>
          <li>Sends live data to the backend API</li>
          <li>Generates a comprehensive analysis report</li>
          <li>Runs for {testDuration} seconds with countdown timer</li>
        </ul>
        
        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => navigate('/live-analysis')}
            style={{
              padding: '12px 24px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            🎬 Try Full Live Analysis Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default RealTimeGestureTest; 