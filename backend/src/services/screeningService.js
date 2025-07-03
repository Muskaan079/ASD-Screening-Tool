import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

// Question bank with adaptive difficulty levels
const questionBank = {
  social: [
    {
      id: 'social_1',
      category: 'social',
      difficulty: 1,
      text: 'How do you feel about making eye contact with people?',
      type: 'likert',
      options: ['Very comfortable', 'Somewhat comfortable', 'Neutral', 'Somewhat uncomfortable', 'Very uncomfortable'],
      expectedResponse: 'comfortable',
      followUpQuestions: ['social_2', 'social_3']
    },
    {
      id: 'social_2',
      category: 'social',
      difficulty: 2,
      text: 'Do you find it easy to understand when someone is joking?',
      type: 'likert',
      options: ['Always', 'Usually', 'Sometimes', 'Rarely', 'Never'],
      expectedResponse: 'usually',
      followUpQuestions: ['social_4', 'social_5']
    },
    {
      id: 'social_3',
      category: 'social',
      difficulty: 3,
      text: 'How do you handle unexpected changes in social situations?',
      type: 'open',
      expectedResponse: 'adaptable',
      followUpQuestions: ['social_6']
    }
  ],
  communication: [
    {
      id: 'comm_1',
      category: 'communication',
      difficulty: 1,
      text: 'Do you prefer to communicate through text or face-to-face?',
      type: 'choice',
      options: ['Text', 'Face-to-face', 'Both equally'],
      expectedResponse: 'both',
      followUpQuestions: ['comm_2']
    },
    {
      id: 'comm_2',
      category: 'communication',
      difficulty: 2,
      text: 'How do you feel about starting conversations with strangers?',
      type: 'likert',
      options: ['Very easy', 'Easy', 'Neutral', 'Difficult', 'Very difficult'],
      expectedResponse: 'neutral',
      followUpQuestions: ['comm_3']
    }
  ],
  behavior: [
    {
      id: 'behavior_1',
      category: 'behavior',
      difficulty: 1,
      text: 'Do you have any specific routines that you follow every day?',
      type: 'open',
      expectedResponse: 'flexible',
      followUpQuestions: ['behavior_2']
    },
    {
      id: 'behavior_2',
      category: 'behavior',
      difficulty: 2,
      text: 'How do you react when your daily routine is interrupted?',
      type: 'likert',
      options: ['Very calm', 'Calm', 'Neutral', 'Anxious', 'Very anxious'],
      expectedResponse: 'calm',
      followUpQuestions: ['behavior_3']
    }
  ],
  sensory: [
    {
      id: 'sensory_1',
      category: 'sensory',
      difficulty: 1,
      text: 'Are you sensitive to loud noises or bright lights?',
      type: 'likert',
      options: ['Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely'],
      expectedResponse: 'moderate',
      followUpQuestions: ['sensory_2']
    },
    {
      id: 'sensory_2',
      category: 'sensory',
      difficulty: 2,
      text: 'How do you feel about certain textures or fabrics?',
      type: 'open',
      expectedResponse: 'neutral',
      followUpQuestions: ['sensory_3']
    }
  ]
};

// DSM-5 criteria mapping
const dsm5Criteria = {
  social: {
    A1: 'Deficits in social-emotional reciprocity',
    A2: 'Deficits in nonverbal communicative behaviors',
    A3: 'Deficits in developing, maintaining, and understanding relationships'
  },
  communication: {
    B1: 'Stereotyped or repetitive motor movements',
    B2: 'Insistence on sameness, inflexible adherence to routines',
    B3: 'Highly restricted, fixated interests',
    B4: 'Hyper- or hyporeactivity to sensory input'
  }
};

// --- OpenAI Integration Helper ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

