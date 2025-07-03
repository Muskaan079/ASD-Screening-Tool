import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpeechToText } from '../services/useSpeechToText';
import { getNextQuestion, ConversationEntry, RepetitiveMotionData } from '../services/adaptiveEngine';
import { EmotionLogEntry } from '../services/reportGenerator';
import { ReasoningFactor } from './ReasoningVisualizer';
import FaceEmotionTracker from './FaceEmotionTracker';
import ReasoningVisualizer from './ReasoningVisualizer';
import { useRepetitiveMotionDetector } from '../hooks/useRepetitiveMotionDetector';

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
  const navigate = useNavigate();

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
    
    console.log('Data stored, navigating to report...');
    navigate('/report');
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
      </div>
    </div>
  );
};

export default ChatInterface; 