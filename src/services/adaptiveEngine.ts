import { 
  AdaptiveQuestioningData, 
  VoiceAnalysis, 
  FacialAnalysis, 
  ResponseMetrics,
  QuestionResponse,
  LLMAnalysis 
} from '../types';

interface Question {
  id: string;
  text: string;
  type: 'cognitive' | 'emotional' | 'social';
  difficulty: 'easy' | 'medium' | 'hard';
  expectedResponseTime: number;
  adaptiveFactors: {
    voiceTone: Partial<VoiceAnalysis>;
    facialExpression: Partial<FacialAnalysis>;
    responseMetrics: Partial<ResponseMetrics>;
  };
}

class AdaptiveQuestioningEngine {
  private questions: Question[] = [];
  private currentQuestionIndex = 0;
  private questionHistory: QuestionResponse[] = [];
  private adaptiveData: AdaptiveQuestioningData | null = null;

  constructor() {
    this.initializeQuestions();
  }

  private initializeQuestions(): void {
    this.questions = [
      // Cognitive Questions
      {
        id: 'cog_1',
        text: 'What comes next in this pattern: 2, 4, 6, 8, ...?',
        type: 'cognitive',
        difficulty: 'easy',
        expectedResponseTime: 5000,
        adaptiveFactors: {
          voiceTone: { emotion: 'neutral' },
          facialExpression: { confusion: 0.2 },
          responseMetrics: { accuracy: 0.8 }
        }
      },
      {
        id: 'cog_2',
        text: 'If you have 3 red balls and 2 blue balls, how many balls do you have in total?',
        type: 'cognitive',
        difficulty: 'easy',
        expectedResponseTime: 3000,
        adaptiveFactors: {
          voiceTone: { emotion: 'neutral' },
          facialExpression: { confusion: 0.1 },
          responseMetrics: { accuracy: 0.9 }
        }
      },
      {
        id: 'cog_3',
        text: 'Complete this sequence: 1, 3, 6, 10, 15, ...?',
        type: 'cognitive',
        difficulty: 'medium',
        expectedResponseTime: 8000,
        adaptiveFactors: {
          voiceTone: { emotion: 'confused' },
          facialExpression: { confusion: 0.5 },
          responseMetrics: { accuracy: 0.6 }
        }
      },
      {
        id: 'cog_4',
        text: 'What is the sum of all numbers from 1 to 10?',
        type: 'cognitive',
        difficulty: 'hard',
        expectedResponseTime: 12000,
        adaptiveFactors: {
          voiceTone: { emotion: 'frustrated' },
          facialExpression: { confusion: 0.8 },
          responseMetrics: { accuracy: 0.4 }
        }
      },

      // Emotional Questions
      {
        id: 'emo_1',
        text: 'How would you feel if someone gave you a gift?',
        type: 'emotional',
        difficulty: 'easy',
        expectedResponseTime: 4000,
        adaptiveFactors: {
          voiceTone: { emotion: 'excited' },
          facialExpression: { 
            expressions: { 
              happy: 0.7, sad: 0.1, angry: 0.05, surprised: 0.05, 
              fearful: 0.05, disgusted: 0.05, neutral: 0.1 
            } 
          },
          responseMetrics: { accuracy: 0.8 }
        }
      },
      {
        id: 'emo_2',
        text: 'What emotion do you see in this person\'s face?',
        type: 'emotional',
        difficulty: 'medium',
        expectedResponseTime: 6000,
        adaptiveFactors: {
          voiceTone: { emotion: 'neutral' },
          facialExpression: { confusion: 0.3 },
          responseMetrics: { accuracy: 0.7 }
        }
      },
      {
        id: 'emo_3',
        text: 'How would you comfort someone who is sad?',
        type: 'emotional',
        difficulty: 'hard',
        expectedResponseTime: 10000,
        adaptiveFactors: {
          voiceTone: { emotion: 'anxious' },
          facialExpression: { confusion: 0.6 },
          responseMetrics: { accuracy: 0.5 }
        }
      },

      // Social Questions
      {
        id: 'soc_1',
        text: 'What would you do if someone asked to play with you?',
        type: 'social',
        difficulty: 'easy',
        expectedResponseTime: 4000,
        adaptiveFactors: {
          voiceTone: { emotion: 'excited' },
          facialExpression: { 
            expressions: { 
              happy: 0.6, sad: 0.1, angry: 0.05, surprised: 0.1, 
              fearful: 0.05, disgusted: 0.05, neutral: 0.15 
            } 
          },
          responseMetrics: { accuracy: 0.8 }
        }
      },
      {
        id: 'soc_2',
        text: 'How would you start a conversation with a new friend?',
        type: 'social',
        difficulty: 'medium',
        expectedResponseTime: 7000,
        adaptiveFactors: {
          voiceTone: { emotion: 'anxious' },
          facialExpression: { confusion: 0.4 },
          responseMetrics: { accuracy: 0.6 }
        }
      },
      {
        id: 'soc_3',
        text: 'What would you do if you saw someone being bullied?',
        type: 'social',
        difficulty: 'hard',
        expectedResponseTime: 12000,
        adaptiveFactors: {
          voiceTone: { emotion: 'confused' },
          facialExpression: { confusion: 0.7 },
          responseMetrics: { accuracy: 0.4 }
        }
      }
    ];
  }

