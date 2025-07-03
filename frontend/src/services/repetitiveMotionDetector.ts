/**
 * ASD Repetitive Motion Detector
 * Detects hand flapping and other repetitive movements using FFT analysis
 * Integration module for the ASD screening tool
 */

export interface FrequencyPeak {
  frequency: number;
  magnitude: number;
}

export interface AxisAnalysis {
  repetitiveFrequencies: FrequencyPeak[];
  score: number;
  peaksDetected: number;
}

export interface WristAnalysis {
  yAxis: AxisAnalysis;
  zAxis: AxisAnalysis;
  overallScore: number;
  classification: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  description: string;
  dataPoints: number;
}

export interface SessionAnalysis {
  leftWrist?: WristAnalysis;
  rightWrist?: WristAnalysis;
  sessionSummary?: {
    overallScore: number;
    classification: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    description: string;
    wristCount: number;
  };
}

export class RepetitiveMotionDetector {
  private frameRate: number;
  private handFlappingFreqRange: [number, number] = [1.5, 3.5];
  private generalRepetitiveRange: [number, number] = [0.5, 5.0];

  constructor(frameRate: number = 25.1) {
    this.frameRate = frameRate;
  }

  /**
   * Fast Fourier Transform implementation
   */
  private fft(data: number[]): number[] {
    const n = data.length;
    if (n <= 1) return data;

    // Pad with zeros if needed to make length power of 2
    let paddedData = [...data];
    if ((n & (n - 1)) !== 0) {
      let nextPower = 1;
      while (nextPower < n) nextPower <<= 1;
      paddedData = data.concat(new Array(nextPower - n).fill(0));
    }

    return this.fftRecursive(paddedData);
  }

  private fftRecursive(data: number[]): number[] {
    const n = data.length;
    if (n === 1) return data;

    // Split into even and odd indices
    const even = data.filter((_, i) => i % 2 === 0);
    const odd = data.filter((_, i) => i % 2 === 1);

    // Recursive calls
    const evenFft = this.fftRecursive(even);
    const oddFft = this.fftRecursive(odd);

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
  }

  /**
   * Find frequency peaks in FFT magnitude spectrum
   */
  private findFrequencyPeaks(magnitudes: number[], freqs: number[], threshold: number = 0.05): FrequencyPeak[] {
    const peaks: FrequencyPeak[] = [];
    
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
  }

  /**
   * Calculate repetitive motion score based on frequency patterns
   */
  private calculateRepetitiveScore(freqsMags: FrequencyPeak[]): number {
    if (freqsMags.length === 0) return 0.0;

    const maxMag = Math.max(...freqsMags.map(p => p.magnitude));
    let totalScore = 0.0;

    for (const { frequency, magnitude } of freqsMags) {
      // Weight by frequency (higher weight for typical hand flapping)
      let weight = 0.3; // Default weight
      if (frequency >= this.handFlappingFreqRange[0] && frequency <= this.handFlappingFreqRange[1]) {
        weight = 1.0; // Hand flapping frequency
      } else if (frequency >= this.generalRepetitiveRange[0] && frequency <= this.generalRepetitiveRange[1]) {
        weight = 0.7; // General repetitive motion
      }

      // Normalize magnitude
      const normalizedMag = maxMag > 0 ? magnitude / maxMag : 0.0;
      totalScore += weight * normalizedMag;
    }

    return totalScore / freqsMags.length;
  }

  /**
   * Classify repetitive motion based on score
   */
  private classifyRepetitiveMotion(score: number): { classification: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'; description: string } {
    if (score > 0.7) {
      return {
        classification: 'HIGH',
        description: 'Strong repetitive motion patterns detected'
      };
    } else if (score > 0.4) {
      return {
        classification: 'MEDIUM',
        description: 'Moderate repetitive motion patterns detected'
      };
    } else if (score > 0.1) {
      return {
        classification: 'LOW',
        description: 'Weak repetitive motion patterns detected'
      };
    } else {
      return {
        classification: 'NONE',
        description: 'No significant repetitive motion detected'
      };
    }
  }

  /**
   * Analyze repetitive motion for a single axis
   */
  private analyzeAxis(coordinates: number[]): AxisAnalysis {
    if (coordinates.length < 10) {
      return {
        repetitiveFrequencies: [],
        score: 0.0,
        peaksDetected: 0
      };
    }

    // Perform FFT
    const fftResult = this.fft(coordinates);
    const magnitudes = fftResult.map(val => Math.abs(val));

    // Calculate frequencies
    const freqs = coordinates.map((_, i) => (i * this.frameRate) / coordinates.length);

    // Find peaks
    const peaks = this.findFrequencyPeaks(magnitudes, freqs);

    // Filter for repetitive motion frequencies
    const repetitivePeaks = peaks
      .slice(0, 10) // Top 10 peaks
      .filter(peak => peak.frequency >= 0.1 && peak.frequency <= 10.0);

    // Calculate score
    const score = this.calculateRepetitiveScore(repetitivePeaks);

    return {
      repetitiveFrequencies: repetitivePeaks,
      score,
      peaksDetected: repetitivePeaks.length
    };
  }

