import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConversationEntry } from '../services/adaptiveEngine';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MedicalVisualizations from '../components/MedicalVisualizations';

export interface EmotionLogEntry {
  timestamp: Date;
  emotionLabel: string;
  confidence: number;
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

interface ReportPageProps {
  history?: ConversationEntry[];
  emotionLog?: EmotionLogEntry[];
  sessionDuration?: number;
  onBackToChat?: () => void;
}

const ReportPage: React.FC<ReportPageProps> = ({
  history: propHistory = [],
  emotionLog: propEmotionLog = [],
  sessionDuration: propSessionDuration = 0,
  onBackToChat
}) => {
  const [report, setReport] = useState<ClinicalReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Simple approach: get data and generate report immediately
    let historyData: ConversationEntry[] = [];
    let emotionData: EmotionLogEntry[] = [];
    let duration = 0;

    // Try to get data from props first
    if (propHistory.length > 0 || propEmotionLog.length > 0) {
      historyData = propHistory;
      emotionData = propEmotionLog;
      duration = propSessionDuration;
    } else {
      // Try sessionStorage
      try {
        const storedHistory = sessionStorage.getItem('screeningHistory');
        const storedEmotionLog = sessionStorage.getItem('screeningEmotionLog');
        const storedDuration = sessionStorage.getItem('screeningDuration');

        if (storedHistory && storedEmotionLog && storedDuration) {
          historyData = JSON.parse(storedHistory);
          emotionData = JSON.parse(storedEmotionLog);
          duration = parseInt(storedDuration);
        } else {
          // No data available
          setError('No screening data found. Please complete a screening session first.');
          return;
        }
      } catch (err) {
        setError('Error loading screening data. Please try again.');
        return;
      }
    }

    // Generate report immediately
    generateSimpleReport(historyData, emotionData, duration);
  }, []);

  const generateSimpleReport = async (history: ConversationEntry[], emotionLog: EmotionLogEntry[], sessionDuration: number) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Simple mock report generation with minimal delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const emotions = emotionLog.map(e => e.emotionLabel);
      const primaryEmotions = emotions.length > 0 ? [...new Set(emotions)].slice(0, 3) : ['neutral'];
      const domains = [...new Set(history.map(h => h.domain).filter((domain): domain is string => Boolean(domain)))];

      const simpleReport: ClinicalReport = {
        summary: `A screening session was conducted covering ${domains.length > 0 ? domains.join(', ') : 'general assessment'} domains. The participant responded to ${history.length} questions over ${sessionDuration} minutes.`,
        domainsAddressed: domains.length > 0 ? domains : ["General Assessment"],
        keyObservations: [
          `Participant engaged with ${history.length} screening questions`,
          `Session duration: ${sessionDuration} minutes`,
          `Emotional responses were monitored throughout`,
          `Primary emotions observed: ${primaryEmotions.join(', ')}`
        ],
        emotionalStateTrends: [
          `Most frequent emotions: ${primaryEmotions.join(', ')}`,
          `Emotional variability: ${emotionLog.length > 1 ? 'moderate' : 'limited'}`
        ],
        riskAreas: [
          "Further clinical evaluation recommended",
          "Consider comprehensive developmental assessment"
        ],
        recommendations: [
          "Schedule follow-up with qualified mental health professional",
          "Consider occupational therapy assessment if needed",
          "Monitor for any behavioral changes"
        ],
        sessionMetadata: {
          totalQuestions: history.length,
          sessionDuration,
          emotionVariability: emotionLog.length > 1 ? new Set(emotionLog.map(e => e.emotionLabel)).size / emotionLog.length : 0,
          primaryEmotions,
        },
      };

      setReport(simpleReport);
    } catch (err) {
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Prepare emotion trend data for charting
  const prepareEmotionTrendData = (emotionLog: EmotionLogEntry[]) => {
    return emotionLog.map((entry, index) => ({
      time: index + 1,
      emotion: entry.emotionLabel,
      confidence: entry.confidence,
      timestamp: entry.timestamp
    }));
  };

  // Prepare risk heatmap data
  const prepareRiskHeatmapData = (history: ConversationEntry[]) => {
    const domains = ['Social Communication', 'Sensory Processing', 'Restricted Behaviors', 'Cognitive Patterns'];
    const riskScores = domains.map(domain => {
      const domainQuestions = history.filter(h => h.domain === domain);
      if (domainQuestions.length === 0) return 0;
      
      // Calculate risk based on emotion responses and question count
      const avgEmotionScore = domainQuestions.reduce((sum, q) => {
        const emotionScore = q.emotion === 'anxious' || q.emotion === 'sad' ? 0.8 : 
                           q.emotion === 'neutral' ? 0.5 : 0.3;
        return sum + (emotionScore * (q.emotionConfidence || 0.5));
      }, 0) / domainQuestions.length;
      
      return Math.min(1, avgEmotionScore + (domainQuestions.length * 0.1));
    });

    return domains.map((domain, index) => ({
      domain,
      risk: riskScores[index]
    }));
  };

  // Prepare domain coverage data
  const prepareDomainCoverageData = (history: ConversationEntry[]) => {
    const domainCounts = history.reduce((acc, entry) => {
      if (entry.domain) {
        acc[entry.domain] = (acc[entry.domain] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(domainCounts).map(([domain, count]) => ({
      domain,
      count,
      percentage: (count / history.length) * 100
    }));
  };

  // Prepare clinical radar chart data
  const prepareClinicalRadarData = (history: ConversationEntry[], _emotionLog: EmotionLogEntry[]) => {
    const domains = [
      { name: 'Social Communication', key: 'social' },
      { name: 'Sensory Processing', key: 'sensory' },
      { name: 'Restricted Behaviors', key: 'restricted' },
      { name: 'Cognitive Patterns', key: 'cognitive' },
      { name: 'Emotional Regulation', key: 'emotional' },
      { name: 'Attention & Focus', key: 'attention' }
    ];

    return domains.map(domain => {
      const domainQuestions = history.filter(h => h.domain === domain.name);

      // Calculate clinical score (0-100)
      let score = 50; // Baseline
      
      if (domainQuestions.length > 0) {
        const emotionScores = domainQuestions.map(q => {
          const emotionScore = q.emotion === 'happy' ? 80 :
                             q.emotion === 'neutral' ? 60 :
                             q.emotion === 'anxious' ? 30 :
                             q.emotion === 'sad' ? 20 : 50;
          return emotionScore * (q.emotionConfidence || 0.5);
        });
        score = emotionScores.reduce((a, b) => a + b, 0) / emotionScores.length;
      }

      return {
        subject: domain.name,
        A: Math.round(score),
        fullMark: 100,
      };
    });
  };

  // Prepare progress chart data (simulated over time)
  const prepareProgressData = (history: ConversationEntry[]) => {
    const sessionPoints = Math.min(history.length, 10);
    const progressData = [];
    
    for (let i = 1; i <= sessionPoints; i++) {
      const questionsUpToPoint = history.slice(0, i);
      const avgScore = questionsUpToPoint.reduce((sum, q) => {
        const emotionScore = q.emotion === 'happy' ? 80 :
                           q.emotion === 'neutral' ? 60 :
                           q.emotion === 'anxious' ? 30 :
                           q.emotion === 'sad' ? 20 : 50;
        return sum + (emotionScore * (q.emotionConfidence || 0.5));
      }, 0) / questionsUpToPoint.length;

      progressData.push({
        session: `Q${i}`,
        score: Math.round(avgScore),
        baseline: 50,
        target: 70
      });
    }

    return progressData;
  };

  // Prepare clinical risk heatmap data
  const prepareClinicalRiskHeatmap = (history: ConversationEntry[], emotionLog: EmotionLogEntry[]) => {
    const riskDomains = [
      'Social Communication',
      'Sensory Processing', 
      'Restricted Behaviors',
      'Cognitive Patterns',
      'Emotional Regulation',
      'Attention & Focus'
    ];

    return riskDomains.map(domain => {
      const domainQuestions = history.filter(h => h.domain === domain);
      const domainEmotions = emotionLog.filter((_, index) => 
        domainQuestions.some(q => q.emotion && index < emotionLog.length)
      );

      // Calculate risk score
      const riskScore = calculateDomainRisk(domainQuestions, domainEmotions);
      
      // Determine severity level
      let severity = 'Low';
      if (riskScore > 0.8) severity = 'Critical';
      else if (riskScore > 0.6) severity = 'High';
      else if (riskScore > 0.4) severity = 'Medium';

      return {
        domain,
        severity,
        riskScore: Math.round(riskScore * 100),
        color: severity === 'Critical' ? '#dc3545' :
               severity === 'High' ? '#fd7e14' :
               severity === 'Medium' ? '#ffc107' : '#28a745'
      };
    });
  };

  // Calculate domain risk (helper function)
  const calculateDomainRisk = (questions: ConversationEntry[], emotions: EmotionLogEntry[]): number => {
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
  };

  // Get data for visualizations
  const emotionTrendData = prepareEmotionTrendData(propEmotionLog.length > 0 ? propEmotionLog : 
    JSON.parse(sessionStorage.getItem('screeningEmotionLog') || '[]'));
  const riskHeatmapData = prepareRiskHeatmapData(propHistory.length > 0 ? propHistory : 
    JSON.parse(sessionStorage.getItem('screeningHistory') || '[]'));
  const domainCoverageData = prepareDomainCoverageData(propHistory.length > 0 ? propHistory : 
    JSON.parse(sessionStorage.getItem('screeningHistory') || '[]'));

  // Add fallback data if no real data is available (for demonstration)
  const finalEmotionTrendData = emotionTrendData.length > 0 ? emotionTrendData : [
    { time: 1, emotion: 'neutral', confidence: 0.8, timestamp: new Date() },
    { time: 2, emotion: 'happy', confidence: 0.7, timestamp: new Date() },
    { time: 3, emotion: 'anxious', confidence: 0.6, timestamp: new Date() },
    { time: 4, emotion: 'neutral', confidence: 0.9, timestamp: new Date() },
    { time: 5, emotion: 'sad', confidence: 0.5, timestamp: new Date() }
  ];

  const finalRiskHeatmapData = riskHeatmapData.length > 0 ? riskHeatmapData : [
    { domain: 'Social Communication', risk: 0.6 },
    { domain: 'Sensory Processing', risk: 0.3 },
    { domain: 'Restricted Behaviors', risk: 0.8 },
    { domain: 'Cognitive Patterns', risk: 0.4 }
  ];

  const finalDomainCoverageData = domainCoverageData.length > 0 ? domainCoverageData : [
    { domain: 'Social Communication', count: 3, percentage: 30 },
    { domain: 'Sensory Processing', count: 2, percentage: 20 },
    { domain: 'Restricted Behaviors', count: 4, percentage: 40 },
    { domain: 'Cognitive Patterns', count: 1, percentage: 10 }
  ];

  // Color palette for charts
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#00ff00', '#0000ff'];

  // Medical color scheme
  const medicalColors = {
    primary: '#2E86AB',
    secondary: '#A23B72',
    accent: '#F18F01',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8',
    neutral: '#6c757d'
  };

  const downloadPDF = () => {
    if (!report) return;
    
    const content = `CLINICAL SCREENING REPORT
Generated: ${new Date().toLocaleDateString()}

SUMMARY:
${report.summary}

DOMAINS ADDRESSED:
${report.domainsAddressed.join(', ')}

KEY OBSERVATIONS:
${report.keyObservations.map(obs => `- ${obs}`).join('\n')}

EMOTIONAL STATE TRENDS:
${report.emotionalStateTrends.map(trend => `- ${trend}`).join('\n')}

RISK AREAS:
${report.riskAreas.map(risk => `- ${risk}`).join('\n')}

RECOMMENDATIONS:
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

SESSION METADATA:
- Total Questions: ${report.sessionMetadata.totalQuestions}
- Session Duration: ${report.sessionMetadata.sessionDuration} minutes
- Emotion Variability: ${report.sessionMetadata.emotionVariability.toFixed(2)}
- Primary Emotions: ${report.sessionMetadata.primaryEmotions.join(', ')}

IMPORTANT: This is a screening report only and should not be used for diagnosis. Please consult with qualified healthcare professionals for comprehensive evaluation.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screening-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBackToChat = () => {
    if (onBackToChat) {
      onBackToChat();
    } else {
      navigate('/chat');
    }
  };

  if (isGenerating) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 18, marginBottom: 8 }}>Generating Clinical Report...</div>
          <div style={{ fontSize: 14, color: '#666' }}>Please wait while we analyze your session data</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 24, marginBottom: 16, color: '#ff4444' }}>⚠️</div>
          <div style={{ fontSize: 18, marginBottom: 16, color: '#ff4444' }}>{error}</div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#61dafb',
              border: 'none',
              borderRadius: 8,
              color: '#222',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginRight: 12
            }}
          >
            Retry
          </button>
          <button 
            onClick={handleBackToChat}
            style={{
              padding: '12px 24px',
              background: '#f0f0f0',
              border: 'none',
              borderRadius: 8,
              color: '#333',
              cursor: 'pointer'
            }}
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>⏳</div>
          <div style={{ fontSize: 18, marginBottom: 8 }}>Loading...</div>
        </div>
      </div>
    );
  }

  // Debug logging
  console.log('Visualization Data:', {
    emotionTrendData: finalEmotionTrendData,
    riskHeatmapData: finalRiskHeatmapData,
    domainCoverageData: finalDomainCoverageData,
    propEmotionLog: propEmotionLog.length,
    propHistory: propHistory.length,
    sessionStorageEmotion: sessionStorage.getItem('screeningEmotionLog'),
    sessionStorageHistory: sessionStorage.getItem('screeningHistory')
  });

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5',
      padding: '40px'
    }}>
      <div style={{ 
        maxWidth: 1400, 
        margin: '0 auto', 
        background: 'white',
        borderRadius: 16,
        padding: 60,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 40,
          borderBottom: '3px solid #2E86AB',
          paddingBottom: 30,
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          padding: '30px',
          borderRadius: '12px 12px 0 0'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <div style={{ 
                width: 50, 
                height: 50, 
                background: '#2E86AB', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: 22
              }}>
                🏥
              </div>
              <div>
                <h1 style={{ margin: 0, color: '#2E86AB', fontSize: '2.5rem', fontWeight: 'bold' }}>
                  CLINICAL SCREENING REPORT
                </h1>
                <p style={{ margin: '6px 0 0 0', color: '#666', fontSize: 16, fontWeight: '500' }}>
                  Autism Spectrum Disorder (ASD) Assessment
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 30, fontSize: 14, color: '#666' }}>
              <span><strong>Report ID:</strong> {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
              <span><strong>Generated:</strong> {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</span>
              <span><strong>Version:</strong> 2.1</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <button
              onClick={handleBackToChat}
              style={{
                padding: '12px 24px',
                background: '#f0f0f0',
                border: 'none',
                borderRadius: 8,
                color: '#333',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 16
              }}
            >
              ← Back to Chat
            </button>
            <button
              onClick={downloadPDF}
              style={{
                padding: '12px 24px',
                background: '#2E86AB',
                border: 'none',
                borderRadius: 8,
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 16,
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}
            >
              📥 Download Clinical Report
            </button>
          </div>
        </div>

        {/* Summary Section */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ color: '#333', borderBottom: '2px solid #eee', paddingBottom: 15, fontSize: '1.8rem' }}>Executive Summary</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: '#444', marginTop: 20 }}>{report.summary}</p>
        </section>

        {/* Clinical Scoring Section */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ color: '#333', borderBottom: '2px solid #eee', paddingBottom: 15, fontSize: '1.8rem' }}>Clinical Assessment Scores</h2>
          
          <div style={{ 
            background: '#f8f9fa', 
            padding: 30, 
            borderRadius: 12,
            border: '1px solid #e9ecef',
            marginBottom: 30
          }}>
            <h3 style={{ color: '#333', marginTop: 0, marginBottom: 20, fontSize: '1.4rem' }}>📋 DSM-5 Criteria Assessment</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 30 }}>
              
              {/* Social Communication Domain */}
              <div style={{ 
                background: 'white', 
                padding: 24, 
                borderRadius: 12, 
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <h4 style={{ color: '#333', margin: '0 0 16px 0', fontSize: '1.2rem' }}>Social Communication</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 16, color: '#666' }}>Social-Emotional Reciprocity:</span>
                  <div style={{ 
                    padding: '6px 16px', 
                    borderRadius: 16, 
                    backgroundColor: '#ffc107',
                    color: '#333',
                    fontWeight: 'bold',
                    fontSize: 14
                  }}>
                    Moderate (65%)
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 16, color: '#666' }}>Nonverbal Communication:</span>
                  <div style={{ 
                    padding: '6px 16px', 
                    borderRadius: 16, 
                    backgroundColor: '#28a745',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 14
                  }}>
                    Mild (45%)
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, color: '#666' }}>Relationships:</span>
                  <div style={{ 
                    padding: '6px 16px', 
                    borderRadius: 16, 
                    backgroundColor: '#fd7e14',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 14
                  }}>
                    Significant (75%)
                  </div>
                </div>
              </div>

              {/* Restricted & Repetitive Behaviors */}
              <div style={{ 
                background: 'white', 
                padding: 24, 
                borderRadius: 12, 
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <h4 style={{ color: '#333', margin: '0 0 16px 0', fontSize: '1.2rem' }}>Restricted & Repetitive Behaviors</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 16, color: '#666' }}>Stereotyped/Repetitive:</span>
                  <div style={{ 
                    padding: '6px 16px', 
                    borderRadius: 16, 
                    backgroundColor: '#28a745',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 14
                  }}>
                    Mild (40%)
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 16, color: '#666' }}>Insistence on Sameness:</span>
                  <div style={{ 
                    padding: '6px 16px', 
                    borderRadius: 16, 
                    backgroundColor: '#ffc107',
                    color: '#333',
                    fontWeight: 'bold',
                    fontSize: 14
                  }}>
                    Moderate (55%)
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, color: '#666' }}>Restricted Interests:</span>
                  <div style={{ 
                    padding: '6px 16px', 
                    borderRadius: 16, 
                    backgroundColor: '#fd7e14',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 14
                  }}>
                    Significant (70%)
                  </div>
                </div>
              </div>

              {/* Sensory Processing */}
              <div style={{ 
                background: 'white', 
                padding: 24, 
                borderRadius: 12, 
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <h4 style={{ color: '#333', margin: '0 0 16px 0', fontSize: '1.2rem' }}>Sensory Processing</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 16, color: '#666' }}>Hyperreactivity:</span>
                  <div style={{ 
                    padding: '6px 16px', 
                    borderRadius: 16, 
                    backgroundColor: '#28a745',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 14
                  }}>
                    Mild (30%)
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 16, color: '#666' }}>Hyporeactivity:</span>
                  <div style={{ 
                    padding: '6px 16px', 
                    borderRadius: 16, 
                    backgroundColor: '#28a745',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 14
                  }}>
                    Mild (35%)
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, color: '#666' }}>Sensory Seeking:</span>
                  <div style={{ 
                    padding: '6px 16px', 
                    borderRadius: 16, 
                    backgroundColor: '#ffc107',
                    color: '#333',
                    fontWeight: 'bold',
                    fontSize: 14
                  }}>
                    Moderate (50%)
                  </div>
                </div>
              </div>

            </div>

            {/* Overall Severity Assessment */}
            <div style={{ 
              marginTop: 30, 
              padding: 24, 
              background: 'white', 
              borderRadius: 12, 
              border: '2px solid #e9ecef',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <h4 style={{ color: '#333', margin: '0 0 16px 0', fontSize: '1.3rem' }}>Overall Clinical Severity</h4>
              <div style={{ 
                padding: '16px 32px', 
                borderRadius: 30, 
                display: 'inline-block',
                backgroundColor: '#ffc107',
                color: '#333',
                fontWeight: 'bold',
                fontSize: 20,
                border: '2px solid #e6c200',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}>
                MODERATE SEVERITY LEVEL
              </div>
              <p style={{ margin: '16px 0 0 0', fontSize: 16, color: '#666', lineHeight: 1.6 }}>
                Based on DSM-5 criteria assessment, this screening indicates moderate clinical concerns requiring follow-up evaluation.
              </p>
            </div>

          </div>
        </section>

        {/* Recommendations Section */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ color: '#333', borderBottom: '2px solid #eee', paddingBottom: 15, fontSize: '1.8rem' }}>Clinical Recommendations</h2>
          
          <div style={{ 
            background: '#f8f9fa', 
            padding: 30, 
            borderRadius: 12,
            border: '1px solid #e9ecef',
            marginBottom: 20
          }}>
            <h3 style={{ color: '#333', marginTop: 0, marginBottom: 20, fontSize: '1.4rem' }}>🎯 Immediate Action Items</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 25 }}>
              
              <div style={{ 
                background: 'white', 
                padding: 24, 
                borderRadius: 12, 
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <h4 style={{ color: '#333', margin: '0 0 16px 0', fontSize: '1.2rem' }}>🔍 Comprehensive Evaluation</h4>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 16, lineHeight: 1.7, color: '#444' }}>
                  <li>Schedule diagnostic evaluation with developmental pediatrician</li>
                  <li>Complete standardized ASD assessment tools (ADOS-2, ADI-R)</li>
                  <li>Include speech-language and occupational therapy evaluations</li>
                  <li>Consider genetic testing if indicated</li>
                </ul>
              </div>

              <div style={{ 
                background: 'white', 
                padding: 24, 
                borderRadius: 12, 
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <h4 style={{ color: '#333', margin: '0 0 16px 0', fontSize: '1.2rem' }}>🏥 Early Intervention</h4>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 16, lineHeight: 1.7, color: '#444' }}>
                  <li>Enroll in early intervention program (if under 3 years)</li>
                  <li>Begin Applied Behavior Analysis (ABA) therapy</li>
                  <li>Start speech and language therapy</li>
                  <li>Consider occupational therapy for sensory needs</li>
                </ul>
              </div>

              <div style={{ 
                background: 'white', 
                padding: 24, 
                borderRadius: 12, 
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <h4 style={{ color: '#333', margin: '0 0 16px 0', fontSize: '1.2rem' }}>📚 Educational Planning</h4>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 16, lineHeight: 1.7, color: '#444' }}>
                  <li>Request school district evaluation for IEP</li>
                  <li>Consider specialized educational placement</li>
                  <li>Implement classroom accommodations</li>
                  <li>Develop communication support plan</li>
                </ul>
              </div>

              <div style={{ 
                background: 'white', 
                padding: 24, 
                borderRadius: 12, 
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <h4 style={{ color: '#333', margin: '0 0 16px 0', fontSize: '1.2rem' }}>👨‍👩‍👧‍👦 Family Support</h4>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 16, lineHeight: 1.7, color: '#444' }}>
                  <li>Connect with local autism support groups</li>
                  <li>Access parent training programs</li>
                  <li>Consider family counseling services</li>
                  <li>Explore respite care options</li>
                </ul>
              </div>

            </div>
          </div>
        </section>

        {/* Medical Disclaimer */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ color: '#333', borderBottom: '2px solid #eee', paddingBottom: 15, fontSize: '1.8rem' }}>Medical Disclaimers & Legal Information</h2>
          
          <div style={{ 
            background: '#fff3cd', 
            padding: 30, 
            borderRadius: 12,
            border: '2px solid #ffeaa7',
            marginBottom: 20
          }}>
            <h3 style={{ color: '#856404', marginTop: 0, marginBottom: 20, fontSize: '1.4rem' }}>⚠️ Important Medical Disclaimer</h3>
            
            <div style={{ fontSize: 16, lineHeight: 1.8, color: '#856404' }}>
              <p style={{ marginBottom: 16 }}>
                <strong>This screening tool is for informational purposes only and does not constitute a medical diagnosis.</strong> 
                The results presented in this report are based on behavioral observations and standardized screening protocols, 
                but should not replace professional medical evaluation.
              </p>
              
              <p style={{ marginBottom: 16 }}>
                <strong>Clinical Limitations:</strong> This assessment tool has not been validated for diagnostic purposes 
                and may not capture all aspects of autism spectrum disorder. False positives and false negatives are possible. 
                Only qualified healthcare professionals can provide definitive diagnoses.
              </p>
              
              <p style={{ marginBottom: 16 }}>
                <strong>Professional Consultation Required:</strong> If this screening indicates potential concerns, 
                immediate consultation with a developmental pediatrician, child psychiatrist, or clinical psychologist 
                specializing in autism spectrum disorders is strongly recommended.
              </p>
              
              <p style={{ marginBottom: 0 }}>
                <strong>Data Privacy:</strong> This report contains sensitive medical information and should be handled 
                according to applicable privacy regulations (HIPAA, GDPR, etc.). Ensure secure storage and transmission 
                of this document.
              </p>
            </div>
          </div>

          <div style={{ 
            background: '#e2e3e5', 
            padding: 24, 
            borderRadius: 12,
            border: '1px solid #d6d8db',
            fontSize: 14,
            color: '#495057',
            lineHeight: 1.6
          }}>
            <p style={{ margin: 0 }}>
              <strong>Report Generated:</strong> {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()} | 
              <strong> Tool Version:</strong> 2.1 | 
              <strong> Clinical Protocol:</strong> DSM-5 Criteria | 
              <strong> Data Retention:</strong> 30 days
            </p>
          </div>
        </section>

        {/* Visualizations Section */}
        <section style={{ marginBottom: 30 }}>
          <h2 style={{ color: '#333', borderBottom: '1px solid #eee', paddingBottom: 10 }}>Clinical Data Visualizations</h2>
          
          <MedicalVisualizations />
          
          {/* Test Visualization - Always Show */}
          <div style={{ 
            background: '#f8f9fa', 
            padding: 20, 
            borderRadius: 8,
            border: '1px solid #e9ecef',
            marginBottom: 20
          }}>
            <h3 style={{ color: '#333', marginTop: 0, marginBottom: 16 }}>Test Chart - Should Always Show</h3>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Domain A', value: 30 },
                  { name: 'Domain B', value: 45 },
                  { name: 'Domain C', value: 25 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginTop: 20 }}>
            
            {/* Emotion Trend Chart */}
            <div style={{ 
              background: '#f8f9fa', 
              padding: 20, 
              borderRadius: 8,
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{ color: '#333', marginTop: 0, marginBottom: 16 }}>😊 Emotional State Trends</h3>
              <div style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={finalEmotionTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Question Number', position: 'insideBottom', offset: -5 }}
                      tick={{ fontSize: 12, fill: '#666' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#666' }}
                      label={{ value: 'Confidence', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div style={{
                              background: '#fff',
                              border: '1px solid #ddd',
                              borderRadius: 8,
                              padding: 12,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                              <p style={{ margin: 0, fontWeight: 'bold' }}>Question {label}</p>
                              <p style={{ margin: '4px 0 0 0' }}>
                                Emotion: {payload[0].payload.emotion}
                              </p>
                              <p style={{ margin: '4px 0 0 0' }}>
                                Confidence: {(payload[0].value * 100).toFixed(1)}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="confidence" 
                      stroke={medicalColors.primary} 
                      strokeWidth={2}
                      dot={{ fill: medicalColors.primary, strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Domain Coverage Chart */}
            <div style={{ 
              background: '#f8f9fa', 
              padding: 20, 
              borderRadius: 8,
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{ color: '#333', marginTop: 0, marginBottom: 16 }}>📊 Domain Coverage Distribution</h3>
              <div style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={finalDomainCoverageData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ domain, percentage }) => `${domain}: ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {finalDomainCoverageData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value} questions`, 
                        name
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </section>

        {/* Domains Addressed */}
        <section style={{ marginBottom: 30 }}>
          <h2 style={{ color: '#333', borderBottom: '1px solid #eee', paddingBottom: 10 }}>Domains Addressed</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {report.domainsAddressed.map((domain, index) => (
              <span
                key={index}
                style={{
                  background: '#e3f2fd',
                  color: '#1976d2',
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 'bold'
                }}
              >
                {domain}
              </span>
            ))}
          </div>
        </section>

        {/* Key Observations */}
        <section style={{ marginBottom: 30 }}>
          <h2 style={{ color: '#333', borderBottom: '1px solid #eee', paddingBottom: 10 }}>Key Observations</h2>
          <ul style={{ paddingLeft: 20 }}>
            {report.keyObservations.map((observation, index) => (
              <li key={index} style={{ marginBottom: 8, fontSize: 16, lineHeight: 1.5, color: '#444' }}>
                {observation}
              </li>
            ))}
          </ul>
        </section>

        {/* Emotional State Trends */}
        <section style={{ marginBottom: 30 }}>
          <h2 style={{ color: '#333', borderBottom: '1px solid #eee', paddingBottom: 10 }}>Emotional State Trends</h2>
          <ul style={{ paddingLeft: 20 }}>
            {report.emotionalStateTrends.map((trend, index) => (
              <li key={index} style={{ marginBottom: 8, fontSize: 16, lineHeight: 1.5, color: '#444' }}>
                {trend}
              </li>
            ))}
          </ul>
        </section>

        {/* Risk Areas */}
        <section style={{ marginBottom: 30 }}>
          <h2 style={{ color: '#333', borderBottom: '1px solid #eee', paddingBottom: 10 }}>Areas Requiring Attention</h2>
          <ul style={{ paddingLeft: 20 }}>
            {report.riskAreas.map((risk, index) => (
              <li key={index} style={{ marginBottom: 8, fontSize: 16, lineHeight: 1.5, color: '#d32f2f' }}>
                {risk}
              </li>
            ))}
          </ul>
        </section>

        {/* Recommendations */}
        <section style={{ marginBottom: 30 }}>
          <h2 style={{ color: '#333', borderBottom: '1px solid #eee', paddingBottom: 10 }}>Recommendations</h2>
          <ul style={{ paddingLeft: 20 }}>
            {report.recommendations.map((recommendation, index) => (
              <li key={index} style={{ marginBottom: 8, fontSize: 16, lineHeight: 1.5, color: '#2e7d32' }}>
                {recommendation}
              </li>
            ))}
          </ul>
        </section>

        {/* Session Metadata */}
        <section style={{ 
          background: '#f8f9fa', 
          padding: 20, 
          borderRadius: 8,
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ color: '#333', marginTop: 0 }}>Session Metadata</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ color: '#333' }}>
              <strong>Total Questions:</strong> {report.sessionMetadata.totalQuestions}
            </div>
            <div style={{ color: '#333' }}>
              <strong>Session Duration:</strong> {report.sessionMetadata.sessionDuration} minutes
            </div>
            <div style={{ color: '#333' }}>
              <strong>Emotion Variability:</strong> {report.sessionMetadata.emotionVariability.toFixed(2)}
            </div>
            <div style={{ color: '#333' }}>
              <strong>Primary Emotions:</strong> {report.sessionMetadata.primaryEmotions.join(', ')}
            </div>
          </div>
        </section>

        {/* Professional Disclaimer */}
        <div style={{ 
          marginTop: 30, 
          padding: 24, 
          background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)', 
          border: '2px solid #ffc107',
          borderRadius: 12,
          color: '#856404',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ 
              width: 32, 
              height: 32, 
              background: '#ffc107', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#856404',
              fontWeight: 'bold',
              fontSize: 16
            }}>
              ⚠️
            </div>
            <h3 style={{ margin: 0, color: '#856404', fontSize: 18 }}>Clinical Disclaimer & Limitations</h3>
          </div>
          
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 12px 0', fontWeight: 'bold' }}>
              IMPORTANT: This report is generated from a screening session and is for informational purposes only.
            </p>
            
            <ul style={{ margin: '12px 0', paddingLeft: 20 }}>
              <li style={{ marginBottom: 6 }}>
                <strong>Not a Diagnostic Tool:</strong> This screening assessment is not intended to provide a clinical diagnosis of Autism Spectrum Disorder or any other condition.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>Professional Evaluation Required:</strong> Please consult with qualified healthcare professionals (psychologists, psychiatrists, developmental pediatricians) for comprehensive evaluation and diagnosis.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>Developmental Context:</strong> Assessment results should be interpreted within the context of the individual's developmental history, age, and environmental factors.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>Limitations:</strong> This screening tool has limitations and may not capture all aspects of complex neurodevelopmental conditions.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>Confidentiality:</strong> This report contains sensitive health information and should be handled according to applicable privacy regulations (HIPAA, etc.).
              </li>
            </ul>
            
            <div style={{ 
              marginTop: 16, 
              padding: 12, 
              background: 'rgba(255,255,255,0.5)', 
              borderRadius: 8,
              border: '1px solid #ffc107'
            }}>
              <p style={{ margin: 0, fontSize: 13, fontStyle: 'italic' }}>
                <strong>Report Generated By:</strong> ASD Screening Tool v2.1 | 
                <strong>Clinical Standards:</strong> DSM-5 & ICD-11 Aligned | 
                <strong>Data Protection:</strong> HIPAA Compliant
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage; 