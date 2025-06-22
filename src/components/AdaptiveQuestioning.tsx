import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { websocketService } from '../services/websocket';
import { multimodalService } from '../services/multimodal';
import { adaptiveEngine } from '../services/adaptiveEngine';
import { llmService } from '../services/llmService';
import { QuestionResponse, MultimodalContext, LLMAnalysis } from '../types';
import './AdaptiveQuestioning.css';

interface AdaptiveQuestioningProps {
  onComplete: (summary: any) => void;
}

const AdaptiveQuestioning: React.FC<AdaptiveQuestioningProps> = ({ onComplete }) => {
  const {
    currentSession,
    adaptiveData,
    updateAdaptiveData,
    addQuestionResponse,
    setMultimodalContext,
    setLLMAnalysis,
    setLoading,
    setError
  } = useAppStore();

  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [responseStartTime, setResponseStartTime] = useState<number>(0);
  const [userResponse, setUserResponse] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [maxQuestions] = useState(15);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (currentSession) {
      initializeSession();
    }
  }, [currentSession]);

  useEffect(() => {
    if (currentQuestion) {
      startMultimodalAnalysis();
    }
  }, [currentQuestion]);

  const initializeSession = async () => {
    try {
      setLoading(true);
      
      // Initialize adaptive engine with session data
      if (adaptiveData) {
        adaptiveEngine.setAdaptiveData(adaptiveData);
      }
      
      // Start WebSocket connection
      websocketService.startSession(currentSession!);
      
      // Get first question
      const firstQuestion = adaptiveEngine.getNextQuestion();
      setCurrentQuestion(firstQuestion);
      setQuestionCount(1);
      
      setLoading(false);
    } catch (error) {
      setError('Failed to initialize session');
      setLoading(false);
    }
  };

  const startMultimodalAnalysis = async () => {
    try {
      await multimodalService.startMultimodalAnalysis();
      
      // Set up multimodal data callback
      multimodalService.onMultimodalData((context: MultimodalContext) => {
        setMultimodalContext(context);
        
        // Send to WebSocket for real-time analysis
        websocketService.sendMultimodalData(context);
        
        // Get LLM analysis
        llmService.analyzeMultimodalContext(context).then((analysis: LLMAnalysis) => {
          setLLMAnalysis(analysis);
          
          // Handle adaptive actions
          handleAdaptiveAction(analysis);
        });
      });
    } catch (error) {
      console.error('Failed to start multimodal analysis:', error);
    }
  };

  const handleAdaptiveAction = (analysis: LLMAnalysis) => {
    switch (analysis.nextAction) {
      case 'adjust_difficulty':
        // Adjust difficulty based on analysis
        if (adaptiveData) {
          const newDifficulty = analysis.reasoning.includes('increase') ? 'hard' : 'easy';
          updateAdaptiveData({ currentDifficulty: newDifficulty });
        }
        break;
      case 'repeat':
        // Repeat current question
        break;
      case 'move_to_next':
        // Move to next question
        handleNextQuestion();
        break;
      default:
        // Continue with current flow
        break;
    }
  };

  const startResponse = () => {
    setIsRecording(true);
    setResponseStartTime(Date.now());
    setUserResponse('');
  };

  const stopResponse = () => {
    setIsRecording(false);
    const responseTime = Date.now() - responseStartTime;
    
    // Create question response
    const response: QuestionResponse = {
      questionId: currentQuestion.id,
      question: currentQuestion.text,
      response: userResponse,
      responseTime,
      accuracy: calculateAccuracy(userResponse),
      difficulty: adaptiveData?.currentDifficulty || 'medium',
      adaptiveFactors: {
        voiceTone: adaptiveData?.voiceTone || {
          prosody: { pitch: 0, volume: 0, speechRate: 0, clarity: 0 },
          emotion: 'neutral',
          confidence: 0,
          timestamp: new Date()
        },
        facialExpression: adaptiveData?.facialExpression || {
          expressions: {
            happy: 0, sad: 0, angry: 0, surprised: 0,
            fearful: 0, disgusted: 0, neutral: 1
          },
          dominantEmotion: 'neutral',
          confusion: 0,
          attention: 1,
          timestamp: new Date()
        }
      }
    };

    // Add response to history
    addQuestionResponse(response);
    adaptiveEngine.addQuestionResponse(response);
    
    // Send to WebSocket
    websocketService.sendQuestionResponse(response);
    
    // Move to next question
    setTimeout(() => {
      handleNextQuestion();
    }, 1000);
  };

  const calculateAccuracy = (response: string): number => {
    // Simplified accuracy calculation
    // In a real implementation, this would use NLP or semantic analysis
    const expectedKeywords = currentQuestion.text.toLowerCase().split(' ');
    const responseKeywords = response.toLowerCase().split(' ');
    
    const matches = expectedKeywords.filter(keyword => 
      responseKeywords.some(responseKeyword => 
        responseKeyword.includes(keyword) || keyword.includes(responseKeyword)
      )
    );
    
    return Math.min(1, matches.length / expectedKeywords.length);
  };

  const handleNextQuestion = () => {
    const nextQuestion = adaptiveEngine.getNextQuestion();
    
    if (nextQuestion && questionCount < maxQuestions) {
      setCurrentQuestion(nextQuestion);
      setQuestionCount(questionCount + 1);
      setUserResponse('');
    } else {
      // Session complete
      completeSession();
    }
  };

  const completeSession = () => {
    const summary = adaptiveEngine.getSessionSummary();
    
    // Stop multimodal analysis
    multimodalService.stopMultimodalAnalysis();
    
    // End WebSocket session
    websocketService.endSession(currentSession!);
    
    // Call completion callback
    onComplete(summary);
  };

  const handleVoiceInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserResponse(event.target.value);
  };

  return (
    <div className="adaptive-questioning">
      <div className="question-container">
        {currentQuestion && (
          <div className="question-card">
            <div className="question-header">
              <h2>Question {questionCount} of {maxQuestions}</h2>
              <div className="difficulty-badge">
                {adaptiveData?.currentDifficulty || 'medium'}
              </div>
            </div>
            
            <div className="question-content">
              <h3>{currentQuestion.text}</h3>
              <p className="question-type">{currentQuestion.type} question</p>
            </div>

            <div className="response-section">
              <textarea
                value={userResponse}
                onChange={handleVoiceInput}
                placeholder="Type your response here..."
                className="response-input"
                rows={4}
              />
              
              <div className="response-controls">
                {!isRecording ? (
                  <button
                    onClick={startResponse}
                    className="start-btn"
                    disabled={!userResponse.trim()}
                  >
                    Start Response
                  </button>
                ) : (
                  <button
                    onClick={stopResponse}
                    className="stop-btn"
                  >
                    Stop Response
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="multimodal-feedback">
        <div className="voice-analysis">
          <h4>Voice Analysis</h4>
          <div className="voice-metrics">
            <div className="metric">
              <span>Emotion:</span>
              <span>{adaptiveData?.voiceTone.emotion || 'neutral'}</span>
            </div>
            <div className="metric">
              <span>Confidence:</span>
              <span>{((adaptiveData?.voiceTone.confidence || 0) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="facial-analysis">
          <h4>Facial Analysis</h4>
          <div className="facial-metrics">
            <div className="metric">
              <span>Dominant Emotion:</span>
              <span>{adaptiveData?.facialExpression.dominantEmotion || 'neutral'}</span>
            </div>
            <div className="metric">
              <span>Attention:</span>
              <span>{((adaptiveData?.facialExpression.attention || 0) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="ai-analysis">
          <h4>AI Analysis</h4>
          <div className="ai-metrics">
            <div className="metric">
              <span>Confidence:</span>
              <span>{((adaptiveData?.responseMetrics.confidence || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span>Response Time:</span>
              <span>{Math.round((adaptiveData?.responseMetrics.responseTime || 0) / 1000)}s</span>
            </div>
          </div>
        </div>
      </div>

      <div className="session-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${(questionCount / maxQuestions) * 100}%` }}
          />
        </div>
        <p>Progress: {questionCount} / {maxQuestions}</p>
      </div>
    </div>
  );
};

export default AdaptiveQuestioning; 