  /**
   * Analyze repetitive motion for a wrist (left or right)
   */
  public analyzeWristMotion(wristData: { y: number[]; z: number[] }): WristAnalysis {
    const { y: yCoords, z: zCoords } = wristData;

    if (!yCoords.length || !zCoords.length) {
      return {
        yAxis: { repetitiveFrequencies: [], score: 0.0, peaksDetected: 0 },
        zAxis: { repetitiveFrequencies: [], score: 0.0, peaksDetected: 0 },
        overallScore: 0.0,
        classification: 'NONE',
        description: 'No data available',
        dataPoints: 0
      };
    }

    // Analyze each axis
    const yAnalysis = this.analyzeAxis(yCoords);
    const zAnalysis = this.analyzeAxis(zCoords);

    // Calculate overall score
    const overallScore = (yAnalysis.score + zAnalysis.score) / 2;

    // Classify
    const { classification, description } = this.classifyRepetitiveMotion(overallScore);

    return {
      yAxis: yAnalysis,
      zAxis: zAnalysis,
      overallScore,
      classification,
      description,
      dataPoints: yCoords.length
    };
  }

  /**
   * Analyze repetitive motion for an entire session
   */
  public analyzeSession(trajectoryData: {
    leftWrist?: { y: number[]; z: number[] };
    rightWrist?: { y: number[]; z: number[] };
  }): SessionAnalysis {
    const results: SessionAnalysis = {};

    if (trajectoryData.leftWrist) {
      results.leftWrist = this.analyzeWristMotion(trajectoryData.leftWrist);
    }

    if (trajectoryData.rightWrist) {
      results.rightWrist = this.analyzeWristMotion(trajectoryData.rightWrist);
    }

    // Calculate session-level metrics
    const wristResults = [results.leftWrist, results.rightWrist].filter(Boolean);
    if (wristResults.length > 0) {
      const allScores = wristResults.map(result => result!.overallScore);
      const sessionScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
      const { classification, description } = this.classifyRepetitiveMotion(sessionScore);

      results.sessionSummary = {
        overallScore: sessionScore,
        classification,
        description,
        wristCount: wristResults.length
      };
    }

    return results;
  }

  /**
   * Real-time analysis for live data streams
   */
  public analyzeRealTime(coordinates: number[], windowSize: number = 100): AxisAnalysis {
    if (coordinates.length < windowSize) {
      return this.analyzeAxis(coordinates);
    }

    // Use sliding window for real-time analysis
    const recentData = coordinates.slice(-windowSize);
    return this.analyzeAxis(recentData);
  }

  /**
   * Get detection statistics for clinical reporting
   */
  public getDetectionStats(analysis: SessionAnalysis): {
    hasRepetitiveMotion: boolean;
    severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    recommendations: string[];
  } {
    const classifications = [
      analysis.leftWrist?.classification,
      analysis.rightWrist?.classification,
      analysis.sessionSummary?.classification
    ].filter(Boolean) as ('HIGH' | 'MEDIUM' | 'LOW' | 'NONE')[];

    const hasRepetitiveMotion = classifications.some(c => c !== 'NONE');
    const severity = classifications.length > 0 ? 
      classifications.reduce((max, current) => 
        ['HIGH', 'MEDIUM', 'LOW', 'NONE'].indexOf(current) < ['HIGH', 'MEDIUM', 'LOW', 'NONE'].indexOf(max) ? current : max
      ) : 'NONE';

    const recommendations: string[] = [];
    
    if (severity === 'HIGH') {
      recommendations.push('Consider occupational therapy for motor skills development');
      recommendations.push('Monitor for other repetitive behaviors');
      recommendations.push('Consult with behavioral specialist');
    } else if (severity === 'MEDIUM') {
      recommendations.push('Continue monitoring for pattern changes');
      recommendations.push('Consider gentle redirection strategies');
    } else if (severity === 'LOW') {
      recommendations.push('Normal developmental variation observed');
      recommendations.push('Continue routine monitoring');
    }

    return {
      hasRepetitiveMotion,
      severity,
      recommendations
    };
  }
}

// Export singleton instance for easy use
export const repetitiveMotionDetector = new RepetitiveMotionDetector();

// Export utility functions
export const createRepetitiveMotionDetector = (frameRate: number = 25.1) => {
  return new RepetitiveMotionDetector(frameRate);
}; 