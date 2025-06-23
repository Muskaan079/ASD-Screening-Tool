import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClinicalReport, generatePDFContent, EmotionLogEntry } from '../services/reportGenerator';
import { ConversationEntry } from '../services/adaptiveEngine';

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
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ConversationEntry[]>(propHistory);
  const [emotionLog, setEmotionLog] = useState<EmotionLogEntry[]>(propEmotionLog);
  const [sessionDuration, setSessionDuration] = useState<number>(propSessionDuration);
  const navigate = useNavigate();

  useEffect(() => {
    // If no props provided, try to get data from sessionStorage
    if (propHistory.length === 0 && propEmotionLog.length === 0) {
      try {
        const storedHistory = sessionStorage.getItem('screeningHistory');
        const storedEmotionLog = sessionStorage.getItem('screeningEmotionLog');
        const storedDuration = sessionStorage.getItem('screeningDuration');

        if (storedHistory && storedEmotionLog && storedDuration) {
          setHistory(JSON.parse(storedHistory));
          setEmotionLog(JSON.parse(storedEmotionLog));
          setSessionDuration(parseInt(storedDuration));
        } else {
          // No stored data, redirect to chat
          navigate('/chat');
          return;
        }
      } catch (err) {
        console.error('Error reading from sessionStorage:', err);
        navigate('/chat');
        return;
      }
    }

    // If we have data (either from props or sessionStorage), generate report
    if (history.length > 0 || emotionLog.length > 0) {
      generateReport();
    }
  }, [propHistory, propEmotionLog, propSessionDuration, navigate]);

  const generateReport = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      console.log('Starting report generation...', { history, emotionLog, sessionDuration });
      
      // Import the report generator dynamically to avoid circular dependencies
      const { generateClinicalReport } = await import('../services/reportGenerator');
      
      console.log('Report generator imported, calling generateClinicalReport...');
      
      const clinicalReport = await generateClinicalReport({
        history,
        emotionLog,
        sessionDuration,
      });
      
      console.log('Report generated successfully:', clinicalReport);
      setReport(clinicalReport);
    } catch (err) {
      console.error('Error in generateReport:', err);
      setError('Failed to generate clinical report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!report) return;
    
    const content = generatePDFContent(report);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinical-report-${new Date().toISOString().split('T')[0]}.txt`;
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
            onClick={generateReport}
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
    return null;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: 1000, 
        margin: '0 auto', 
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          background: '#61dafb', 
          padding: '24px',
          color: '#222'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 'bold' }}>Clinical Screening Report</h1>
              <p style={{ margin: '8px 0 0 0', opacity: 0.8 }}>
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={downloadPDF}
                style={{
                  padding: '10px 20px',
                  background: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  color: '#222',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                📄 Download Report
              </button>
              <button 
                onClick={handleBackToChat}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '2px solid #fff',
                  borderRadius: 6,
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                ← Back to Chat
              </button>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div style={{ padding: '32px' }}>
          {/* Summary */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: '#333', borderBottom: '2px solid #61dafb', paddingBottom: 8, marginBottom: 16 }}>
              Executive Summary
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: '#555' }}>
              {report.summary}
            </p>
          </section>

          {/* Session Metadata */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: '#333', borderBottom: '2px solid #61dafb', paddingBottom: 8, marginBottom: 16 }}>
              Session Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8 }}>
                <div style={{ fontWeight: 'bold', color: '#333' }}>Total Questions</div>
                <div style={{ fontSize: 24, color: '#61dafb' }}>{report.sessionMetadata.totalQuestions}</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8 }}>
                <div style={{ fontWeight: 'bold', color: '#333' }}>Session Duration</div>
                <div style={{ fontSize: 24, color: '#61dafb' }}>{report.sessionMetadata.sessionDuration} min</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8 }}>
                <div style={{ fontWeight: 'bold', color: '#333' }}>Primary Emotions</div>
                <div style={{ fontSize: 16, color: '#61dafb' }}>{report.sessionMetadata.primaryEmotions.join(', ')}</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8 }}>
                <div style={{ fontWeight: 'bold', color: '#333' }}>Emotion Variability</div>
                <div style={{ fontSize: 24, color: '#61dafb' }}>{report.sessionMetadata.emotionVariability.toFixed(2)}</div>
              </div>
            </div>
          </section>

          {/* Domains Addressed */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: '#333', borderBottom: '2px solid #61dafb', paddingBottom: 8, marginBottom: 16 }}>
              DSM-5 Domains Addressed
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {report.domainsAddressed.map((domain, index) => (
                <span 
                  key={index}
                  style={{
                    background: '#e3f2fd',
                    color: '#1976d2',
                    padding: '8px 16px',
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
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: '#333', borderBottom: '2px solid #61dafb', paddingBottom: 8, marginBottom: 16 }}>
              Key Behavioral Observations
            </h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {report.keyObservations.map((observation, index) => (
                <li 
                  key={index}
                  style={{
                    background: '#f8f9fa',
                    padding: 16,
                    marginBottom: 12,
                    borderRadius: 8,
                    borderLeft: '4px solid #61dafb',
                    fontSize: 15,
                    lineHeight: 1.5
                  }}
                >
                  {observation}
                </li>
              ))}
            </ul>
          </section>

          {/* Emotional State Trends */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: '#333', borderBottom: '2px solid #61dafb', paddingBottom: 8, marginBottom: 16 }}>
              Emotional State Trends
            </h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {report.emotionalStateTrends.map((trend, index) => (
                <li 
                  key={index}
                  style={{
                    background: '#fff3e0',
                    padding: 16,
                    marginBottom: 12,
                    borderRadius: 8,
                    borderLeft: '4px solid #ff9800',
                    fontSize: 15,
                    lineHeight: 1.5
                  }}
                >
                  {trend}
                </li>
              ))}
            </ul>
          </section>

          {/* Risk Areas */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: '#333', borderBottom: '2px solid #61dafb', paddingBottom: 8, marginBottom: 16 }}>
              Areas Requiring Attention
            </h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {report.riskAreas.map((risk, index) => (
                <li 
                  key={index}
                  style={{
                    background: '#ffebee',
                    padding: 16,
                    marginBottom: 12,
                    borderRadius: 8,
                    borderLeft: '4px solid #f44336',
                    fontSize: 15,
                    lineHeight: 1.5
                  }}
                >
                  {risk}
                </li>
              ))}
            </ul>
          </section>

          {/* Recommendations */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: '#333', borderBottom: '2px solid #61dafb', paddingBottom: 8, marginBottom: 16 }}>
              Clinical Recommendations
            </h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {report.recommendations.map((recommendation, index) => (
                <li 
                  key={index}
                  style={{
                    background: '#e8f5e8',
                    padding: 16,
                    marginBottom: 12,
                    borderRadius: 8,
                    borderLeft: '4px solid #4caf50',
                    fontSize: 15,
                    lineHeight: 1.5
                  }}
                >
                  {recommendation}
                </li>
              ))}
            </ul>
          </section>

          {/* Disclaimer */}
          <section style={{ 
            background: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: 8, 
            padding: 20,
            marginTop: 40
          }}>
            <h3 style={{ color: '#856404', margin: '0 0 12px 0' }}>⚠️ Important Disclaimer</h3>
            <p style={{ color: '#856404', margin: 0, lineHeight: 1.5 }}>
              This report is based on a screening session and should not be considered a clinical diagnosis. 
              The observations and recommendations provided are for informational purposes only. 
              Please consult with a qualified mental health professional for comprehensive evaluation and diagnosis.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ReportPage; 