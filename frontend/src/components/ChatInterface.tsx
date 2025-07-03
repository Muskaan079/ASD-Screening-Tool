import React, { useState, FormEvent, ChangeEvent, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpeechToText } from '../services/useSpeechToText';
import { EmotionLogEntry } from '../services/reportGenerator';
import { ReasoningFactor } from './ReasoningVisualizer';
import FaceEmotionTracker from './FaceEmotionTracker';
import ReasoningVisualizer from './ReasoningVisualizer';
import { useRepetitiveMotionDetector } from '../hooks/useRepetitiveMotionDetector';
import apiService from '../services/api';
import * as tf from '@tensorflow/tfjs';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import * as faceapi from 'face-api.js';

interface Message {
  sender: 'system' | 'user';
  text: string;
  emotion?: string;
  emotionConfidence?: number;
  timestamp: Date;
  domain?: string;
  reasoning?: string;
  reasoningFactors?: ReasoningFactor[];
}

const initialMessages: Message[] = [
  {
    sender: 'system',
    text: "Hi! Let's begin the autism screening. How are you feeling today?",
    timestamp: new Date(),
    domain: 'Introduction',
    reasoning: 'Initial greeting to establish rapport'
  },
];

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  const [emotionConfidence, setEmotionConfidence] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [emotionLog, setEmotionLog] = useState<EmotionLogEntry[]>([]);
  const [sessionStartTime] = useState<Date>(new Date());
  const [passiveMotionData, setPassiveMotionData] = useState<any>(null);
  const [detectedBehaviors, setDetectedBehaviors] = useState<string[]>([]);
  const [postureAnalysis, setPostureAnalysis] = useState<string>('upright');
  const [engagementScore, setEngagementScore] = useState<number>(0);
  const [motionHistory, setMotionHistory] = useState<any[]>([]);
  const [isPassiveTracking, setIsPassiveTracking] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionProgress, setSessionProgress] = useState<{
    questionsAnswered: number;
    totalQuestions: number;
    progress: number;
  }>({ questionsAnswered: 0, totalQuestions: 10, progress: 0 });
  const [backendStatus, setBackendStatus] = useState<string>('Connecting...');
  const navigate = useNavigate();

  // Passive motion tracking refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaPipePoseRef = useRef<Pose | null>(null);

  // Initialize repetitive motion detector
  const {
    addWristData,
    analysis: repetitiveMotionAnalysis,
    clearHistory,
    hasData: hasRepetitiveMotionData,
    dataCount: repetitiveMotionDataCount,
  } = useRepetitiveMotionDetector({
    windowSize: 100,
    analysisInterval: 1000,
    frameRate: 25.1,
  });

  const {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText();

  // Initialize backend connection
  useEffect(() => {
    const initializeBackend = async () => {
      try {
        setBackendStatus('Checking backend connection...');
        const healthCheck = await apiService.checkHealth();
        console.log('Backend health check:', healthCheck);
        
        setBackendStatus('Starting screening session...');
        const sessionResponse = await apiService.startScreening({
          name: 'Test Patient',
          age: 8,
          gender: 'Male'
        });
        
        if (sessionResponse.success) {
          setSessionId(sessionResponse.sessionId);
          setBackendStatus('Connected to backend');
          console.log('Session started:', sessionResponse.sessionId);
        } else {
          setBackendStatus('Failed to start session');
        }
      } catch (error) {
        console.error('Backend initialization failed:', error);
        setBackendStatus('Backend connection failed - using local mode');
      }
    };

    initializeBackend();
  }, []);

  // Generate mock reasoning factors based on conversation history
  const generateMockReasoning = (userResponse: string, emotion: string): ReasoningFactor[] => {
    const factors: ReasoningFactor[] = [];
    
    // Add emotion factor
    if (emotion !== 'neutral') {
      factors.push({
        factor: `Emotion: ${emotion}`,
        impact: Math.random() * 0.3 + 0.1 // 10-40% impact
      });
    }

    // Add response-based factors
    const responseLength = userResponse.length;
    if (responseLength > 50) {
      factors.push({
        factor: "Detailed response provided",
        impact: Math.random() * 0.2 + 0.2 // 20-40% impact
      });
    }

    // Add domain-specific factors based on recent messages
    const recentSystemMessages = messages
      .filter(msg => msg.sender === 'system' && msg.domain)
      .slice(-3);
    
    if (recentSystemMessages.length > 0) {
      const lastDomain = recentSystemMessages[recentSystemMessages.length - 1].domain;
      if (lastDomain && lastDomain !== 'Introduction') {
        factors.push({
          factor: `Previous focus: ${lastDomain}`,
          impact: Math.random() * 0.3 + 0.3 // 30-60% impact
        });
      }
    }

    // Add conversation flow factors
    const questionCount = messages.filter(msg => msg.sender === 'system').length;
    if (questionCount > 3) {
      factors.push({
        factor: "Building on previous responses",
        impact: Math.random() * 0.2 + 0.4 // 40-60% impact
      });
    }

    // Ensure we have at least 2-4 factors
    while (factors.length < 2) {
      factors.push({
        factor: `Response pattern analysis`,
        impact: Math.random() * 0.2 + 0.1 // 10-30% impact
      });
    }

    // Normalize impacts to sum to 1.0
    const totalImpact = factors.reduce((sum, factor) => sum + factor.impact, 0);
    return factors.map(factor => ({
      ...factor,
      impact: factor.impact / totalImpact
    }));
  };

  // Handle emotion detection from FaceEmotionTracker
  const handleEmotionDetected = (emotion: string, confidence: number) => {
    setCurrentEmotion(emotion);
    setEmotionConfidence(confidence);
    
    // Log emotion with timestamp
    const emotionEntry: EmotionLogEntry = {
      timestamp: new Date(),
      emotionLabel: emotion,
      confidence: confidence,
    };
    setEmotionLog(prev => [...prev, emotionEntry]);

    // Send emotion data to backend if session is active
    if (sessionId) {
      apiService.updateEmotionData(sessionId, {
        dominant_emotion: emotion,
        confidence: confidence,
        emotions: { [emotion]: confidence },
        timestamp: new Date().toISOString()
      }).catch(error => {
        console.error('Failed to update emotion data:', error);
      });
    }
  };

  // Handle wrist data from MediaPipe
  const handleWristDataDetected = (handData: any) => {
    addWristData(handData);
  };

  // Handle repetitive motion analysis
  const handleRepetitiveMotionDetected = (analysis: any) => {
    console.log('Repetitive motion detected:', analysis);
  };

  // Passive Motion Tracking Functions
  const initializePassiveTracking = async () => {
    try {
      // Initialize TensorFlow.js
      await tf.ready();
      await tf.setBackend('webgl');

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

      pose.onResults((results) => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear previous drawings
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.poseLandmarks) {
          // Draw pose landmarks (hidden tracking)
          drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: '#00FF00',
            lineWidth: 2
          });
          drawLandmarks(ctx, results.poseLandmarks, {
            color: '#FF0000',
            lineWidth: 1,
            radius: 3
          });

          // Analyze motion patterns
          const motionAnalysis = analyzeMotionPatterns(results.poseLandmarks);
          setPassiveMotionData(motionAnalysis);
          setMotionHistory(prev => [...prev.slice(-50), motionAnalysis]);

          // Update detected behaviors
          const behaviors: string[] = [];
          if (motionAnalysis.handFlapping) behaviors.push('Hand Flapping');
          if (motionAnalysis.rocking) behaviors.push('Rocking Motion');
          if (motionAnalysis.fidgeting) behaviors.push('Finger Fidgeting');
          if (motionAnalysis.gazeAvoidance) behaviors.push('Gaze Avoidance');
          
          setDetectedBehaviors(behaviors);
          setPostureAnalysis(motionAnalysis.posture);
          setEngagementScore(motionAnalysis.engagement);

          // Send motion data to backend if session is active
          if (sessionId) {
            apiService.updateMotionData(sessionId, {
              repetitive_motions: behaviors.length > 0,
              fidgeting: motionAnalysis.fidgeting,
              patterns: behaviors,
              motion_data: motionAnalysis,
              timestamp: new Date().toISOString()
            }).catch(error => {
              console.error('Failed to update motion data:', error);
            });
          }
        }
      });

      mediaPipePoseRef.current = pose;
      await startPassiveVideo();
      setIsPassiveTracking(true);
    } catch (error) {
      console.error('Failed to initialize passive tracking:', error);
    }
  };

  const startPassiveVideo = async () => {
    try {
      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Failed to start video:', error);
    }
  };

  const analyzeMotionPatterns = (landmarks: any[]) => {
    const analysis = {
      handFlapping: detectHandFlapping(landmarks),
      rocking: detectRockingMotion(landmarks),
      fidgeting: detectFingerFidgeting(landmarks),
      gazeAvoidance: detectGazeAvoidance(landmarks),
      posture: analyzePosture(landmarks),
      engagement: calculateEngagement(landmarks)
    };

    return analysis;
  };

  const detectHandFlapping = (landmarks: any[]): boolean => {
    // Simplified hand flapping detection
    if (landmarks.length < 33) return false;
    
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    
    // Check for rapid vertical movement
    const verticalMovement = Math.abs(leftWrist.y - rightWrist.y);
    return verticalMovement > 0.1; // Threshold for flapping
  };

  const detectRockingMotion = (landmarks: any[]): boolean => {
    // Simplified rocking detection
    if (landmarks.length < 33) return false;
    
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    
    // Check for forward-backward movement
    const rockingMovement = Math.abs(leftHip.z - rightHip.z);
    return rockingMovement > 0.05; // Threshold for rocking
  };

  const detectFingerFidgeting = (landmarks: any[]): boolean => {
    // Simplified fidgeting detection
    if (landmarks.length < 33) return false;
    
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    
    // Check for small repetitive movements
    const movement = Math.abs(leftWrist.x - rightWrist.x) + Math.abs(leftWrist.y - rightWrist.y);
    return movement > 0.02 && movement < 0.1; // Small but noticeable movement
  };

  const detectGazeAvoidance = (landmarks: any[]): boolean => {
    // Simplified gaze avoidance detection
    if (landmarks.length < 33) return false;
    
    const nose = landmarks[0];
    const leftEye = landmarks[2];
    const rightEye = landmarks[5];
    
    // Check if head is turned away from center
    const headAngle = Math.atan2(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
    return Math.abs(headAngle) > 0.3; // Head turned more than ~17 degrees
  };

  const analyzePosture = (landmarks: any[]): string => {
    if (landmarks.length < 33) return 'unknown';
    
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    
    const shoulderSlope = Math.abs(leftShoulder.y - rightShoulder.y);
    const hipSlope = Math.abs(leftHip.y - rightHip.y);
    
    if (shoulderSlope < 0.05 && hipSlope < 0.05) {
      return 'upright';
    } else if (shoulderSlope > 0.1 || hipSlope > 0.1) {
      return 'slouched';
    } else {
      return 'slightly_tilted';
    }
  };

  const calculateEngagement = (landmarks: any[]): number => {
    if (landmarks.length < 33) return 0;
    
    const nose = landmarks[0];
    const leftEye = landmarks[2];
    const rightEye = landmarks[5];
    
    // Calculate engagement based on head position and eye direction
    const headPosition = (leftEye.y + rightEye.y) / 2;
    const eyeDistance = Math.abs(leftEye.x - rightEye.x);
    
    // Higher engagement if head is centered and eyes are open
    let engagement = 0.5; // Base engagement
    
    if (headPosition > 0.3 && headPosition < 0.7) engagement += 0.2; // Head in center
    if (eyeDistance > 0.05) engagement += 0.2; // Eyes open
    if (nose.y > 0.2 && nose.y < 0.8) engagement += 0.1; // Nose in good position
    
    return Math.min(engagement, 1.0);
  };

  // Initialize passive tracking on component mount
  useEffect(() => {
    const initTracking = async () => {
      try {
        await initializePassiveTracking();
      } catch (error) {
        console.error('Failed to initialize tracking:', error);
      }
    };

    initTracking();
  }, []);

  // Generate next question using backend API
  const generateNextQuestion = async (userResponse: string) => {
    if (!sessionId) {
      // Fallback to local mode if no session
      const mockQuestion = {
        text: "That's interesting. Can you tell me more about your daily routine?",
        domain: 'Daily Activities',
        reasoning: 'Following up on previous response'
      };
      
      const reasoningFactors = generateMockReasoning(userResponse, currentEmotion);
      
      setMessages(prev => [...prev, {
        sender: 'system',
        text: mockQuestion.text,
        timestamp: new Date(),
        domain: mockQuestion.domain,
        reasoning: mockQuestion.reasoning,
        reasoningFactors
      }]);
      return;
    }

    try {
      setIsLoading(true);
      
      // Prepare emotion and motion data
      const emotionData = {
        dominant_emotion: currentEmotion,
        confidence: emotionConfidence,
        emotions: { [currentEmotion]: emotionConfidence },
        timestamp: new Date().toISOString()
      };

      const motionData = {
        repetitive_motions: detectedBehaviors.length > 0,
        fidgeting: passiveMotionData?.fidgeting || false,
        patterns: detectedBehaviors,
        motion_data: passiveMotionData,
        timestamp: new Date().toISOString()
      };

      // Get next question from backend
      const response = await apiService.getNextQuestion(
        sessionId,
        {
          questionId: `q_${messages.filter(m => m.sender === 'system').length}`,
          answer: userResponse,
          confidence: emotionConfidence,
          responseTime: 2000, // Mock response time
          emotionData,
          motionData
        },
        emotionData,
        motionData
      );

      if (response.success) {
        const reasoningFactors = generateMockReasoning(userResponse, currentEmotion);
        
        setMessages(prev => [...prev, {
          sender: 'system',
          text: response.question.text,
          timestamp: new Date(),
          domain: response.question.category,
          reasoning: 'AI-adapted based on response and behavior',
          reasoningFactors
        }]);

        setSessionProgress(response.sessionProgress);
      } else {
        throw new Error('Failed to get next question');
      }
    } catch (error) {
      console.error('Failed to generate next question:', error);
      
      // Fallback to local mode
      const fallbackQuestions = [
        "How do you usually spend your free time?",
        "Do you have any specific interests or hobbies?",
        "How do you feel about changes in your routine?",
        "Can you tell me about your friends and social activities?",
        "What do you find most challenging in your daily life?"
      ];
      
      const randomQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
      const reasoningFactors = generateMockReasoning(userResponse, currentEmotion);
      
      setMessages(prev => [...prev, {
        sender: 'system',
        text: randomQuestion,
        timestamp: new Date(),
        domain: 'General',
        reasoning: 'Fallback question due to backend issue',
        reasoningFactors
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    resetTranscript();

    // Add user message
    setMessages(prev => [...prev, {
      sender: 'user',
      text: userMessage,
      emotion: currentEmotion,
      emotionConfidence,
      timestamp: new Date()
    }]);

    // Generate next question
    await generateNextQuestion(userMessage);
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleFinishAndGenerateReport = async () => {
    if (!sessionId) {
      // Navigate to report page with local data
      navigate('/report', { 
        state: { 
          emotionLog, 
          sessionStartTime, 
          detectedBehaviors,
          sessionProgress: { questionsAnswered: messages.filter(m => m.sender === 'user').length, totalQuestions: 10, progress: 0.8 }
        } 
      });
      return;
    }

    try {
      setBackendStatus('Generating report...');
      
      const reportResponse = await apiService.generateReport(sessionId, {
        practitioner: 'AI Screening Assistant',
        date: new Date().toISOString()
      });

      if (reportResponse.success) {
        navigate('/report', { 
          state: { 
            report: reportResponse.report,
            sessionId: reportResponse.sessionId,
            emotionLog, 
            sessionStartTime, 
            detectedBehaviors,
            sessionProgress
          } 
        });
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      
      // Fallback to local report
      navigate('/report', { 
        state: { 
          emotionLog, 
          sessionStartTime, 
          detectedBehaviors,
          sessionProgress: { questionsAnswered: messages.filter(m => m.sender === 'user').length, totalQuestions: 10, progress: 0.8 }
        } 
      });
    }
  };

  const handleStartLiveAnalysis = () => {
    navigate('/live-analysis');
  };

  const getConversationHistory = () => {
    return messages.map(msg => ({
      role: msg.sender === 'system' ? 'assistant' : 'user',
      content: msg.text,
      timestamp: msg.timestamp,
      emotion: msg.emotion,
      emotionConfidence: msg.emotionConfidence
    }));
  };

  // Update transcript when speech input is available
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: '20px',
        height: 'calc(100vh - 40px)'
      }}>
        {/* Main Chat Area */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>ASD Screening Session</h1>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '4px' }}>
              Backend Status: {backendStatus} | Session: {sessionId ? sessionId.slice(0, 8) + '...' : 'Not started'}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '4px' }}>
              Progress: {sessionProgress.questionsAnswered}/{sessionProgress.totalQuestions} ({Math.round(sessionProgress.progress * 100)}%)
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {messages.map((message, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: message.sender === 'user' 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : '#f7fafc',
                  color: message.sender === 'user' ? 'white' : '#2d3748',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ marginBottom: '8px' }}>{message.text}</div>
                  
                  {message.emotion && (
                    <div style={{ 
                      fontSize: '0.8rem', 
                      opacity: 0.8,
                      marginTop: '4px'
                    }}>
                      Emotion: {message.emotion} ({(message.emotionConfidence || 0) * 100}%)
                    </div>
                  )}
                  
                  {message.domain && (
                    <div style={{ 
                      fontSize: '0.8rem', 
                      opacity: 0.8,
                      marginTop: '4px'
                    }}>
                      Domain: {message.domain}
                    </div>
                  )}
                  
                  {message.reasoning && (
                    <div style={{ 
                      fontSize: '0.8rem', 
                      opacity: 0.8,
                      marginTop: '4px'
                    }}>
                      Reasoning: {message.reasoning}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start'
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: '#f7fafc',
                  color: '#2d3748'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #667eea',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Generating next question...
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{
            padding: '20px',
            borderTop: '1px solid #e2e8f0',
            background: 'white'
          }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Type your response or use voice input..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleMicToggle}
                disabled={isLoading}
                style={{
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  background: isListening ? '#dc3545' : '#28a745',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                {isListening ? '⏹️' : '🎤'}
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  background: input.trim() && !isLoading 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : '#cbd5e0',
                  color: 'white',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  fontSize: '1rem'
                }}
              >
                Send
              </button>
            </form>
            
            {error && (
              <div style={{ 
                marginTop: '8px', 
                color: '#dc3545', 
                fontSize: '0.9rem' 
              }}>
                Voice input error: {error}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Emotion Tracker */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#2d3748' }}>😊 Emotion Detection</h3>
            <FaceEmotionTracker onEmotionDetected={handleEmotionDetected} />
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                Current: {currentEmotion}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                Confidence: {(emotionConfidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Motion Tracking */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#2d3748' }}>🎯 Motion Analysis</h3>
            <div style={{ fontSize: '0.9rem', color: '#4a5568', marginBottom: '8px' }}>
              Status: {isPassiveTracking ? 'Active' : 'Initializing...'}
            </div>
            
            {detectedBehaviors.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#2d3748', marginBottom: '4px' }}>
                  Detected Behaviors:
                </div>
                {detectedBehaviors.map((behavior, index) => (
                  <div key={index} style={{
                    fontSize: '0.8rem',
                    color: '#dc3545',
                    padding: '2px 6px',
                    background: '#f8d7da',
                    borderRadius: '4px',
                    marginBottom: '2px'
                  }}>
                    • {behavior}
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>
              Posture: {postureAnalysis}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>
              Engagement: {(engagementScore * 100).toFixed(1)}%
            </div>
          </div>

          {/* Reasoning Visualizer */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#2d3748' }}>🧠 AI Reasoning</h3>
            <ReasoningVisualizer 
              question={messages[messages.length - 1]?.text || "Waiting for next question..."}
              reasoning={messages[messages.length - 1]?.reasoningFactors || []}
              isVisible={messages.length > 0}
            />
          </div>

          {/* Action Buttons */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <button
              onClick={handleStartLiveAnalysis}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '8px',
                border: 'none',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🎬 Start Live Analysis
            </button>
            
            <button
              onClick={handleFinishAndGenerateReport}
              style={{
                width: '100%',
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              📊 Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Hidden video elements for passive tracking */}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        width={640}
        height={480}
        autoPlay
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        width={640}
        height={480}
      />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ChatInterface; 