import { useState, useEffect, useCallback, useRef } from 'react';

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
  score: number;
  classification: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  description: string;
  leftWristData: number[];
  rightWristData: number[];
  dominantFrequencies: number[];
  recommendations: string[];
}

interface UseRepetitiveMotionDetectorOptions {
  windowSize?: number;
  analysisInterval?: number;
  frameRate?: number;
  handFlappingRange?: [number, number];
  generalRepetitiveRange?: [number, number];
}

export const useRepetitiveMotionDetector = (options: UseRepetitiveMotionDetectorOptions = {}) => {
  const {
    windowSize = 100,
    analysisInterval = 1000,
    frameRate = 25.1,
    handFlappingRange = [1.5, 3.5],
    generalRepetitiveRange = [0.5, 5.0]
  } = options;

  const [wristDataHistory, setWristDataHistory] = useState<HandPoseData[]>([]);
  const [analysis, setAnalysis] = useState<RepetitiveMotionAnalysis>({
    score: 0,
    classification: 'NONE',
    description: 'No data available',
    leftWristData: [],
    rightWristData: [],
    dominantFrequencies: [],
    recommendations: []
  });

  const analysisRef = useRef<RepetitiveMotionAnalysis>(analysis);

  // FFT implementation
  const fft = useCallback((data: number[]): number[] => {
    const n = data.length;
    if (n <= 1) return data;

    // Pad with zeros if needed to make length power of 2
    let paddedData = [...data];
    if ((n & (n - 1)) !== 0) {
      let nextPower = 1;
      while (nextPower < n) nextPower <<= 1;
      paddedData = data.concat(new Array(nextPower - n).fill(0));
    }

    return fftRecursive(paddedData);
  }, []);

  const fftRecursive = useCallback((data: number[]): number[] => {
    const n = data.length;
    if (n === 1) return data;

    // Split into even and odd indices
    const even = data.filter((_, i) => i % 2 === 0);
    const odd = data.filter((_, i) => i % 2 === 1);

    // Recursive calls
    const evenFft = fftRecursive(even);
    const oddFft = fftRecursive(odd);

    // Combine results
    const result = new Array(n);
    for (let k = 0; k < n / 2; k++) {
      const angle = (-2 * Math.PI * k) / n;
      const twiddleReal = Math.cos(angle);
      const twiddleImag = Math.sin(angle);

      const evenReal = evenFft[k];
      const oddReal = oddFft[k];
      const oddImag = 0; // Simplified for real input

      result[k] = evenReal + twiddleReal * oddReal - twiddleImag * oddImag;
      result[k + n / 2] = evenReal - twiddleReal * oddReal + twiddleImag * oddImag;
    }

    return result;
  }, []);

  // Find frequency peaks
  const findFrequencyPeaks = useCallback((magnitudes: number[], freqs: number[], threshold: number = 0.05) => {
    const peaks: { frequency: number; magnitude: number }[] = [];
    
    for (let i = 1; i < Math.min(magnitudes.length / 2, magnitudes.length - 1); i++) {
      if (
        magnitudes[i] > magnitudes[i - 1] &&
        magnitudes[i] > magnitudes[i + 1] &&
        magnitudes[i] > Math.max(...magnitudes) * threshold
      ) {
        peaks.push({
          frequency: freqs[i],
          magnitude: magnitudes[i]
        });
      }
    }

    // Sort by magnitude
    peaks.sort((a, b) => b.magnitude - a.magnitude);
    return peaks;
  }, []);

  // Calculate repetitive motion score
  const calculateRepetitiveScore = useCallback((freqsMags: { frequency: number; magnitude: number }[]) => {
    if (freqsMags.length === 0) return 0.0;

    const maxMag = Math.max(...freqsMags.map(p => p.magnitude));
    let totalScore = 0.0;

    for (const { frequency, magnitude } of freqsMags) {
      // Weight by frequency (higher weight for typical hand flapping)
      let weight = 0.3; // Default weight
      if (frequency >= handFlappingRange[0] && frequency <= handFlappingRange[1]) {
        weight = 1.0; // Hand flapping frequency
      } else if (frequency >= generalRepetitiveRange[0] && frequency <= generalRepetitiveRange[1]) {
        weight = 0.7; // General repetitive motion
      }

      // Normalize magnitude
      const normalizedMag = maxMag > 0 ? magnitude / maxMag : 0.0;
      totalScore += weight * normalizedMag;
    }

    return totalScore / freqsMags.length;
  }, [handFlappingRange, generalRepetitiveRange]);

  // Classify repetitive motion
  const classifyRepetitiveMotion = useCallback((score: number) => {
    if (score > 0.7) {
      return {
        classification: 'HIGH' as const,
        description: 'Strong repetitive motion patterns detected'
      };
    } else if (score > 0.4) {
      return {
        classification: 'MEDIUM' as const,
        description: 'Moderate repetitive motion patterns detected'
      };
    } else if (score > 0.1) {
      return {
        classification: 'LOW' as const,
        description: 'Weak repetitive motion patterns detected'
      };
    } else {
      return {
        classification: 'NONE' as const,
        description: 'No significant repetitive motion detected'
      };
    }
  }, []);

  // Generate recommendations
  const generateRecommendations = useCallback((classification: string) => {
    const recommendations: string[] = [];
    
    switch (classification) {
      case 'HIGH':
        recommendations.push('Consider occupational therapy for motor skills development');
        recommendations.push('Monitor for other repetitive behaviors');
        recommendations.push('Consult with behavioral specialist');
        recommendations.push('Implement gentle redirection strategies');
        break;
      case 'MEDIUM':
        recommendations.push('Continue monitoring for pattern changes');
        recommendations.push('Consider gentle redirection strategies');
        recommendations.push('Document frequency and triggers');
        break;
      case 'LOW':
        recommendations.push('Normal developmental variation observed');
        recommendations.push('Continue routine monitoring');
        recommendations.push('Provide positive reinforcement for appropriate behaviors');
        break;
      default:
        recommendations.push('No specific recommendations at this time');
        recommendations.push('Continue routine developmental monitoring');
    }

    return recommendations;
  }, []);

  // Analyze repetitive motion
  const analyzeMotion = useCallback(() => {
    if (wristDataHistory.length < 20) return;

    // Extract Y coordinates for up-down movement analysis
    const leftYCoords = wristDataHistory
      .map(data => data.leftWrist?.y)
      .filter(y => y !== null && y !== undefined) as number[];

    const rightYCoords = wristDataHistory
      .map(data => data.rightWrist?.y)
      .filter(y => y !== null && y !== undefined) as number[];

    if (leftYCoords.length === 0 && rightYCoords.length === 0) return;

    // Perform FFT analysis on combined data
    const combinedYCoords = [...leftYCoords, ...rightYCoords];
    const fftResult = fft(combinedYCoords);
    const magnitudes = fftResult.map(val => Math.abs(val));

    // Calculate frequencies
    const freqs = combinedYCoords.map((_, i) => (i * frameRate) / combinedYCoords.length);

    // Find peaks
    const peaks = findFrequencyPeaks(magnitudes, freqs);

    // Filter for repetitive motion frequencies
    const repetitivePeaks = peaks
      .slice(0, 10) // Top 10 peaks
      .filter(peak => peak.frequency >= 0.1 && peak.frequency <= 10.0);

    // Calculate score
    const score = calculateRepetitiveScore(repetitivePeaks);

    // Classify
    const { classification, description } = classifyRepetitiveMotion(score);

    // Generate recommendations
    const recommendations = generateRecommendations(classification);

    const newAnalysis: RepetitiveMotionAnalysis = {
      score,
      classification,
      description,
      leftWristData: leftYCoords,
      rightWristData: rightYCoords,
      dominantFrequencies: repetitivePeaks.map(p => p.frequency),
      recommendations
    };

    setAnalysis(newAnalysis);
    analysisRef.current = newAnalysis;
  }, [wristDataHistory, fft, frameRate, findFrequencyPeaks, calculateRepetitiveScore, classifyRepetitiveMotion, generateRecommendations]);

  // Add new wrist data
  const addWristData = useCallback((handData: HandPoseData) => {
    setWristDataHistory(prev => {
      const newHistory = [...prev, handData];
      // Keep only the last windowSize frames
      return newHistory.slice(-windowSize);
    });
  }, [windowSize]);

  // Clear data history
  const clearHistory = useCallback(() => {
    setWristDataHistory([]);
    setAnalysis({
      score: 0,
      classification: 'NONE',
      description: 'No data available',
      leftWristData: [],
      rightWristData: [],
      dominantFrequencies: [],
      recommendations: []
    });
  }, []);

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

  // Periodic analysis
  useEffect(() => {
    if (wristDataHistory.length === 0) return;

    const interval = setInterval(analyzeMotion, analysisInterval);
    return () => clearInterval(interval);
  }, [wristDataHistory, analyzeMotion, analysisInterval]);

  return {
    // Data management
    addWristData,
    clearHistory,
    
    // Analysis results
    analysis,
    analysisRef,
    
    // Utility functions
    getCurrentWristPositions,
    getMovementStats,
    
    // Raw data
    wristDataHistory,
    
    // Status
    hasData: wristDataHistory.length > 0,
    dataCount: wristDataHistory.length,
    
    // Configuration
    config: {
      windowSize,
      analysisInterval,
      frameRate,
      handFlappingRange,
      generalRepetitiveRange
    }
  };
}; 