  public setAdaptiveData(data: AdaptiveQuestioningData): void {
    this.adaptiveData = data;
  }

  public addQuestionResponse(response: QuestionResponse): void {
    this.questionHistory.push(response);
    this.updateAdaptiveFactors(response);
  }

  private updateAdaptiveFactors(response: QuestionResponse): void {
    if (!this.adaptiveData) return;

    // Update voice tone analysis
    this.adaptiveData.voiceTone = response.adaptiveFactors.voiceTone;
    
    // Update facial expression analysis
    this.adaptiveData.facialExpression = response.adaptiveFactors.facialExpression;
    
    // Update response metrics
    this.adaptiveData.responseMetrics = {
      responseTime: response.responseTime,
      accuracy: response.accuracy,
      confidence: this.calculateConfidence(response),
      hesitation: this.calculateHesitation(response),
      corrections: this.countCorrections(response.response)
    };

    // Adjust difficulty based on performance
    this.adjustDifficulty(response);
  }

  private calculateConfidence(response: QuestionResponse): number {
    // Calculate confidence based on response time and accuracy
    const timeConfidence = Math.max(0, 1 - (response.responseTime / 10000));
    const accuracyConfidence = response.accuracy;
    return (timeConfidence + accuracyConfidence) / 2;
  }

  private calculateHesitation(response: QuestionResponse): number {
    // Calculate hesitation based on response time vs expected
    const currentQuestion = this.questions.find(q => q.id === response.questionId);
    if (!currentQuestion) return 0;

    const expectedTime = currentQuestion.expectedResponseTime;
    const actualTime = response.responseTime;
    
    return Math.max(0, (actualTime - expectedTime) / expectedTime);
  }

  private countCorrections(response: string): number {
    // Count corrections in speech (simplified)
    const correctionWords = ['um', 'uh', 'like', 'you know', 'i mean'];
    return correctionWords.reduce((count, word) => {
      const regex = new RegExp(word, 'gi');
      return count + (response.match(regex)?.length || 0);
    }, 0);
  }

  private adjustDifficulty(response: QuestionResponse): void {
    if (!this.adaptiveData) return;

    const currentDifficulty = this.adaptiveData.currentDifficulty;
    const performance = this.calculateOverallPerformance();

    if (performance > 0.8 && currentDifficulty !== 'hard') {
      // Increase difficulty
      this.adaptiveData.currentDifficulty = this.getNextDifficulty(currentDifficulty, 'up');
    } else if (performance < 0.4 && currentDifficulty !== 'easy') {
      // Decrease difficulty
      this.adaptiveData.currentDifficulty = this.getNextDifficulty(currentDifficulty, 'down');
    }
  }

