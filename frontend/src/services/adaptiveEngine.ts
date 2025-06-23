import { questions, Question } from './questions';

export interface ConversationEntry {
  question: string;
  response: string;
  emotion?: string;
  emotionConfidence?: number;
  timestamp: Date;
  domain?: string;
}

export interface AdaptiveQuestionRequest {
  history: ConversationEntry[];
  emotion: string;
  emotionConfidence?: number;
}

export interface AdaptiveQuestionResponse {
  question: string;
  reasoning: string;
  domain: string;
  severity: 'mild' | 'moderate' | 'severe';
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
  //     max_tokens: 500,
  //     temperature: 0.7,
  //   }),
  // });
  // const data = await response.json();
  // return data.choices[0].message.content;

  // Mock response for development
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
  
  const mockResponses = [
    {
      question: "Do you find it difficult to understand sarcasm or jokes that rely on tone of voice?",
      reasoning: "Based on the user's anxious emotional state and previous responses, focusing on social communication challenges would be most appropriate.",
      domain: "Social Communication",
      severity: "moderate" as const
    },
    {
      question: "Do you prefer to follow strict routines and become upset when they are disrupted?",
      reasoning: "The user's emotional responses suggest potential sensitivity to changes, making routine-related questions relevant.",
      domain: "Restricted Behaviors",
      severity: "mild" as const
    },
    {
      question: "Are you unusually sensitive to certain sounds, lights, or textures?",
      reasoning: "Given the user's emotional state, exploring sensory sensitivities could provide valuable insights.",
      domain: "Sensory Processing",
      severity: "moderate" as const
    }
  ];
  
  const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
  return JSON.stringify(randomResponse);
};

export const getNextQuestion = async (request: AdaptiveQuestionRequest): Promise<AdaptiveQuestionResponse> => {
  try {
    const { history, emotion, emotionConfidence } = request;

    // Build conversation history for the prompt
    const conversationText = history.map(h => 
      `Q: ${h.question}\nA: ${h.response}${h.emotion ? ` (Emotion: ${h.emotion}, Confidence: ${(h.emotionConfidence || 0 * 100).toFixed(1)}%)` : ''}`
    ).join('\n\n');

    // Create the prompt for GPT-4
    const prompt = `You are an expert clinical psychologist conducting an adaptive ASD screening assessment. 

Given the conversation history:
${conversationText}

And the user's current detected emotion: "${emotion}" (confidence: ${(emotionConfidence || 0 * 100).toFixed(1)}%)

Please provide the next most appropriate ASD screening question according to DSM-5 criteria. Consider:
1. The user's emotional state and how it might affect their responses
2. Areas that haven't been explored yet based on the conversation
3. Follow-up questions based on previous responses
4. DSM-5 diagnostic criteria for Autism Spectrum Disorder

Return your response as a JSON object with this exact structure:
{
  "question": "The next screening question",
  "reasoning": "Brief explanation of why this question is appropriate",
  "domain": "The DSM-5 domain this question addresses",
  "severity": "mild|moderate|severe"
}

Focus on being empathetic and adaptive to the user's emotional state.`;

    const response = await callOpenAI(prompt);
    
    try {
      const parsedResponse = JSON.parse(response);
      
      // Validate the response structure
      if (!parsedResponse.question || !parsedResponse.reasoning || !parsedResponse.domain || !parsedResponse.severity) {
        throw new Error('Invalid response structure from AI');
      }

      return {
        question: parsedResponse.question,
        reasoning: parsedResponse.reasoning,
        domain: parsedResponse.domain,
        severity: parsedResponse.severity,
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to a predefined question
      return getFallbackQuestion(history, request.emotion);
    }

  } catch (error) {
    console.error('Error getting next question:', error);
    return getFallbackQuestion(request.history, request.emotion);
  }
};

// Fallback function that selects questions from our predefined set
const getFallbackQuestion = (history: ConversationEntry[], emotion: string): AdaptiveQuestionResponse => {
  const usedQuestions = new Set(history.map(h => h.question));
  const availableQuestions = questions.filter(q => !usedQuestions.has(q.text));
  
  if (availableQuestions.length === 0) {
    // If all questions are used, return a follow-up question
    return {
      question: "Thank you for your responses. Is there anything else you'd like to share about your experiences?",
      reasoning: "All screening questions completed, providing opportunity for additional information",
      domain: "General",
      severity: "mild"
    };
  }

  // Select question based on emotion and history
  let selectedQuestion: Question;
  
  if (emotion === 'anxious' || emotion === 'fearful') {
    // Focus on social communication for anxious users
    selectedQuestion = availableQuestions.find(q => q.domain === 'Social Communication') || availableQuestions[0];
  } else if (emotion === 'sad' || emotion === 'angry') {
    // Focus on sensory processing for distressed users
    selectedQuestion = availableQuestions.find(q => q.domain === 'Sensory Sensitivity') || availableQuestions[0];
  } else {
    // Random selection for neutral/positive emotions
    selectedQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  }

  return {
    question: selectedQuestion.text,
    reasoning: `Selected from predefined questions based on emotion: ${emotion}`,
    domain: selectedQuestion.domain,
    severity: selectedQuestion.severity,
  };
};

// Helper function to get question statistics
export const getQuestionStats = (history: ConversationEntry[]) => {
  const domains = history.map(h => h.domain).filter(Boolean);
  const emotions = history.map(h => h.emotion).filter(Boolean);
  
  return {
    totalQuestions: history.length,
    domainsCovered: [...new Set(domains)],
    emotionHistory: emotions,
    averageEmotionConfidence: history
      .map(h => h.emotionConfidence || 0)
      .reduce((sum, conf) => sum + conf, 0) / history.length || 0,
  };
}; 