import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import * as faceapi from 'face-api.js';
import apiService, { type EmotionData, type MotionData } from '../services/api';
import mlService, { type EmotionAnalysis, type GestureAnalysis } from '../services/mlService';

// DREAM-inspired skeleton structure with comprehensive keypoints
interface SkeletonData {
  // Head and face
  nose: { x: number; y: number; z: number; confidence: number };
  left_eye: { x: number; y: number; z: number; confidence: number };
  right_eye: { x: number; y: number; z: number; confidence: number };
  
  // Shoulders and arms
  left_shoulder: { x: number; y: number; z: number; confidence: number };
  right_shoulder: { x: number; y: number; z: number; confidence: number };
  left_elbow: { x: number; y: number; z: number; confidence: number };
  right_elbow: { x: number; y: number; z: number; confidence: number };
  left_wrist: { x: number; y: number; z: number; confidence: number };
  right_wrist: { x: number; y: number; z: number; confidence: number };
  
  // Hands and fingers
  left_hand: { x: number; y: number; z: number; confidence: number };
  right_hand: { x: number; y: number; z: number; confidence: number };
  
  // Torso
  left_hip: { x: number; y: number; z: number; confidence: number };
  right_hip: { x: number; y: number; z: number; confidence: number };
}

// Custom behavior detection rules
interface BehaviorRule {
  name: string;
  description: string;
  condition: (skeleton: SkeletonData, history: SkeletonData[]) => boolean;
  severity: 'low' | 'medium' | 'high';
}

interface EnhancedGestureAnalysisProps {
  onAnalysisComplete?: (results: any) => void;
  sessionDuration?: number;
  patientInfo?: {
    name: string;
    age: number;
    gender?: string;
  };
}

