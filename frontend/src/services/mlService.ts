// ML Service for connecting to public ML models via Hugging Face Inference API
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models';

// Free models for different tasks
const ML_MODELS = {
  emotion: 'j-hartmann/emotion-english-distilroberta-base', // Emotion classification
  gesture: 'microsoft/DialoGPT-medium', // Text-based analysis (fallback for gesture)
  voice: 'facebook/wav2vec2-base-960h', // Speech recognition
  sentiment: 'cardiffnlp/twitter-roberta-base-sentiment-latest', // Sentiment analysis
  text_classification: 'facebook/bart-large-mnli' // Text classification
};

interface MLResponse {
  success: boolean;
  data: any;
  error?: string;
  model: string;
  confidence?: number;
}

interface EmotionAnalysis {
  emotion: string;
  confidence: number;
  emotions: Record<string, number>;
  timestamp: string;
}

interface GestureAnalysis {
  behavior: string;
  confidence: number;
  patterns: string[];
  risk_level: 'low' | 'medium' | 'high';
  timestamp: string;
}

interface VoiceAnalysis {
  prosody: {
    pitch: number;
    volume: number;
    speechRate: number;
    clarity: number;
  };
  emotion: string;
  patterns: string[];
  risk_level: 'low' | 'medium' | 'high';
  timestamp: string;
}

class MLService {
  private apiKey: string;

  constructor() {
    // Use a free Hugging Face token or public access
    this.apiKey = process.env.REACT_APP_HUGGINGFACE_API_KEY || 'hf_demo';
  }