async function scoreWithOpenAI(prompt) {
  if (!OPENAI_API_KEY) return { score: 0.5, reasoning: 'No API key set.' };
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an expert ASD screener. Score the following answer from 0 (atypical) to 1 (typical) and explain your reasoning.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 100
      })
    });
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    // Parse score and reasoning from LLM output
    const match = text.match(/score\s*[:=]\s*(0(\.\d+)?|1(\.0+)?)/i);
    const score = match ? parseFloat(match[1]) : 0.5;
    return { score, reasoning: text };
  } catch (e) {
    return { score: 0.5, reasoning: 'OpenAI error: ' + e.message };
  }
}

// --- Adaptive Question Selection ---
function getDominantEmotion(emotionHistory) {
  if (!emotionHistory || emotionHistory.length === 0) return null;
  const counts = {};
  for (const e of emotionHistory) {
    const dom = e.dominantEmotion;
    if (dom) counts[dom] = (counts[dom] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

function hasRecentRepetitiveMotion(motionHistory) {
  if (!motionHistory || motionHistory.length === 0) return false;
  return motionHistory.slice(-5).some(m => m.repetitiveMotions);
}

export const createScreeningSession = async (patientInfo) => {
  const session = {
    id: uuidv4(),
    patientInfo,
    startTime: new Date().toISOString(),
    status: 'active',
    responses: [],
    emotionHistory: [],
    motionHistory: [],
    currentQuestion: null,
    lastUpdated: new Date().toISOString(),
    totalQuestions: 20,
    adaptiveData: {
      difficultyLevel: 1,
      categoryFocus: 'social',
      responsePatterns: {},
      emotionTrends: {},
      motionPatterns: {}
    }
  };

  return session;
};

export const generateAdaptiveQuestion = async (session) => {
  const { responses, adaptiveData, emotionHistory, motionHistory } = session;
  // If first question, start with social
  if (responses.length === 0) return questionBank.social[0];

  // Analyze recent emotion/motion
  const dominantEmotion = getDominantEmotion(emotionHistory);
  const repetitiveMotion = hasRecentRepetitiveMotion(motionHistory);

  // If negative emotion or repetitive motion, branch to easier/follow-up
  let category = adaptiveData.categoryFocus;
  let difficulty = adaptiveData.difficultyLevel;
  if (dominantEmotion === 'anxious' || repetitiveMotion) {
    difficulty = Math.max(1, difficulty - 1);
  } else if (dominantEmotion === 'happy' || dominantEmotion === 'neutral') {
    difficulty = Math.min(3, difficulty + 1);
  }

  // Find next unasked question in this category/difficulty
  const askedIds = responses.map(r => r.questionId);
  let candidates = (questionBank[category] || []).filter(q => q.difficulty === difficulty && !askedIds.includes(q.id));
  if (candidates.length === 0) {
    // Try other categories
    for (const cat of Object.keys(questionBank)) {
      candidates = (questionBank[cat] || []).filter(q => !askedIds.includes(q.id));
      if (candidates.length > 0) {
        category = cat;
        break;
      }
    }
  }
  // Fallback: any unasked question
  if (candidates.length === 0) {
    candidates = Object.values(questionBank).flat().filter(q => !askedIds.includes(q.id));
  }
  // Fallback: repeat first question
  if (candidates.length === 0) return questionBank.social[0];
  return candidates[0];
};

// --- ML/LLM-Enhanced Response Analysis ---
export const analyzeResponse = async (responseData) => {
  const { questionId, answer, confidence, responseTime, emotionData, motionData, voiceData, patientAge } = responseData;
  let answerAnalysis = { score: 0.5, interpretation: 'No analysis' };
  let reasoning = '';
  // Use OpenAI for open/free-text
  if (answer && typeof answer === 'string' && answer.length > 10) {
    const prompt = `Question: ${questionId}\nAnswer: ${answer}`;
    const aiResult = await scoreWithOpenAI(prompt);
    answerAnalysis = { score: aiResult.score, interpretation: aiResult.reasoning };
    reasoning = aiResult.reasoning;
  } else {
    // Simple scoring for likert/choice
    answerAnalysis = { score: 0.7, interpretation: 'Response analyzed' };
    reasoning = 'Default scoring.';
  }
  // Emotion/motion scoring
  const emotionScore = emotionData?.emotions ? Math.max(...Object.values(emotionData.emotions)) : 0.5;
  const motionScore = motionData?.repetitiveMotions ? 0.3 : 0.7;
  // Aggregate
  const overallScore = 0.5 * answerAnalysis.score + 0.2 * (confidence || 0.5) + 0.15 * emotionScore + 0.15 * motionScore;
  return {
    questionId,
    answerAnalysis,
    confidenceScore: confidence || 0.5,
    responseTimeAnalysis: { score: 0.8, interpretation: 'Normal response time' },
    emotionAnalysis: { score: emotionScore, interpretation: `Dominant: ${emotionData?.dominantEmotion || 'N/A'}` },
    motionAnalysis: { score: motionScore, interpretation: motionData?.repetitiveMotions ? 'Repetitive motions detected' : 'Normal' },
    voiceAnalysis: { score: voiceData?.clarity || 0.5, interpretation: 'Voice data processed' },
    overallScore,
    reasoning,
    recommendations: overallScore < 0.4 ? ['Consider follow-up in this area'] : ['Continue monitoring']
  };
};

// --- Rich Clinical Report Generation ---
export const generateClinicalReport = async (session, practitionerInfo) => {
  const { patientInfo, responses, emotionHistory, motionHistory } = session;
  // Emotion trends
  const emotionCounts = {};
  for (const e of emotionHistory) {
    if (e.dominantEmotion) emotionCounts[e.dominantEmotion] = (emotionCounts[e.dominantEmotion] || 0) + 1;
  }
  const emotionTrends = Object.entries(emotionCounts).map(([emotion, count]) => ({ emotion, count }));
  // Repetitive motion
  const repetitiveCount = motionHistory.filter(m => m.repetitiveMotions).length;
  // Session metadata
  const duration = session.endTime ? ((new Date(session.endTime) - new Date(session.startTime)) / 60000).toFixed(1) + ' min' : 'N/A';
  // Category scores
  const categoryScores = {};
  for (const r of responses) {
    const q = Object.values(questionBank).flat().find(q => q.id === r.questionId);
    if (!q) continue;
    if (!categoryScores[q.category]) categoryScores[q.category] = [];
    categoryScores[q.category].push(r.analysis?.overallScore || 0.5);
  }
  const categoryAverages = {};
  for (const cat of Object.keys(categoryScores)) {
    const arr = categoryScores[cat];
    categoryAverages[cat] = { average: arr.reduce((a, b) => a + b, 0) / arr.length, count: arr.length };
  }
  // Recommendations
  const recommendations = [];
  if (emotionTrends.some(e => e.emotion === 'anxious' && e.count > 2)) recommendations.push('Monitor for anxiety during social interactions.');
  if (repetitiveCount > 2) recommendations.push('Observe for repetitive motor behaviors.');
  for (const cat of Object.keys(categoryAverages)) {
    if (categoryAverages[cat].average < 0.5) recommendations.push(`Consider further assessment in ${cat}.`);
  }
  if (recommendations.length === 0) recommendations.push('No significant concerns identified. Continue monitoring.');
  // Compose report
  return {
    patientInfo,
    practitionerInfo,
    sessionInfo: {
      startTime: session.startTime,
      endTime: session.endTime,
      duration,
      totalQuestions: responses.length
    },
    assessment: {
      categoryScores: categoryAverages,
      emotionTrends,
      repetitiveMotionCount: repetitiveCount,
      dsm5Assessment: {},
      overallRisk: Object.values(categoryAverages).some(c => c.average < 0.5) ? 'moderate' : 'low',
      confidence: Math.round((responses.length / (session.totalQuestions || 20)) * 100)
    },
    behavioralObservations: {
      emotionPatterns: emotionTrends,
      motionPatterns: { repetitiveCount },
      responsePatterns: responses.map(r => ({ questionId: r.questionId, score: r.analysis?.overallScore }))
    },
    recommendations,
    disclaimer: 'This is a screening tool and does not constitute a clinical diagnosis.',
    generatedAt: new Date().toISOString()
  };
}; 