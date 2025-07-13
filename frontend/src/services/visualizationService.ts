import { ConversationEntry } from './adaptiveEngine';
import { EmotionLogEntry } from '../types';

// Removed local EmotionLogEntry interface, now using shared one

export interface VisualizationData {
  emotionTrends: EmotionTrendData[];
  riskAssessment: RiskAssessmentData[];
  domainCoverage: DomainCoverageData[];
  clinicalMetrics: ClinicalMetricsData;
  behavioralPatterns: BehavioralPatternData[];
  responseTimeAnalysis: ResponseTimeData[];
  confidenceDistribution: ConfidenceData[];
  sessionTimeline: TimelineData[];
}

export interface EmotionTrendData {
  time: number;
  emotion: string;
  confidence: number;
  timestamp: Date;
  intensity: number;
}

export interface RiskAssessmentData {
  domain: string;
  risk: number;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  recommendations: string[];
}

export interface DomainCoverageData {
  domain: string;
  count: number;
  percentage: number;
  averageScore: number;
  completionRate: number;
}

export interface ClinicalMetricsData {
  overallScore: number;
  attentionSpan: number;
  responseConsistency: number;
  emotionalStability: number;
  socialEngagement: number;
  cognitiveFlexibility: number;
}

export interface BehavioralPatternData {
  pattern: string;
  frequency: number;
  severity: number;
  context: string;
  intervention: string;
}

export interface ResponseTimeData {
  questionType: string;
  averageTime: number;
  consistency: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface ConfidenceData {
  range: string;
  count: number;
  percentage: number;
  emotion: string;
}

export interface TimelineData {
  timestamp: Date;
  event: string;
  duration: number;
  emotion: string;
  confidence: number;
}

// Medical visualization color schemes
export const medicalColors = {
  primary: '#2E86AB',
  secondary: '#A23B72',
  accent: '#F18F01',
  success: '#C73E1D',
  warning: '#FF6B35',
  info: '#4ECDC4',
  danger: '#FF3838',
  neutral: '#95A5A6'
};

export const severityColors = {
  low: '#28a745',
  medium: '#ffc107',
  high: '#dc3545',
  critical: '#6f42c1'
};

export const emotionColors = {
  happy: '#28a745',
  sad: '#6c757d',
  angry: '#dc3545',
  anxious: '#ffc107',
  neutral: '#17a2b8',
  surprised: '#fd7e14',
  disgusted: '#6f42c1'
};

class VisualizationService {
  
  // Generate comprehensive visualization data
  generateVisualizationData(
    history: ConversationEntry[], 
    emotionLog: EmotionLogEntry[], 
    sessionDuration: number
  ): VisualizationData {
    
    const emotionTrends = this.generateEmotionTrends(emotionLog);
    const riskAssessment = this.generateRiskAssessment(history, emotionLog);
    const domainCoverage = this.generateDomainCoverage(history);
    const clinicalMetrics = this.generateClinicalMetrics(history, emotionLog, sessionDuration);
    const behavioralPatterns = this.generateBehavioralPatterns(history, emotionLog);
    const responseTimeAnalysis = this.generateResponseTimeAnalysis(history);
    const confidenceDistribution = this.generateConfidenceDistribution(emotionLog);
    const sessionTimeline = this.generateSessionTimeline(history, emotionLog, sessionDuration);

    return {
      emotionTrends,
      riskAssessment,
      domainCoverage,
      clinicalMetrics,
      behavioralPatterns,
      responseTimeAnalysis,
      confidenceDistribution,
      sessionTimeline
    };
  }

  // Enhanced emotion trend analysis with intensity mapping
  private generateEmotionTrends(emotionLog: EmotionLogEntry[]): EmotionTrendData[] {
    return emotionLog.map((entry, index) => {
      const intensity = this.calculateEmotionIntensity(entry.emotionLabel, entry.confidence);
      return {
        time: index + 1,
        emotion: entry.emotionLabel,
        confidence: entry.confidence,
        timestamp: entry.timestamp,
        intensity
      };
    });
  }

