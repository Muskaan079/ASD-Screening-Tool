import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

interface WristPosition {
  x: number;
  y: number;
  z: number;
  confidence: number;
}

interface HandPoseData {
  leftWrist: WristPosition | null;
  rightWrist: WristPosition | null;
  timestamp: number;
}

interface EnhancedEmotionTrackerProps {
  onEmotionDetected?: (emotion: string, confidence: number) => void;
  onWristDataDetected?: (handData: HandPoseData) => void;
  onRepetitiveMotionDetected?: (analysis: any) => void;
  width?: number;
  height?: number;
  enableHandTracking?: boolean;
}

const EnhancedEmotionTracker: React.FC<EnhancedEmotionTrackerProps> = ({
  onEmotionDetected,
  onWristDataDetected,
  onRepetitiveMotionDetected,
  width = 400,
  height = 300,
  enableHandTracking = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  const [confidence, setConfidence] = useState<number>(0);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [handTrackingActive, setHandTrackingActive] = useState(false);
  const [wristDataHistory, setWristDataHistory] = useState<HandPoseData[]>([]);
  const [repetitiveMotionScore, setRepetitiveMotionScore] = useState<number>(0);

  // MediaPipe Hands setup
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  // Load face-api.js models
  const loadModels = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try loading from CDN first, then fallback to local
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
    if (!enableHandTracking) return;

    try {
      // Dynamic import for MediaPipe
      const { Hands } = await import('@mediapipe/hands');
      const { Camera } = await import('@mediapipe/camera_utils');
      const { drawConnectors, drawLandmarks } = await import('@mediapipe/drawing_utils');

      // Initialize MediaPipe Hands
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

      // Set up results callback
      handsRef.current.onResults((results: any) => {
        const handData: HandPoseData = {
          leftWrist: null,
          rightWrist: null,
          timestamp: Date.now()
        };

        if (results.multiHandLandmarks) {
          results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
            const handedness = results.multiHandedness[index].label;
            const wrist = landmarks[0]; // Wrist is landmark 0

            const wristPosition: WristPosition = {
              x: wrist.x * width,
              y: wrist.y * height,
              z: wrist.z * 1000, // Scale Z for better analysis
              confidence: 0.8 // MediaPipe doesn't provide confidence per landmark
            };

            if (handedness === 'Left') {
              handData.leftWrist = wristPosition;
            } else if (handedness === 'Right') {
              handData.rightWrist = wristPosition;
            }
          });
        }

        // Update wrist data history
        setWristDataHistory(prev => {
          const newHistory = [...prev, handData].slice(-100); // Keep last 100 frames
          return newHistory;
        });

        // Emit wrist data
        if (onWristDataDetected) {
          onWristDataDetected(handData);
        }

        // Draw hand landmarks
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw hand landmarks
            if (results.multiHandLandmarks) {
              results.multiHandLandmarks.forEach((landmarks: any) => {
                drawConnectors(ctx, landmarks, Hands.HAND_CONNECTIONS, {
                  color: '#00FF00',
                  lineWidth: 2
                });
                drawLandmarks(ctx, landmarks, {
                  color: '#FF0000',
                  lineWidth: 1,
                  radius: 3
                });
              });
            }
          }
        }
      });

      // Initialize camera
      cameraRef.current = new Camera(videoRef.current!, {
        onFrame: async () => {
          if (handsRef.current && videoRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: width,
        height: height
      });

      await cameraRef.current.start();
      setHandTrackingActive(true);
      console.log('Hand tracking initialized successfully');

    } catch (err) {
      console.warn('Hand tracking not available:', err);
      setHandTrackingActive(false);
    }
  }, [enableHandTracking, width, height, onWristDataDetected]);

  // Start video stream
  const startVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreamActive(true);
      }
    } catch (err) {
      setError('Failed to access webcam. Please check permissions.');
      console.error('Error accessing webcam:', err);
    }
  }, [width, height]);

  // Detect emotions
  const detectEmotions = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isStreamActive) return;

    try {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections.length > 0) {
        const expressions = detections[0].expressions;
        const emotions = Object.entries(expressions);
        
        // Find the emotion with highest confidence
        const topEmotion = emotions.reduce((prev, current) => 
          prev[1] > current[1] ? prev : current
        );

        const [emotion, confidence] = topEmotion;
        setCurrentEmotion(emotion);
        setConfidence(confidence);

        // Emit to parent component
        if (onEmotionDetected) {
          onEmotionDetected(emotion, confidence);
        }

        // Draw face detections on canvas
        const canvas = canvasRef.current;
        const displaySize = { width, height };
        faceapi.matchDimensions(canvas, displaySize);
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Don't clear canvas here as hand tracking will draw on it
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
        }
      }
    } catch (err) {
      console.error('Error detecting emotions:', err);
    }
  }, [isStreamActive, width, height, onEmotionDetected]);

  // Simple repetitive motion analysis
  const analyzeRepetitiveMotion = useCallback(() => {
    if (wristDataHistory.length < 20) return;

    // Extract Y coordinates for up-down movement analysis
    const leftYCoords = wristDataHistory
      .map(data => data.leftWrist?.y)
      .filter(y => y !== null && y !== undefined) as number[];

    const rightYCoords = wristDataHistory
      .map(data => data.rightWrist?.y)
      .filter(y => y !== null && y !== undefined) as number[];

    // Simple variance-based analysis
    const calculateVariance = (coords: number[]) => {
      if (coords.length < 2) return 0;
      const mean = coords.reduce((sum, val) => sum + val, 0) / coords.length;
      const variance = coords.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / coords.length;
      return variance;
    };

    const leftVariance = calculateVariance(leftYCoords);
    const rightVariance = calculateVariance(rightYCoords);
    const avgVariance = (leftVariance + rightVariance) / 2;

    // Normalize score (0-1)
    const score = Math.min(avgVariance / 1000, 1.0);
    setRepetitiveMotionScore(score);

    // Emit analysis if callback provided
    if (onRepetitiveMotionDetected) {
      onRepetitiveMotionDetected({
        score,
        leftVariance,
        rightVariance,
        leftWristData: leftYCoords,
        rightWristData: rightYCoords
      });
    }
  }, [wristDataHistory, onRepetitiveMotionDetected]);

  // Initialize component
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Start video when models are loaded
  useEffect(() => {
    if (!isLoading && !error) {
      startVideo();
    }
  }, [isLoading, error, startVideo]);

  // Initialize hand tracking after video starts
  useEffect(() => {
    if (isStreamActive && enableHandTracking && !handTrackingActive) {
      loadHandTracking();
    }
  }, [isStreamActive, enableHandTracking, handTrackingActive, loadHandTracking]);

  // Start emotion detection loop
  useEffect(() => {
    if (!isStreamActive) return;

    const interval = setInterval(detectEmotions, 100); // Detect every 100ms
    return () => clearInterval(interval);
  }, [isStreamActive, detectEmotions]);

  // Analyze repetitive motion periodically
  useEffect(() => {
    if (wristDataHistory.length === 0) return;

    const interval = setInterval(analyzeRepetitiveMotion, 1000); // Analyze every second
    return () => clearInterval(interval);
  }, [wristDataHistory, analyzeRepetitiveMotion]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        width, 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '2px dashed #ccc',
        borderRadius: 8,
        background: '#f5f5f5'
      }}>
        <div>Loading emotion and hand tracking models...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        width, 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '2px solid #ff4444',
        borderRadius: 8,
        background: '#fff5f5',
        color: '#ff4444',
        textAlign: 'center',
        padding: 16
      }}>
        <div>
          <div>⚠️ {error}</div>
          <button 
            onClick={loadModels}
            style={{
              marginTop: 8,
              padding: '8px 16px',
              background: '#61dafb',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          style={{
            width,
            height,
            borderRadius: 8,
            border: '2px solid #61dafb',
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width,
            height,
            borderRadius: 8,
          }}
        />
      </div>
      
      <div style={{ 
        marginTop: 8, 
        padding: '8px 16px', 
        background: '#f0f0f0', 
        borderRadius: 8,
        display: 'inline-block'
      }}>
        <div style={{ fontWeight: 'bold', color: '#333' }}>
          Detected Emotion: {currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)}
        </div>
        <div style={{ fontSize: 12, color: '#666' }}>
          Confidence: {(confidence * 100).toFixed(1)}%
        </div>
        {enableHandTracking && (
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            Hand Tracking: {handTrackingActive ? '✅ Active' : '❌ Inactive'}
          </div>
        )}
        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
          Repetitive Motion Score: {(repetitiveMotionScore * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
};

export default EnhancedEmotionTracker; 