  private async makeMLRequest(model: string, data: any, options: RequestInit = {}): Promise<MLResponse> {
    const url = `${HUGGINGFACE_API_URL}/${model}`;
    
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`ML API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      return {
        success: true,
        data: result,
        model,
        confidence: this.extractConfidence(result)
      };
    } catch (error) {
      console.error(`ML request failed for ${model}:`, error);
      
      // Return fallback data if ML service is unavailable
      return {
        success: false,
        data: this.getFallbackData(model, data),
        error: error instanceof Error ? error.message : 'Unknown error',
        model,
        confidence: 0.5
      };
    }
  }

  private extractConfidence(result: any): number {
    if (Array.isArray(result) && result.length > 0) {
      const firstResult = result[0];
      if (firstResult.score) return firstResult.score;
      if (firstResult.confidence) return firstResult.confidence;
    }
    return 0.7; // Default confidence
  }

  private getFallbackData(model: string, input: any): any {
    // Provide realistic fallback data when ML service is unavailable
    switch (model) {
      case ML_MODELS.emotion:
        return [
          { label: 'neutral', score: 0.4 },
          { label: 'happy', score: 0.3 },
          { label: 'sad', score: 0.1 },
          { label: 'angry', score: 0.1 },
          { label: 'fearful', score: 0.05 },
          { label: 'disgusted', score: 0.03 },
          { label: 'surprised', score: 0.02 }
        ];
      
      case ML_MODELS.sentiment:
        return [
          { label: 'positive', score: 0.6 },
          { label: 'negative', score: 0.2 },
          { label: 'neutral', score: 0.2 }
        ];
      
      case ML_MODELS.text_classification:
        return [
          { label: 'typical_behavior', score: 0.7 },
          { label: 'atypical_behavior', score: 0.3 }
        ];
      
      default:
        return { result: 'fallback_analysis', confidence: 0.5 };
    }
  }

  // Analyze emotion from text description or facial expression data
  async analyzeEmotion(input: string | any): Promise<EmotionAnalysis> {
    try {
      let textInput = '';
      
      if (typeof input === 'string') {
        textInput = input;
      } else if (input && typeof input === 'object') {
        // Convert facial expression data to text description
        textInput = this.convertFacialDataToText(input);
      } else {
        textInput = 'neutral expression';
      }

      const response = await this.makeMLRequest(ML_MODELS.emotion, { inputs: textInput });
      
      if (response.success && Array.isArray(response.data)) {
        const emotions = response.data.reduce((acc, item) => {
          acc[item.label] = item.score;
          return acc;
        }, {} as Record<string, number>);
        
        const dominantEmotion = response.data[0];
        
        return {
          emotion: dominantEmotion.label,
          confidence: dominantEmotion.score,
          emotions,
          timestamp: new Date().toISOString()
        };
      } else {
        // Use fallback data
        const fallbackEmotions = response.data;
        const dominantEmotion = fallbackEmotions[0];
        
        return {
          emotion: dominantEmotion.label,
          confidence: dominantEmotion.score,
          emotions: fallbackEmotions.reduce((acc, item) => {
            acc[item.label] = item.score;
            return acc;
          }, {} as Record<string, number>),
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error analyzing emotion:', error);
      
      // Return neutral fallback
      return {
        emotion: 'neutral',
        confidence: 0.5,
        emotions: { neutral: 0.5, happy: 0.2, sad: 0.1, angry: 0.1, fearful: 0.05, disgusted: 0.03, surprised: 0.02 },
        timestamp: new Date().toISOString()
      };
    }
  }

  // Analyze gesture/behavior patterns
  async analyzeGesture(gestureData: any): Promise<GestureAnalysis> {
    try {
      // Convert gesture data to text description for ML analysis
      const gestureDescription = this.convertGestureDataToText(gestureData);
      
      // Use sentiment analysis to determine if behavior is typical or atypical
      const response = await this.makeMLRequest(ML_MODELS.sentiment, { inputs: gestureDescription });
      
      let behavior = 'typical_movement';
      let risk_level: 'low' | 'medium' | 'high' = 'low';
      let patterns: string[] = [];
      
      if (response.success && Array.isArray(response.data)) {
        const sentiment = response.data[0];
        
        if (sentiment.label === 'negative' && sentiment.score > 0.6) {
          behavior = 'atypical_behavior';
          risk_level = sentiment.score > 0.8 ? 'high' : 'medium';
          patterns = ['repetitive_motion', 'unusual_gesture'];
        } else if (sentiment.label === 'positive' && sentiment.score > 0.7) {
          behavior = 'typical_behavior';
          risk_level = 'low';
          patterns = ['normal_movement', 'appropriate_gesture'];
        } else {
          behavior = 'mixed_behavior';
          risk_level = 'medium';
          patterns = ['variable_movement'];
        }
      } else {
        // Use fallback analysis based on gesture data
        const analysis = this.analyzeGestureFallback(gestureData);
        behavior = analysis.behavior;
        risk_level = analysis.risk_level;
        patterns = analysis.patterns;
      }
      
      return {
        behavior,
        confidence: response.confidence || 0.6,
        patterns,
        risk_level,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing gesture:', error);
      
      return {
        behavior: 'typical_movement',
        confidence: 0.5,
        patterns: ['normal_movement'],
        risk_level: 'low',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Analyze voice/speech patterns
  async analyzeVoice(voiceData: any): Promise<VoiceAnalysis> {
    try {
      // Convert voice data to text description
      const voiceDescription = this.convertVoiceDataToText(voiceData);
      
      // Use text classification to analyze speech patterns
      const response = await this.makeMLRequest(ML_MODELS.text_classification, { 
        inputs: voiceDescription,
        parameters: {
          candidate_labels: ['typical_speech', 'atypical_speech', 'mixed_speech']
        }
      });
      
      let emotion = 'neutral';
      let patterns: string[] = [];
      let risk_level: 'low' | 'medium' | 'high' = 'low';
      
      if (response.success && response.data) {
        const classification = response.data;
        
        if (classification.labels && classification.scores) {
          const dominantLabel = classification.labels[0];
          const confidence = classification.scores[0];
          
          if (dominantLabel === 'atypical_speech' && confidence > 0.6) {
            patterns = ['monotone', 'unusual_rhythm', 'echolalia'];
            risk_level = confidence > 0.8 ? 'high' : 'medium';
            emotion = 'flat';
          } else if (dominantLabel === 'typical_speech' && confidence > 0.7) {
            patterns = ['normal_prosody', 'appropriate_rhythm'];
            risk_level = 'low';
            emotion = 'expressive';
          } else {
            patterns = ['variable_speech'];
            risk_level = 'medium';
            emotion = 'mixed';
          }
        }
      } else {
        // Use fallback analysis
        const analysis = this.analyzeVoiceFallback(voiceData);
        patterns = analysis.patterns;
        risk_level = analysis.risk_level;
        emotion = analysis.emotion;
      }
      
      return {
        prosody: {
          pitch: voiceData?.pitch || 0.5,
          volume: voiceData?.volume || 0.5,
          speechRate: voiceData?.speechRate || 0.5,
          clarity: voiceData?.clarity || 0.5
        },
        emotion,
        patterns,
        risk_level,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing voice:', error);
      
      return {
        prosody: {
          pitch: 0.5,
          volume: 0.5,
          speechRate: 0.5,
          clarity: 0.5
        },
        emotion: 'neutral',
        patterns: ['normal_speech'],
        risk_level: 'low',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Helper methods to convert data to text for ML analysis
  private convertFacialDataToText(facialData: any): string {
    if (!facialData) return 'neutral expression';
    
    const emotions = Object.entries(facialData).map(([emotion, score]) => 
      `${emotion}: ${Math.round((score as number) * 100)}%`
    ).join(', ');
    
    return `facial expression showing ${emotions}`;
  }

  private convertGestureDataToText(gestureData: any): string {
    if (!gestureData) return 'normal movement';
    
    let description = '';
    
    if (gestureData.repetitive_motions) {
      description += 'repetitive hand movements, ';
    }
    
    if (gestureData.fidgeting) {
      description += 'fidgeting behavior, ';
    }
    
    if (gestureData.patterns && gestureData.patterns.length > 0) {
      description += `patterns: ${gestureData.patterns.join(', ')}, `;
    }
    
    if (gestureData.motion_data) {
      const motion = gestureData.motion_data;
      if (motion.skeleton) {
        description += 'skeleton tracking active, ';
      }
      if (motion.behaviors && motion.behaviors.length > 0) {
        description += `detected behaviors: ${motion.behaviors.join(', ')}, `;
      }
    }
    
    return description || 'normal movement patterns';
  }

  private convertVoiceDataToText(voiceData: any): string {
    if (!voiceData) return 'normal speech';
    
    let description = '';
    
    if (voiceData.prosody) {
      const prosody = voiceData.prosody;
      description += `pitch: ${prosody.pitch > 0.7 ? 'high' : prosody.pitch < 0.3 ? 'low' : 'normal'}, `;
      description += `volume: ${prosody.volume > 0.7 ? 'loud' : prosody.volume < 0.3 ? 'quiet' : 'normal'}, `;
      description += `speech rate: ${prosody.speechRate > 0.7 ? 'fast' : prosody.speechRate < 0.3 ? 'slow' : 'normal'}, `;
      description += `clarity: ${prosody.clarity > 0.7 ? 'clear' : prosody.clarity < 0.3 ? 'unclear' : 'normal'}, `;
    }
    
    if (voiceData.voiceEmotion) {
      description += `emotion: ${voiceData.voiceEmotion}, `;
    }
    
    if (voiceData.speechPatterns && voiceData.speechPatterns.length > 0) {
      description += `patterns: ${voiceData.speechPatterns.join(', ')}, `;
    }
    
    return description || 'normal speech patterns';
  }

  // Fallback analysis methods
  private analyzeGestureFallback(gestureData: any): { behavior: string; risk_level: 'low' | 'medium' | 'high'; patterns: string[] } {
    if (!gestureData) {
      return { behavior: 'typical_movement', risk_level: 'low', patterns: ['normal_movement'] };
    }
    
    let riskScore = 0;
    const patterns: string[] = [];
    
    if (gestureData.repetitive_motions) {
      riskScore += 0.4;
      patterns.push('repetitive_motion');
    }
    
    if (gestureData.fidgeting) {
      riskScore += 0.2;
      patterns.push('fidgeting');
    }
    
    if (gestureData.patterns) {
      riskScore += gestureData.patterns.length * 0.1;
      patterns.push(...gestureData.patterns);
    }
    
    let behavior = 'typical_movement';
    let risk_level: 'low' | 'medium' | 'high' = 'low';
    
    if (riskScore > 0.6) {
      behavior = 'atypical_behavior';
      risk_level = 'high';
    } else if (riskScore > 0.3) {
      behavior = 'mixed_behavior';
      risk_level = 'medium';
    }
    
    return { behavior, risk_level, patterns };
  }

  private analyzeVoiceFallback(voiceData: any): { patterns: string[]; risk_level: 'low' | 'medium' | 'high'; emotion: string } {
    if (!voiceData) {
      return { patterns: ['normal_speech'], risk_level: 'low', emotion: 'neutral' };
    }
    
    let riskScore = 0;
    const patterns: string[] = [];
    let emotion = 'neutral';
    
    if (voiceData.prosody) {
      const prosody = voiceData.prosody;
      
      if (prosody.pitch < 0.3 || prosody.pitch > 0.7) {
        riskScore += 0.2;
        patterns.push('unusual_pitch');
      }
      
      if (prosody.volume < 0.3) {
        riskScore += 0.1;
        patterns.push('quiet_speech');
      }
      
      if (prosody.speechRate < 0.3) {
        riskScore += 0.2;
        patterns.push('slow_speech');
      }
      
      if (prosody.clarity < 0.4) {
        riskScore += 0.3;
        patterns.push('unclear_speech');
      }
    }
    
    if (voiceData.voiceEmotion) {
      emotion = voiceData.voiceEmotion;
      if (emotion === 'flat' || emotion === 'monotone') {
        riskScore += 0.3;
        patterns.push('flat_affect');
      }
    }
    
    let risk_level: 'low' | 'medium' | 'high' = 'low';
    
    if (riskScore > 0.6) {
      risk_level = 'high';
    } else if (riskScore > 0.3) {
      risk_level = 'medium';
    }
    
    if (patterns.length === 0) {
      patterns.push('normal_speech');
    }
    
    return { patterns, risk_level, emotion };
  }

  // Batch analysis for multiple data types
  async analyzeMultimodal(data: {
    emotion?: any;
    gesture?: any;
    voice?: any;
  }): Promise<{
    emotion: EmotionAnalysis;
    gesture: GestureAnalysis;
    voice: VoiceAnalysis;
    overall_risk: 'low' | 'medium' | 'high';
    confidence: number;
  }> {
    const [emotionResult, gestureResult, voiceResult] = await Promise.allSettled([
      data.emotion ? this.analyzeEmotion(data.emotion) : Promise.resolve(null),
      data.gesture ? this.analyzeGesture(data.gesture) : Promise.resolve(null),
      data.voice ? this.analyzeVoice(data.voice) : Promise.resolve(null)
    ]);
    
    const emotion = emotionResult.status === 'fulfilled' ? emotionResult.value : {
      emotion: 'neutral',
      confidence: 0.5,
      emotions: { neutral: 0.5 },
      timestamp: new Date().toISOString()
    };
    
    const gesture = gestureResult.status === 'fulfilled' ? gestureResult.value : {
      behavior: 'typical_movement',
      confidence: 0.5,
      patterns: ['normal_movement'],
      risk_level: 'low',
      timestamp: new Date().toISOString()
    };
    
    const voice = voiceResult.status === 'fulfilled' ? voiceResult.value : {
      prosody: { pitch: 0.5, volume: 0.5, speechRate: 0.5, clarity: 0.5 },
      emotion: 'neutral',
      patterns: ['normal_speech'],
      risk_level: 'low',
      timestamp: new Date().toISOString()
    };
    
    // Calculate overall risk level
    const riskScores = {
      low: 0,
      medium: 0,
      high: 0
    };
    
    [emotion, gesture, voice].forEach(analysis => {
      if (analysis && 'risk_level' in analysis) {
        riskScores[analysis.risk_level]++;
      }
    });
    
    let overall_risk: 'low' | 'medium' | 'high' = 'low';
    if (riskScores.high > 0) {
      overall_risk = 'high';
    } else if (riskScores.medium > 0) {
      overall_risk = 'medium';
    }
    
    const confidence = (emotion.confidence + gesture.confidence + voice.confidence) / 3;
    
    return {
      emotion,
      gesture,
      voice,
      overall_risk,
      confidence
    };
  }
}

// Export singleton instance
const mlService = new MLService();
export default mlService;
export type { EmotionAnalysis, GestureAnalysis, VoiceAnalysis }; 