  // Calculate emotion intensity based on emotion type and confidence
  private calculateEmotionIntensity(emotion: string, confidence: number): number {
    const baseIntensity = {
      'happy': 0.8,
      'sad': 0.7,
      'angry': 0.9,
      'anxious': 0.6,
      'neutral': 0.3,
      'surprised': 0.5,
      'disgusted': 0.8
    };

    return (baseIntensity[emotion as keyof typeof baseIntensity] || 0.5) * confidence;
  }

  // Enhanced risk assessment with severity levels and recommendations
  private generateRiskAssessment(history: ConversationEntry[], emotionLog: EmotionLogEntry[]): RiskAssessmentData[] {
    const domains = ['Social Communication', 'Sensory Processing', 'Restricted Behaviors', 'Cognitive Patterns', 'Emotional Regulation'];
    
    return domains.map(domain => {
      const domainQuestions = history.filter(h => h.domain === domain);
      const domainEmotions = emotionLog.filter((_, index) => 
        domainQuestions.some(q => q.emotion && index < emotionLog.length)
      );

      const riskScore = this.calculateDomainRisk(domainQuestions, domainEmotions);
      const severity = this.determineSeverity(riskScore);
      const confidence = this.calculateRiskConfidence(domainQuestions.length, domainEmotions.length);
      const recommendations = this.generateDomainRecommendations(domain, riskScore);

      return {
        domain,
        risk: riskScore,
        severity,
        confidence,
        recommendations
      };
    });
  }

  private calculateDomainRisk(questions: ConversationEntry[], emotions: EmotionLogEntry[]): number {
    if (questions.length === 0) return 0;

    const emotionRisk = emotions.reduce((sum, emotion) => {
      const riskMultiplier = {
        'anxious': 0.8,
        'sad': 0.6,
        'angry': 0.9,
        'neutral': 0.3,
        'happy': 0.2
      };
      return sum + (riskMultiplier[emotion.emotionLabel as keyof typeof riskMultiplier] || 0.5) * emotion.confidence;
    }, 0) / Math.max(emotions.length, 1);

    const questionRisk = questions.reduce((sum, q) => {
      const emotionScore = q.emotion === 'anxious' || q.emotion === 'sad' ? 0.8 : 
                         q.emotion === 'neutral' ? 0.5 : 0.3;
      return sum + (emotionScore * (q.emotionConfidence || 0.5));
    }, 0) / questions.length;

    return Math.min(1, (emotionRisk + questionRisk) / 2 + (questions.length * 0.05));
  }

  private determineSeverity(riskScore: number): 'low' | 'medium' | 'high' {
    if (riskScore < 0.4) return 'low';
    if (riskScore < 0.7) return 'medium';
    return 'high';
  }

  private calculateRiskConfidence(questionCount: number, emotionCount: number): number {
    const dataPoints = questionCount + emotionCount;
    return Math.min(1, dataPoints / 10);
  }

  private generateDomainRecommendations(domain: string, riskScore: number): string[] {
    const recommendations: Record<string, string[]> = {
      'Social Communication': [
        'Consider social skills training programs',
        'Evaluate communication therapy needs',
        'Assess peer interaction patterns'
      ],
      'Sensory Processing': [
        'Occupational therapy assessment recommended',
        'Evaluate environmental modifications',
        'Consider sensory integration therapy'
      ],
      'Restricted Behaviors': [
        'Behavioral therapy consultation',
        'Routine and structure planning',
        'Flexibility training programs'
      ],
      'Cognitive Patterns': [
        'Cognitive behavioral therapy assessment',
        'Executive function evaluation',
        'Learning style assessment'
      ],
      'Emotional Regulation': [
        'Emotional regulation therapy',
        'Stress management techniques',
        'Coping strategy development'
      ]
    };

    const domainRecs = recommendations[domain] || ['Professional assessment recommended'];
    return riskScore > 0.6 ? domainRecs : ['Monitor for changes', 'Regular follow-up recommended'];
  }

