import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

// DSM-5 ASD Diagnostic Criteria
const DSM5_CRITERIA = {
  A: {
    title: 'Persistent deficits in social communication and social interaction',
    items: [
      'Deficits in social-emotional reciprocity',
      'Deficits in nonverbal communicative behaviors',
      'Deficits in developing, maintaining, and understanding relationships'
    ]
  },
  B: {
    title: 'Restricted, repetitive patterns of behavior, interests, or activities',
    items: [
      'Stereotyped or repetitive motor movements, use of objects, or speech',
      'Insistence on sameness, inflexible adherence to routines',
      'Highly restricted, fixated interests',
      'Hyper- or hyporeactivity to sensory input'
    ]
  }
};

// ASD Screening Questions Database
const ASD_QUESTIONS = {
  social_communication: [
    {
      id: 'sc_1',
      category: 'social_communication',
      text: 'How does the child respond to their name being called?',
      type: 'likert',
      options: ['Always responds', 'Usually responds', 'Sometimes responds', 'Rarely responds', 'Never responds'],
      weight: 0.8
    },
    {
      id: 'sc_2',
      category: 'social_communication',
      text: 'Does the child make eye contact during interactions?',
      type: 'likert',
      options: ['Always', 'Usually', 'Sometimes', 'Rarely', 'Never'],
      weight: 0.9
    },
    {
      id: 'sc_3',
      category: 'social_communication',
      text: 'How does the child engage in pretend play?',
      type: 'open',
      weight: 0.7
    },
    {
      id: 'sc_4',
      category: 'social_communication',
      text: 'Does the child show interest in other children?',
      type: 'likert',
      options: ['Very interested', 'Somewhat interested', 'Neutral', 'Little interest', 'No interest'],
      weight: 0.8
    }
  ],
  repetitive_behaviors: [
    {
      id: 'rb_1',
      category: 'repetitive_behaviors',
      text: 'Does the child engage in repetitive hand movements?',
      type: 'likert',
      options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Very often'],
      weight: 0.9
    },
    {
      id: 'rb_2',
      category: 'repetitive_behaviors',
      text: 'How does the child react to changes in routine?',
      type: 'likert',
      options: ['Very flexible', 'Somewhat flexible', 'Neutral', 'Somewhat upset', 'Very upset'],
      weight: 0.8
    },
    {
      id: 'rb_3',
      category: 'repetitive_behaviors',
      text: 'Does the child have intense, focused interests?',
      type: 'open',
      weight: 0.7
    }
  ],
  sensory: [
    {
      id: 'sensory_1',
      category: 'sensory',
      text: 'How does the child react to loud noises?',
      type: 'likert',
      options: ['No reaction', 'Mild reaction', 'Moderate reaction', 'Strong reaction', 'Very strong reaction'],
      weight: 0.8
    },
    {
      id: 'sensory_2',
      category: 'sensory',
      text: 'Does the child have unusual responses to textures or fabrics?',
      type: 'likert',
      options: ['No unusual responses', 'Mild', 'Moderate', 'Significant', 'Very significant'],
      weight: 0.7
    }
  ]
};

// Behavioral Observation Templates
const BEHAVIORAL_OBSERVATIONS = {
  eye_contact: {
    typical: 'Maintains appropriate eye contact during interactions',
    atypical: 'Avoids or has difficulty maintaining eye contact',
    scoring: (duration, frequency) => {
      const score = (duration * 0.6) + (frequency * 0.4);
      return { score, level: score > 0.7 ? 'typical' : score > 0.4 ? 'mild' : 'atypical' };
    }
  },
  repetitive_motions: {
    typical: 'No repetitive movements observed',
    atypical: 'Repetitive hand flapping, rocking, or other movements observed',
    scoring: (frequency, duration, intensity) => {
      const score = 1 - ((frequency * 0.4) + (duration * 0.3) + (intensity * 0.3));
      return { score, level: score > 0.7 ? 'typical' : score > 0.4 ? 'mild' : 'atypical' };
    }
  },
  social_engagement: {
    typical: 'Engages appropriately in social interactions',
    atypical: 'Limited or inappropriate social engagement',
    scoring: (responsiveness, initiation, reciprocity) => {
      const score = (responsiveness * 0.4) + (initiation * 0.3) + (reciprocity * 0.3);
      return { score, level: score > 0.7 ? 'typical' : score > 0.4 ? 'mild' : 'atypical' };
    }
  }
};

