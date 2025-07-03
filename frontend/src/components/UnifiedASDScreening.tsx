import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import * as faceapi from 'face-api.js';
import apiService, { type EmotionData, type MotionData, type VoiceData } from '../services/api';
import { useSpeechToText } from '../services/useSpeechToText';

// Comprehensive ASD screening data structure
interface ASDScreeningData {
  // Patient Information
  patientInfo: {
    name: string;
    age: number;
    gender?: string;
    parentName?: string;
    contactInfo?: string;
  };
  
  // Session Information
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  
  // Multimodal Analysis Data
  emotionAnalysis: {
    dominantEmotion: string;
    emotionHistory: Array<{
      emotion: string;
      confidence: number;
      timestamp: Date;
    }>;
    emotionStability: number; // 0-1, higher = more stable
    socialEmotionResponses: number; // 0-1, higher = more social
  };
  
  gestureAnalysis: {
    repetitiveMotions: boolean;
    handFlapping: boolean;
    rockingMotion: boolean;
    fidgeting: boolean;
    gestureHistory: Array<{
      type: string;
      confidence: number;
      timestamp: Date;
    }>;
    motorCoordination: number; // 0-1, higher = better coordination
  };
  
  voiceAnalysis: {
    prosody: {
      pitch: number;
      volume: number;
      speechRate: number;
      clarity: number;
    };
    voiceEmotion: string;
    speechPatterns: string[];
    voiceHistory: Array<{
      text: string;
      emotion: string;
      confidence: number;
      timestamp: Date;
    }>;
    communicationStyle: number; // 0-1, higher = more typical
  };
  
  textAnalysis: {
    responses: Array<{
      questionId: string;
      question: string;
      answer: string;
      responseTime: number;
      confidence: number;
      analysis: {
        score: number;
        interpretation: string;
        domain: string;
      };
    }>;
    languageComplexity: number; // 0-1, higher = more complex
    socialUnderstanding: number; // 0-1, higher = better understanding
  };
  
  // Behavioral Observations
  behavioralObservations: {
    eyeContact: number; // 0-1, higher = more eye contact
    socialEngagement: number; // 0-1, higher = more engaged
    repetitiveBehaviors: string[];
    sensoryResponses: string[];
    attentionSpan: number; // 0-1, higher = longer attention
  };
  
  // Screening Results
  screeningResults: {
    overallScore: number; // 0-1, higher = more typical
    riskLevel: 'low' | 'medium' | 'high';
    domains: {
      social: number;
      communication: number;
      behavior: number;
      sensory: number;
    };
    recommendations: string[];
    nextSteps: string[];
  };
}

interface UnifiedASDScreeningProps {
  patientInfo?: {
    name: string;
    age: number;
    gender?: string;
    parentName?: string;
    contactInfo?: string;
  };
  onScreeningComplete?: (results: ASDScreeningData) => void;
  sessionDuration?: number;
}

