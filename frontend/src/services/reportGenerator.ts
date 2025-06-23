import { ConversationEntry } from './adaptiveEngine';

export interface EmotionLogEntry {
  timestamp: Date;
  emotionLabel: string;
  confidence: number;
}

export interface ClinicalReportRequest {
  history: ConversationEntry[];
  emotionLog: EmotionLogEntry[];
  sessionDuration: number; // in minutes
}

export interface ClinicalReport {
  summary: string;
  domainsAddressed: string[];
  keyObservations: string[];
  emotionalStateTrends: string[];
  riskAreas: string[];
  recommendations: string[];
  sessionMetadata: {
    totalQuestions: number;
    sessionDuration: number;
    emotionVariability: number;
    primaryEmotions: string[];
  };
}

// Mock OpenAI API call - replace with actual implementation
const callOpenAI = async (_prompt: string): Promise<string> => {
  // TODO: Replace with actual OpenAI API call
  // const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     model: 'gpt-4',
  //     messages: [{ role: 'user', content: prompt }],
  //     max_tokens: 1500,
  //     temperature: 0.7,
  //   }),
  // });
  // const data = await response.json();
  // return data.choices[0].message.content;

  // Mock response for development
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
  
  const mockReport = {
    summary: "The screening session revealed several areas of interest related to social communication and sensory processing. The participant demonstrated consistent patterns in their responses that warrant further clinical evaluation.",
    domainsAddressed: ["Social Communication", "Sensory Processing", "Restricted Behaviors"],
    keyObservations: [
      "Expressed difficulty with understanding social cues and sarcasm",
      "Reported sensitivity to certain sounds and textures",
      "Showed preference for routine and structure",
      "Demonstrated limited eye contact during conversation"
    ],
    emotionalStateTrends: [
      "Initial anxiety that gradually decreased throughout the session",
      "Consistent neutral baseline with occasional anxious spikes",
      "Emotional responses were appropriate to question content"
    ],
    riskAreas: [
      "Social communication challenges may impact daily interactions",
      "Sensory sensitivities could affect environmental adaptation",
      "Rigidity in routines may limit flexibility"
    ],
    recommendations: [
      "Recommend comprehensive clinical evaluation by licensed psychologist",
      "Consider occupational therapy assessment for sensory processing",
      "Explore social skills training programs",
      "Monitor for any changes in behavioral patterns"
    ]
  };
  
  return JSON.stringify(mockReport);
};