// Voice Analysis Patterns
const VOICE_PATTERNS = {
  prosody: {
    typical: 'Normal intonation and rhythm',
    atypical: 'Monotone speech, unusual rhythm, or echolalia',
    scoring: (pitch_variation, rhythm_consistency, speech_rate) => {
      const score = (pitch_variation * 0.4) + (rhythm_consistency * 0.3) + (speech_rate * 0.3);
      return { score, level: score > 0.7 ? 'typical' : score > 0.4 ? 'mild' : 'atypical' };
    }
  },
  communication_style: {
    typical: 'Appropriate conversational skills',
    atypical: 'Limited conversation, scripted speech, or unusual language patterns',
    scoring: (turn_taking, topic_maintenance, language_complexity) => {
      const score = (turn_taking * 0.4) + (topic_maintenance * 0.3) + (language_complexity * 0.3);
      return { score, level: score > 0.7 ? 'typical' : score > 0.4 ? 'mild' : 'atypical' };
    }
  }
};

// OpenAI Integration for Advanced Analysis
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

async function analyzeWithOpenAI(prompt, context = '') {
  if (!OPENAI_API_KEY) {
    return { score: 0.5, reasoning: 'No API key available for advanced analysis' };
  }

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
          {
            role: 'system',
            content: `You are an expert clinical psychologist specializing in ASD assessment. 
            Analyze the provided data and give a score from 0 (atypical) to 1 (typical) with detailed reasoning.
            Focus on DSM-5 criteria for Autism Spectrum Disorder.`
          },
          {
            role: 'user',
            content: `${context}\n\n${prompt}`
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      })
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    
    // Extract score from response
    const scoreMatch = text.match(/score\s*[:=]\s*(0(\.\d+)?|1(\.0+)?)/i);
    const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0.5;
    
    return { score, reasoning: text };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return { score: 0.5, reasoning: 'Error in advanced analysis' };
  }
}

// Create comprehensive screening session
export const createComprehensiveSession = async (patientInfo) => {
  const session = {
    id: uuidv4(),
    patientInfo,
    startTime: new Date().toISOString(),
    status: 'active',
    phase: 'initialization',
    
    // Multimodal data storage
    emotionData: [],
    motionData: [],
    voiceData: [],
    textResponses: [],
    behavioralObservations: [],
    
    // Analysis results
    analysisResults: {
      emotionAnalysis: null,
      gestureAnalysis: null,
      voiceAnalysis: null,
      textAnalysis: null,
      behavioralAnalysis: null,
      overallAssessment: null
    },
    
    // Session metadata
    lastUpdated: new Date().toISOString(),
    duration: 0,
    completionStatus: 'in_progress'
  };

  return session;
};

// Analyze emotion data
export const analyzeEmotionData = async (emotionHistory) => {
  if (!emotionHistory || emotionHistory.length === 0) {
    return { score: 0.5, analysis: 'No emotion data available' };
  }

  // Calculate emotion stability
  const emotions = emotionHistory.map(e => e.dominant_emotion);
  const emotionCounts = {};
  emotions.forEach(emotion => {
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
  });

  const dominantEmotion = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

  // Calculate social vs non-social emotions
  const socialEmotions = ['happy', 'surprised', 'fearful', 'sad'];
  const socialEmotionCount = emotions.filter(e => socialEmotions.includes(e)).length;
  const socialEmotionRatio = socialEmotionCount / emotions.length;

  // Calculate emotion stability (lower variation = higher stability)
  const emotionVariation = 1 - (Object.keys(emotionCounts).length / emotions.length);
  
  const emotionScore = (socialEmotionRatio * 0.6) + (emotionVariation * 0.4);

  return {
    score: emotionScore,
    dominantEmotion,
    emotionStability: emotionVariation,
    socialEmotionResponses: socialEmotionRatio,
    analysis: `Dominant emotion: ${dominantEmotion}, Social responses: ${(socialEmotionRatio * 100).toFixed(1)}%, Stability: ${(emotionVariation * 100).toFixed(1)}%`
  };
};

