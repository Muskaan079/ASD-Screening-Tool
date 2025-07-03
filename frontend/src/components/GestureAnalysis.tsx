import React, { useEffect, useRef, useState, useCallback } from 'react';

interface GestureData {
  repetitiveMotions: boolean;
  handFlapping: boolean;
  rockingMotion: boolean;
  fidgeting: boolean;
  stimming: boolean;
  unusualPostures: boolean;
  patterns: string[];
  confidence: number;
  timestamp: Date;
}

interface GestureAnalysisProps {
  isActive: boolean;
  onGestureData?: (data: GestureData) => void;
  sessionDuration?: number;
}

const GestureAnalysis: React.FC<GestureAnalysisProps> = ({
  isActive,
  onGestureData,
  sessionDuration = 300
}) => {
  const [gestureData, setGestureData] = useState<GestureData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Initializing gesture analysis...');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const gestureHistoryRef = useRef<Array<{x: number, y: number, timestamp: number}>>([]);

  // Simulate gesture detection with realistic ASD-related patterns
  const analyzeGestures = useCallback(() => {
    if (!isActive) return;

    const now = Date.now();
    const history = gestureHistoryRef.current;
    
    // Simulate hand positions and movements
    const handX = Math.random() * window.innerWidth;
    const handY = Math.random() * window.innerHeight;
    
    // Add current position to history
    history.push({ x: handX, y: handY, timestamp: now });
    
    // Keep only last 30 seconds of data
    const thirtySecondsAgo = now - 30000;
    gestureHistoryRef.current = history.filter(h => h.timestamp > thirtySecondsAgo);
    
    // Analyze for repetitive patterns
    const recentMovements = history.slice(-20);
    const repetitiveMotions = detectRepetitiveMotions(recentMovements);
    const handFlapping = detectHandFlapping(recentMovements);
    const rockingMotion = detectRockingMotion(recentMovements);
    const fidgeting = detectFidgeting(recentMovements);
    const stimming = detectStimming(recentMovements);
    const unusualPostures = detectUnusualPostures(recentMovements);
    
    // Calculate confidence based on pattern consistency
    const confidence = calculateConfidence(recentMovements);
    
    // Generate patterns list
    const patterns: string[] = [];
    if (repetitiveMotions) patterns.push('repetitive_motions');
    if (handFlapping) patterns.push('hand_flapping');
    if (rockingMotion) patterns.push('rocking_motion');
    if (fidgeting) patterns.push('fidgeting');
    if (stimming) patterns.push('stimming');
    if (unusualPostures) patterns.push('unusual_postures');
    
    const data: GestureData = {
      repetitiveMotions,
      handFlapping,
      rockingMotion,
      fidgeting,
      stimming,
      unusualPostures,
      patterns,
      confidence,
      timestamp: new Date()
    };

    setGestureData(data);
    
    if (onGestureData) {
      onGestureData(data);
    }
  }, [isActive, onGestureData]);

  // Detect repetitive horizontal movements (common in ASD)
  const detectRepetitiveMotions = (movements: Array<{x: number, y: number, timestamp: number}>): boolean => {
    if (movements.length < 10) return false;
    
    const horizontalMovements = movements.filter((_, i) => {
      if (i === 0) return false;
      const prev = movements[i - 1];
      const curr = movements[i];
      return Math.abs(curr.x - prev.x) > 20;
    });
    
    return horizontalMovements.length >= movements.length * 0.6;
  };

  // Detect hand flapping (rapid up-down movements)
  const detectHandFlapping = (movements: Array<{x: number, y: number, timestamp: number}>): boolean => {
    if (movements.length < 8) return false;
    
    const verticalMovements = movements.filter((_, i) => {
      if (i === 0) return false;
      const prev = movements[i - 1];
      const curr = movements[i];
      return Math.abs(curr.y - prev.y) > 30;
    });
    
    return verticalMovements.length >= movements.length * 0.5;
  };

  // Detect rocking motion (forward-backward movement)
  const detectRockingMotion = (movements: Array<{x: number, y: number, timestamp: number}>): boolean => {
    if (movements.length < 12) return false;
    
    // Simulate rocking by detecting rhythmic patterns
    const timeIntervals = movements.slice(1).map((curr, i) => {
      const prev = movements[i];
      return curr.timestamp - prev.timestamp;
    });
    
    // Check for consistent timing (rocking rhythm)
    const avgInterval = timeIntervals.reduce((sum, interval) => sum + interval, 0) / timeIntervals.length;
    const consistentIntervals = timeIntervals.filter(interval => 
      Math.abs(interval - avgInterval) < avgInterval * 0.3
    );
    
    return consistentIntervals.length >= timeIntervals.length * 0.7;
  };

  // Detect fidgeting (small, frequent movements)
  const detectFidgeting = (movements: Array<{x: number, y: number, timestamp: number}>): boolean => {
    if (movements.length < 15) return false;
    
    const smallMovements = movements.filter((_, i) => {
      if (i === 0) return false;
      const prev = movements[i - 1];
      const curr = movements[i];
      const distance = Math.sqrt((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2);
      return distance > 5 && distance < 50;
    });
    
    return smallMovements.length >= movements.length * 0.6;
  };

  // Detect stimming behaviors (self-stimulatory behaviors)
  const detectStimming = (movements: Array<{x: number, y: number, timestamp: number}>): boolean => {
    if (movements.length < 10) return false;
    
    // Check for repetitive circular or rhythmic patterns
    const circularMovements = movements.filter((_, i) => {
      if (i < 3) return false;
      const prev3 = movements[i - 3];
      const prev2 = movements[i - 2];
      const prev1 = movements[i - 1];
      const curr = movements[i];
      
      // Check if movement forms a circular pattern
      const centerX = (prev3.x + prev2.x + prev1.x + curr.x) / 4;
      const centerY = (prev3.y + prev2.y + prev1.y + curr.y) / 4;
      
      const distances = [prev3, prev2, prev1, curr].map(pos => 
        Math.sqrt((pos.x - centerX) ** 2 + (pos.y - centerY) ** 2)
      );
      
      const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
      const consistentDistance = distances.every(d => Math.abs(d - avgDistance) < avgDistance * 0.5);
      
      return consistentDistance;
    });
    
    return circularMovements.length >= movements.length * 0.4;
  };

  // Detect unusual postures
  const detectUnusualPostures = (movements: Array<{x: number, y: number, timestamp: number}>): boolean => {
    if (movements.length < 5) return false;
    
    // Check for extended periods in unusual positions
    const unusualPositions = movements.filter(pos => {
      // Check if position is in unusual areas (corners, edges)
      const isNearEdge = pos.x < 50 || pos.x > window.innerWidth - 50 || 
                        pos.y < 50 || pos.y > window.innerHeight - 50;
      
      // Check for asymmetric positioning
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const distanceFromCenter = Math.sqrt((pos.x - centerX) ** 2 + (pos.y - centerY) ** 2);
      
      return isNearEdge || distanceFromCenter > Math.min(window.innerWidth, window.innerHeight) * 0.4;
    });
    
    return unusualPositions.length >= movements.length * 0.3;
  };

  // Calculate confidence based on pattern consistency
  const calculateConfidence = (movements: Array<{x: number, y: number, timestamp: number}>): number => {
    if (movements.length < 5) return 0.3;
    
    // Higher confidence for more consistent patterns
    const timeIntervals = movements.slice(1).map((curr, i) => {
      const prev = movements[i];
      return curr.timestamp - prev.timestamp;
    });
    
    const avgInterval = timeIntervals.reduce((sum, interval) => sum + interval, 0) / timeIntervals.length;
    const consistentIntervals = timeIntervals.filter(interval => 
      Math.abs(interval - avgInterval) < avgInterval * 0.5
    );
    
    return Math.min(0.3 + (consistentIntervals.length / timeIntervals.length) * 0.7, 1.0);
  };

  // Initialize gesture analysis
  const initializeGestureAnalysis = useCallback(async () => {
    try {
      setStatus('Initializing gesture analysis system...');
      
      // Request camera access for video feed
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus('Gesture analysis active');
        setIsInitialized(true);
      }
    } catch (err) {
      console.error('Failed to initialize gesture analysis:', err);
      setError('Failed to access camera for gesture analysis');
      setStatus('Gesture analysis initialization failed');
    }
  }, []);

  // Start analysis when active
  useEffect(() => {
    if (isActive && isInitialized) {
      // Start gesture analysis simulation
      analysisIntervalRef.current = setInterval(analyzeGestures, 1000); // 1 FPS for gesture analysis
      setStatus('Gesture analysis in progress...');
    } else if (!isActive) {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      setStatus('Gesture analysis paused');
    }
  }, [isActive, isInitialized, analyzeGestures]);

  // Initialize on mount
  useEffect(() => {
    initializeGestureAnalysis();
  }, [initializeGestureAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (error) {
    return (
      <div style={{ 
        padding: 16, 
        background: '#f8d7da', 
        borderRadius: 8, 
        border: '1px solid #f5c6cb',
        color: '#721c24'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Gesture Analysis Error</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Video Feed */}
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            minHeight: '200px',
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
      </div>

      {/* Gesture Analysis Data */}
      <div style={{ padding: 16, background: '#f3e5f5', borderRadius: 8, border: '1px solid #e1bee7' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#7b1fa2' }}>🤲 Gesture Analysis</h4>
        {gestureData ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Repetitive Motions</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: gestureData.repetitiveMotions ? '#dc3545' : '#28a745' }}>
                  {gestureData.repetitiveMotions ? '✅ Detected' : '❌ None'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Hand Flapping</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: gestureData.handFlapping ? '#dc3545' : '#28a745' }}>
                  {gestureData.handFlapping ? '✅ Detected' : '❌ None'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Rocking Motion</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: gestureData.rockingMotion ? '#dc3545' : '#28a745' }}>
                  {gestureData.rockingMotion ? '✅ Detected' : '❌ None'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Fidgeting</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: gestureData.fidgeting ? '#ffc107' : '#28a745' }}>
                  {gestureData.fidgeting ? '⚠️ Detected' : '❌ None'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Stimming</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: gestureData.stimming ? '#dc3545' : '#28a745' }}>
                  {gestureData.stimming ? '✅ Detected' : '❌ None'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Confidence</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#17a2b8' }}>
                  {(gestureData.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            {gestureData.patterns && gestureData.patterns.length > 0 ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Detected Patterns:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {gestureData.patterns.map((pattern: string, index: number) => (
                    <span
                      key={index}
                      style={{
                        padding: '2px 8px',
                        background: '#e1bee7',
                        borderRadius: 12,
                        fontSize: 11,
                        color: '#7b1fa2'
                      }}
                    >
                      {pattern.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div style={{ color: '#666', fontStyle: 'italic' }}>Initializing gesture analysis...</div>
        )}
        <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
          Status: {status}
        </div>
      </div>
    </div>
  );
};

export default GestureAnalysis; 