const EnhancedGestureAnalysis: React.FC<EnhancedGestureAnalysisProps> = ({
  onAnalysisComplete,
  sessionDuration = 60,
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
  const [skeletonData, setSkeletonData] = useState<SkeletonData | null>(null);
  const [detectedBehaviors, setDetectedBehaviors] = useState<string[]>([]);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<string>('Initializing...');
  const [skeletonHistory, setSkeletonHistory] = useState<SkeletonData[]>([]);
  const [poseDetector, setPoseDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [mediaPipePose, setMediaPipePose] = useState<Pose | null>(null);

  // Custom behavior detection rules
  const behaviorRules: BehaviorRule[] = [
    {
      name: 'Repetitive Hand Waving',
      description: 'Detects repetitive horizontal hand movements',
      condition: (skeleton, history) => {
        if (history.length < 10) return false;
        const recentWrists = history.slice(-10).map(h => ({ left: h.left_wrist, right: h.right_wrist }));
        const horizontalMovements = recentWrists.filter((_, i) => {
          if (i === 0) return false;
          const prev = recentWrists[i - 1];
          const curr = recentWrists[i];
          const leftMovement = Math.abs(curr.left.x - prev.left.x) > 20;
          const rightMovement = Math.abs(curr.right.x - prev.right.x) > 20;
          return leftMovement || rightMovement;
        });
        return horizontalMovements.length >= 6;
      },
      severity: 'medium'
    },
    {
      name: 'Hand Flapping',
      description: 'Detects rapid up-down hand movements',
      condition: (skeleton, history) => {
        if (history.length < 8) return false;
        const recentWrists = history.slice(-8).map(h => ({ left: h.left_wrist, right: h.right_wrist }));
        const verticalMovements = recentWrists.filter((_, i) => {
          if (i === 0) return false;
          const prev = recentWrists[i - 1];
          const curr = recentWrists[i];
          const leftMovement = Math.abs(curr.left.y - prev.left.y) > 30;
          const rightMovement = Math.abs(curr.right.y - prev.right.y) > 30;
          return leftMovement || rightMovement;
        });
        return verticalMovements.length >= 5;
      },
      severity: 'high'
    },
    {
      name: 'Rocking Motion',
      description: 'Detects repetitive forward-backward torso movement',
      condition: (skeleton, history) => {
        if (history.length < 12) return false;
        const recentHips = history.slice(-12).map(h => ({ left: h.left_hip, right: h.right_hip }));
        const rockingMovements = recentHips.filter((_, i) => {
          if (i === 0) return false;
          const prev = recentHips[i - 1];
          const curr = recentHips[i];
          const leftMovement = Math.abs(curr.left.z - prev.left.z) > 15;
          const rightMovement = Math.abs(curr.right.z - prev.right.z) > 15;
          return leftMovement || rightMovement;
        });
        return rockingMovements.length >= 8;
      },
      severity: 'medium'
    },
    {
      name: 'Finger Fidgeting',
      description: 'Detects small repetitive finger movements',
      condition: (skeleton, history) => {
        if (history.length < 15) return false;
        const recentHands = history.slice(-15).map(h => ({ left: h.left_hand, right: h.right_hand }));
        const smallMovements = recentHands.filter((_, i) => {
          if (i === 0) return false;
          const prev = recentHands[i - 1];
          const curr = recentHands[i];
          const leftMovement = Math.abs(curr.left.x - prev.left.x) > 5 && Math.abs(curr.left.y - prev.left.y) > 5;
          const rightMovement = Math.abs(curr.right.x - prev.right.x) > 5 && Math.abs(curr.right.y - prev.right.y) > 5;
          return leftMovement || rightMovement;
        });
        return smallMovements.length >= 10;
      },
      severity: 'low'
    },
    {
      name: 'Avoiding Eye Contact',
      description: 'Detects head turned away from camera',
      condition: (skeleton, history) => {
        if (!skeleton) return false;
        const headAngle = Math.atan2(skeleton.right_eye.x - skeleton.left_eye.x, skeleton.right_eye.y - skeleton.left_eye.y);
        return Math.abs(headAngle) > 0.5; // Head turned more than ~30 degrees
      },
      severity: 'medium'
    }
  ];

  // Initialize TensorFlow.js
  const initializeTensorFlow = useCallback(async () => {
    try {
      setCameraStatus('Initializing TensorFlow.js...');
      await tf.ready();
      await tf.setBackend('webgl');
      
      // Initialize MoveNet pose detector
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
        enableSegmentation: false
      };
      
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        detectorConfig
      );
      
      setPoseDetector(detector);
      setCameraStatus('TensorFlow.js initialized');
      console.log('TensorFlow.js and MoveNet initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TensorFlow.js:', error);
      setCameraStatus('TensorFlow.js initialization failed');
    }
  }, []);

  // Initialize MediaPipe Pose
  const initializeMediaPipe = useCallback(async () => {
    try {
      setCameraStatus('Initializing MediaPipe Pose...');
      const pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      pose.onResults(async (results) => {
        if (!isRecording || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear previous drawings
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw pose landmarks
        if (results.poseLandmarks) {
          drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: '#00FF00',
            lineWidth: 2
          });
          drawLandmarks(ctx, results.poseLandmarks, {
            color: '#FF0000',
            lineWidth: 1,
            radius: 3
          });

          // Convert to DREAM-inspired skeleton format
          const skeleton: SkeletonData = {
            nose: {
              x: results.poseLandmarks[0].x * canvas.width,
              y: results.poseLandmarks[0].y * canvas.height,
              z: results.poseLandmarks[0].z,
              confidence: results.poseLandmarks[0].visibility || 0
            },
            left_eye: {
              x: results.poseLandmarks[2].x * canvas.width,
              y: results.poseLandmarks[2].y * canvas.height,
              z: results.poseLandmarks[2].z,
              confidence: results.poseLandmarks[2].visibility || 0
            },
            right_eye: {
              x: results.poseLandmarks[5].x * canvas.width,
              y: results.poseLandmarks[5].y * canvas.height,
              z: results.poseLandmarks[5].z,
              confidence: results.poseLandmarks[5].visibility || 0
            },
            left_shoulder: {
              x: results.poseLandmarks[11].x * canvas.width,
              y: results.poseLandmarks[11].y * canvas.height,
              z: results.poseLandmarks[11].z,
              confidence: results.poseLandmarks[11].visibility || 0
            },
            right_shoulder: {
              x: results.poseLandmarks[12].x * canvas.width,
              y: results.poseLandmarks[12].y * canvas.height,
              z: results.poseLandmarks[12].z,
              confidence: results.poseLandmarks[12].visibility || 0
            },
            left_elbow: {
              x: results.poseLandmarks[13].x * canvas.width,
              y: results.poseLandmarks[13].y * canvas.height,
              z: results.poseLandmarks[13].z,
              confidence: results.poseLandmarks[13].visibility || 0
            },
            right_elbow: {
              x: results.poseLandmarks[14].x * canvas.width,
              y: results.poseLandmarks[14].y * canvas.height,
              z: results.poseLandmarks[14].z,
              confidence: results.poseLandmarks[14].visibility || 0
            },
            left_wrist: {
              x: results.poseLandmarks[15].x * canvas.width,
              y: results.poseLandmarks[15].y * canvas.height,
              z: results.poseLandmarks[15].z,
              confidence: results.poseLandmarks[15].visibility || 0
            },
            right_wrist: {
              x: results.poseLandmarks[16].x * canvas.width,
              y: results.poseLandmarks[16].y * canvas.height,
              z: results.poseLandmarks[16].z,
              confidence: results.poseLandmarks[16].visibility || 0
            },
            left_hand: {
              x: results.poseLandmarks[19].x * canvas.width,
              y: results.poseLandmarks[19].y * canvas.height,
              z: results.poseLandmarks[19].z,
              confidence: results.poseLandmarks[19].visibility || 0
            },
            right_hand: {
              x: results.poseLandmarks[20].x * canvas.width,
              y: results.poseLandmarks[20].y * canvas.height,
              z: results.poseLandmarks[20].z,
              confidence: results.poseLandmarks[20].visibility || 0
            },
            left_hip: {
              x: results.poseLandmarks[23].x * canvas.width,
              y: results.poseLandmarks[23].y * canvas.height,
              z: results.poseLandmarks[23].z,
              confidence: results.poseLandmarks[23].visibility || 0
            },
            right_hip: {
              x: results.poseLandmarks[24].x * canvas.width,
              y: results.poseLandmarks[24].y * canvas.height,
              z: results.poseLandmarks[24].z,
              confidence: results.poseLandmarks[24].visibility || 0
            }
          };

          setSkeletonData(skeleton);
          setSkeletonHistory(prev => [...prev.slice(-20), skeleton]); // Keep last 20 frames

          // Check behavior rules
          const newBehaviors = behaviorRules
            .filter(rule => rule.condition(skeleton, skeletonHistory))
            .map(rule => rule.name);

          setDetectedBehaviors(newBehaviors);

          // Enhanced gesture analysis using ML service
          try {
            const gestureData = {
              repetitive_motions: newBehaviors.some(b => b.includes('Repetitive') || b.includes('Flapping')),
              fidgeting: newBehaviors.some(b => b.includes('Fidgeting')),
              patterns: newBehaviors,
              motion_data: {
                skeleton,
                behaviors: newBehaviors,
                timestamp: Date.now()
              }
            };

            const mlResult = await mlService.analyzeGesture(gestureData);
            
            // Combine local detection with ML analysis
            const enhancedBehaviors = [...newBehaviors, ...mlResult.patterns];
            setDetectedBehaviors(enhancedBehaviors);

            // Send enhanced data to backend
            if (sessionId) {
              const motionData: MotionData = {
                repetitive_motions: mlResult.patterns.includes('repetitive_motion'),
                fidgeting: mlResult.patterns.includes('fidgeting'),
                patterns: enhancedBehaviors,
                motion_data: {
                  skeleton,
                  behaviors: enhancedBehaviors,
                  ml_analysis: {
                    behavior: mlResult.behavior,
                    risk_level: mlResult.risk_level,
                    confidence: mlResult.confidence
                  },
                  timestamp: Date.now()
                },
                timestamp: mlResult.timestamp
              };

              apiService.updateMotionData(sessionId, motionData).catch(console.warn);
            }
          } catch (mlError) {
            console.warn('ML gesture analysis failed, using local detection:', mlError);
            
            // Fallback to local detection only
            if (sessionId) {
              const motionData: MotionData = {
                repetitive_motions: newBehaviors.some(b => b.includes('Repetitive') || b.includes('Flapping')),
                fidgeting: newBehaviors.some(b => b.includes('Fidgeting')),
                patterns: newBehaviors,
                motion_data: {
                  skeleton,
                  behaviors: newBehaviors,
                  timestamp: Date.now()
                },
                timestamp: new Date().toISOString()
              };

              apiService.updateMotionData(sessionId, motionData).catch(console.warn);
            }
          }
        }
      });

      setMediaPipePose(pose);
      setCameraStatus('MediaPipe Pose initialized');
      console.log('MediaPipe Pose initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MediaPipe Pose:', error);
      setCameraStatus('MediaPipe Pose initialization failed');
    }
  }, [isRecording, sessionId, skeletonHistory, behaviorRules]);

  // Load face-api.js models
  const loadFaceModels = useCallback(async () => {
    try {
      setCameraStatus('Loading emotion detection models...');
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

      setCameraStatus('Emotion models loaded');
    } catch (err) {
      setError('Failed to load emotion detection models');
      setCameraStatus('Emotion model loading failed');
      console.error('Error loading face models:', err);
    }
  }, []);

  // Start video stream
  const startVideo = useCallback(async () => {
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
        setCameraStatus('Camera active - performing comprehensive analysis');
        setIsRecording(true);
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video loaded:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
        };
        
        videoRef.current.onplay = () => {
          console.log('Video started playing');
          setCameraStatus('Live comprehensive analysis active');
        };
      }
    } catch (err) {
      setError('Failed to access camera. Please check camera permissions.');
      setCameraStatus('Camera access failed');
      console.error('Error starting video:', err);
    }
  }, []);

  // Analyze emotion from video frame using ML service
  const analyzeEmotion = useCallback(async () => {
    if (!videoRef.current || !isRecording) return;

    try {
      // Try face-api.js first, then fallback to ML service
      let emotionResult: EmotionAnalysis;
      
      try {
        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        if (detections.length > 0) {
          const expressions = detections[0].expressions;
          const emotions = Object.entries(expressions);
          const dominantEmotion = emotions.reduce((a, b) => a[1] > b[1] ? a : b);
          
          emotionResult = {
            emotion: dominantEmotion[0],
            confidence: dominantEmotion[1],
            emotions: Object.fromEntries(Object.entries(expressions)),
            timestamp: new Date().toISOString()
          };
        } else {
          // Fallback to ML service if no face detected
          emotionResult = await mlService.analyzeEmotion('facial expression analysis');
        }
      } catch (faceError) {
        console.warn('Face-api.js failed, using ML service:', faceError);
        // Use ML service as fallback
        emotionResult = await mlService.analyzeEmotion('facial expression analysis');
      }
      
      setCurrentEmotion(emotionResult.emotion);
      setEmotionConfidence(emotionResult.confidence);

      // Send emotion data to backend
      if (sessionId) {
        const emotionData: EmotionData = {
          dominant_emotion: emotionResult.emotion,
          confidence: emotionResult.confidence,
          emotions: emotionResult.emotions,
          timestamp: emotionResult.timestamp
        };

        apiService.updateEmotionData(sessionId, emotionData).catch(console.warn);
      }
    } catch (err) {
      console.warn('Error analyzing emotion:', err);
      // Final fallback
      setCurrentEmotion('neutral');
      setEmotionConfidence(0.5);
    }
  }, [isRecording, sessionId]);

  // Start analysis session
  const startAnalysis = useCallback(async () => {
    try {
      setIsRecording(true);
      setError(null);
      
      // Initialize all models
      await Promise.all([
        initializeTensorFlow(),
        initializeMediaPipe(),
        loadFaceModels()
      ]);

      // Create backend session
      const result = await apiService.startScreening(patientInfo);
      setSessionId(result.sessionId);
      console.log('Enhanced analysis session started:', result.sessionId);

      // Start video and tracking
      await startVideo();

      // Start emotion analysis loop
      const emotionInterval = setInterval(analyzeEmotion, 1000);

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

      setIsLoading(false);

      return () => {
        clearInterval(emotionInterval);
        clearInterval(countdownInterval);
      };
    } catch (error) {
      setIsRecording(false);
      setError('Failed to start enhanced analysis session');
      console.error('Error starting analysis:', error);
    }
  }, [patientInfo, initializeTensorFlow, initializeMediaPipe, loadFaceModels, startVideo, analyzeEmotion]);

  // Stop analysis session
  const stopAnalysis = useCallback(async () => {
    setIsRecording(false);
    
    if (sessionId) {
      try {
        const report = await apiService.generateReport(sessionId, {
          practitionerName: 'Dr. AI Assistant',
          practice: 'ASD Screening Tool'
        });

        const finalResults = {
          sessionId,
          emotionData: { 
            emotion: currentEmotion, 
            confidence: emotionConfidence
          },
          behaviorData: { 
            detectedBehaviors, 
            skeletonData,
            behaviorRules: behaviorRules.map(rule => rule.name)
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
  }, [sessionId, currentEmotion, emotionConfidence, detectedBehaviors, skeletonData, behaviorRules, sessionDuration, timeRemaining, onAnalysisComplete]);

  // Initialize on mount
  useEffect(() => {
    startAnalysis();
  }, [startAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaPipePose) {
        mediaPipePose.close();
      }
    };
  }, [mediaPipePose]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 24, marginBottom: 16 }}>🔄</div>
        <div>{cameraStatus}</div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
          Loading TensorFlow.js, MediaPipe, and emotion detection models...
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
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>🎬 Enhanced Gesture Analysis</h2>
      
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
                display: 'block',
                minHeight: '300px',
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

        {/* Enhanced Analytics */}
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
            <h4 style={{ margin: '0 0 12px 0', color: '#7b1fa2' }}>🎯 Detected Behaviors</h4>
            <div style={{ fontSize: 14 }}>
              {detectedBehaviors.length > 0 ? (
                detectedBehaviors.map((behavior, index) => (
                  <div key={index} style={{ 
                    marginBottom: 4, 
                    padding: '4px 8px', 
                    background: '#e1bee7', 
                    borderRadius: 4,
                    fontSize: 12
                  }}>
                    • {behavior}
                  </div>
                ))
              ) : (
                <div style={{ color: '#666', fontStyle: 'italic' }}>No behaviors detected</div>
              )}
            </div>
          </div>
          
          <div style={{ padding: 16, background: '#e8f5e8', borderRadius: 12, border: '1px solid #c8e6c9' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#388e3c' }}>🦴 Skeleton Tracking</h4>
            <div style={{ fontSize: 14, color: '#666' }}>
              {skeletonData ? (
                <div>
                  <div>Keypoints: 13 tracked</div>
                  <div>Confidence: {(Object.values(skeletonData).reduce((sum, kp) => sum + kp.confidence, 0) / 13 * 100).toFixed(1)}%</div>
                  <div>History: {skeletonHistory.length} frames</div>
                </div>
              ) : (
                <div>No skeleton data</div>
              )}
            </div>
          </div>

          <div style={{ padding: 16, background: '#fff3e0', borderRadius: 12, border: '1px solid #ffcc02' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#f57c00' }}>📈 Session Stats</h4>
            <div style={{ fontSize: 14, color: '#666' }}>
              <div>Duration: {sessionDuration - timeRemaining}s</div>
              <div>Behaviors: {detectedBehaviors.length}</div>
              <div>Status: {cameraStatus}</div>
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
            🎬 Start Enhanced Analysis
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
          <h3 style={{ margin: '0 0 16px 0', color: '#155724' }}>✅ Enhanced Analysis Complete!</h3>
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
              <strong>Behaviors Detected:</strong> 
              <div>{analysisResults.behaviorData.detectedBehaviors.length}</div>
            </div>
            <div>
              <strong>Session Duration:</strong> 
              <div>{analysisResults.sessionDuration}s</div>
            </div>
            <div>
              <strong>Technologies Used:</strong> 
              <div>TensorFlow.js + MediaPipe + Face-api.js</div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default EnhancedGestureAnalysis; 