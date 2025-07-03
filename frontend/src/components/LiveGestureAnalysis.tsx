import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import apiService, { type EmotionData, type MotionData } from '../services/api';

interface LiveGestureAnalysisProps {
  onAnalysisComplete?: (results: any) => void;
  sessionDuration?: number; // in seconds
  patientInfo?: {
    name: string;
    age: number;
    gender?: string;
  };
}

const LiveGestureAnalysis: React.FC<LiveGestureAnalysisProps> = ({
  onAnalysisComplete,
  sessionDuration = 60, // 1 minute default
  patientInfo = { name: 'Test Patient', age: 8, gender: 'Male' }
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(sessionDuration);
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  const [emotionConfidence, setEmotionConfidence] = useState<number>(0);
  const [motionPoints, setMotionPoints] = useState<Array<{x: number, y: number, type: string}>>([]);
  const [detectedMotions, setDetectedMotions] = useState<string[]>([]);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<Array<{emotion: string, confidence: number, timestamp: number}>>([]);
  const [motionHistory, setMotionHistory] = useState<Array<{motions: string[], timestamp: number}>>([]);

  // MediaPipe Hands setup
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const animationFrameRef = useRef<number>();

  // Load face-api.js models
  const loadModels = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const modelUrls = [
        'https://justadudewhohacks.github.io/face-api.js/models',
        '/models'
      ];

      let modelsLoaded = false;
      
      for (const baseUrl of modelUrls) {
        try {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(baseUrl),
            faceapi.nets.faceExpressionNet.loadFromUri(baseUrl),
          ]);
          modelsLoaded = true;
          console.log(`Face models loaded successfully from: ${baseUrl}`);
          break;
        } catch (err) {
          console.warn(`Failed to load face models from ${baseUrl}:`, err);
          continue;
        }
      }

      if (!modelsLoaded) {
        throw new Error('Failed to load face models from all sources');
      }

      setIsLoading(false);
    } catch (err) {
      setError('Failed to load emotion detection models. Please check your internet connection.');
      setIsLoading(false);
      console.error('Error loading models:', err);
    }
  }, []);

  // Load MediaPipe Hands
  const loadHandTracking = useCallback(async () => {
    try {
      const { Hands, HAND_CONNECTIONS } = await import('@mediapipe/hands');
      const { Camera } = await import('@mediapipe/camera_utils');
      const { drawConnectors, drawLandmarks } = await import('@mediapipe/drawing_utils');

      handsRef.current = new Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      handsRef.current.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      handsRef.current.onResults((results: any) => {
        if (!isRecording || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear previous drawings
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const newMotionPoints: Array<{x: number, y: number, type: string}> = [];
        const newDetectedMotions: string[] = [];

        if (results.multiHandLandmarks) {
          results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
            const handedness = results.multiHandedness[index].label;
            
            // Draw hand connections
            drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
              color: '#00FF00',
              lineWidth: 2
            });

            // Draw landmarks
            drawLandmarks(ctx, landmarks, {
              color: '#FF0000',
              lineWidth: 1,
              radius: 3
            });

            // Analyze motion patterns
            landmarks.forEach((landmark: any, landmarkIndex: number) => {
              const x = landmark.x * canvas.width;
              const y = landmark.y * canvas.height;
              
              newMotionPoints.push({
                x, y, type: `${handedness}_landmark_${landmarkIndex}`
              });

              // Detect specific motions
              if (landmarkIndex === 8) { // Index finger tip
                newDetectedMotions.push(`${handedness}_pointing`);
              }
              if (landmarkIndex === 4) { // Thumb tip
                newDetectedMotions.push(`${handedness}_thumb`);
              }
              if (landmarkIndex === 12) { // Middle finger tip
                newDetectedMotions.push(`${handedness}_middle_finger`);
              }
            });

            // Detect repetitive motions
            if (landmarks.length > 0) {
              const wrist = landmarks[0];
              const wristX = wrist.x * canvas.width;
              const wristY = wrist.y * canvas.height;
              
              // Add wrist position for motion tracking
              newMotionPoints.push({
                x: wristX, y: wristY, type: `${handedness}_wrist`
              });
            }
          });
        }

        setMotionPoints(newMotionPoints);
        setDetectedMotions(newDetectedMotions);

        // Add to motion history
        if (newDetectedMotions.length > 0) {
          setMotionHistory(prev => [...prev.slice(-50), { motions: newDetectedMotions, timestamp: Date.now() }]);
        }

        // Send motion data to backend
        if (sessionId) {
          const motionData: MotionData = {
            repetitive_motions: newDetectedMotions.length > 0,
            fidgeting: newDetectedMotions.includes('Left_thumb') || newDetectedMotions.includes('Right_thumb'),
            patterns: newDetectedMotions,
            motion_data: {
              landmarks: results.multiHandLandmarks,
              motionPoints: newMotionPoints,
              timestamp: Date.now()
            },
            timestamp: new Date().toISOString()
          };

          apiService.updateMotionData(sessionId, motionData).catch(console.warn);
        }
      });

      // Initialize camera
      if (videoRef.current) {
        cameraRef.current = new Camera(videoRef.current, {
          onFrame: async () => {
            if (handsRef.current && videoRef.current) {
              await handsRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });

        await cameraRef.current.start();
        console.log('Hand tracking initialized successfully');
      }

    } catch (err) {
      console.warn('Hand tracking not available:', err);
    }
  }, [isRecording, sessionId]);

  // Start video stream
  const startVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsRecording(true);
      }
    } catch (err) {
      setError('Failed to access camera. Please check camera permissions.');
      console.error('Error starting video:', err);
    }
  }, []);

  // Analyze emotion from video frame
  const analyzeEmotion = useCallback(async () => {
    if (!videoRef.current || !isRecording) return;

    try {
      const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections.length > 0) {
        const expressions = detections[0].expressions;
        const emotions = Object.entries(expressions);
        const dominantEmotion = emotions.reduce((a, b) => a[1] > b[1] ? a : b);
        
        setCurrentEmotion(dominantEmotion[0]);
        setEmotionConfidence(dominantEmotion[1]);

        // Add to emotion history
        setEmotionHistory(prev => [...prev.slice(-50), {
          emotion: dominantEmotion[0],
          confidence: dominantEmotion[1],
          timestamp: Date.now()
        }]);

        // Send emotion data to backend
        if (sessionId) {
          const emotionData: EmotionData = {
            dominant_emotion: dominantEmotion[0],
            confidence: dominantEmotion[1],
            emotions: expressions,
            timestamp: new Date().toISOString()
          };

          apiService.updateEmotionData(sessionId, emotionData).catch(console.warn);
        }
      }
    } catch (err) {
      console.warn('Error analyzing emotion:', err);
    }
  }, [isRecording, sessionId]);

  // Start analysis session
  const startAnalysis = useCallback(async () => {
    try {
      // Create backend session
      const result = await apiService.startScreening(patientInfo);
      setSessionId(result.sessionId);
      console.log('Analysis session started:', result.sessionId);

      // Start video and tracking
      await startVideo();
      await loadHandTracking();

      // Start emotion analysis loop
      const emotionInterval = setInterval(analyzeEmotion, 1000); // Analyze every second

      // Start countdown
      const countdownInterval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            clearInterval(emotionInterval);
            stopAnalysis();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(emotionInterval);
        clearInterval(countdownInterval);
      };
    } catch (error) {
      setError('Failed to start analysis session');
      console.error('Error starting analysis:', error);
    }
  }, [patientInfo, startVideo, loadHandTracking, analyzeEmotion]);

  // Stop analysis session
  const stopAnalysis = useCallback(async () => {
    setIsRecording(false);
    
    if (sessionId) {
      try {
        // Generate final report
        const report = await apiService.generateReport(sessionId, {
          practitionerName: 'Dr. AI Assistant',
          practice: 'ASD Screening Tool'
        });

        const finalResults = {
          sessionId,
          emotionData: { 
            emotion: currentEmotion, 
            confidence: emotionConfidence,
            history: emotionHistory
          },
          motionData: { 
            detectedMotions, 
            motionPoints: motionPoints.length,
            history: motionHistory
          },
          report: report.report,
          sessionDuration: sessionDuration - timeRemaining
        };

        setAnalysisResults(finalResults);

        if (onAnalysisComplete) {
          onAnalysisComplete(finalResults);
        }
      } catch (error) {
        console.error('Error generating report:', error);
      }
    }

    // Stop video stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  }, [sessionId, currentEmotion, emotionConfidence, detectedMotions, motionPoints, emotionHistory, motionHistory, sessionDuration, timeRemaining, onAnalysisComplete]);

  // Initialize on mount
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 24, marginBottom: 16 }}>🔄</div>
        <div>Loading gesture analysis models...</div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
          This may take a few moments on first load
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#dc3545' }}>
        <div style={{ fontSize: 24, marginBottom: 16 }}>❌</div>
        <div>{error}</div>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: 16,
            padding: '8px 16px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>🎬 Live Gesture Analysis</h2>
      
      {/* Session Info */}
      <div style={{ 
        marginBottom: 20, 
        padding: 16, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 12,
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong>Patient:</strong> {patientInfo.name} ({patientInfo.age} years old)
          {sessionId && <div style={{ fontSize: 12, opacity: 0.8 }}>Session: {sessionId}</div>}
        </div>
        <div>
          {isRecording ? (
            <div style={{ fontWeight: 'bold', fontSize: 18 }}>
              ⏱️ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          ) : (
            <div style={{ fontWeight: 'bold' }}>
              ✅ Analysis Complete
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Video Feed */}
        <div style={{ position: 'relative' }}>
          <div style={{ 
            position: 'relative', 
            borderRadius: 12, 
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
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
            
            {/* Motion Detection Overlay */}
            {motionPoints.map((point, index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  left: `${(point.x / 640) * 100}%`,
                  top: `${(point.y / 480) * 100}%`,
                  width: 8,
                  height: 8,
                  background: point.type.includes('wrist') ? '#ff0000' : '#00ff00',
                  borderRadius: '50%',
                  border: '2px solid white',
                  transform: 'translate(-50%, -50%)',
                  animation: 'pulse 1s infinite',
                  boxShadow: '0 0 8px rgba(255,255,255,0.8)'
                }}
              />
            ))}

            {/* Recording Indicator */}
            {isRecording && (
              <div style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: '#dc3545',
                color: 'white',
                padding: '8px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <div style={{
                  width: 8,
                  height: 8,
                  background: 'white',
                  borderRadius: '50%',
                  animation: 'pulse 1s infinite'
                }}></div>
                REC
              </div>
            )}
          </div>
        </div>

        {/* Real-time Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 16, background: '#e3f2fd', borderRadius: 12, border: '1px solid #bbdefb' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>😊 Current Emotion</h4>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1976d2' }}>
              {currentEmotion}
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>
              Confidence: {(emotionConfidence * 100).toFixed(1)}%
            </div>
          </div>
          
          <div style={{ padding: 16, background: '#f3e5f5', borderRadius: 12, border: '1px solid #e1bee7' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#7b1fa2' }}>🤲 Detected Motions</h4>
            <div style={{ fontSize: 14 }}>
              {detectedMotions.length > 0 ? (
                detectedMotions.map((motion, index) => (
                  <div key={index} style={{ 
                    marginBottom: 4, 
                    padding: '4px 8px', 
                    background: '#e1bee7', 
                    borderRadius: 4,
                    fontSize: 12
                  }}>
                    • {motion}
                  </div>
                ))
              ) : (
                <div style={{ color: '#666', fontStyle: 'italic' }}>No motions detected</div>
              )}
            </div>
          </div>
          
          <div style={{ padding: 16, background: '#e8f5e8', borderRadius: 12, border: '1px solid #c8e6c9' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#388e3c' }}>📊 Motion Points</h4>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#388e3c' }}>
              {motionPoints.length}
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>
              points tracked
            </div>
          </div>

          <div style={{ padding: 16, background: '#fff3e0', borderRadius: 12, border: '1px solid #ffcc02' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#f57c00' }}>📈 Session Stats</h4>
            <div style={{ fontSize: 14, color: '#666' }}>
              <div>Emotions: {emotionHistory.length}</div>
              <div>Motions: {motionHistory.length}</div>
              <div>Duration: {sessionDuration - timeRemaining}s</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        {!isRecording && !analysisResults ? (
          <button
            onClick={startAnalysis}
            style={{
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 50,
              fontSize: 18,
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 8px 16px rgba(40, 167, 69, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(40, 167, 69, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(40, 167, 69, 0.3)';
            }}
          >
            🎬 Start Live Analysis
          </button>
        ) : isRecording ? (
          <button
            onClick={stopAnalysis}
            style={{
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 50,
              fontSize: 18,
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 8px 16px rgba(220, 53, 69, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(220, 53, 69, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(220, 53, 69, 0.3)';
            }}
          >
            ⏹️ Stop Analysis
          </button>
        ) : null}
      </div>

      {/* Results */}
      {analysisResults && (
        <div style={{ 
          marginTop: 20, 
          padding: 24, 
          background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)', 
          borderRadius: 12,
          border: '1px solid #c3e6cb',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#155724' }}>✅ Analysis Complete!</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <strong>Session ID:</strong> 
              <div style={{ fontSize: 12, color: '#666', wordBreak: 'break-all' }}>{analysisResults.sessionId}</div>
            </div>
            <div>
              <strong>Final Emotion:</strong> 
              <div>{analysisResults.emotionData.emotion} ({(analysisResults.emotionData.confidence * 100).toFixed(1)}%)</div>
            </div>
            <div>
              <strong>Motion Points Tracked:</strong> 
              <div>{analysisResults.motionData.motionPoints}</div>
            </div>
            <div>
              <strong>Detected Motions:</strong> 
              <div>{analysisResults.motionData.detectedMotions.length}</div>
            </div>
            <div>
              <strong>Session Duration:</strong> 
              <div>{analysisResults.sessionDuration}s</div>
            </div>
            <div>
              <strong>Emotion Samples:</strong> 
              <div>{analysisResults.emotionData.history.length}</div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LiveGestureAnalysis; 