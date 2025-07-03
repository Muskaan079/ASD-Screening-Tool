import React, { useEffect, useRef, useState, useCallback } from 'react';

interface EyeTrackingData {
  gazeX: number;
  gazeY: number;
  eyeContact: boolean;
  attentionFocus: string;
  blinkRate: number;
  pupilDilation: number;
  timestamp: Date;
}

interface EyeTrackingAnalysisProps {
  isActive: boolean;
  onEyeTrackingData?: (data: EyeTrackingData) => void;
  sessionDuration?: number;
}

const EyeTrackingAnalysis: React.FC<EyeTrackingAnalysisProps> = ({
  isActive,
  onEyeTrackingData,
  sessionDuration = 300
}) => {
  const [eyeTrackingData, setEyeTrackingData] = useState<EyeTrackingData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Initializing eye tracking...');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate eye tracking data
  const simulateEyeTracking = useCallback(() => {
    if (!isActive) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Simulate realistic gaze patterns
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    const gazeRadius = Math.min(screenWidth, screenHeight) * 0.3;
    
    // Add some natural movement around the center
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * gazeRadius;
    const gazeX = centerX + Math.cos(angle) * distance;
    const gazeY = centerY + Math.sin(angle) * distance;
    
    // Simulate eye contact (70% chance when looking at screen center)
    const distanceFromCenter = Math.sqrt((gazeX - centerX) ** 2 + (gazeY - centerY) ** 2);
    const eyeContact = distanceFromCenter < gazeRadius * 0.5 && Math.random() > 0.3;
    
    // Simulate attention focus
    const attentionFocus = distanceFromCenter < gazeRadius * 0.3 ? 'focused' : 
                          distanceFromCenter < gazeRadius * 0.7 ? 'scanning' : 'away';
    
    // Simulate blink rate (normal: 15-20 blinks per minute)
    const blinkRate = 15 + Math.random() * 5;
    
    // Simulate pupil dilation (normal: 2-8mm)
    const pupilDilation = 2 + Math.random() * 6;
    
    const data: EyeTrackingData = {
      gazeX,
      gazeY,
      eyeContact,
      attentionFocus,
      blinkRate,
      pupilDilation,
      timestamp: new Date()
    };

    setEyeTrackingData(data);
    
    if (onEyeTrackingData) {
      onEyeTrackingData(data);
    }
  }, [isActive, onEyeTrackingData]);

  // Initialize eye tracking
  const initializeEyeTracking = useCallback(async () => {
    try {
      setStatus('Initializing eye tracking system...');
      
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
        setStatus('Eye tracking active');
        setIsInitialized(true);
      }
    } catch (err) {
      console.error('Failed to initialize eye tracking:', err);
      setError('Failed to access camera for eye tracking');
      setStatus('Eye tracking initialization failed');
    }
  }, []);

  // Start tracking when active
  useEffect(() => {
    if (isActive && isInitialized) {
      // Start eye tracking simulation
      trackingIntervalRef.current = setInterval(simulateEyeTracking, 100); // 10 FPS
      
      // Simulate blink detection
      blinkIntervalRef.current = setInterval(() => {
        if (eyeTrackingData) {
          const newData = { ...eyeTrackingData };
          newData.blinkRate = 15 + Math.random() * 5;
          setEyeTrackingData(newData);
        }
      }, 2000); // Update blink rate every 2 seconds
      
      setStatus('Eye tracking in progress...');
    } else if (!isActive) {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
      if (blinkIntervalRef.current) {
        clearInterval(blinkIntervalRef.current);
        blinkIntervalRef.current = null;
      }
      setStatus('Eye tracking paused');
    }
  }, [isActive, isInitialized, simulateEyeTracking, eyeTrackingData]);

  // Initialize on mount
  useEffect(() => {
    initializeEyeTracking();
  }, [initializeEyeTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      if (blinkIntervalRef.current) {
        clearInterval(blinkIntervalRef.current);
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
        <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Eye Tracking Error</div>
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
        
        {/* Gaze indicator */}
        {eyeTrackingData && (
          <div
            style={{
              position: 'absolute',
              left: `${(eyeTrackingData.gazeX / window.innerWidth) * 100}%`,
              top: `${(eyeTrackingData.gazeY / window.innerHeight) * 100}%`,
              width: 20,
              height: 20,
              background: eyeTrackingData.eyeContact ? '#28a745' : '#ffc107',
              borderRadius: '50%',
              border: '2px solid white',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: '0 0 10px rgba(0,0,0,0.5)'
            }}
          />
        )}
      </div>

      {/* Eye Tracking Data */}
      <div style={{ padding: 16, background: '#e3f2fd', borderRadius: 8, border: '1px solid #bbdefb' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>👁️ Eye Tracking Analysis</h4>
        
        {eyeTrackingData ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: '#666' }}>Eye Contact</div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: eyeTrackingData.eyeContact ? '#28a745' : '#dc3545' }}>
                {eyeTrackingData.eyeContact ? '✅ Yes' : '❌ No'}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: 12, color: '#666' }}>Attention Focus</div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1976d2' }}>
                {eyeTrackingData.attentionFocus}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: 12, color: '#666' }}>Blink Rate</div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#ffc107' }}>
                {eyeTrackingData.blinkRate.toFixed(1)}/min
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: 12, color: '#666' }}>Pupil Dilation</div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#17a2b8' }}>
                {eyeTrackingData.pupilDilation.toFixed(1)}mm
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: '#666', fontStyle: 'italic' }}>Initializing eye tracking...</div>
        )}
        
        <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
          Status: {status}
        </div>
      </div>
    </div>
  );
};

export default EyeTrackingAnalysis; 