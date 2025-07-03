import { useState, useEffect, useCallback } from 'react';
import { repetitiveMotionDetector, SessionAnalysis } from '../services/repetitiveMotionDetector';

interface WristPosition {
  x: number;
  y: number;
  z: number;
  confidence: number;
}

interface HandPoseData {
  leftWrist: WristPosition | null;
  rightWrist: WristPosition | null;
  timestamp: number;
}

interface RepetitiveMotionAnalysis {
  isActive: boolean;
  currentScore: number;
  classification: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  description: string;
  leftWristData: number[];
  rightWristData: number[];
  sessionAnalysis: SessionAnalysis | null;
  recommendations: string[];
}

export const useRepetitiveMotionAnalysis = (
  windowSize: number = 100,
  analysisInterval: number = 1000
) => {
  const [wristDataHistory, setWristDataHistory] = useState<HandPoseData[]>([]);
  const [analysis, setAnalysis] = useState<RepetitiveMotionAnalysis>({
    isActive: false,
    currentScore: 0,
    classification: 'NONE',
    description: 'No data available',
    leftWristData: [],
    rightWristData: [],
    sessionAnalysis: null,
    recommendations: []
  });

  // Add new wrist data to history
  const addWristData = useCallback((handData: HandPoseData) => {
    setWristDataHistory(prev => {
      const newHistory = [...prev, handData];
      // Keep only the last windowSize frames
      return newHistory.slice(-windowSize);
    });
  }, [windowSize]);

  // Analyze repetitive motion
  const analyzeMotion = useCallback(() => {
    if (wristDataHistory.length < 20) return;

    // Extract coordinate data
    const leftWristData = {
      y: wristDataHistory
        .map(data => data.leftWrist?.y)
        .filter(y => y !== null && y !== undefined) as number[],
      z: wristDataHistory
        .map(data => data.leftWrist?.z)
        .filter(z => z !== null && z !== undefined) as number[]
    };

    const rightWristData = {
      y: wristDataHistory
        .map(data => data.rightWrist?.y)
        .filter(y => y !== null && y !== undefined) as number[],
      z: wristDataHistory
        .map(data => data.rightWrist?.z)
        .filter(z => z !== null && z !== undefined) as number[]
    };

    // Perform analysis using the detector
    const sessionAnalysis = repetitiveMotionDetector.analyzeSession({
      leftWrist: leftWristData.y.length > 0 ? leftWristData : undefined,
      rightWrist: rightWristData.y.length > 0 ? rightWristData : undefined
    });

    // Get detection statistics
    const stats = repetitiveMotionDetector.getDetectionStats(sessionAnalysis);

    setAnalysis({
      isActive: true,
      currentScore: sessionAnalysis.sessionSummary?.overallScore || 0,
      classification: sessionAnalysis.sessionSummary?.classification || 'NONE',
      description: sessionAnalysis.sessionSummary?.description || 'No data available',
      leftWristData: leftWristData.y,
      rightWristData: rightWristData.y,
      sessionAnalysis,
      recommendations: stats.recommendations
    });
  }, [wristDataHistory]);

  // Real-time analysis
  const analyzeRealTime = useCallback((coordinates: number[]) => {
    if (coordinates.length < 10) return null;
    
    return repetitiveMotionDetector.analyzeRealTime(coordinates, 50);
  }, []);

  // Periodic analysis
  useEffect(() => {
    if (wristDataHistory.length === 0) return;

    const interval = setInterval(analyzeMotion, analysisInterval);
    return () => clearInterval(interval);
  }, [wristDataHistory, analyzeMotion, analysisInterval]);

  // Get current wrist positions
  const getCurrentWristPositions = useCallback(() => {
    if (wristDataHistory.length === 0) return null;
    
    const latest = wristDataHistory[wristDataHistory.length - 1];
    return {
      leftWrist: latest.leftWrist,
      rightWrist: latest.rightWrist,
      timestamp: latest.timestamp
    };
  }, [wristDataHistory]);

  // Get movement statistics
  const getMovementStats = useCallback(() => {
    if (wristDataHistory.length < 10) return null;

    const leftYCoords = wristDataHistory
      .map(data => data.leftWrist?.y)
      .filter(y => y !== null && y !== undefined) as number[];

    const rightYCoords = wristDataHistory
      .map(data => data.rightWrist?.y)
      .filter(y => y !== null && y !== undefined) as number[];

    const calculateStats = (coords: number[]) => {
      if (coords.length < 2) return null;
      
      const mean = coords.reduce((sum, val) => sum + val, 0) / coords.length;
      const variance = coords.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / coords.length;
      const stdDev = Math.sqrt(variance);
      const range = Math.max(...coords) - Math.min(...coords);
      
      return { mean, variance, stdDev, range, count: coords.length };
    };

    return {
      leftWrist: calculateStats(leftYCoords),
      rightWrist: calculateStats(rightYCoords),
      totalFrames: wristDataHistory.length
    };
  }, [wristDataHistory]);

  // Clear data history
  const clearHistory = useCallback(() => {
    setWristDataHistory([]);
    setAnalysis({
      isActive: false,
      currentScore: 0,
      classification: 'NONE',
      description: 'No data available',
      leftWristData: [],
      rightWristData: [],
      sessionAnalysis: null,
      recommendations: []
    });
  }, []);

  return {
    // Data management
    addWristData,
    clearHistory,
    
    // Analysis results
    analysis,
    
    // Utility functions
    analyzeRealTime,
    getCurrentWristPositions,
    getMovementStats,
    
    // Raw data
    wristDataHistory,
    
    // Status
    hasData: wristDataHistory.length > 0,
    dataCount: wristDataHistory.length
  };
}; 