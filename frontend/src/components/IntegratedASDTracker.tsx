import React, { useState, useCallback } from 'react';
import EnhancedEmotionTracker from './EnhancedEmotionTracker';
import { useRepetitiveMotionAnalysis } from '../hooks/useRepetitiveMotionAnalysis';

interface IntegratedASDTrackerProps {
  onSessionComplete?: (sessionData: any) => void;
  width?: number;
  height?: number;
}

const IntegratedASDTracker: React.FC<IntegratedASDTrackerProps> = ({
  onSessionComplete,
  width = 640,
  height = 480,
}) => {
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionData, setSessionData] = useState<any>({
    emotions: [],
    wristData: [],
    repetitiveMotionAnalysis: null,
    startTime: null,
    endTime: null
  });

  // Initialize repetitive motion analysis
  const {
    addWristData,
    analysis: repetitiveAnalysis,
    getMovementStats,
    clearHistory,
    hasData,
    dataCount
  } = useRepetitiveMotionAnalysis(100, 1000);

  // Handle emotion detection
  const handleEmotionDetected = useCallback((emotion: string, confidence: number) => {
    if (!sessionActive) return;

    setSessionData(prev => ({
      ...prev,
      emotions: [...prev.emotions, {
        emotion,
        confidence,
        timestamp: Date.now()
      }]
    }));
  }, [sessionActive]);

  // Handle wrist data detection
  const handleWristDataDetected = useCallback((handData: any) => {
    if (!sessionActive) return;

    // Add to repetitive motion analysis
    addWristData(handData);

    // Store in session data
    setSessionData(prev => ({
      ...prev,
      wristData: [...prev.wristData, handData]
    }));
  }, [sessionActive, addWristData]);

  // Handle repetitive motion analysis
  const handleRepetitiveMotionDetected = useCallback((analysis: any) => {
    if (!sessionActive) return;

    setSessionData(prev => ({
      ...prev,
      repetitiveMotionAnalysis: {
        ...analysis,
        timestamp: Date.now()
      }
    }));
  }, [sessionActive]);

  // Start session
  const startSession = useCallback(() => {
    setSessionActive(true);
    clearHistory();
    setSessionData({
      emotions: [],
      wristData: [],
      repetitiveMotionAnalysis: null,
      startTime: Date.now(),
      endTime: null
    });
  }, [clearHistory]);

  // Stop session
  const stopSession = useCallback(() => {
    setSessionActive(false);
    setSessionData(prev => ({
      ...prev,
      endTime: Date.now()
    }));

    // Prepare final session data
    const finalSessionData = {
      ...sessionData,
      endTime: Date.now(),
      duration: Date.now() - (sessionData.startTime || Date.now()),
      finalRepetitiveAnalysis: repetitiveAnalysis,
      movementStats: getMovementStats(),
      summary: {
        totalEmotions: sessionData.emotions.length,
        totalWristData: sessionData.wristData.length,
        hasRepetitiveMotion: repetitiveAnalysis.isActive,
        repetitiveMotionScore: repetitiveAnalysis.currentScore,
        repetitiveMotionClassification: repetitiveAnalysis.classification
      }
    };

    // Emit to parent component
    if (onSessionComplete) {
      onSessionComplete(finalSessionData);
    }
  }, [sessionData, repetitiveAnalysis, getMovementStats, onSessionComplete]);

  // Get current emotion
  const getCurrentEmotion = () => {
    if (sessionData.emotions.length === 0) return 'No data';
    const latest = sessionData.emotions[sessionData.emotions.length - 1];
    return `${latest.emotion} (${(latest.confidence * 100).toFixed(1)}%)`;
  };

  // Get session duration
  const getSessionDuration = () => {
    if (!sessionData.startTime) return '0s';
    const duration = Date.now() - sessionData.startTime;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      {/* Session Controls */}
      <div style={{ 
        marginBottom: 16, 
        padding: 16, 
        background: '#f8f9fa', 
        borderRadius: 8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0, color: '#333' }}>ASD Screening Session</h3>
          <div style={{ fontSize: 14, color: '#666' }}>
            Status: {sessionActive ? '🟢 Active' : '🔴 Inactive'} | 
            Duration: {getSessionDuration()} | 
            Data Points: {dataCount}
          </div>
        </div>
        
        <div>
          {!sessionActive ? (
            <button
              onClick={startSession}
              style={{
                padding: '12px 24px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 'bold'
              }}
            >
              Start Session
            </button>
          ) : (
            <button
              onClick={stopSession}
              style={{
                padding: '12px 24px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 'bold'
              }}
            >
              Stop Session
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Tracker */}
      <div style={{ marginBottom: 16 }}>
        <EnhancedEmotionTracker
          onEmotionDetected={handleEmotionDetected}
          onWristDataDetected={handleWristDataDetected}
          onRepetitiveMotionDetected={handleRepetitiveMotionDetected}
          width={width}
          height={height}
          enableHandTracking={true}
        />
      </div>

      {/* Real-time Analysis Dashboard */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: 16,
        marginBottom: 16
      }}>
        {/* Emotion Analysis */}
        <div style={{ 
          padding: 16, 
          background: 'white', 
          borderRadius: 8, 
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>🎭 Emotion Analysis</h4>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            Current: {getCurrentEmotion()}
          </div>
          <div style={{ fontSize: 14, color: '#666' }}>
            Total Detections: {sessionData.emotions.length}
          </div>
        </div>

        {/* Repetitive Motion Analysis */}
        <div style={{ 
          padding: 16, 
          background: 'white', 
          borderRadius: 8, 
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>🔄 Repetitive Motion</h4>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            Score: {(repetitiveAnalysis.currentScore * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            Classification: {repetitiveAnalysis.classification}
          </div>
          <div style={{ fontSize: 14, color: '#666' }}>
            Status: {repetitiveAnalysis.isActive ? '✅ Active' : '⏳ Collecting Data'}
          </div>
        </div>

        {/* Hand Tracking Status */}
        <div style={{ 
          padding: 16, 
          background: 'white', 
          borderRadius: 8, 
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>✋ Hand Tracking</h4>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            Data Points: {dataCount}
          </div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            Left Wrist: {repetitiveAnalysis.leftWristData.length > 0 ? '✅' : '❌'}
          </div>
          <div style={{ fontSize: 14, color: '#666' }}>
            Right Wrist: {repetitiveAnalysis.rightWristData.length > 0 ? '✅' : '❌'}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {repetitiveAnalysis.recommendations.length > 0 && (
        <div style={{ 
          padding: 16, 
          background: '#e7f3ff', 
          borderRadius: 8, 
          border: '1px solid #b3d9ff',
          marginBottom: 16
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#0066cc' }}>💡 Recommendations</h4>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#0066cc' }}>
            {repetitiveAnalysis.recommendations.map((rec, index) => (
              <li key={index} style={{ marginBottom: 4 }}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Session Summary */}
      {!sessionActive && sessionData.startTime && (
        <div style={{ 
          padding: 16, 
          background: '#f8f9fa', 
          borderRadius: 8, 
          border: '1px solid #dee2e6'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>📊 Session Summary</h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 12,
            fontSize: 14,
            color: '#666'
          }}>
            <div>Duration: {getSessionDuration()}</div>
            <div>Emotions Detected: {sessionData.emotions.length}</div>
            <div>Wrist Data Points: {sessionData.wristData.length}</div>
            <div>Repetitive Motion: {repetitiveAnalysis.classification}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegratedASDTracker; 