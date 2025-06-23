import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

interface FaceEmotionTrackerProps {
  onEmotionDetected?: (emotion: string, confidence: number) => void;
  width?: number;
  height?: number;
}

const FaceEmotionTracker: React.FC<FaceEmotionTrackerProps> = ({
  onEmotionDetected,
  width = 400,
  height = 300,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  const [confidence, setConfidence] = useState<number>(0);
  const [isStreamActive, setIsStreamActive] = useState(false);

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
          console.log(`Models loaded successfully from: ${baseUrl}`);
          break;
        } catch (err) {
          console.warn(`Failed to load models from ${baseUrl}:`, err);
          continue;
        }
      }

      if (!modelsLoaded) {
        throw new Error('Failed to load models from all sources');
      }

      setIsLoading(false);
    } catch (err) {
      setError('Failed to load emotion detection models. Please check your internet connection.');
      setIsLoading(false);
      console.error('Error loading models:', err);
    }
  }, []);

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

        // Draw detections on canvas
        const canvas = canvasRef.current;
        const displaySize = { width, height };
        faceapi.matchDimensions(canvas, displaySize);
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      }
    } catch (err) {
      console.error('Error detecting emotions:', err);
    }
  }, [isStreamActive, width, height, onEmotionDetected]);

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

  // Start emotion detection loop
  useEffect(() => {
    if (!isStreamActive) return;

    const interval = setInterval(detectEmotions, 100); // Detect every 100ms
    return () => clearInterval(interval);
  }, [isStreamActive, detectEmotions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
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
        <div>Loading emotion detection models...</div>
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
      </div>
    </div>
  );
};

export default FaceEmotionTracker; 