  private calculateOverallPerformance(): number {
    if (this.questionHistory.length === 0) return 0.5;

    const recentResponses = this.questionHistory.slice(-5); // Last 5 responses
    const avgAccuracy = recentResponses.reduce((sum, r) => sum + r.accuracy, 0) / recentResponses.length;
    const avgConfidence = recentResponses.reduce((sum, r) => sum + this.calculateConfidence(r), 0) / recentResponses.length;

    return (avgAccuracy + avgConfidence) / 2;
  }

  private getNextDifficulty(current: string, direction: 'up' | 'down'): 'easy' | 'medium' | 'hard' {
    const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
    const currentIndex = difficulties.indexOf(current as any);
    
    if (direction === 'up' && currentIndex < difficulties.length - 1) {
      return difficulties[currentIndex + 1];
    } else if (direction === 'down' && currentIndex > 0) {
      return difficulties[currentIndex - 1];
    }
    
    return current as 'easy' | 'medium' | 'hard';
  }

  public getNextQuestion(): Question | null {
    if (this.currentQuestionIndex >= this.questions.length) {
      return null; // All questions completed
    }

    const availableQuestions = this.questions.filter(q => 
      q.difficulty === this.adaptiveData?.currentDifficulty
    );

    if (availableQuestions.length === 0) {
      // Fallback to any question of current difficulty
      return this.questions[this.currentQuestionIndex];
    }

    // Select question based on adaptive factors
    const selectedQuestion = this.selectOptimalQuestion(availableQuestions);
    this.currentQuestionIndex++;
    
    return selectedQuestion;
  }

  private selectOptimalQuestion(availableQuestions: Question[]): Question {
    if (!this.adaptiveData) {
      return availableQuestions[0];
    }

    // Score questions based on current adaptive factors
    const scoredQuestions = availableQuestions.map(question => {
      const score = this.calculateQuestionScore(question);
      return { question, score };
    });

    // Sort by score and return the best match
    scoredQuestions.sort((a, b) => b.score - a.score);
    return scoredQuestions[0].question;
  }

  private calculateQuestionScore(question: Question): number {
    if (!this.adaptiveData) return 0;

    let score = 0;

    // Voice tone matching
    if (question.adaptiveFactors.voiceTone.emotion === this.adaptiveData.voiceTone.emotion) {
      score += 0.3;
    }

    // Facial expression matching
    const confusionMatch = Math.abs(
      (question.adaptiveFactors.facialExpression.confusion || 0) - 
      this.adaptiveData.facialExpression.confusion
    );
    score += Math.max(0, 0.2 - confusionMatch);

    // Response metrics matching
    const accuracyMatch = Math.abs(
      (question.adaptiveFactors.responseMetrics.accuracy || 0) - 
      this.adaptiveData.responseMetrics.accuracy
    );
    score += Math.max(0, 0.2 - accuracyMatch);

    // Question type diversity
    const recentTypes = this.questionHistory.slice(-3).map(r => {
      const q = this.questions.find(question => question.id === r.questionId);
      return q?.type;
    });
    
    if (!recentTypes.includes(question.type)) {
      score += 0.3; // Bonus for different question type
    }

    return score;
  }

  public getSessionSummary(): {
    totalQuestions: number;
    averageAccuracy: number;
    averageResponseTime: number;
    difficultyProgression: string[];
    adaptiveAdjustments: number;
  } {
    const totalQuestions = this.questionHistory.length;
    const averageAccuracy = this.questionHistory.reduce((sum, r) => sum + r.accuracy, 0) / totalQuestions;
    const averageResponseTime = this.questionHistory.reduce((sum, r) => sum + r.responseTime, 0) / totalQuestions;
    
    const difficultyProgression = this.questionHistory.map(r => r.difficulty);
    
    const adaptiveAdjustments = difficultyProgression.reduce((count, difficulty, index) => {
      if (index > 0 && difficulty !== difficultyProgression[index - 1]) {
        return count + 1;
      }
      return count;
    }, 0);

    return {
      totalQuestions,
      averageAccuracy,
      averageResponseTime,
      difficultyProgression,
      adaptiveAdjustments
    };
  }

  public reset(): void {
    this.currentQuestionIndex = 0;
    this.questionHistory = [];
    this.adaptiveData = null;
  }
}

export const adaptiveEngine = new AdaptiveQuestioningEngine(); 