import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MedicalReport from '../components/MedicalReport';

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
    eyeTrackingHistory: any[];
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

const Report: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<ASDScreeningData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get report data from URL params or localStorage
    const sessionId = searchParams.get('sessionId');
    
    if (sessionId) {
      // Try to get data from localStorage
      const storedData = localStorage.getItem(`screening_${sessionId}`);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Convert date strings back to Date objects
        parsedData.startTime = new Date(parsedData.startTime);
        if (parsedData.endTime) {
          parsedData.endTime = new Date(parsedData.endTime);
        }
        // Convert emotion history timestamps
        if (parsedData.emotionAnalysis?.emotionHistory) {
          parsedData.emotionAnalysis.emotionHistory = parsedData.emotionAnalysis.emotionHistory.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          }));
        }
        // Convert gesture history timestamps
        if (parsedData.gestureAnalysis?.gestureHistory) {
          parsedData.gestureAnalysis.gestureHistory = parsedData.gestureAnalysis.gestureHistory.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          }));
        }
        // Convert voice history timestamps
        if (parsedData.voiceAnalysis?.voiceHistory) {
          parsedData.voiceAnalysis.voiceHistory = parsedData.voiceAnalysis.voiceHistory.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          }));
        }
        // Convert eye tracking history timestamps
        if (parsedData.eyeTrackingAnalysis?.eyeTrackingHistory) {
          parsedData.eyeTrackingAnalysis.eyeTrackingHistory = parsedData.eyeTrackingAnalysis.eyeTrackingHistory.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          }));
        }
        setReportData(parsedData);
      } else {
        // If no data found, redirect back to screening
        navigate('/screening');
        return;
      }
    } else {
      // Use test data if no session ID (for demo purposes)
      const testData: ASDScreeningData = {
        patientInfo: { name: 'Test Patient', age: 8, gender: 'Male' },
        sessionId: 'test-session-123',
        startTime: new Date(),
        endTime: new Date(),
        duration: 300,
        emotionAnalysis: {
          dominantEmotion: 'neutral',
          emotionHistory: [
            { emotion: 'happy', confidence: 0.7, timestamp: new Date() },
            { emotion: 'neutral', confidence: 0.8, timestamp: new Date() },
            { emotion: 'sad', confidence: 0.3, timestamp: new Date() }
          ],
          emotionStability: 0.7,
          socialEmotionResponses: 0.6
        },
        gestureAnalysis: {
          repetitiveMotions: false,
          handFlapping: false,
          rockingMotion: false,
          fidgeting: true,
          gestureHistory: [
            { type: 'normal_movement', confidence: 0.8, timestamp: new Date() },
            { type: 'fidgeting', confidence: 0.6, timestamp: new Date() }
          ],
          motorCoordination: 0.8
        },
        voiceAnalysis: {
          prosody: { pitch: 0.6, volume: 0.7, speechRate: 0.5, clarity: 0.8 },
          voiceEmotion: 'neutral',
          speechPatterns: ['clear', 'typical'],
          voiceHistory: [
            { text: 'Voice sample analyzed', emotion: 'neutral', confidence: 0.7, timestamp: new Date() }
          ],
          communicationStyle: 0.7
        },
        eyeTrackingAnalysis: {
          eyeContactDuration: 0.6,
          gazePatterns: ['focused', 'responsive'],
          attentionSpan: 0.7,
          socialEngagement: 0.6,
          eyeTrackingHistory: []
        },
        textAnalysis: {
          responses: [],
          languageComplexity: 0.7,
          socialUnderstanding: 0.6
        },
        behavioralObservations: {
          eyeContact: 0.6,
          socialEngagement: 0.6,
          repetitiveBehaviors: [],
          sensoryResponses: [],
          attentionSpan: 0.7
        },
        screeningResults: {
          overallScore: 0.65,
          riskLevel: 'medium',
          domains: {
            social: 0.6,
            communication: 0.7,
            behavior: 0.8,
            sensory: 0.7
          },
          recommendations: [
            'Continue monitoring developmental progress',
            'Consider follow-up screening in 3-6 months',
            'Provide developmental support as needed'
          ],
          nextSteps: [
            'Schedule follow-up assessment in 3-6 months',
            'Monitor for any changes in behavior or development',
            'Consider early intervention if concerns persist'
          ]
        }
      };
      setReportData(testData);
    }
    setLoading(false);
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 24, marginBottom: 8 }}>Loading Medical Report</div>
          <div style={{ fontSize: 16, color: '#666' }}>Preparing comprehensive analysis...</div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <div style={{ fontSize: 24, marginBottom: 8 }}>Report Not Found</div>
          <div style={{ fontSize: 16, color: '#666', marginBottom: 24 }}>
            No screening data found for this session.
          </div>
          <button
            onClick={() => navigate('/screening')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              cursor: 'pointer'
            }}
          >
            Start New Screening
          </button>
        </div>
      </div>
    );
  }

  return (
    <MedicalReport 
      screeningData={reportData} 
      onClose={() => navigate('/screening')}
    />
  );
};

export default Report; 