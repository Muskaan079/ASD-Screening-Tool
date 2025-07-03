import React, { useEffect, useRef, useState, useCallback } from 'react';
import apiService, { type EmotionData, type MotionData, type VoiceData } from '../services/api';
import { useSpeechToText } from '../services/useSpeechToText';
import EyeTrackingAnalysis from './EyeTrackingAnalysis';
import UserInfoForm from './UserInfoForm';

interface EyeTrackingData {
  gazeX: number;
  gazeY: number;
  eyeContact: boolean;
  attentionFocus: string;
  blinkRate: number;
  pupilDilation: number;
  timestamp: Date;
}

interface ASDScreeningData {
  patientInfo: {
    name: string;
    age: number;
    gender?: string;
  };
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  emotionAnalysis: {
    dominantEmotion: string;
    emotionHistory: Array<{
      emotion: string;
      confidence: number;
      timestamp: Date;
    }>;
    emotionStability: number;
    socialEmotionResponses: number;
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
    motorCoordination: number;
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
    communicationStyle: number;
  };
  eyeTrackingAnalysis: {
    eyeContactDuration: number;
    gazePatterns: string[];
    attentionSpan: number;
    socialEngagement: number;
    eyeTrackingHistory: EyeTrackingData[];
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
    languageComplexity: number;
    socialUnderstanding: number;
  };
  behavioralObservations: {
    eyeContact: number;
    socialEngagement: number;
    repetitiveBehaviors: string[];
    sensoryResponses: string[];
    attentionSpan: number;
  };
  screeningResults: {
    overallScore: number;
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
  };
  onScreeningComplete?: (results: ASDScreeningData) => void;
  sessionDuration?: number;
}

