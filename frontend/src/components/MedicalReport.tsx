import React, { useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface ASDScreeningData {
  patientInfo: {
    name: string;
    age: number;
    gender?: string;
  };
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  emotionAnalysis: {
    dominantEmotion: string;
    emotionHistory: Array<{
      emotion: string;
      confidence: number;
      timestamp: Date;
    }>;
    emotionStability: number;
    socialEmotionResponses: number;
  };
  gestureAnalysis: {
    repetitiveMotions: boolean;
    handFlapping: boolean;
    rockingMotion: boolean;
    fidgeting: boolean;
    gestureHistory: Array<{
      type: string;
      confidence: number;
      timestamp: Date;
    }>;
    motorCoordination: number;
  };
  voiceAnalysis: {
    prosody: {
      pitch: number;
      volume: number;
      speechRate: number;
      clarity: number;
    };
    voiceEmotion: string;
    speechPatterns: string[];
    voiceHistory: Array<{
      text: string;
      emotion: string;
      confidence: number;
      timestamp: Date;
    }>;
    communicationStyle: number;
  };
  eyeTrackingAnalysis: {
    eyeContactDuration: number;
    gazePatterns: string[];
    attentionSpan: number;
    socialEngagement: number;
    eyeTrackingHistory: any[];
  };
  textAnalysis: {
    responses: Array<{
      questionId: string;
      question: string;
      answer: string;
      responseTime: number;
      confidence: number;
      analysis: {
        score: number;
        interpretation: string;
        domain: string;
      };
    }>;
    languageComplexity: number;
    socialUnderstanding: number;
  };
  behavioralObservations: {
    eyeContact: number;
    socialEngagement: number;
    repetitiveBehaviors: string[];
    sensoryResponses: string[];
    attentionSpan: number;
  };
  screeningResults: {
    overallScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    domains: {
      social: number;
      communication: number;
      behavior: number;
      sensory: number;
    };
    recommendations: string[];
    nextSteps: string[];
  };
}

interface MedicalReportProps {
  screeningData: ASDScreeningData;
  onClose?: () => void;
}

const MedicalReport: React.FC<MedicalReportProps> = ({ screeningData, onClose }) => {
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const sessionDuration = useMemo(() => {
    const duration = screeningData.duration;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [screeningData.duration]);

  // Chart data preparation
  const domainScoresData = useMemo(() => [
    { name: 'Social', score: screeningData.screeningResults.domains.social * 100, fill: '#8884d8' },
    { name: 'Communication', score: screeningData.screeningResults.domains.communication * 100, fill: '#82ca9d' },
    { name: 'Behavior', score: screeningData.screeningResults.domains.behavior * 100, fill: '#ffc658' },
    { name: 'Sensory', score: screeningData.screeningResults.domains.sensory * 100, fill: '#ff7300' }
  ], [screeningData.screeningResults.domains]);

  const radarData = useMemo(() => [
    { subject: 'Social Skills', A: screeningData.screeningResults.domains.social * 100, fullMark: 100 },
    { subject: 'Communication', A: screeningData.screeningResults.domains.communication * 100, fullMark: 100 },
    { subject: 'Behavioral', A: screeningData.screeningResults.domains.behavior * 100, fullMark: 100 },
    { subject: 'Sensory', A: screeningData.screeningResults.domains.sensory * 100, fullMark: 100 },
    { subject: 'Motor Skills', A: screeningData.gestureAnalysis.motorCoordination * 100, fullMark: 100 },
    { subject: 'Attention', A: screeningData.eyeTrackingAnalysis.attentionSpan * 100, fullMark: 100 }
  ], [screeningData]);

  const emotionTimelineData = useMemo(() => {
    return screeningData.emotionAnalysis.emotionHistory.map((entry, index) => ({
      time: index,
      emotion: entry.emotion,
      confidence: entry.confidence * 100
    }));
  }, [screeningData.emotionAnalysis.emotionHistory]);

  const prosodyData = useMemo(() => [
    { name: 'Pitch', value: screeningData.voiceAnalysis.prosody.pitch * 100 },
    { name: 'Volume', value: screeningData.voiceAnalysis.prosody.volume * 100 },
    { name: 'Speech Rate', value: screeningData.voiceAnalysis.prosody.speechRate * 100 },
    { name: 'Clarity', value: screeningData.voiceAnalysis.prosody.clarity * 100 }
  ], [screeningData.voiceAnalysis.prosody]);

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('ASD Screening Report', 105, 20, { align: 'center' });
    
    // Patient Information
    doc.setFontSize(12);
    doc.text('Patient Information:', 20, 40);
    doc.setFontSize(10);
    doc.text(`Name: ${screeningData.patientInfo.name}`, 20, 50);
    doc.text(`Age: ${screeningData.patientInfo.age} years`, 20, 60);
    doc.text(`Gender: ${screeningData.patientInfo.gender || 'Not specified'}`, 20, 70);
    doc.text(`Session ID: ${screeningData.sessionId}`, 20, 80);
    doc.text(`Date: ${reportDate}`, 20, 90);
    doc.text(`Duration: ${sessionDuration}`, 20, 100);
    
    // Screening Results
    doc.setFontSize(12);
    doc.text('Screening Results:', 20, 120);
    doc.setFontSize(10);
    doc.text(`Overall Score: ${(screeningData.screeningResults.overallScore * 100).toFixed(1)}%`, 20, 130);
    doc.text(`Risk Level: ${screeningData.screeningResults.riskLevel.toUpperCase()}`, 20, 140);
    
    // Domain Scores
    doc.text('Domain Scores:', 20, 160);
    doc.text(`Social: ${(screeningData.screeningResults.domains.social * 100).toFixed(1)}%`, 20, 170);
    doc.text(`Communication: ${(screeningData.screeningResults.domains.communication * 100).toFixed(1)}%`, 20, 180);
    doc.text(`Behavior: ${(screeningData.screeningResults.domains.behavior * 100).toFixed(1)}%`, 20, 190);
    doc.text(`Sensory: ${(screeningData.screeningResults.domains.sensory * 100).toFixed(1)}%`, 20, 200);
    
    // Recommendations
    doc.setFontSize(12);
    doc.text('Recommendations:', 20, 220);
    doc.setFontSize(10);
    screeningData.screeningResults.recommendations.forEach((rec, index) => {
      doc.text(`${index + 1}. ${rec}`, 20, 230 + (index * 10));
    });
    
    doc.save(`ASD_Screening_Report_${screeningData.patientInfo.name}_${reportDate}.pdf`);
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return '#28a745';
      case 'medium': return '#ffc107';
      case 'high': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getRiskLevelDescription = (level: string) => {
    switch (level) {
      case 'low': return 'Minimal ASD indicators detected. Continue monitoring developmental milestones.';
      case 'medium': return 'Some ASD indicators present. Consider follow-up assessment and monitoring.';
      case 'high': return 'Multiple ASD indicators detected. Recommend comprehensive evaluation by specialist.';
      default: return 'Assessment incomplete.';
    }
  };

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '0 auto', 
      padding: 20, 
      backgroundColor: '#1a1a2e',
      minHeight: '100vh',
      color: '#ffffff'
    }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0f3460 0%, #16213e 100%)',
        color: 'white',
        padding: 30,
        borderRadius: 12,
        marginBottom: 30,
        textAlign: 'center',
        border: '1px solid #2d3748'
      }}>
        <h1 style={{ margin: 0, fontSize: 32, color: '#ffffff' }}>🧠 ASD Screening Report</h1>
        <p style={{ margin: '10px 0 0 0', fontSize: 16, color: '#e2e8f0' }}>
          Comprehensive Analysis Report for Healthcare Practitioners
        </p>
      </div>

      {/* Patient Information Card */}
      <div style={{ 
        background: '#2d3748', 
        padding: 24, 
        borderRadius: 12, 
        marginBottom: 24,
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        border: '1px solid #4a5568'
      }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#ffffff' }}>Patient Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Name:</strong> {screeningData.patientInfo.name}
          </div>
          <div style={{ color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Age:</strong> {screeningData.patientInfo.age} years
          </div>
          <div style={{ color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Gender:</strong> {screeningData.patientInfo.gender || 'Not specified'}
          </div>
          <div style={{ color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Session ID:</strong> {screeningData.sessionId}
          </div>
          <div style={{ color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Assessment Date:</strong> {reportDate}
          </div>
          <div style={{ color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Session Duration:</strong> {sessionDuration}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div style={{ 
        background: '#2d3748', 
        padding: 24, 
        borderRadius: 12, 
        marginBottom: 24,
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        border: '1px solid #4a5568'
      }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#ffffff' }}>Executive Summary</h2>
        <div style={{ 
          padding: 16, 
          background: getRiskLevelColor(screeningData.screeningResults.riskLevel) + '20',
          borderLeft: `4px solid ${getRiskLevelColor(screeningData.screeningResults.riskLevel)}`,
          borderRadius: 4
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: 12 
          }}>
            <div style={{ 
              padding: '8px 16px', 
              background: getRiskLevelColor(screeningData.screeningResults.riskLevel),
              color: 'white',
              borderRadius: 20,
              fontWeight: 'bold',
              marginRight: 12
            }}>
              {screeningData.screeningResults.riskLevel.toUpperCase()} RISK
            </div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}>
              Overall Score: {(screeningData.screeningResults.overallScore * 100).toFixed(1)}%
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: '#e2e8f0' }}>
            {getRiskLevelDescription(screeningData.screeningResults.riskLevel)}
          </p>
        </div>
      </div>

      {/* Domain Scores */}
      <div style={{ 
        background: '#2d3748', 
        padding: 24, 
        borderRadius: 12, 
        marginBottom: 24,
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        border: '1px solid #4a5568'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#ffffff' }}>Domain Analysis</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ padding: 16, background: '#4a5568', borderRadius: 8, textAlign: 'center', border: '1px solid #718096' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#63b3ed' }}>Social</h4>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#63b3ed' }}>
              {(screeningData.screeningResults.domains.social * 100).toFixed(0)}%
            </div>
          </div>
          <div style={{ padding: 16, background: '#4a5568', borderRadius: 8, textAlign: 'center', border: '1px solid #718096' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#68d391' }}>Communication</h4>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#68d391' }}>
              {(screeningData.screeningResults.domains.communication * 100).toFixed(0)}%
            </div>
          </div>
          <div style={{ padding: 16, background: '#4a5568', borderRadius: 8, textAlign: 'center', border: '1px solid #718096' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#f6ad55' }}>Behavior</h4>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f6ad55' }}>
              {(screeningData.screeningResults.domains.behavior * 100).toFixed(0)}%
            </div>
          </div>
          <div style={{ padding: 16, background: '#4a5568', borderRadius: 8, textAlign: 'center', border: '1px solid #718096' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#81e6d9' }}>Sensory</h4>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#81e6d9' }}>
              {(screeningData.screeningResults.domains.sensory * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: 24, 
        marginBottom: 24 
      }}>
        {/* Emotion Analysis */}
        <div style={{ 
          background: '#2d3748', 
          padding: 24, 
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          border: '1px solid #4a5568'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#ffffff' }}>Emotion Analysis</h3>
          <div style={{ marginBottom: 12, color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Dominant Emotion:</strong> {screeningData.emotionAnalysis.dominantEmotion}
          </div>
          <div style={{ marginBottom: 12, color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Emotion Stability:</strong> {(screeningData.emotionAnalysis.emotionStability * 100).toFixed(1)}%
          </div>
          <div style={{ marginBottom: 12, color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Social Responses:</strong> {(screeningData.emotionAnalysis.socialEmotionResponses * 100).toFixed(1)}%
          </div>
        </div>

        {/* Gesture Analysis */}
        <div style={{ 
          background: '#2d3748', 
          padding: 24, 
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          border: '1px solid #4a5568'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#ffffff' }}>Behavioral Analysis</h3>
          <div style={{ marginBottom: 8, color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Repetitive Motions:</strong> {screeningData.gestureAnalysis.repetitiveMotions ? '✅ Detected' : '❌ Not detected'}
          </div>
          <div style={{ marginBottom: 8, color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Hand Flapping:</strong> {screeningData.gestureAnalysis.handFlapping ? '✅ Detected' : '❌ Not detected'}
          </div>
          <div style={{ marginBottom: 8, color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Fidgeting:</strong> {screeningData.gestureAnalysis.fidgeting ? '✅ Detected' : '❌ Not detected'}
          </div>
          <div style={{ marginBottom: 8, color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Motor Coordination:</strong> {(screeningData.gestureAnalysis.motorCoordination * 100).toFixed(1)}%
          </div>
        </div>

        {/* Voice Analysis */}
        <div style={{ 
          background: '#2d3748', 
          padding: 24, 
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          border: '1px solid #4a5568'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#ffffff' }}>Communication Analysis</h3>
          <div style={{ marginBottom: 8, color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Voice Emotion:</strong> {screeningData.voiceAnalysis.voiceEmotion}
          </div>
          <div style={{ marginBottom: 8, color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Communication Style:</strong> {(screeningData.voiceAnalysis.communicationStyle * 100).toFixed(1)}%
          </div>
          <div style={{ marginBottom: 8, color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Speech Patterns:</strong> {screeningData.voiceAnalysis.speechPatterns.length > 0 ? 
              screeningData.voiceAnalysis.speechPatterns.join(', ') : 'Typical patterns'
            }
          </div>
        </div>

        {/* Eye Tracking Analysis */}
        <div style={{ 
          background: '#2d3748', 
          padding: 24, 
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          border: '1px solid #4a5568'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#ffffff' }}>Social Engagement</h3>
          <div style={{ marginBottom: 8, color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Eye Contact Duration:</strong> {(screeningData.eyeTrackingAnalysis.eyeContactDuration * 100).toFixed(1)}%
          </div>
          <div style={{ marginBottom: 8, color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Attention Span:</strong> {(screeningData.eyeTrackingAnalysis.attentionSpan * 100).toFixed(1)}%
          </div>
          <div style={{ marginBottom: 8, color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Social Engagement:</strong> {(screeningData.eyeTrackingAnalysis.socialEngagement * 100).toFixed(1)}%
          </div>
          <div style={{ marginBottom: 8, color: '#e2e8f0' }}>
            <strong style={{ color: '#63b3ed' }}>Gaze Patterns:</strong> {screeningData.eyeTrackingAnalysis.gazePatterns.join(', ')}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ 
        background: '#2d3748', 
        padding: 24, 
        borderRadius: 12, 
        marginBottom: 24,
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        border: '1px solid #4a5568'
      }}>
        <h2 style={{ margin: '0 0 24px 0', color: '#ffffff' }}>Clinical Visualizations</h2>
        
        {/* Domain Scores Bar Chart */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#e2e8f0' }}>Domain Performance Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={domainScoresData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
              <Bar dataKey="score" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart for Comprehensive Assessment */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#e2e8f0' }}>Comprehensive Assessment Profile</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Assessment Score" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Voice Prosody Analysis */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#e2e8f0' }}>Voice Prosody Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={prosodyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Emotion Timeline */}
        {emotionTimelineData.length > 0 && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', color: '#e2e8f0' }}>Emotion Timeline</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={emotionTimelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, 'Confidence']} />
                <Legend />
                <Line type="monotone" dataKey="confidence" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div style={{ 
        background: '#2d3748', 
        padding: 24, 
        borderRadius: 12, 
        marginBottom: 24,
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        border: '1px solid #4a5568'
      }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#ffffff' }}>Clinical Recommendations</h2>
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ color: '#e2e8f0', marginBottom: 12 }}>Immediate Actions:</h4>
          <ul style={{ paddingLeft: 20, lineHeight: 1.6, color: '#e2e8f0' }}>
            {screeningData.screeningResults.recommendations.map((rec, index) => (
              <li key={index} style={{ marginBottom: 8 }}>{rec}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 style={{ color: '#e2e8f0', marginBottom: 12 }}>Next Steps:</h4>
          <ul style={{ paddingLeft: 20, lineHeight: 1.6, color: '#e2e8f0' }}>
            {screeningData.screeningResults.nextSteps.map((step, index) => (
              <li key={index} style={{ marginBottom: 8 }}>{step}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        justifyContent: 'center',
        marginBottom: 24
      }}>
        <button
          onClick={generatePDF}
          style={{
            padding: '16px 32px',
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 50,
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(40, 167, 69, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(40, 167, 69, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(40, 167, 69, 0.3)';
          }}
        >
          📄 Download PDF Report
        </button>
        
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 50,
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(108, 117, 125, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(108, 117, 125, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(108, 117, 125, 0.3)';
            }}
          >
            ← Back to Screening
          </button>
        )}
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        padding: 20, 
        color: '#a0aec0', 
        fontSize: 14,
        borderTop: '1px solid #4a5568'
      }}>
        <p style={{ margin: 0 }}>
          This report was generated by the ASD Screening Tool using AI-powered analysis.
          <br />
          For clinical decisions, please consult with qualified healthcare professionals.
        </p>
      </div>
    </div>
  );
};

export default MedicalReport; 