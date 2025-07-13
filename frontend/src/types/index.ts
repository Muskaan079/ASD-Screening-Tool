export interface EmotionLogEntry {
  timestamp: Date;
  emotionLabel: string;
  confidence: number;
  intensity?: number;
} 