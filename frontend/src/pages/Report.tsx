import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConversationEntry } from '../services/adaptiveEngine';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

  // Color palette for charts
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#00ff00', '#0000ff'];

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

  // Get data for visualizations
  const emotionTrendData = prepareEmotionTrendData(propEmotionLog.length > 0 ? propEmotionLog : 
    JSON.parse(sessionStorage.getItem('screeningEmotionLog') || '[]'));
  const riskHeatmapData = prepareRiskHeatmapData(propHistory.length > 0 ? propHistory : 
    JSON.parse(sessionStorage.getItem('screeningHistory') || '[]'));
  const domainCoverageData = prepareDomainCoverageData(propHistory.length > 0 ? propHistory : 
    JSON.parse(sessionStorage.getItem('screeningHistory') || '[]'));

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: 1200, 
        margin: '0 auto', 
        background: 'white',
        borderRadius: 12,
        padding: 40,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 30,
          borderBottom: '2px solid #61dafb',
          paddingBottom: 20
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#333', fontSize: '2rem' }}>📋 Clinical Screening Report</h1>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleBackToChat}
              style={{
                padding: '10px 20px',
                background: '#f0f0f0',
                border: 'none',
                borderRadius: 6,
                color: '#333',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ← Back to Chat
            </button>
            <button
              onClick={downloadPDF}
              style={{
                padding: '10px 20px',
                background: '#61dafb',
                border: 'none',
                borderRadius: 6,
                color: '#222',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📥 Download Report
            </button>
          </div>
        </div>

        {/* Summary Section */}
        <section style={{ marginBottom: 30 }}>
          <h2 style={{ color: '#333', borderBottom: '1px solid #eee', paddingBottom: 10 }}>Executive Summary</h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: '#444' }}>{report.summary}</p>
        </section>

        {/* Visualizations Section */}
        <section style={{ marginBottom: 30 }}>
          <h2 style={{ color: '#333', borderBottom: '1px solid #eee', paddingBottom: 10 }}>Data Visualizations</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginTop: 20 }}>
            
            {/* Emotion Trend Chart */}
            <div style={{ 
              background: '#f8f9fa', 
              padding: 20, 
              borderRadius: 8,
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{ color: '#333', marginTop: 0, marginBottom: 16 }}>Emotion Trends Over Time</h3>
              {emotionTrendData.length > 0 ? (
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={emotionTrendData}>
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
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  No emotion data available
                </div>
              )}
            </div>

            {/* Risk Heatmap */}
            <div style={{ 
              background: '#f8f9fa', 
              padding: 20, 
              borderRadius: 8,
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{ color: '#333', marginTop: 0, marginBottom: 16 }}>Domain Risk Assessment</h3>
              {riskHeatmapData.length > 0 ? (
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={riskHeatmapData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        type="number" 
                        domain={[0, 1]}
                        tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                        tick={{ fontSize: 12, fill: '#666' }}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="domain" 
                        width={120}
                        tick={{ fontSize: 11, fill: '#333' }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${(value * 100).toFixed(1)}% risk`, 'Risk Level']}
                        labelFormatter={(label) => `Domain: ${label}`}
                      />
                      <Bar 
                        dataKey="risk" 
                        fill={(entry: any) => {
                          const risk = entry.risk;
                          if (risk > 0.7) return '#dc3545'; // High risk - red
                          if (risk > 0.4) return '#ffc107'; // Medium risk - yellow
                          return '#28a745'; // Low risk - green
                        }}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  No domain data available
                </div>
              )}
            </div>

            {/* Domain Coverage Chart */}
            <div style={{ 
              background: '#f8f9fa', 
              padding: 20, 
              borderRadius: 8,
              border: '1px solid #e9ecef',
              gridColumn: 'span 2'
            }}>
              <h3 style={{ color: '#333', marginTop: 0, marginBottom: 16 }}>Domain Coverage Distribution</h3>
              {domainCoverageData.length > 0 ? (
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={domainCoverageData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ domain, percentage }) => `${domain}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {domainCoverageData.map((entry, index) => (
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
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  No domain coverage data available
                </div>
              )}
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

        {/* Disclaimer */}
        <div style={{ 
          marginTop: 30, 
          padding: 20, 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7',
          borderRadius: 8,
          color: '#856404'
        }}>
          <strong>Important Disclaimer:</strong> This report is generated from a screening session and is for informational purposes only. 
          It should not be used as a diagnostic tool. Please consult with qualified healthcare professionals for comprehensive evaluation and diagnosis.
        </div>
      </div>
    </div>
  );
};

export default ReportPage; 