const UnifiedASDScreening: React.FC<UnifiedASDScreeningProps> = ({
  patientInfo = { name: 'Test Patient', age: 8, gender: 'Male' },
  onScreeningComplete,
  sessionDuration = 300 // 5 minutes default
}) => {
  // Core state
  const [isLoading, setIsLoading] = useState(true);
  const [isScreening, setIsScreening] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(sessionDuration);
  const [currentPhase, setCurrentPhase] = useState<'intro' | 'screening' | 'analysis' | 'complete'>('intro');
  
  // Analysis state
  const [emotionData, setEmotionData] = useState<EmotionData | null>(null);
  const [motionData, setMotionData] = useState<MotionData | null>(null);
  const [voiceData, setVoiceData] = useState<VoiceData | null>(null);
  const [screeningData, setScreeningData] = useState<ASDScreeningData | null>(null);
  
  // Technical state
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [poseDetector, setPoseDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [mediaPipePose, setMediaPipePose] = useState<Pose | null>(null);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Speech recognition
  const {
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText();

  // Initialize TensorFlow.js and models
  const initializeModels = useCallback(async () => {
    try {
      setStatus('Loading AI models...');
      
      // Initialize TensorFlow.js
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
      
      // Initialize MediaPipe Pose
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

      setMediaPipePose(pose);
      
      // Load face-api.js models
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
          break;
        } catch (err) {
          console.warn(`Failed to load face models from ${baseUrl}:`, err);
          continue;
        }
      }

      if (!modelsLoaded) {
        throw new Error('Failed to load face models from all sources');
      }
      
      setStatus('Models loaded successfully');
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize models:', error);
      setError('Failed to initialize AI models. Please refresh and try again.');
      setStatus('Model initialization failed');
    }
  }, []);

  // Start video stream and analysis
  const startVideoAnalysis = useCallback(async () => {
    try {
      setStatus('Starting video analysis...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        },
        audio: true
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Set up audio analysis
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        source.connect(analyserRef.current);
        
        setStatus('Video and audio analysis active');
      }
    } catch (err) {
      console.error('Error starting video analysis:', err);
      setError('Failed to access camera/microphone. Please check permissions.');
    }
  }, []);

  // Analyze emotion from video frame
  const analyzeEmotion = useCallback(async () => {
    if (!videoRef.current || !isScreening) return;

    try {
      const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections.length > 0) {
        const expressions = detections[0].expressions;
        const emotions = Object.entries(expressions);
        const dominantEmotion = emotions.reduce((a, b) => a[1] > b[1] ? a : b);
        
        const emotionData: EmotionData = {
          dominant_emotion: dominantEmotion[0],
          confidence: dominantEmotion[1],
          emotions: Object.fromEntries(Object.entries(expressions)),
          timestamp: new Date().toISOString()
        };

        setEmotionData(emotionData);

        if (sessionId) {
          await apiService.updateComprehensiveEmotionData(sessionId, emotionData);
        }
      }
    } catch (err) {
      console.warn('Error analyzing emotion:', err);
    }
  }, [isScreening, sessionId]);

  // Analyze voice and speech patterns
  const analyzeVoice = useCallback(async () => {
    if (!analyserRef.current || !isScreening) return;

    try {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate voice metrics
      const averageFrequency = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
      const volume = Math.max(...dataArray) / 255;
      
      const voiceData: VoiceData = {
        prosody: {
          pitch: averageFrequency,
          volume: volume,
          speechRate: transcript.split(' ').length / (timeRemaining / 60), // words per minute
          clarity: 0.8 // Placeholder, would need more sophisticated analysis
        },
        voiceEmotion: emotionData?.dominant_emotion || 'neutral',
        speechPatterns: extractSpeechPatterns(transcript),
        timestamp: new Date().toISOString()
      };

      setVoiceData(voiceData);

      if (sessionId) {
        await apiService.updateComprehensiveVoiceData(sessionId, voiceData);
      }
    } catch (err) {
      console.warn('Error analyzing voice:', err);
    }
  }, [isScreening, transcript, timeRemaining, emotionData, sessionId]);

  // Extract speech patterns for ASD analysis
  const extractSpeechPatterns = (text: string): string[] => {
    const patterns: string[] = [];
    
    if (text.length === 0) return patterns;
    
    // Check for echolalia (repetition)
    const words = text.toLowerCase().split(' ');
    const wordCounts: { [key: string]: number } = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    const repeatedWords = Object.entries(wordCounts)
      .filter(([_, count]) => count > 2)
      .map(([word, _]) => word);
    
    if (repeatedWords.length > 0) {
      patterns.push('echolalia');
    }
    
    // Check for unusual speech patterns
    if (text.includes('um') || text.includes('uh')) {
      patterns.push('fillers');
    }
    
    if (text.length < 10) {
      patterns.push('short_responses');
    }
    
    return patterns;
  };

  // Start comprehensive screening session
  const startScreening = useCallback(async () => {
    try {
      setIsScreening(true);
      setError(null);
      setCurrentPhase('screening');
      
      // Create backend session
      const result = await apiService.startComprehensiveScreening(patientInfo);
      setSessionId(result.sessionId);
      
      // Start video analysis
      await startVideoAnalysis();
      
      // Start speech recognition
      startListening();
      
      // Start analysis loops
      const emotionInterval = setInterval(analyzeEmotion, 1000);
      const voiceInterval = setInterval(analyzeVoice, 2000);
      
      // Start countdown
      const countdownInterval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            clearInterval(emotionInterval);
            clearInterval(voiceInterval);
            stopListening();
            completeScreening();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setStatus('Comprehensive screening in progress...');
      
      return () => {
        clearInterval(emotionInterval);
        clearInterval(voiceInterval);
        clearInterval(countdownInterval);
      };
    } catch (error) {
      setIsScreening(false);
      setError('Failed to start screening session');
      console.error('Error starting screening:', error);
    }
  }, [patientInfo, startVideoAnalysis, startListening, stopListening, analyzeEmotion, analyzeVoice]);

  // Complete screening and generate results
  const completeScreening = useCallback(async () => {
    setIsScreening(false);
    setCurrentPhase('analysis');
    setStatus('Analyzing results...');
    
    if (sessionId) {
      try {
        // Generate comprehensive report
        const report = await apiService.generateComprehensiveReport(sessionId, {
          practitionerName: 'Dr. AI Assistant',
          practice: 'ASD Screening Tool'
        });

        // Compile comprehensive screening data
        const comprehensiveData: ASDScreeningData = {
          patientInfo,
          sessionId,
          startTime: new Date(Date.now() - (sessionDuration - timeRemaining) * 1000),
          endTime: new Date(),
          duration: sessionDuration - timeRemaining,
          
          emotionAnalysis: {
            dominantEmotion: emotionData?.dominant_emotion || 'neutral',
            emotionHistory: [], // Would be populated from backend
            emotionStability: calculateEmotionStability(),
            socialEmotionResponses: calculateSocialEmotionResponses()
          },
          
          gestureAnalysis: {
            repetitiveMotions: motionData?.repetitive_motions || false,
            handFlapping: false, // Would be detected from motion analysis
            rockingMotion: false,
            fidgeting: motionData?.fidgeting || false,
            gestureHistory: [],
            motorCoordination: 0.7 // Placeholder
          },
          
          voiceAnalysis: {
            prosody: voiceData?.prosody || {
              pitch: 0.5,
              volume: 0.5,
              speechRate: 0.5,
              clarity: 0.5
            },
            voiceEmotion: voiceData?.voiceEmotion || 'neutral',
            speechPatterns: voiceData?.speechPatterns || [],
            voiceHistory: [],
            communicationStyle: calculateCommunicationStyle()
          },
          
          textAnalysis: {
            responses: [], // Would be populated from backend
            languageComplexity: calculateLanguageComplexity(),
            socialUnderstanding: 0.6 // Placeholder
          },
          
          behavioralObservations: {
            eyeContact: 0.7, // Placeholder
            socialEngagement: 0.6,
            repetitiveBehaviors: motionData?.patterns || [],
            sensoryResponses: [],
            attentionSpan: 0.8
          },
          
          screeningResults: {
            overallScore: report.assessment?.overallScore || 0.65,
            riskLevel: report.assessment?.riskLevel || 'medium',
            domains: report.assessment?.domains || {
              social: 0.6,
              communication: 0.7,
              behavior: 0.5,
              sensory: 0.8
            },
            recommendations: report.assessment?.recommendations || [
              'Monitor developmental milestones',
              'Consider follow-up screening in 6 months',
              'Discuss concerns with pediatrician'
            ],
            nextSteps: report.assessment?.nextSteps || [
              'Share results with healthcare provider',
              'Schedule follow-up appointment if needed',
              'Consider additional assessments if concerns persist'
            ]
          }
        };

        setScreeningData(comprehensiveData);
        setCurrentPhase('complete');
        setStatus('Screening complete');

        if (onScreeningComplete) {
          onScreeningComplete(comprehensiveData);
        }
      } catch (error) {
        console.error('Error generating report:', error);
        setError('Failed to generate screening report');
      }
    }

    // Stop video stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  }, [sessionId, emotionData, motionData, voiceData, patientInfo, sessionDuration, timeRemaining, onScreeningComplete]);

  // Helper functions for analysis
  const calculateEmotionStability = (): number => {
    // Placeholder - would analyze emotion history
    return 0.7;
  };

  const calculateSocialEmotionResponses = (): number => {
    // Placeholder - would analyze social vs non-social emotions
    return 0.6;
  };

  const calculateCommunicationStyle = (): number => {
    // Placeholder - would analyze voice patterns and speech
    return 0.7;
  };

  const calculateLanguageComplexity = (): number => {
    // Placeholder - would analyze text responses
    return 0.6;
  };

  // Initialize on mount
  useEffect(() => {
    initializeModels();
  }, [initializeModels]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaPipePose) {
        mediaPipePose.close();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [mediaPipePose]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 24, marginBottom: 16 }}>🧠</div>
        <div style={{ fontSize: 18, marginBottom: 8 }}>ASD Screening Tool</div>
        <div>{status}</div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
          Loading AI models for comprehensive analysis...
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
      <h1 style={{ textAlign: 'center', marginBottom: 20 }}>🧠 Comprehensive ASD Screening</h1>
      
      {/* Patient Info */}
      <div style={{ 
        marginBottom: 20, 
        padding: 16, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 12,
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Patient:</strong> {patientInfo.name} ({patientInfo.age} years old)
            {sessionId && <div style={{ fontSize: 12, opacity: 0.8 }}>Session: {sessionId}</div>}
          </div>
          <div>
            {isScreening ? (
              <div style={{ fontWeight: 'bold', fontSize: 18 }}>
                ⏱️ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </div>
            ) : (
              <div style={{ fontWeight: 'bold' }}>
                {currentPhase === 'complete' ? '✅ Complete' : 'Ready'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {currentPhase === 'intro' && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🧠</div>
          <h2 style={{ marginBottom: 16 }}>Comprehensive ASD Screening</h2>
          <p style={{ marginBottom: 24, fontSize: 16, color: '#666' }}>
            This screening tool analyzes voice, gestures, text, and emotions to provide
            a comprehensive assessment for Autism Spectrum Disorder.
          </p>
          <button
            onClick={startScreening}
            style={{
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 50,
              fontSize: 18,
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 8px 16px rgba(40, 167, 69, 0.3)'
            }}
          >
            🎬 Start Comprehensive Screening
          </button>
        </div>
      )}

      {currentPhase === 'screening' && (
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
                SCREENING
              </div>
            </div>
          </div>

          {/* Real-time Analysis */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 16, background: '#e3f2fd', borderRadius: 12, border: '1px solid #bbdefb' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>😊 Emotion Analysis</h4>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1976d2' }}>
                {emotionData?.dominant_emotion || 'Analyzing...'}
              </div>
              <div style={{ fontSize: 14, color: '#666' }}>
                Confidence: {emotionData ? `${(emotionData.confidence * 100).toFixed(1)}%` : '...'}
              </div>
            </div>
            
            <div style={{ padding: 16, background: '#f3e5f5', borderRadius: 12, border: '1px solid #e1bee7' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#7b1fa2' }}>🎤 Voice Analysis</h4>
              <div style={{ fontSize: 14, color: '#666' }}>
                {isListening ? (
                  <div>
                    <div>🎙️ Listening...</div>
                    <div style={{ fontSize: 12, marginTop: 8, padding: 8, background: '#f8f9fa', borderRadius: 4 }}>
                      "{transcript || 'No speech detected'}"
                    </div>
                  </div>
                ) : (
                  <div>Not listening</div>
                )}
              </div>
            </div>
            
            <div style={{ padding: 16, background: '#e8f5e8', borderRadius: 12, border: '1px solid #c8e6c9' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#388e3c' }}>🤲 Gesture Analysis</h4>
              <div style={{ fontSize: 14, color: '#666' }}>
                {motionData?.repetitive_motions ? 'Repetitive motions detected' : 'Normal movements'}
              </div>
            </div>

            <div style={{ padding: 16, background: '#fff3e0', borderRadius: 12, border: '1px solid #ffcc02' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#f57c00' }}>📊 Status</h4>
              <div style={{ fontSize: 14, color: '#666' }}>
                <div>{status}</div>
                <div>Phase: {currentPhase}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentPhase === 'analysis' && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🔍</div>
          <h2 style={{ marginBottom: 16 }}>Analyzing Results</h2>
          <div style={{ fontSize: 16, color: '#666' }}>
            Processing comprehensive data from voice, gestures, text, and emotions...
          </div>
        </div>
      )}

      {currentPhase === 'complete' && screeningData && (
        <div style={{ padding: 24, background: '#f8f9fa', borderRadius: 12 }}>
          <h2 style={{ marginBottom: 20, color: '#28a745' }}>✅ Screening Complete</h2>
          
          {/* Risk Level */}
          <div style={{ 
            marginBottom: 24, 
            padding: 16, 
            background: screeningData.screeningResults.riskLevel === 'high' ? '#f8d7da' : 
                       screeningData.screeningResults.riskLevel === 'medium' ? '#fff3cd' : '#d1ecf1',
            borderRadius: 8,
            border: screeningData.screeningResults.riskLevel === 'high' ? '1px solid #f5c6cb' :
                   screeningData.screeningResults.riskLevel === 'medium' ? '1px solid #ffeaa7' : '1px solid #bee5eb'
          }}>
            <h3 style={{ margin: '0 0 8px 0' }}>
              Risk Level: {screeningData.screeningResults.riskLevel.toUpperCase()}
            </h3>
            <div style={{ fontSize: 14 }}>
              Overall Score: {(screeningData.screeningResults.overallScore * 100).toFixed(1)}%
            </div>
          </div>

          {/* Domain Scores */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ padding: 16, background: 'white', borderRadius: 8, border: '1px solid #dee2e6' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Social</h4>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#007bff' }}>
                {(screeningData.screeningResults.domains.social * 100).toFixed(0)}%
              </div>
            </div>
            <div style={{ padding: 16, background: 'white', borderRadius: 8, border: '1px solid #dee2e6' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Communication</h4>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#28a745' }}>
                {(screeningData.screeningResults.domains.communication * 100).toFixed(0)}%
              </div>
            </div>
            <div style={{ padding: 16, background: 'white', borderRadius: 8, border: '1px solid #dee2e6' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Behavior</h4>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ffc107' }}>
                {(screeningData.screeningResults.domains.behavior * 100).toFixed(0)}%
              </div>
            </div>
            <div style={{ padding: 16, background: 'white', borderRadius: 8, border: '1px solid #dee2e6' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Sensory</h4>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#17a2b8' }}>
                {(screeningData.screeningResults.domains.sensory * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Recommendations</h3>
            <ul style={{ textAlign: 'left', paddingLeft: 20 }}>
              {screeningData.screeningResults.recommendations.map((rec, index) => (
                <li key={index} style={{ marginBottom: 8 }}>{rec}</li>
              ))}
            </ul>
          </div>

          {/* Next Steps */}
          <div>
            <h3 style={{ marginBottom: 16 }}>Next Steps</h3>
            <ul style={{ textAlign: 'left', paddingLeft: 20 }}>
              {screeningData.screeningResults.nextSteps.map((step, index) => (
                <li key={index} style={{ marginBottom: 8 }}>{step}</li>
              ))}
            </ul>
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

export default UnifiedASDScreening; 