  // Enhanced domain coverage with scoring
  private generateDomainCoverage(history: ConversationEntry[]): DomainCoverageData[] {
    const domainCounts = history.reduce((acc, entry) => {
      if (entry.domain) {
        if (!acc[entry.domain]) {
          acc[entry.domain] = { count: 0, scores: [] };
        }
        acc[entry.domain].count++;
        if (entry.emotionConfidence) {
          acc[entry.domain].scores.push(entry.emotionConfidence);
        }
      }
      return acc;
    }, {} as Record<string, { count: number; scores: number[] }>);

    return Object.entries(domainCounts).map(([domain, data]) => ({
      domain,
      count: data.count,
      percentage: (data.count / history.length) * 100,
      averageScore: data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0,
      completionRate: Math.min(1, data.count / 5) // Assuming 5 questions per domain is complete
    }));
  }

  // Clinical metrics calculation
  private generateClinicalMetrics(history: ConversationEntry[], emotionLog: EmotionLogEntry[], sessionDuration: number): ClinicalMetricsData {
    const responseTimes = history.map((_, index) => {
      if (index === 0) return 30; // Default first response time
      return Math.random() * 60 + 15; // Simulated response times
    });

    const attentionSpan = this.calculateAttentionSpan(responseTimes, sessionDuration);
    const responseConsistency = this.calculateResponseConsistency(history);
    const emotionalStability = this.calculateEmotionalStability(emotionLog);
    const socialEngagement = this.calculateSocialEngagement(history);
    const cognitiveFlexibility = this.calculateCognitiveFlexibility(history);

    return {
      overallScore: (attentionSpan + responseConsistency + emotionalStability + socialEngagement + cognitiveFlexibility) / 5,
      attentionSpan,
      responseConsistency,
      emotionalStability,
      socialEngagement,
      cognitiveFlexibility
    };
  }

  private calculateAttentionSpan(responseTimes: number[], sessionDuration: number): number {
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    // Calculate standard deviation manually
    const variance = responseTimes.reduce((sum, time) => sum + Math.pow(time - avgResponseTime, 2), 0) / responseTimes.length;
    const stdDev = Math.sqrt(variance);
    
    const consistency = 1 - (stdDev / avgResponseTime);
    return Math.min(1, (sessionDuration / (avgResponseTime * responseTimes.length)) * consistency);
  }

  private calculateResponseConsistency(history: ConversationEntry[]): number {
    const emotions = history.map(h => h.emotion).filter(Boolean);
    const uniqueEmotions = new Set(emotions);
    return 1 - (uniqueEmotions.size / Math.max(emotions.length, 1));
  }

  private calculateEmotionalStability(emotionLog: EmotionLogEntry[]): number {
    if (emotionLog.length < 2) return 0.5;
    
    const emotionChanges = emotionLog.slice(1).map((log, index) => 
      log.emotionLabel !== emotionLog[index].emotionLabel ? 1 : 0
    );
    
    const stabilityScore = 1 - (emotionChanges.reduce((a: number, b: number) => a + b, 0) / emotionChanges.length);
    return Math.max(0, stabilityScore);
  }

  private calculateSocialEngagement(history: ConversationEntry[]): number {
    const socialQuestions = history.filter(h => h.domain === 'Social Communication');
    if (socialQuestions.length === 0) return 0.5;
    
    const engagementScores = socialQuestions.map(q => {
      const emotionScore = q.emotion === 'happy' || q.emotion === 'neutral' ? 0.8 : 0.4;
      return emotionScore * (q.emotionConfidence || 0.5);
    });
    
    return engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length;
  }

  private calculateCognitiveFlexibility(history: ConversationEntry[]): number {
    const cognitiveQuestions = history.filter(h => h.domain === 'Cognitive Patterns');
    if (cognitiveQuestions.length === 0) return 0.5;
    
    const flexibilityScores = cognitiveQuestions.map(q => {
      const emotionScore = q.emotion === 'neutral' ? 0.7 : 
                          q.emotion === 'anxious' ? 0.4 : 0.6;
      return emotionScore * (q.emotionConfidence || 0.5);
    });
    
    return flexibilityScores.reduce((a, b) => a + b, 0) / flexibilityScores.length;
  }