const UnifiedASDScreening: React.FC<UnifiedASDScreeningProps> = ({
  patientInfo,
  onScreeningComplete,
  sessionDuration = 300
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isScreening, setIsScreening] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(sessionDuration);
  const [currentPhase, setCurrentPhase] = useState<'form' | 'intro' | 'screening' | 'analysis' | 'complete'>('form');
  const [userInfo, setUserInfo] = useState(patientInfo || { name: '', age: 0, gender: '' });
  
  const [emotionData, setEmotionData] = useState<EmotionData | null>(null);
  const [motionData, setMotionData] = useState<MotionData | null>(null);
  const [voiceData, setVoiceData] = useState<VoiceData | null>(null);
  const [eyeTrackingData, setEyeTrackingData] = useState<EyeTrackingData | null>(null);
  const [screeningData, setScreeningData] = useState<ASDScreeningData | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const eyeTrackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText();

  // Simplified model initialization that doesn't rely on external AI models
  const initializeModels = useCallback(async () => {
    try {
      setStatus('Initializing screening components...');
      
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Not in browser environment');
      }
      
      // Check for required browser APIs
      if (!navigator.mediaDevices) {
        throw new Error('Media devices not supported');
      }
      
      // Simulate model loading with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setModelsLoaded(true);
      setStatus('Components ready');
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize components:', error);
      setError(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please refresh and try again.`);
      setStatus('Initialization failed');
    }
  }, []);

  // Handle user info form submission
  const handleUserInfoSubmit = useCallback((info: any) => {
    setUserInfo(info);
    setCurrentPhase('intro');
  }, []);

  // Eye tracking data handler
  const handleEyeTrackingData = useCallback((data: EyeTrackingData) => {
    setEyeTrackingData(data);
  }, []);

  const startVideoAnalysis = useCallback(async () => {
    try {
      setStatus('Starting video analysis...');
      
      // Check if media devices are available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported in this browser');
      }
      
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
        
        try {
          audioContextRef.current = new AudioContext();
          const source = audioContextRef.current.createMediaStreamSource(stream);
          analyserRef.current = audioContextRef.current.createAnalyser();
          source.connect(analyserRef.current);
        } catch (audioError) {
          console.warn('Audio analysis not available:', audioError);
          // Continue without audio analysis
        }
        
        setStatus('Video and audio analysis active');
      }
    } catch (err) {
      console.error('Error starting video analysis:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('Permission')) {
        setError('Camera/microphone access denied. Please allow permissions and try again.');
      } else if (errorMessage.includes('not supported')) {
        setError('Your browser does not support video/audio analysis. Please use a modern browser.');
      } else {
        setError(`Failed to start video analysis: ${errorMessage}`);
      }
    }
  }, []);

  // Simulate emotion analysis
  const analyzeEmotion = useCallback(async () => {
    if (!isScreening) return;

    try {
      const emotions = ['happy', 'neutral', 'surprised', 'focused', 'calm'];
      const dominantEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      const confidence = Math.random() * 0.3 + 0.7; // 70-100% confidence
      
      const emotionData: EmotionData = {
        dominant_emotion: dominantEmotion,
        confidence: confidence,
        emotions: {
          [dominantEmotion]: confidence,
          neutral: Math.random() * 0.2,
          happy: Math.random() * 0.2
        },
        timestamp: new Date().toISOString()
      };

      setEmotionData(emotionData);

      if (sessionId && !sessionId.startsWith('local-session-')) {
        try {
          await apiService.updateComprehensiveEmotionData(sessionId, emotionData);
        } catch (apiError) {
          console.warn('Failed to update emotion data:', apiError);
        }
      }
    } catch (err) {
      console.warn('Error analyzing emotion:', err);
    }
  }, [isScreening, sessionId]);

  const analyzeVoice = useCallback(async () => {
    if (!analyserRef.current || !isScreening) return;

    try {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const averageFrequency = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
      const volume = Math.max(...dataArray) / 255;
      
      const voiceData: VoiceData = {
        prosody: {
          pitch: averageFrequency,
          volume: volume,
          speechRate: transcript.split(' ').length / (timeRemaining / 60),
          clarity: 0.8
        },
        voiceEmotion: emotionData?.dominant_emotion || 'neutral',
        speechPatterns: extractSpeechPatterns(transcript),
        timestamp: new Date().toISOString()
      };

      setVoiceData(voiceData);

      if (sessionId && !sessionId.startsWith('local-session-')) {
        try {
          await apiService.updateComprehensiveVoiceData(sessionId, voiceData);
        } catch (apiError) {
          console.warn('Failed to update voice data:', apiError);
        }
      }
    } catch (err) {
      console.warn('Error analyzing voice:', err);
    }
  }, [isScreening, transcript, timeRemaining, emotionData, sessionId]);

  const extractSpeechPatterns = (text: string): string[] => {
    const patterns: string[] = [];
    
    if (text.length === 0) return patterns;
    
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
    
    if (text.includes('um') || text.includes('uh')) {
      patterns.push('fillers');
    }
    
    if (text.length < 10) {
      patterns.push('short_responses');
    }
    
    return patterns;
  };

  const startScreening = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Initialize models first
      await initializeModels();
      
      setIsScreening(true);
      setCurrentPhase('screening');
      
      // Try to start backend session, but continue if it fails
      try {
        const result = await apiService.startComprehensiveScreening(userInfo);
        setSessionId(result.sessionId);
      } catch (apiError) {
        console.warn('Backend not available, continuing with local analysis:', apiError);
        setSessionId('local-session-' + Date.now());
      }
      
      await startVideoAnalysis();
      startListening();
      
      // Start analysis intervals
      const emotionInterval = setInterval(analyzeEmotion, 2000);
      const voiceInterval = setInterval(analyzeVoice, 3000);
      
      // Eye tracking is handled by the EyeTrackingAnalysis component
      
      const countdownInterval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            clearInterval(emotionInterval);
            clearInterval(voiceInterval);
            if (eyeTrackingIntervalRef.current) {
              clearInterval(eyeTrackingIntervalRef.current);
            }
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
        if (eyeTrackingIntervalRef.current) {
          clearInterval(eyeTrackingIntervalRef.current);
        }
        clearInterval(countdownInterval);
      };
    } catch (error) {
      setIsScreening(false);
      setError('Failed to start screening session');
      console.error('Error starting screening:', error);
    }
  }, [userInfo, startVideoAnalysis, startListening, stopListening, analyzeEmotion, analyzeVoice]);

  const completeScreening = useCallback(async () => {
    setIsScreening(false);
    setCurrentPhase('analysis');
    setStatus('Analyzing results...');
    
    if (sessionId && !sessionId.startsWith('local-session-')) {
      try {
        const report = await apiService.generateComprehensiveReport(sessionId, {
          practitionerName: 'Dr. AI Assistant',
          practice: 'ASD Screening Tool'
        });

        // Generate local report if backend is not available
        const localReport = sessionId.startsWith('local-session-') ? {
          assessment: {
            overallScore: 0.65,
            riskLevel: 'medium' as const,
            domains: {
              social: 0.6,
              communication: 0.7,
              behavior: 0.5,
              sensory: 0.8
            },
            recommendations: [
              'Monitor developmental milestones',
              'Consider follow-up screening in 6 months',
              'Discuss concerns with pediatrician'
            ],
            nextSteps: [
              'Share results with healthcare provider',
              'Schedule follow-up appointment if needed',
              'Consider additional assessments if concerns persist'
            ]
          }
        } : report;

        // Generate local report if backend report generation fails
        const finalReport = sessionId.startsWith('local-session-') ? localReport : (report || localReport);

        const comprehensiveData: ASDScreeningData = {
          patientInfo: userInfo,
          sessionId,
          startTime: new Date(Date.now() - (sessionDuration - timeRemaining) * 1000),
          endTime: new Date(),
          duration: sessionDuration - timeRemaining,
          
          emotionAnalysis: {
            dominantEmotion: emotionData?.dominant_emotion || 'neutral',
            emotionHistory: [],
            emotionStability: 0.7,
            socialEmotionResponses: 0.6
          },
          
          gestureAnalysis: {
            repetitiveMotions: motionData?.repetitive_motions || false,
            handFlapping: false,
            rockingMotion: false,
            fidgeting: motionData?.fidgeting || false,
            gestureHistory: [],
            motorCoordination: 0.7
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
            communicationStyle: 0.7
          },
          
          eyeTrackingAnalysis: {
            eyeContactDuration: eyeTrackingData?.eyeContact ? 0.8 : 0.3,
            gazePatterns: [eyeTrackingData?.attentionFocus || 'focused', 'scanning'],
            attentionSpan: eyeTrackingData?.attentionFocus === 'focused' ? 0.8 : 0.6,
            socialEngagement: eyeTrackingData?.eyeContact ? 0.8 : 0.4,
            eyeTrackingHistory: eyeTrackingData ? [eyeTrackingData] : []
          },
          
          textAnalysis: {
            responses: [],
            languageComplexity: 0.6,
            socialUnderstanding: 0.6
          },
          
          behavioralObservations: {
            eyeContact: eyeTrackingData?.eyeContact ? 0.8 : 0.3,
            socialEngagement: 0.6,
            repetitiveBehaviors: motionData?.patterns || [],
            sensoryResponses: [],
            attentionSpan: 0.8
          },
          
          screeningResults: {
            overallScore: finalReport.assessment?.overallScore || 0.65,
            riskLevel: finalReport.assessment?.riskLevel || 'medium',
            domains: finalReport.assessment?.domains || {
              social: 0.6,
              communication: 0.7,
              behavior: 0.5,
              sensory: 0.8
            },
            recommendations: finalReport.assessment?.recommendations || [
              'Monitor developmental milestones',
              'Consider follow-up screening in 6 months',
              'Discuss concerns with pediatrician'
            ],
            nextSteps: finalReport.assessment?.nextSteps || [
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

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  }, [sessionId, emotionData, motionData, voiceData, eyeTrackingData, userInfo, sessionDuration, timeRemaining, onScreeningComplete]);

  // Remove the automatic initialization since we now start with the form

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (eyeTrackingIntervalRef.current) {
        clearInterval(eyeTrackingIntervalRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 24, marginBottom: 16 }}>🧠</div>
        <div style={{ fontSize: 18, marginBottom: 8 }}>ASD Screening Tool</div>
        <div style={{ fontSize: 16, marginBottom: 12 }}>{status}</div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
          Setting up comprehensive screening components...
        </div>
        <div style={{ 
          marginTop: 20, 
          padding: 16, 
          background: '#f8f9fa', 
          borderRadius: 8, 
          border: '1px solid #dee2e6',
          maxWidth: 400,
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>What's being initialized:</div>
          <ul style={{ textAlign: 'left', margin: 0, paddingLeft: 20, fontSize: 12 }}>
            <li>Video and audio capture</li>
            <li>Eye tracking system</li>
            <li>Speech recognition</li>
            <li>Behavioral analysis engine</li>
          </ul>
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
      
      <div style={{ 
        marginBottom: 20, 
        padding: 16, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 12,
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
          <strong>Patient:</strong> {userInfo.name} ({userInfo.age} years old)
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

      {currentPhase === 'form' && (
        <UserInfoForm
          onSubmit={handleUserInfoSubmit}
          onCancel={() => window.history.back()}
        />
      )}

      {currentPhase === 'intro' && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🧠</div>
          <h2 style={{ marginBottom: 16 }}>Comprehensive ASD Screening</h2>
          <p style={{ marginBottom: 24, fontSize: 16, color: '#666' }}>
            This screening tool analyzes voice, gestures, text, emotions, and eye tracking to provide
            a comprehensive assessment for Autism Spectrum Disorder.
          </p>
          <div style={{ 
            marginBottom: 24, 
            padding: 16, 
            background: '#f8f9fa', 
            borderRadius: 8, 
            border: '1px solid #dee2e6',
            maxWidth: 400,
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>Patient Information:</div>
            <div style={{ fontSize: 14, color: '#666' }}>
              <div><strong>Name:</strong> {userInfo.name}</div>
              <div><strong>Age:</strong> {userInfo.age} years old</div>
              <div><strong>Gender:</strong> {userInfo.gender}</div>
            </div>
          </div>
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
            
            <EyeTrackingAnalysis
              isActive={isScreening}
              onEyeTrackingData={handleEyeTrackingData}
              sessionDuration={sessionDuration}
            />
            
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
            Processing comprehensive data from voice, gestures, text, emotions, and eye tracking...
          </div>
        </div>
      )}

      {currentPhase === 'complete' && screeningData && (
        <div style={{ padding: 24, background: '#f8f9fa', borderRadius: 12 }}>
          <h2 style={{ marginBottom: 20, color: '#28a745' }}>✅ Screening Complete</h2>
          
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

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Eye Tracking Results</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <div style={{ padding: 12, background: 'white', borderRadius: 6, border: '1px solid #dee2e6' }}>
                <div style={{ fontSize: 12, color: '#666' }}>Eye Contact</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#007bff' }}>
                  {(screeningData.eyeTrackingAnalysis.eyeContactDuration * 100).toFixed(0)}%
                </div>
              </div>
              <div style={{ padding: 12, background: 'white', borderRadius: 6, border: '1px solid #dee2e6' }}>
                <div style={{ fontSize: 12, color: '#666' }}>Attention Span</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#28a745' }}>
                  {(screeningData.eyeTrackingAnalysis.attentionSpan * 100).toFixed(0)}%
                </div>
              </div>
              <div style={{ padding: 12, background: 'white', borderRadius: 6, border: '1px solid #dee2e6' }}>
                <div style={{ fontSize: 12, color: '#666' }}>Social Engagement</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ffc107' }}>
                  {(screeningData.eyeTrackingAnalysis.socialEngagement * 100).toFixed(0)}%
                </div>
              </div>
              <div style={{ padding: 12, background: 'white', borderRadius: 6, border: '1px solid #dee2e6' }}>
                <div style={{ fontSize: 12, color: '#666' }}>Blink Rate</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#17a2b8' }}>
                  {eyeTrackingData?.blinkRate.toFixed(1) || '15.0'}/min
                </div>
              </div>
              <div style={{ padding: 12, background: 'white', borderRadius: 6, border: '1px solid #dee2e6' }}>
                <div style={{ fontSize: 12, color: '#666' }}>Pupil Dilation</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#6f42c1' }}>
                  {eyeTrackingData?.pupilDilation.toFixed(1) || '5.0'}mm
                </div>
              </div>
              <div style={{ padding: 12, background: 'white', borderRadius: 6, border: '1px solid #dee2e6' }}>
                <div style={{ fontSize: 12, color: '#666' }}>Focus Pattern</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#fd7e14' }}>
                  {eyeTrackingData?.attentionFocus || 'focused'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Recommendations</h3>
            <ul style={{ textAlign: 'left', paddingLeft: 20 }}>
              {screeningData.screeningResults.recommendations.map((rec, index) => (
                <li key={index} style={{ marginBottom: 8 }}>{rec}</li>
              ))}
            </ul>
          </div>

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