export const generateClinicalReport = async (request: ClinicalReportRequest): Promise<ClinicalReport> => {
  try {
    const { history, emotionLog, sessionDuration } = request;

    // Build conversation transcript
    const conversationText = history.map(h => 
      `Q: ${h.question}\nA: ${h.response}${h.emotion ? ` (Emotion: ${h.emotion}, Confidence: ${(h.emotionConfidence || 0 * 100).toFixed(1)}%)` : ''}`
    ).join('\n\n');

    // Analyze emotion trends
    const emotions = emotionLog.map(e => e.emotionLabel);
    const primaryEmotions = getMostFrequentEmotions(emotions, 3);
    const emotionVariability = calculateEmotionVariability(emotionLog);

    // Create the prompt for GPT-4
    const prompt = `You are a clinical assistant specializing in behavioral assessment. 

Given this ASD screening session transcript and emotional observations, generate a DSM-5 aligned clinical report summarizing the participant's behavioral patterns, risk areas, and recommendations.

CONVERSATION TRANSCRIPT:
${conversationText}

EMOTIONAL OBSERVATIONS:
${emotionLog.map(e => `${e.timestamp.toLocaleTimeString()}: ${e.emotionLabel} (${(e.confidence * 100).toFixed(1)}% confidence)`).join('\n')}

SESSION METADATA:
- Duration: ${sessionDuration} minutes
- Total Questions: ${history.length}
- Primary Emotions: ${primaryEmotions.join(', ')}
- Emotion Variability: ${emotionVariability.toFixed(2)}

IMPORTANT: Do NOT provide a diagnosis. Only generate structured observations and recommendations for further evaluation.

Return your response as a JSON object with this exact structure:
{
  "summary": "Brief overview of the session and key findings",
  "domainsAddressed": ["List of DSM-5 domains covered in the screening"],
  "keyObservations": ["Specific behavioral observations from responses"],
  "emotionalStateTrends": ["Patterns in emotional responses throughout session"],
  "riskAreas": ["Areas that may require attention or support"],
  "recommendations": ["Specific recommendations for next steps"]
}

Use professional clinical language and focus on observable behaviors and patterns.`;

    const response = await callOpenAI(prompt);
    
    try {
      const parsedResponse = JSON.parse(response);
      
      // Validate the response structure
      const requiredFields = ['summary', 'domainsAddressed', 'keyObservations', 'emotionalStateTrends', 'riskAreas', 'recommendations'];
      const missingFields = requiredFields.filter(field => !parsedResponse[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Calculate session metadata
      const sessionMetadata = {
        totalQuestions: history.length,
        sessionDuration,
        emotionVariability,
        primaryEmotions,
      };

      return {
        ...parsedResponse,
        sessionMetadata,
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return generateFallbackReport(request);
    }

  } catch (error) {
    console.error('Error generating clinical report:', error);
    return generateFallbackReport(request);
  }
};

// Helper functions
const getMostFrequentEmotions = (emotions: string[], count: number): string[] => {
  const emotionCounts = emotions.reduce((acc, emotion) => {
    acc[emotion] = (acc[emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(emotionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, count)
    .map(([emotion]) => emotion);
};

const calculateEmotionVariability = (emotionLog: EmotionLogEntry[]): number => {
  if (emotionLog.length < 2) return 0;
  
  const uniqueEmotions = new Set(emotionLog.map(e => e.emotionLabel));
  return uniqueEmotions.size / emotionLog.length;
};

// Fallback report generator
const generateFallbackReport = (request: ClinicalReportRequest): ClinicalReport => {
  const { history, emotionLog, sessionDuration } = request;
  const emotions = emotionLog.map(e => e.emotionLabel);
  const primaryEmotions = getMostFrequentEmotions(emotions, 3);
  const emotionVariability = calculateEmotionVariability(emotionLog);

  // Extract domains from history
  const domains = [...new Set(history.map(h => h.domain).filter((domain): domain is string => Boolean(domain)))];

  return {
    summary: "A screening session was conducted to assess various behavioral and communication patterns. The session covered multiple domains relevant to developmental assessment.",
    domainsAddressed: domains.length > 0 ? domains : ["General Assessment"],
    keyObservations: [
      "Participant engaged in the screening process",
      "Responses were provided for all questions",
      "Emotional state was monitored throughout the session"
    ],
    emotionalStateTrends: [
      `Primary emotions observed: ${primaryEmotions.join(', ')}`,
      "Emotional responses were recorded throughout the session"
    ],
    riskAreas: [
      "Further clinical evaluation recommended for comprehensive assessment"
    ],
    recommendations: [
      "Schedule follow-up with qualified mental health professional",
      "Consider comprehensive developmental evaluation",
      "Monitor for any behavioral changes or concerns"
    ],
    sessionMetadata: {
      totalQuestions: history.length,
      sessionDuration,
      emotionVariability,
      primaryEmotions,
    },
  };
};

// Export helper function for PDF generation
export const generatePDFContent = (report: ClinicalReport): string => {
  return `
Clinical Screening Report
Generated: ${new Date().toLocaleDateString()}

SUMMARY
${report.summary}

DOMAINS ADDRESSED
${report.domainsAddressed.map(domain => `• ${domain}`).join('\n')}

KEY OBSERVATIONS
${report.keyObservations.map(obs => `• ${obs}`).join('\n')}

EMOTIONAL STATE TRENDS
${report.emotionalStateTrends.map(trend => `• ${trend}`).join('\n')}

RISK AREAS
${report.riskAreas.map(risk => `• ${risk}`).join('\n')}

RECOMMENDATIONS
${report.recommendations.map(rec => `• ${rec}`).join('\n')}

SESSION METADATA
• Total Questions: ${report.sessionMetadata.totalQuestions}
• Session Duration: ${report.sessionMetadata.sessionDuration} minutes
• Primary Emotions: ${report.sessionMetadata.primaryEmotions.join(', ')}
• Emotion Variability: ${report.sessionMetadata.emotionVariability.toFixed(2)}

DISCLAIMER
This report is based on a screening session and should not be considered a clinical diagnosis. 
Please consult with a qualified mental health professional for comprehensive evaluation.
  `.trim();
}; 