  // Behavioral pattern analysis
  private generateBehavioralPatterns(history: ConversationEntry[], emotionLog: EmotionLogEntry[]): BehavioralPatternData[] {
    const patterns = [
      {
        pattern: 'Emotional Avoidance',
        frequency: this.calculatePatternFrequency(emotionLog, 'neutral'),
        severity: 0.6,
        context: 'High frequency of neutral responses',
        intervention: 'Emotional expression exercises'
      },
      {
        pattern: 'Anxiety Response',
        frequency: this.calculatePatternFrequency(emotionLog, 'anxious'),
        severity: 0.8,
        context: 'Consistent anxious responses',
        intervention: 'Anxiety management techniques'
      },
      {
        pattern: 'Social Withdrawal',
        frequency: this.calculatePatternFrequency(history, 'Social Communication'),
        severity: 0.7,
        context: 'Limited social engagement',
        intervention: 'Social skills training'
      }
    ];

    return patterns.filter(p => p.frequency > 0.2);
  }

  private calculatePatternFrequency(data: any[], pattern: string): number {
    const matches = data.filter(item => 
      item.emotionLabel === pattern || item.domain === pattern
    );
    return matches.length / Math.max(data.length, 1);
  }

  // Response time analysis
  private generateResponseTimeAnalysis(history: ConversationEntry[]): ResponseTimeData[] {
    const questionTypes = ['Social Communication', 'Sensory Processing', 'Restricted Behaviors', 'Cognitive Patterns'];
    
    return questionTypes.map(type => {
      const typeQuestions = history.filter(h => h.domain === type);
      const avgTime = typeQuestions.length > 0 ? Math.random() * 45 + 15 : 30;
      const consistency = Math.random() * 0.4 + 0.6;
      const trend = Math.random() > 0.5 ? 'improving' : Math.random() > 0.5 ? 'stable' : 'declining';
      
      return {
        questionType: type,
        averageTime: avgTime,
        consistency,
        trend
      };
    });
  }

  // Confidence distribution analysis
  private generateConfidenceDistribution(emotionLog: EmotionLogEntry[]): ConfidenceData[] {
    const ranges = [
      { min: 0, max: 0.2, label: '0-20%' },
      { min: 0.2, max: 0.4, label: '20-40%' },
      { min: 0.4, max: 0.6, label: '40-60%' },
      { min: 0.6, max: 0.8, label: '60-80%' },
      { min: 0.8, max: 1, label: '80-100%' }
    ];

    return ranges.map(range => {
      const count = emotionLog.filter(log => 
        log.confidence >= range.min && log.confidence < range.max
      ).length;
      
      return {
        range: range.label,
        count,
        percentage: (count / Math.max(emotionLog.length, 1)) * 100,
        emotion: 'mixed'
      };
    });
  }

  // Session timeline generation
  private generateSessionTimeline(history: ConversationEntry[], emotionLog: EmotionLogEntry[], sessionDuration: number): TimelineData[] {
    const timeline: TimelineData[] = [];
    const startTime = new Date(Date.now() - sessionDuration * 60 * 1000);

    // Add session start
    timeline.push({
      timestamp: startTime,
      event: 'Session Started',
      duration: 0,
      emotion: 'neutral',
      confidence: 1
    });

    // Add question responses
    history.forEach((entry, index) => {
      const timeOffset = (index / history.length) * sessionDuration * 60 * 1000;
      const timestamp = new Date(startTime.getTime() + timeOffset);
      
      timeline.push({
        timestamp,
        event: `Question ${index + 1}`,
        duration: Math.random() * 60 + 15,
        emotion: entry.emotion || 'neutral',
        confidence: entry.emotionConfidence || 0.5
      });
    });

    // Add emotion log entries
    emotionLog.forEach((entry, index) => {
      const timeOffset = (index / emotionLog.length) * sessionDuration * 60 * 1000;
      const timestamp = new Date(startTime.getTime() + timeOffset);
      
      timeline.push({
        timestamp,
        event: 'Emotion Detected',
        duration: 0,
        emotion: entry.emotionLabel,
        confidence: entry.confidence
      });
    });

    // Add session end
    const endTime = new Date(startTime.getTime() + sessionDuration * 60 * 1000);
    timeline.push({
      timestamp: endTime,
      event: 'Session Completed',
      duration: 0,
      emotion: 'neutral',
      confidence: 1
    });

    return timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

export const visualizationService = new VisualizationService(); 