// Analyze gesture and motion data
export const analyzeGestureData = async (motionHistory) => {
  if (!motionHistory || motionHistory.length === 0) {
    return { score: 0.5, analysis: 'No motion data available' };
  }

  // Analyze repetitive motions
  const repetitiveMotions = motionHistory.filter(m => m.repetitive_motions).length;
  const repetitiveRatio = repetitiveMotions / motionHistory.length;

  // Analyze fidgeting
  const fidgetingCount = motionHistory.filter(m => m.fidgeting).length;
  const fidgetingRatio = fidgetingCount / motionHistory.length;

  // Calculate motor coordination score (inverse of repetitive/fidgeting)
  const motorCoordinationScore = 1 - ((repetitiveRatio * 0.6) + (fidgetingRatio * 0.4));

  return {
    score: motorCoordinationScore,
    repetitiveMotions: repetitiveRatio > 0.3,
    handFlapping: repetitiveRatio > 0.5,
    rockingMotion: false,
    fidgeting: fidgetingRatio > 0.4,
    motorCoordination: motorCoordinationScore,
    analysis: `Repetitive motions: ${(repetitiveRatio * 100).toFixed(1)}%, Fidgeting: ${(fidgetingRatio * 100).toFixed(1)}%, Motor coordination: ${(motorCoordinationScore * 100).toFixed(1)}%`
  };
};

// Analyze voice and speech data
export const analyzeVoiceData = async (voiceHistory, transcript) => {
  if (!voiceHistory || voiceHistory.length === 0) {
    return { score: 0.5, analysis: 'No voice data available' };
  }

  // Analyze prosody
  const avgPitch = voiceHistory.reduce((sum, v) => sum + (v.prosody?.pitch || 0.5), 0) / voiceHistory.length;
  const avgVolume = voiceHistory.reduce((sum, v) => sum + (v.prosody?.volume || 0.5), 0) / voiceHistory.length;
  const avgSpeechRate = voiceHistory.reduce((sum, v) => sum + (v.prosody?.speechRate || 0.5), 0) / voiceHistory.length;

  // Analyze speech patterns
  const speechPatterns = voiceHistory.flatMap(v => v.speechPatterns || []);
  const patternCounts = {};
  speechPatterns.forEach(pattern => {
    patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
  });

  // Calculate communication style score
  const prosodyScore = (avgPitch * 0.4) + (avgVolume * 0.3) + (avgSpeechRate * 0.3);
  const patternPenalty = Object.keys(patternCounts).length * 0.1;
  const communicationScore = Math.max(0, prosodyScore - patternPenalty);

  return {
    score: communicationScore,
    prosody: { pitch: avgPitch, volume: avgVolume, speechRate: avgSpeechRate },
    speechPatterns: Object.keys(patternCounts),
    communicationStyle: communicationScore,
    analysis: `Prosody score: ${(prosodyScore * 100).toFixed(1)}%, Communication style: ${(communicationScore * 100).toFixed(1)}%, Speech patterns detected: ${Object.keys(patternCounts).length}`
  };
};

// Generate comprehensive assessment
export const generateComprehensiveAssessment = async (session) => {
  const { emotionData, motionData, voiceData, textResponses, behavioralObservations } = session;

  // Analyze each modality
  const emotionAnalysis = await analyzeEmotionData(emotionData);
  const gestureAnalysis = await analyzeGestureData(motionData);
  const voiceAnalysis = await analyzeVoiceData(voiceData);

  // Calculate domain scores
  const socialScore = (emotionAnalysis.score * 0.6) + (gestureAnalysis.score * 0.4);
  const communicationScore = (voiceAnalysis.score * 0.7) + (emotionAnalysis.score * 0.3);
  const behaviorScore = 1 - gestureAnalysis.score;
  const sensoryScore = 0.8;

  // Calculate overall risk score
  const overallScore = (socialScore * 0.3) + (communicationScore * 0.3) + (behaviorScore * 0.2) + (sensoryScore * 0.2);
  
  // Determine risk level
  let riskLevel = 'low';
  if (overallScore < 0.4) riskLevel = 'high';
  else if (overallScore < 0.7) riskLevel = 'medium';

  // Generate recommendations
  const recommendations = generateRecommendations(riskLevel, {
    social: socialScore,
    communication: communicationScore,
    behavior: behaviorScore,
    sensory: sensoryScore
  });

  // Generate next steps
  const nextSteps = generateNextSteps(riskLevel);

  return {
    overallScore,
    riskLevel,
    domains: {
      social: socialScore,
      communication: communicationScore,
      behavior: behaviorScore,
      sensory: sensoryScore
    },
    recommendations,
    nextSteps,
    detailedAnalysis: {
      emotion: emotionAnalysis,
      gesture: gestureAnalysis,
      voice: voiceAnalysis
    }
  };
};

