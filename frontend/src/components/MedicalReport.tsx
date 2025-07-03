import React, { useMemo } from 'react';
import { jsPDF } from 'jspdf';
import 'chart.js/auto';
import { Chart, registerables } from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';

Chart.register(...registerables);

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

  // Chart data for visualizations
  const domainScoresData = {
    labels: ['Social', 'Communication', 'Behavior', 'Sensory'],
    datasets: [{
      label: 'Domain Scores',
      data: [
        screeningData.screeningResults.domains.social,
        screeningData.screeningResults.domains.communication,
        screeningData.screeningResults.domains.behavior,
        screeningData.screeningResults.domains.sensory
      ],
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 205, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 205, 86, 1)',
        'rgba(75, 192, 192, 1)'
      ],
      borderWidth: 2
    }]
  };

  const riskLevelData = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk'],
    datasets: [{
      data: [
        screeningData.screeningResults.riskLevel === 'low' ? 1 : 0,
        screeningData.screeningResults.riskLevel === 'medium' ? 1 : 0,
        screeningData.screeningResults.riskLevel === 'high' ? 1 : 0
      ],
      backgroundColor: [
        'rgba(75, 192, 192, 0.8)',
        'rgba(255, 205, 86, 0.8)',
        'rgba(255, 99, 132, 0.8)'
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 205, 86, 1)',
        'rgba(255, 99, 132, 1)'
      ],
      borderWidth: 2
    }]
  };

  const prosodyData = {
    labels: ['Pitch', 'Volume', 'Speech Rate', 'Clarity'],
    datasets: [{
      label: 'Voice Prosody Analysis',
      data: [
        screeningData.voiceAnalysis.prosody.pitch,
        screeningData.voiceAnalysis.prosody.volume,
        screeningData.voiceAnalysis.prosody.speechRate,
        screeningData.voiceAnalysis.prosody.clarity
      ],
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(54, 162, 235, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
    }]
  };

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
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: 30,
        borderRadius: 12,
        marginBottom: 30,
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: 32 }}>🧠 ASD Screening Report</h1>
        <p style={{ margin: '10px 0 0 0', fontSize: 16, opacity: 0.9 }}>
          Comprehensive Analysis Report for Healthcare Practitioners
        </p>
      </div>

      {/* Patient Information Card */}
      <div style={{ 
        background: 'white', 
        padding: 24, 
        borderRadius: 12, 
        marginBottom: 24,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#333' }}>Patient Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <strong>Name:</strong> {screeningData.patientInfo.name}
          </div>
          <div>
            <strong>Age:</strong> {screeningData.patientInfo.age} years
          </div>
          <div>
            <strong>Gender:</strong> {screeningData.patientInfo.gender || 'Not specified'}
          </div>
          <div>
            <strong>Session ID:</strong> {screeningData.sessionId}
          </div>
          <div>
            <strong>Assessment Date:</strong> {reportDate}
          </div>
          <div>
            <strong>Session Duration:</strong> {sessionDuration}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div style={{ 
        background: 'white', 
        padding: 24, 
        borderRadius: 12, 
        marginBottom: 24,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#333' }}>Executive Summary</h2>
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
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>
              Overall Score: {(screeningData.screeningResults.overallScore * 100).toFixed(1)}%
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
            {getRiskLevelDescription(screeningData.screeningResults.riskLevel)}
          </p>
        </div>
      </div>

      {/* Visualizations */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: 24, 
        marginBottom: 24 
      }}>
        {/* Domain Scores Chart */}
        <div style={{ 
          background: 'white', 
          padding: 24, 
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Domain Analysis</h3>
          <Bar 
            data={domainScoresData} 
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 1,
                  ticks: {
                    callback: function(value) {
                      return (Number(value) * 100).toFixed(0) + '%';
                    }
                  }
                }
              },
              plugins: {
                legend: {
                  display: false
                }
              }
            }}
          />
        </div>

        {/* Risk Level Chart */}
        <div style={{ 
          background: 'white', 
          padding: 24, 
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Risk Assessment</h3>
          <Doughnut 
            data={riskLevelData} 
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }}
          />
        </div>

        {/* Voice Prosody Chart */}
        <div style={{ 
          background: 'white', 
          padding: 24, 
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Voice Prosody Analysis</h3>
          <Radar 
            data={prosodyData} 
            options={{
              responsive: true,
              scales: {
                r: {
                  beginAtZero: true,
                  max: 1,
                  ticks: {
                    callback: function(value) {
                      return (Number(value) * 100).toFixed(0) + '%';
                    }
                  }
                }
              }
            }}
          />
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
          background: 'white', 
          padding: 24, 
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Emotion Analysis</h3>
          <div style={{ marginBottom: 12 }}>
            <strong>Dominant Emotion:</strong> {screeningData.emotionAnalysis.dominantEmotion}
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Emotion Stability:</strong> {(screeningData.emotionAnalysis.emotionStability * 100).toFixed(1)}%
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Social Responses:</strong> {(screeningData.emotionAnalysis.socialEmotionResponses * 100).toFixed(1)}%
          </div>
        </div>

        {/* Gesture Analysis */}
        <div style={{ 
          background: 'white', 
          padding: 24, 
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Behavioral Analysis</h3>
          <div style={{ marginBottom: 8 }}>
            <strong>Repetitive Motions:</strong> {screeningData.gestureAnalysis.repetitiveMotions ? '✅ Detected' : '❌ Not detected'}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Hand Flapping:</strong> {screeningData.gestureAnalysis.handFlapping ? '✅ Detected' : '❌ Not detected'}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Fidgeting:</strong> {screeningData.gestureAnalysis.fidgeting ? '✅ Detected' : '❌ Not detected'}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Motor Coordination:</strong> {(screeningData.gestureAnalysis.motorCoordination * 100).toFixed(1)}%
          </div>
        </div>

        {/* Voice Analysis */}
        <div style={{ 
          background: 'white', 
          padding: 24, 
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Communication Analysis</h3>
          <div style={{ marginBottom: 8 }}>
            <strong>Voice Emotion:</strong> {screeningData.voiceAnalysis.voiceEmotion}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Communication Style:</strong> {(screeningData.voiceAnalysis.communicationStyle * 100).toFixed(1)}%
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Speech Patterns:</strong> {screeningData.voiceAnalysis.speechPatterns.length > 0 ? 
              screeningData.voiceAnalysis.speechPatterns.join(', ') : 'Typical patterns'
            }
          </div>
        </div>

        {/* Eye Tracking Analysis */}
        <div style={{ 
          background: 'white', 
          padding: 24, 
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Social Engagement</h3>
          <div style={{ marginBottom: 8 }}>
            <strong>Eye Contact Duration:</strong> {(screeningData.eyeTrackingAnalysis.eyeContactDuration * 100).toFixed(1)}%
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Attention Span:</strong> {(screeningData.eyeTrackingAnalysis.attentionSpan * 100).toFixed(1)}%
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Social Engagement:</strong> {(screeningData.eyeTrackingAnalysis.socialEngagement * 100).toFixed(1)}%
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Gaze Patterns:</strong> {screeningData.eyeTrackingAnalysis.gazePatterns.join(', ')}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ 
        background: 'white', 
        padding: 24, 
        borderRadius: 12, 
        marginBottom: 24,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#333' }}>Clinical Recommendations</h2>
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ color: '#666', marginBottom: 12 }}>Immediate Actions:</h4>
          <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
            {screeningData.screeningResults.recommendations.map((rec, index) => (
              <li key={index} style={{ marginBottom: 8 }}>{rec}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 style={{ color: '#666', marginBottom: 12 }}>Next Steps:</h4>
          <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
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
        color: '#666', 
        fontSize: 14,
        borderTop: '1px solid #dee2e6'
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