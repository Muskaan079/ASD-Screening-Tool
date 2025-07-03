import React, { useState, FormEvent, ChangeEvent, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpeechToText } from '../services/useSpeechToText';
import { getNextQuestion, ConversationEntry, RepetitiveMotionData } from '../services/adaptiveEngine';
import { EmotionLogEntry } from '../services/reportGenerator';
import { ReasoningFactor } from './ReasoningVisualizer';
import FaceEmotionTracker from './FaceEmotionTracker';
import ReasoningVisualizer from './ReasoningVisualizer';
import { useRepetitiveMotionDetector } from '../hooks/useRepetitiveMotionDetector';
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
          analyzeMotionPatterns(results.poseLandmarks);
        }
      });

      mediaPipePoseRef.current = pose;
      setIsPassiveTracking(true);
      console.log('Passive motion tracking initialized');
    } catch (error) {
      console.error('Failed to initialize passive tracking:', error);
    }
  };

  const startPassiveVideo = async () => {
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
        videoRef.current.onloadedmetadata = () => {
          console.log('Passive tracking video loaded');
        };
      }
    } catch (err) {
      console.error('Error starting passive video:', err);
    }
  };

  const analyzeMotionPatterns = (landmarks: any[]) => {
    // Add to motion history
    setMotionHistory(prev => [...prev.slice(-30), landmarks]);

    // Detect behaviors
    const behaviors: string[] = [];
    
    // Hand Flapping Detection
    if (detectHandFlapping(landmarks)) {
      behaviors.push('Hand Flapping');
    }
    
    // Rocking Motion Detection
    if (detectRockingMotion(landmarks)) {
      behaviors.push('Rocking Motion');
    }
    
    // Finger Fidgeting Detection
    if (detectFingerFidgeting(landmarks)) {
      behaviors.push('Finger Fidgeting');
    }
    
    // Gaze Avoidance Detection
    if (detectGazeAvoidance(landmarks)) {
      behaviors.push('Gaze Avoidance');
    }

    setDetectedBehaviors(behaviors);

    // Analyze posture
    const posture = analyzePosture(landmarks);
    setPostureAnalysis(posture);

    // Calculate engagement
    const engagement = calculateEngagement(landmarks);
    setEngagementScore(engagement);

    // Update passive motion data
    setPassiveMotionData({
      timestamp: Date.now(),
      behaviors,
      posture,
      engagement,
      emotion: currentEmotion
    });
  };

  // Behavior Detection Algorithms
  const detectHandFlapping = (landmarks: any[]): boolean => {
    if (motionHistory.length < 10) return false;
    
    const recentWrists = motionHistory.slice(-10).map(frame => ({
      left: frame[15], // left wrist
      right: frame[16] // right wrist
    }));

    const verticalMovements = recentWrists.filter((_, i) => {
      if (i === 0) return false;
      const prev = recentWrists[i - 1];
      const curr = recentWrists[i];
      const leftMovement = Math.abs(curr.left.y - prev.left.y) > 25;
      const rightMovement = Math.abs(curr.right.y - prev.right.y) > 25;
      return leftMovement || rightMovement;
    });

    return verticalMovements.length >= 5;
  };

  const detectRockingMotion = (landmarks: any[]): boolean => {
    if (motionHistory.length < 12) return false;
    
    const recentHips = motionHistory.slice(-12).map(frame => ({
      left: frame[23], // left hip
      right: frame[24] // right hip
    }));

    const rockingMovements = recentHips.filter((_, i) => {
      if (i === 0) return false;
      const prev = recentHips[i - 1];
      const curr = recentHips[i];
      const leftMovement = Math.abs(curr.left.z - prev.left.z) > 15;
      const rightMovement = Math.abs(curr.right.z - prev.right.z) > 15;
      return leftMovement || rightMovement;
    });

    return rockingMovements.length >= 8;
  };

  const detectFingerFidgeting = (landmarks: any[]): boolean => {
    if (motionHistory.length < 15) return false;
    
    const recentHands = motionHistory.slice(-15).map(frame => ({
      left: frame[19], // left hand
      right: frame[20] // right hand
    }));

    const smallMovements = recentHands.filter((_, i) => {
      if (i === 0) return false;
      const prev = recentHands[i - 1];
      const curr = recentHands[i];
      const leftMovement = Math.abs(curr.left.x - prev.left.x) > 5 && Math.abs(curr.left.y - prev.left.y) > 5;
      const rightMovement = Math.abs(curr.right.x - prev.right.x) > 5 && Math.abs(curr.right.y - prev.right.y) > 5;
      return leftMovement || rightMovement;
    });

    return smallMovements.length >= 10;
  };

  const detectGazeAvoidance = (landmarks: any[]): boolean => {
    const leftEye = landmarks[2];
    const rightEye = landmarks[5];
    const headAngle = Math.atan2(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
    return Math.abs(headAngle) > 0.4; // Head turned more than ~25 degrees
  };

  const analyzePosture = (landmarks: any[]): string => {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    const shoulderAlignment = Math.abs(leftShoulder.y - rightShoulder.y);
    const torsoLean = Math.atan2(
      (leftShoulder.x + rightShoulder.x) / 2 - (leftHip.x + rightHip.x) / 2,
      (leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2
    );

    if (torsoLean > 0.3) return 'leaning_forward';
    if (torsoLean < -0.3) return 'leaning_back';
    if (shoulderAlignment > 20) return 'slouched';
    return 'upright';
  };

  const calculateEngagement = (landmarks: any[]): number => {
    const leftEye = landmarks[2];
    const rightEye = landmarks[5];
    const headAngle = Math.atan2(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
    
    // Eye contact percentage (head facing camera)
    const eyeContact = Math.abs(headAngle) < 0.3 ? 1 : 0;
    
    // Posture stability
    const posture = analyzePosture(landmarks);
    const postureScore = posture === 'upright' ? 1 : 0.5;
    
    return (eyeContact + postureScore) / 2;
  };

  // Initialize passive tracking on component mount
  useEffect(() => {
    const initTracking = async () => {
      await initializePassiveTracking();
      await startPassiveVideo();
    };
    
    initTracking();

    return () => {
      // Cleanup
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (mediaPipePoseRef.current) {
        mediaPipePoseRef.current.close();
      }
    };
  }, []);

  // Generate next question using adaptive engine
  const generateNextQuestion = async (userResponse: string) => {
    try {
      setIsLoading(true);
      
      // Convert messages to conversation history format
      const conversationHistory: ConversationEntry[] = messages
        .filter(msg => msg.sender === 'system' && msg.text !== initialMessages[0].text)
        .map((msg, index) => {
          const userMsg = messages.find((m, i) => i > index && m.sender === 'user');
          return {
            question: msg.text,
            response: userMsg?.text || '',
            emotion: userMsg?.emotion,
            emotionConfidence: userMsg?.emotionConfidence,
            timestamp: userMsg?.timestamp || new Date(),
            domain: msg.domain,
          };
        })
        .filter(entry => entry.response); // Only include Q&A pairs

      // Add the current response to history
      conversationHistory.push({
        question: messages[messages.length - 2]?.text || '',
        response: userResponse,
        emotion: currentEmotion,
        emotionConfidence: emotionConfidence,
        timestamp: new Date(),
        domain: messages[messages.length - 2]?.domain,
      });

      // Prepare repetitive motion data for adaptive engine
      const repetitiveMotionData: RepetitiveMotionData | undefined = 
        repetitiveMotionAnalysis.classification !== 'NONE' ? {
          score: repetitiveMotionAnalysis.score,
          classification: repetitiveMotionAnalysis.classification,
          description: repetitiveMotionAnalysis.description,
          dominantFrequencies: repetitiveMotionAnalysis.dominantFrequencies,
          recommendations: repetitiveMotionAnalysis.recommendations
        } : undefined;

      const nextQuestion = await getNextQuestion({
        history: conversationHistory,
        emotion: currentEmotion,
        emotionConfidence: emotionConfidence,
        repetitiveMotion: repetitiveMotionData
      });

      // Generate mock reasoning factors
      const reasoningFactors = generateMockReasoning(userResponse, currentEmotion);

      // Add the new question as a system message
      const newSystemMessage: Message = {
        sender: 'system',
        text: nextQuestion.question,
        timestamp: new Date(),
        domain: nextQuestion.domain,
        reasoning: nextQuestion.reasoning,
        reasoningFactors: reasoningFactors,
      };

      setMessages(prev => [...prev, newSystemMessage]);
    } catch (error) {
      console.error('Error generating next question:', error);
      // Fallback to a simple follow-up question
      const fallbackMessage: Message = {
        sender: 'system',
        text: "Thank you for sharing that. Can you tell me more about your experiences with social situations?",
        timestamp: new Date(),
        domain: 'Social Communication',
        reasoning: 'Fallback question due to error in adaptive engine',
        reasoningFactors: [
          { factor: "Previous response analysis", impact: 0.6 },
          { factor: "Emotion: neutral", impact: 0.2 },
          { factor: "General follow-up", impact: 0.2 }
        ],
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-submit when recording stops and there's a transcript
  useEffect(() => {
    if (!isListening && transcript.trim() !== '') {
      const newMessage: Message = {
        sender: 'user',
        text: transcript,
        emotion: currentEmotion,
        emotionConfidence: emotionConfidence,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
      resetTranscript();
      
      // Generate next question after a short delay
      setTimeout(() => {
        generateNextQuestion(transcript);
      }, 500);
    }
  }, [isListening, transcript, resetTranscript, currentEmotion, emotionConfidence]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;
    
    const newMessage: Message = {
      sender: 'user',
      text: input,
      emotion: currentEmotion,
      emotionConfidence: emotionConfidence,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    const userResponse = input;
    setInput('');
    
    // Generate next question after a short delay
    setTimeout(() => {
      generateNextQuestion(userResponse);
    }, 500);
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleFinishAndGenerateReport = () => {
    // Calculate session duration in minutes
    const sessionDuration = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 60000);
    
    // Convert messages to conversation history for report
    const conversationHistory = getConversationHistory();
    
    // Prepare repetitive motion data for report
    const repetitiveMotionData = hasRepetitiveMotionData ? {
      classification: repetitiveMotionAnalysis.classification,
      score: repetitiveMotionAnalysis.score,
      description: repetitiveMotionAnalysis.description,
      dominantFrequencies: repetitiveMotionAnalysis.dominantFrequencies,
      recommendations: repetitiveMotionAnalysis.recommendations,
      dataPoints: repetitiveMotionDataCount
    } : undefined;
    
    console.log('Storing data for report:', {
      conversationHistory,
      emotionLog,
      sessionDuration,
      repetitiveMotion: repetitiveMotionData
    });
    
    // Store data in sessionStorage for the report page
    sessionStorage.setItem('screeningHistory', JSON.stringify(conversationHistory));
    sessionStorage.setItem('screeningEmotionLog', JSON.stringify(emotionLog));
    sessionStorage.setItem('screeningDuration', sessionDuration.toString());
    sessionStorage.setItem('screeningRepetitiveMotion', JSON.stringify(repetitiveMotionData));
    sessionStorage.setItem('screeningPassiveMotion', JSON.stringify({
      behaviors: detectedBehaviors,
      posture: postureAnalysis,
      engagement: engagementScore,
      motionHistory: motionHistory.length
    }));
    
    console.log('Data stored, navigating to report...');
    navigate('/report');
  };

  const handleStartLiveAnalysis = () => {
    navigate('/live-analysis');
  };

  // Calculate session duration in minutes
  const sessionDuration = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 60000);

  // Convert messages to conversation history for report
  const getConversationHistory = (): ConversationEntry[] => {
    return messages
      .filter(msg => msg.sender === 'system' && msg.text !== initialMessages[0].text)
      .map((msg, index) => {
        const userMsg = messages.find((m, i) => i > index && m.sender === 'user');
        return {
          question: msg.text,
          response: userMsg?.text || '',
          emotion: userMsg?.emotion,
          emotionConfidence: userMsg?.emotionConfidence,
          timestamp: userMsg?.timestamp || new Date(),
          domain: msg.domain,
        };
      })
      .filter(entry => entry.response);
  };

  return (
    <div className="container">
      <div className="chat-grid">
        {/* Chat Section */}
        <div className="chat-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>Adaptive Screening Chat</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => navigate('/')}
                className="btn btn-secondary"
              >
                ← Home
              </button>
              <button
                onClick={handleStartLiveAnalysis}
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' }}
              >
                🎬 Live Analysis
              </button>
              <button
                onClick={handleFinishAndGenerateReport}
                className="btn btn-success"
                disabled={messages.length < 3}
              >
                📋 Finish & Generate Report
              </button>
            </div>
          </div>
          
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx}>
                <div className={`message ${msg.sender === 'user' ? 'message-user' : 'message-system'}`}>
                  <span className={`message-bubble ${msg.sender === 'user' ? 'message-bubble-user' : 'message-bubble-system'}`}>
                    {msg.text}
                  </span>
                  {msg.emotion && msg.sender === 'user' && (
                    <div style={{ 
                      fontSize: 12, 
                      color: '#666', 
                      marginTop: 6,
                      textAlign: msg.sender === 'user' ? 'right' : 'left'
                    }}>
                      Emotion: {msg.emotion} ({(msg.emotionConfidence! * 100).toFixed(1)}%)
                    </div>
                  )}
                  {msg.domain && msg.sender === 'system' && msg.domain !== 'Introduction' && (
                    <div style={{ 
                      fontSize: 12, 
                      color: '#666', 
                      marginTop: 6,
                      textAlign: 'left'
                    }}>
                      Domain: {msg.domain} | {msg.reasoning}
                    </div>
                  )}
                </div>
                
                {/* Show reasoning visualizer for system messages with reasoning factors */}
                {msg.sender === 'system' && msg.reasoningFactors && msg.domain !== 'Introduction' && (
                  <ReasoningVisualizer
                    question={msg.text}
                    reasoning={msg.reasoningFactors}
                    isVisible={true}
                  />
                )}
              </div>
            ))}
            {isListening && (
              <div className="message message-system">
                <span className="message-bubble listening">
                  🎤 {transcript || 'Listening...'}
                </span>
              </div>
            )}
            {isLoading && (
              <div className="message message-system">
                <span className="message-bubble loading">
                  🤔 Generating next question...
                </span>
              </div>
            )}
          </div>
          
          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <form onSubmit={handleSend} style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type your response..."
              className="input"
              style={{ flex: 1 }}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleMicToggle}
              className="btn btn-primary"
              title={isListening ? 'Stop Recording' : 'Start Recording'}
              disabled={isLoading}
            >
              🎙️
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              Send
            </button>
          </form>
        </div>

        {/* Emotion Tracker Section */}
        <div className="emotion-section emotion-tracker">
          <h3 style={{ marginTop: 0, marginBottom: 20, color: '#333', fontSize: '1.3rem' }}>Emotion Detection</h3>
          <div className="emotion-tracker-container">
            <FaceEmotionTracker 
              onEmotionDetected={handleEmotionDetected}
              onWristDataDetected={handleWristDataDetected}
              onRepetitiveMotionDetected={handleRepetitiveMotionDetected}
              width={350}
              height={250}
              enableHandTracking={true}
            />
          </div>
          <div className="status-info">
            <div style={{ fontWeight: 'bold', marginBottom: 12 }}>Current Status:</div>
            <div style={{ marginBottom: 8 }}>Emotion: <strong>{currentEmotion}</strong></div>
            <div style={{ marginBottom: 8 }}>Confidence: <strong>{(emotionConfidence * 100).toFixed(1)}%</strong></div>
            <div style={{ marginBottom: 8 }}>Hand Tracking: <strong>{hasRepetitiveMotionData ? '✅ Active' : '⏳ Collecting data...'}</strong></div>
            <div style={{ marginBottom: 8 }}>Wrist Data Points: <strong>{repetitiveMotionDataCount}</strong></div>
            {repetitiveMotionAnalysis.classification !== 'NONE' && (
              <div style={{ marginBottom: 8 }}>Repetitive Motion: <strong>{repetitiveMotionAnalysis.classification} (Score: {repetitiveMotionAnalysis.score.toFixed(3)})</strong></div>
            )}
            <div style={{ marginBottom: 8 }}>Session Duration: <strong>{sessionDuration} min</strong></div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#666', lineHeight: '1.4' }}>
              Multi-modal analysis combines facial emotions and hand movements for comprehensive assessment.
            </div>
          </div>
        </div>

        {/* Passive Motion Tracking Section */}
        <div className="passive-tracking-section" style={{ 
          background: '#f8f9fa', 
          padding: 16, 
          borderRadius: 8, 
          marginTop: 20,
          border: '1px solid #e9ecef'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#495057', fontSize: '1.1rem' }}>
            🎯 Passive Behavior Tracking
          </h4>
          
          {/* Hidden video elements for passive tracking */}
          <div style={{ display: 'none' }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ width: 1, height: 1 }}
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              style={{ width: 1, height: 1 }}
            />
          </div>

          {/* Passive tracking status and data */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <div style={{ 
              padding: 8, 
              background: isPassiveTracking ? '#d4edda' : '#f8d7da', 
              borderRadius: 6,
              border: `1px solid ${isPassiveTracking ? '#c3e6cb' : '#f5c6cb'}`
            }}>
              <div style={{ fontSize: 12, color: '#666' }}>Status</div>
              <div style={{ fontWeight: 'bold', color: isPassiveTracking ? '#155724' : '#721c24' }}>
                {isPassiveTracking ? '✅ Active' : '⏳ Initializing...'}
              </div>
            </div>

            <div style={{ 
              padding: 8, 
              background: '#e3f2fd', 
              borderRadius: 6,
              border: '1px solid #bbdefb'
            }}>
              <div style={{ fontSize: 12, color: '#666' }}>Behaviors</div>
              <div style={{ fontWeight: 'bold', color: '#1976d2' }}>
                {detectedBehaviors.length > 0 ? detectedBehaviors.join(', ') : 'None detected'}
              </div>
            </div>

            <div style={{ 
              padding: 8, 
              background: '#f3e5f5', 
              borderRadius: 6,
              border: '1px solid #e1bee7'
            }}>
              <div style={{ fontSize: 12, color: '#666' }}>Posture</div>
              <div style={{ fontWeight: 'bold', color: '#7b1fa2' }}>
                {postureAnalysis.replace('_', ' ')}
              </div>
            </div>

            <div style={{ 
              padding: 8, 
              background: '#e8f5e8', 
              borderRadius: 6,
              border: '1px solid #c8e6c9'
            }}>
              <div style={{ fontSize: 12, color: '#666' }}>Engagement</div>
              <div style={{ fontWeight: 'bold', color: '#388e3c' }}>
                {(engagementScore * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Behavior detection details */}
          {detectedBehaviors.length > 0 && (
            <div style={{ 
              marginTop: 12, 
              padding: 12, 
              background: '#fff3cd', 
              borderRadius: 6,
              border: '1px solid #ffeaa7'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#856404' }}>
                🎯 Detected Behaviors:
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: '#856404' }}>
                {detectedBehaviors.map((behavior, index) => (
                  <li key={index}>{behavior}</li>
                ))}
              </ul>
              <div style={{ 
                marginTop: 8, 
                fontSize: 12, 
                color: '#856404', 
                fontStyle: 'italic' 
              }}>
                These behaviors are being monitored passively during the conversation.
              </div>
            </div>
          )}

          <div style={{ 
            marginTop: 12, 
            fontSize: 12, 
            color: '#6c757d', 
            lineHeight: '1.4',
            fontStyle: 'italic'
          }}>
            💡 Passive tracking monitors body language, posture shifts, and repetitive motions 
            while you answer questions, providing additional behavioral insights.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 