// Generate recommendations based on risk level and domain scores
const generateRecommendations = (riskLevel, domainScores) => {
  const recommendations = [];

  if (riskLevel === 'high') {
    recommendations.push('Consider comprehensive diagnostic evaluation by a developmental pediatrician');
    recommendations.push('Early intervention services strongly recommended');
    recommendations.push('Schedule follow-up assessment within 3 months');
  } else if (riskLevel === 'medium') {
    recommendations.push('Monitor developmental milestones closely');
    recommendations.push('Consider follow-up screening in 6 months');
    recommendations.push('Discuss concerns with pediatrician');
  } else {
    recommendations.push('Continue routine developmental monitoring');
    recommendations.push('No immediate concerns identified');
  }

  // Domain-specific recommendations
  if (domainScores.social < 0.6) {
    recommendations.push('Focus on social skills development');
  }
  if (domainScores.communication < 0.6) {
    recommendations.push('Consider speech and language evaluation');
  }
  if (domainScores.behavior > 0.6) {
    recommendations.push('Monitor for repetitive behaviors and restricted interests');
  }

  return recommendations;
};

// Generate next steps
const generateNextSteps = (riskLevel) => {
  const steps = [
    'Share screening results with healthcare provider',
    'Schedule follow-up appointment if needed'
  ];

  if (riskLevel === 'high') {
    steps.push('Contact early intervention services');
    steps.push('Schedule comprehensive diagnostic evaluation');
  } else if (riskLevel === 'medium') {
    steps.push('Monitor child\'s development closely');
    steps.push('Consider additional assessments if concerns persist');
  }

  return steps;
};

// Generate clinical report
export const generateClinicalReport = async (session, assessment) => {
  const report = {
    sessionId: session.id,
    patientInfo: session.patientInfo,
    assessmentDate: new Date().toISOString(),
    screeningDuration: session.duration,
    
    executiveSummary: {
      riskLevel: assessment.riskLevel,
      overallScore: assessment.overallScore,
      keyFindings: generateKeyFindings(assessment),
      recommendations: assessment.recommendations.slice(0, 3)
    },
    
    detailedResults: {
      socialCommunication: {
        score: assessment.domains.social,
        level: assessment.domains.social > 0.7 ? 'typical' : assessment.domains.social > 0.4 ? 'mild' : 'atypical',
        observations: assessment.detailedAnalysis.emotion.analysis
      },
      repetitiveBehaviors: {
        score: assessment.domains.behavior,
        level: assessment.domains.behavior > 0.7 ? 'typical' : assessment.domains.behavior > 0.4 ? 'mild' : 'atypical',
        observations: assessment.detailedAnalysis.gesture.analysis
      },
      communication: {
        score: assessment.domains.communication,
        level: assessment.domains.communication > 0.7 ? 'typical' : assessment.domains.communication > 0.4 ? 'mild' : 'atypical',
        observations: assessment.detailedAnalysis.voice.analysis
      }
    },
    
    clinicalImpressions: generateClinicalImpressions(assessment),
    recommendations: assessment.recommendations,
    nextSteps: assessment.nextSteps,
    
    disclaimer: 'This screening tool is designed to assist healthcare professionals and is not a diagnostic tool. A comprehensive evaluation by qualified professionals is required for diagnosis.'
  };

  return report;
};

// Generate key findings
const generateKeyFindings = (assessment) => {
  const findings = [];
  
  if (assessment.domains.social < 0.6) {
    findings.push('Social communication challenges observed');
  }
  if (assessment.domains.behavior > 0.6) {
    findings.push('Repetitive behaviors or restricted interests noted');
  }
  if (assessment.domains.communication < 0.6) {
    findings.push('Communication patterns may warrant further evaluation');
  }
  
  if (findings.length === 0) {
    findings.push('No significant concerns identified in this screening');
  }
  
  return findings;
};

// Generate clinical impressions
const generateClinicalImpressions = (assessment) => {
  const impressions = [];
  
  if (assessment.riskLevel === 'high') {
    impressions.push('This child shows several characteristics consistent with ASD and would benefit from comprehensive evaluation.');
  } else if (assessment.riskLevel === 'medium') {
    impressions.push('Some developmental concerns were noted that warrant monitoring and potential follow-up.');
  } else {
    impressions.push('Development appears to be progressing typically based on this screening.');
  }
  
  return impressions;
};

export default {
  createComprehensiveSession,
  analyzeEmotionData,
  analyzeGestureData,
  analyzeVoiceData,
  generateComprehensiveAssessment,
  generateClinicalReport
}; 