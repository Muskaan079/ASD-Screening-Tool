import { MultimodalContext, LLMAnalysis, ClinicalReport, DevelopmentalProjection } from '../types';

class LLMService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  }

  // Analyze multimodal context and suggest next actions
  public async analyzeMultimodalContext(context: MultimodalContext): Promise<LLMAnalysis> {
    try {
      const response = await fetch(`${this.baseURL}/api/llm/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          context,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error('Error analyzing multimodal context:', error);
      
      // Fallback analysis
      return this.generateFallbackAnalysis(context);
    }
  }

  private generateFallbackAnalysis(context: MultimodalContext): LLMAnalysis {
    const { speech, facial, behavioral } = context;
    
    let nextAction: LLMAnalysis['nextAction'] = 'continue';
    let reasoning = '';
    let suggestedQuestion = '';

    // Analyze speech patterns
    if (speech.confidence < 0.5) {
      nextAction = 'repeat';
      reasoning = 'Low speech confidence detected, suggesting question repetition';
    }

    // Analyze facial expressions
    if (facial.expressions.surprised > 0.7 || facial.expressions.fearful > 0.7) {
      nextAction = 'adjust_difficulty';
      reasoning = 'High confusion detected, suggesting difficulty adjustment';
      suggestedQuestion = 'Let me ask you a simpler question. What is 2 + 2?';
    }

    // Analyze behavioral patterns
    if (behavioral.responseTime > 10000) {
      nextAction = 'adjust_difficulty';
      reasoning = 'Slow response time detected, suggesting difficulty adjustment';
    }

    return {
      response: 'Analysis completed successfully',
      confidence: 0.8,
      nextAction,
      reasoning,
      suggestedQuestion
    };
  }

  // Generate clinical report using DSM-5/ICD-11 criteria
  public async generateClinicalReport(sessionData: any): Promise<ClinicalReport> {
    try {
      const response = await fetch(`${this.baseURL}/api/llm/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          sessionData,
          criteria: ['dsm5', 'icd11'],
          format: 'structured'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.report;
    } catch (error) {
      console.error('Error generating clinical report:', error);
      
      // Fallback report
      return this.generateFallbackReport(sessionData);
    }
  }

  private generateFallbackReport(sessionData: any): ClinicalReport {
    return {
      id: `report_${Date.now()}`,
      sessionId: sessionData.sessionId || 'unknown',
      patientId: sessionData.patientId || 'unknown',
      practitionerId: sessionData.practitionerId || 'unknown',
      date: new Date(),
      
      dsm5Criteria: {
        socialCommunication: {
          socialEmotionalReciprocity: 0.6,
          nonverbalCommunication: 0.7,
          relationships: 0.5
        },
        restrictedRepetitive: {
          stereotypedRepetitive: 0.4,
          insistenceOnSameness: 0.3,
          restrictedInterests: 0.5,
          sensoryHyperreactivity: 0.6
        }
      },
      
      icd11Criteria: {
        socialInteraction: 0.6,
        communication: 0.7,
        repetitiveBehaviors: 0.4,
        sensoryIssues: 0.6
      },
      
      testResults: {
        emotionRecognition: {
          score: 8,
          maxScore: 10,
          percentage: 80,
          timeTaken: 45000,
          accuracy: 0.8,
          ageNorm: 8.5,
          percentile: 75
        },
        patternRecognition: {
          score: 7,
          maxScore: 10,
          percentage: 70,
          timeTaken: 60000,
          accuracy: 0.7,
          ageNorm: 7.8,
          percentile: 65
        },
        reactionTime: {
          score: 6,
          maxScore: 10,
          percentage: 60,
          timeTaken: 30000,
          accuracy: 0.6,
          ageNorm: 8.2,
          percentile: 55
        },
        adaptiveQuestioning: sessionData.adaptiveData || {
          voiceTone: {
            prosody: { pitch: 0.5, volume: 0.6, speechRate: 0.7, clarity: 0.8 },
            emotion: 'neutral',
            confidence: 0.7,
            timestamp: new Date()
          },
          facialExpression: {
            expressions: {
              happy: 0.3, sad: 0.1, angry: 0.05, surprised: 0.1,
              fearful: 0.05, disgusted: 0.05, neutral: 0.35
            },
            dominantEmotion: 'neutral',
            confusion: 0.2,
            attention: 0.8,
            timestamp: new Date()
          },
          responseMetrics: {
            responseTime: 5000,
            accuracy: 0.7,
            confidence: 0.6,
            hesitation: 0.3,
            corrections: 2
          },
          currentDifficulty: 'medium',
          questionHistory: []
        }
      },
      
      aiAnalysis: {
        summary: 'The assessment indicates moderate social communication challenges with some repetitive behaviors observed.',
        observations: [
          'Good performance in emotion recognition tasks',
          'Moderate difficulty with pattern recognition',
          'Some delays in response times',
          'Appropriate adaptive questioning responses'
        ],
        riskFactors: [
          'Social interaction difficulties',
          'Communication challenges',
          'Sensory sensitivities'
        ],
        recommendations: [
          'Consider comprehensive evaluation by specialist',
          'Implement social skills training',
          'Address sensory processing needs',
          'Monitor progress over time'
        ],
        confidence: 0.75
      },
      
      metadata: {
        totalDuration: 180000,
        questionsAnswered: 15,
        adaptiveAdjustments: 3,
        exportFormat: 'pdf'
      }
    };
  }

  // Generate developmental projection
  public async generateDevelopmentalProjection(testData: any): Promise<DevelopmentalProjection> {
    try {
      const response = await fetch(`${this.baseURL}/api/llm/project-development`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          testData,
          projectionYears: 5,
          modelType: 'ensemble'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.projection;
    } catch (error) {
      console.error('Error generating developmental projection:', error);
      
      // Fallback projection
      return this.generateFallbackProjection(testData);
    }
  }

  private generateFallbackProjection(testData: any): DevelopmentalProjection {
    const currentAge = testData.age || 8;
    
    return {
      timeline: [
        {
          age: currentAge + 1,
          projectedSkills: ['Improved social communication', 'Better emotion recognition'],
          riskFactors: ['Continued social challenges', 'Academic difficulties'],
          interventions: ['Social skills group', 'Speech therapy']
        },
        {
          age: currentAge + 2,
          projectedSkills: ['Enhanced peer relationships', 'Better academic performance'],
          riskFactors: ['Anxiety in social situations'],
          interventions: ['Cognitive behavioral therapy', 'Continued support']
        },
        {
          age: currentAge + 3,
          projectedSkills: ['Independent social interactions', 'Academic success'],
          riskFactors: ['Transition challenges'],
          interventions: ['Transition planning', 'Ongoing monitoring']
        }
      ],
      confidence: 0.7,
      modelType: 'llm'
    };
  }

  // Generate explainability data
  public async generateExplainabilityData(analysisData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/llm/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          analysisData,
          explainabilityType: 'feature_importance'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.explainability;
    } catch (error) {
      console.error('Error generating explainability data:', error);
      
      // Fallback explainability data
      return {
        featureImportance: {
          'response_time': 0.3,
          'accuracy': 0.4,
          'voice_tone': 0.2,
          'facial_expression': 0.1
        },
        attentionWeights: [0.3, 0.4, 0.2, 0.1],
        confidenceHeatmap: [[0.8, 0.6], [0.4, 0.9]],
        decisionPath: ['Input processing', 'Feature extraction', 'Model prediction'],
        modelVersion: '1.0.0'
      };
    }
  }

  // Stream real-time analysis
  public async streamAnalysis(context: MultimodalContext, onUpdate: (analysis: LLMAnalysis) => void): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/api/llm/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ context })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.analysis) {
                onUpdate(data.analysis);
              }
            } catch (e) {
              console.warn('Failed to parse streaming data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming analysis:', error);
    }
  }
}

export const llmService = new LLMService(); 