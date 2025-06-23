import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { llmService } from '../services/llmService';
import { createPDFExportService } from '../services/pdfService';
import AdaptiveQuestioning from '../components/AdaptiveQuestioning';
import { ClinicalReport } from '../types';
import './EnhancedResults.css';

const EnhancedResults: React.FC = () => {
  const {
    currentSession,
    currentReport,
    setCurrentReport,
    setLoading,
    setError
  } = useAppStore();

  const [showAdaptiveQuestioning, setShowAdaptiveQuestioning] = useState(false);
  const [pdfConfig, setPdfConfig] = useState({
    template: 'clinical' as const,
    includeCharts: true,
    includeExplainability: true,
    practitionerSignature: '',
    clinicInfo: {
      name: 'ASD Screening Clinic',
      address: '123 Medical Center Dr, Suite 100',
      phone: '(555) 123-4567',
      email: 'info@asdscreening.com'
    }
  });

  useEffect(() => {
    if (currentSession && !currentReport) {
      generateClinicalReport();
    }
  }, [currentSession]);

  const generateClinicalReport = async () => {
    try {
      setLoading(true);
      
      const sessionData = {
        sessionId: currentSession?.id,
        patientId: currentSession?.userId,
        practitionerId: 'practitioner_001',
        testResults: {
          emotionRecognition: { score: 8, maxScore: 10, percentage: 80, timeTaken: 45000, accuracy: 0.8, ageNorm: 8.5, percentile: 75 },
          patternRecognition: { score: 7, maxScore: 10, percentage: 70, timeTaken: 60000, accuracy: 0.7, ageNorm: 7.8, percentile: 65 },
          reactionTime: { score: 6, maxScore: 10, percentage: 60, timeTaken: 30000, accuracy: 0.6, ageNorm: 8.2, percentile: 55 },
          adaptiveQuestioning: currentSession?.adaptiveData
        }
      };

      const report = await llmService.generateClinicalReport(sessionData);
      setCurrentReport(report);
      setLoading(false);
    } catch (error) {
      setError('Failed to generate clinical report');
      setLoading(false);
    }
  };

  const handleAdaptiveQuestioningComplete = (summary: any) => {
    console.log('Adaptive questioning completed:', summary);
    setShowAdaptiveQuestioning(false);
    generateClinicalReport();
  };

  const exportToPDF = async () => {
    try {
      setLoading(true);
      
      if (!currentReport) {
        throw new Error('No report available for export');
      }

      const pdfService = createPDFExportService(pdfConfig);
      const pdfBlob = await pdfService.generateClinicalReportPDF(currentReport);
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `asd-screening-report-${currentReport.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setLoading(false);
    } catch (error) {
      setError('Failed to export PDF');
      setLoading(false);
    }
  };

  if (!currentSession) {
    return (
      <div className="enhanced-results">
        <div className="no-session">
          <h2>No Active Session</h2>
          <p>Please start a screening session to view results.</p>
          <button 
            onClick={() => setShowAdaptiveQuestioning(true)}
            className="start-btn"
          >
            Start Adaptive Questioning
          </button>
        </div>
      </div>
    );
  }

  if (showAdaptiveQuestioning) {
    return (
      <div className="enhanced-results">
        <AdaptiveQuestioning onComplete={handleAdaptiveQuestioningComplete} />
      </div>
    );
  }

  return (
    <div className="enhanced-results">
      <div className="results-header">
        <h1>ASD Screening Results</h1>
        <p>Comprehensive analysis and recommendations</p>
      </div>

      {currentReport && (
        <div className="results-content">
          <div className="summary-section">
            <h2>Executive Summary</h2>
            <div className="summary-card">
              <p>{currentReport.aiAnalysis.summary}</p>
              <div className="confidence-indicator">
                <span>AI Confidence: {(currentReport.aiAnalysis.confidence * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="test-results-grid">
            <div className="test-card">
              <h3>Emotion Recognition</h3>
              <div className="test-score">
                <span className="score">{currentReport.testResults.emotionRecognition.score}</span>
                <span className="max-score">/ {currentReport.testResults.emotionRecognition.maxScore}</span>
              </div>
              <div className="test-metrics">
                <div className="metric">
                  <span>Accuracy:</span>
                  <span>{(currentReport.testResults.emotionRecognition.accuracy * 100).toFixed(1)}%</span>
                </div>
                <div className="metric">
                  <span>Percentile:</span>
                  <span>{currentReport.testResults.emotionRecognition.percentile}</span>
                </div>
              </div>
            </div>

            <div className="test-card">
              <h3>Pattern Recognition</h3>
              <div className="test-score">
                <span className="score">{currentReport.testResults.patternRecognition.score}</span>
                <span className="max-score">/ {currentReport.testResults.patternRecognition.maxScore}</span>
              </div>
              <div className="test-metrics">
                <div className="metric">
                  <span>Accuracy:</span>
                  <span>{(currentReport.testResults.patternRecognition.accuracy * 100).toFixed(1)}%</span>
                </div>
                <div className="metric">
                  <span>Percentile:</span>
                  <span>{currentReport.testResults.patternRecognition.percentile}</span>
                </div>
              </div>
            </div>

            <div className="test-card">
              <h3>Reaction Time</h3>
              <div className="test-score">
                <span className="score">{currentReport.testResults.reactionTime.score}</span>
                <span className="max-score">/ {currentReport.testResults.reactionTime.maxScore}</span>
              </div>
              <div className="test-metrics">
                <div className="metric">
                  <span>Accuracy:</span>
                  <span>{(currentReport.testResults.reactionTime.accuracy * 100).toFixed(1)}%</span>
                </div>
                <div className="metric">
                  <span>Percentile:</span>
                  <span>{currentReport.testResults.reactionTime.percentile}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              onClick={() => setShowAdaptiveQuestioning(true)}
              className="action-btn adaptive-btn"
            >
              Start Adaptive Questioning
            </button>
            
            <button 
              onClick={exportToPDF}
              className="action-btn export-btn"
            >
              Export Report (PDF)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedResults; 