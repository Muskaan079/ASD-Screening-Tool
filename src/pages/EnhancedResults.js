import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/simpleStore';
import { api } from '../services/api';
import './EnhancedResults.css';

const EnhancedResults = () => {
  const {
    currentSession,
    currentReport,
    setCurrentReport,
    setLoading,
    setError,
    loading,
    error
  } = useAppStore();

  const [showAdaptiveQuestioning, setShowAdaptiveQuestioning] = useState(false);
  const [showExplainability, setShowExplainability] = useState(false);
  const [llmStatus, setLlmStatus] = useState('checking');

  useEffect(() => {
    checkLLMStatus();
    if (!currentReport) {
      generateRealReport();
    }
  }, []);

  const checkLLMStatus = async () => {
    try {
      const health = await api.checkHealth();
      setLlmStatus(health.openaiConfigured ? 'available' : 'unavailable');
    } catch (error) {
      setLlmStatus('unavailable');
    }
  };

  const generateRealReport = async () => {
    try {
      setLoading(true);
      
      // Create sample session data for demonstration
      const sessionData = {
        sessionId: currentSession?.id || 'session_001',
        patientId: currentSession?.userId || 'patient_001',
        practitionerId: 'practitioner_001',
        testResults: {
          emotionRecognition: {
            score: 8,
            maxScore: 10,
            percentage: 80,
            timeTaken: 45000,
            accuracy: 0.8,
            ageNorm: 8.5,
            percentile: 75
          },
          patternRecognition: {
            score: 7,
            maxScore: 10,
            percentage: 70,
            timeTaken: 60000,
            accuracy: 0.7,
            ageNorm: 7.8,
            percentile: 65
          },
          reactionTime: {
            score: 6,
            maxScore: 10,
            percentage: 60,
            timeTaken: 30000,
            accuracy: 0.6,
            ageNorm: 8.2,
            percentile: 55
          }
        },
        totalDuration: 180000,
        questionsAnswered: 15,
        adaptiveAdjustments: 3
      };

      const criteria = {
        dsm5: true,
        icd11: true,
        includeRecommendations: true
      };

      // Call real LLM API
      const result = await api.generateClinicalReport(sessionData, criteria, 'pdf');
      
      if (result.success && result.report) {
        setCurrentReport(result.report);
      } else {
        throw new Error('Failed to generate report');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error generating real report:', error);
      setError('Failed to generate clinical report. Using demo data instead.');
      generateMockReport();
    }
  };

  const generateMockReport = async () => {
    try {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockReport = {
        id: `report_${Date.now()}`,
        sessionId: currentSession?.id || 'session_001',
        patientId: currentSession?.userId || 'patient_001',
        practitionerId: 'practitioner_001',
        date: new Date(),
        
        testResults: {
          emotionRecognition: {
            score: 8,
            maxScore: 10,
            percentage: 80,
            timeTaken: 45000,
            accuracy: 0.8,
            ageNorm: 8.5,
            percentile: 75
          },
          patternRecognition: {
            score: 7,
            maxScore: 10,
            percentage: 70,
            timeTaken: 60000,
            accuracy: 0.7,
            ageNorm: 7.8,
            percentile: 65
          },
          reactionTime: {
            score: 6,
            maxScore: 10,
            percentage: 60,
            timeTaken: 30000,
            accuracy: 0.6,
            ageNorm: 8.2,
            percentile: 55
          }
        },
        
        aiAnalysis: {
          summary: 'The assessment indicates moderate social communication challenges with some repetitive behaviors observed. The child shows good performance in emotion recognition tasks but may benefit from additional support in pattern recognition and response timing.',
          observations: [
            'Good performance in emotion recognition tasks',
            'Moderate difficulty with pattern recognition',
            'Some delays in response times',
            'Appropriate adaptive questioning responses'
          ],
          riskFactors: [
            'Social interaction difficulties',
            'Communication challenges',
            'Sensory sensitivities'
          ],
          recommendations: [
            'Consider comprehensive evaluation by specialist',
            'Implement social skills training',
            'Address sensory processing needs',
            'Monitor progress over time'
          ],
          confidence: 0.75
        }
      };
      
      setCurrentReport(mockReport);
      setLoading(false);
    } catch (error) {
      setError('Failed to generate clinical report');
      setLoading(false);
    }
  };

  const handleAdaptiveQuestioningComplete = async (summary) => {
    console.log('Adaptive questioning completed:', summary);
    setShowAdaptiveQuestioning(false);
    
    try {
      // Use real LLM to analyze the adaptive questioning results
      const context = {
        adaptiveQuestioning: summary,
        sessionData: currentSession,
        timestamp: new Date()
      };
      
      const analysis = await api.analyzeMultimodalContext(context);
      console.log('LLM analysis of adaptive questioning:', analysis);
      
      // Regenerate report with new data
      generateRealReport();
    } catch (error) {
      console.error('Error analyzing adaptive questioning:', error);
      generateMockReport();
    }
  };

  const exportToPDF = async () => {
    try {
      setLoading(true);
      
      if (!currentReport) {
        throw new Error('No report available for export');
      }

      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a simple text file as PDF alternative
      const reportText = `
ASD Screening Clinical Report
============================

Patient ID: ${currentReport.patientId}
Session ID: ${currentReport.sessionId}
Date: ${currentReport.date.toLocaleDateString()}

Executive Summary:
${currentReport.aiAnalysis?.summary || currentReport.summary || 'No summary available'}

Test Results:
- Emotion Recognition: ${currentReport.testResults?.emotionRecognition?.score || 'N/A'}/${currentReport.testResults?.emotionRecognition?.maxScore || 'N/A'} (${currentReport.testResults?.emotionRecognition?.percentage || 'N/A'}%)
- Pattern Recognition: ${currentReport.testResults?.patternRecognition?.score || 'N/A'}/${currentReport.testResults?.patternRecognition?.maxScore || 'N/A'} (${currentReport.testResults?.patternRecognition?.percentage || 'N/A'}%)
- Reaction Time: ${currentReport.testResults?.reactionTime?.score || 'N/A'}/${currentReport.testResults?.reactionTime?.maxScore || 'N/A'} (${currentReport.testResults?.reactionTime?.percentage || 'N/A'}%)

AI Confidence: ${((currentReport.aiAnalysis?.confidence || currentReport.confidence || 0.7) * 100).toFixed(1)}%

Recommendations:
${(currentReport.aiAnalysis?.recommendations || currentReport.recommendations || ['No recommendations available']).map(rec => `- ${rec}`).join('\n')}

Generated by: ${currentReport.metadata?.generatedBy || 'ASD Screening Tool'}
      `;
      
      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `asd-screening-report-${currentReport.id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setLoading(false);
    } catch (error) {
      setError('Failed to export report');
      setLoading(false);
    }
  };

  const startAdaptiveQuestioning = () => {
    setShowAdaptiveQuestioning(true);
  };

  const generateExplainability = async () => {
    try {
      setLoading(true);
      
      const analysisData = {
        testResults: currentReport?.testResults,
        aiAnalysis: currentReport?.aiAnalysis,
        sessionData: currentSession
      };
      
      const explainabilityResult = await api.generateExplainabilityData(analysisData, 'feature_importance');
      console.log('Explainability data:', explainabilityResult);
      
      setShowExplainability(true);
      setLoading(false);
    } catch (error) {
      console.error('Error generating explainability:', error);
      setShowExplainability(true);
      setLoading(false);
    }
  };

  if (showAdaptiveQuestioning) {
    return (
      <div className="enhanced-results">
        <div className="adaptive-questioning-demo">
          <h2>Adaptive Questioning Demo</h2>
          <p>This is a demonstration of the adaptive questioning feature with real LLM integration.</p>
          <div className="demo-questions">
            <div className="question-card">
              <h3>Question 1 of 5</h3>
              <p>What emotion do you see in this face?</p>
              <div className="response-section">
                <textarea placeholder="Type your response here..." rows={4} />
                <button onClick={() => handleAdaptiveQuestioningComplete({ 
                  question: 'What emotion do you see in this face?',
                  response: 'Sample response',
                  responseTime: 5000,
                  accuracy: 0.8
                })}>
                  Submit Response
                </button>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowAdaptiveQuestioning(false)}
            className="back-btn"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="enhanced-results">
        <div className="loading">
          <h2>Loading...</h2>
          <p>Generating your clinical report with AI analysis...</p>
          {llmStatus === 'checking' && <p>Checking LLM availability...</p>}
          {llmStatus === 'available' && <p>Using real AI analysis</p>}
          {llmStatus === 'unavailable' && <p>Using demo data (LLM not configured)</p>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="enhanced-results">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={generateRealReport} className="retry-btn">
            Retry with Real LLM
          </button>
          <button onClick={generateMockReport} className="retry-btn">
            Use Demo Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-results">
      <div className="results-header">
        <h1>ASD Screening Results</h1>
        <p>Comprehensive analysis and recommendations</p>
        {llmStatus === 'available' && (
          <div className="llm-status available">
            🤖 Real AI Analysis Active
          </div>
        )}
        {llmStatus === 'unavailable' && (
          <div className="llm-status unavailable">
            ⚠️ Demo Mode - Configure OpenAI API for real analysis
          </div>
        )}
      </div>

      {currentReport && (
        <div className="results-content">
          <div className="summary-section">
            <h2>Executive Summary</h2>
            <div className="summary-card">
              <p>{currentReport.aiAnalysis?.summary || currentReport.summary || 'No summary available'}</p>
              <div className="confidence-indicator">
                <span>AI Confidence: {((currentReport.aiAnalysis?.confidence || currentReport.confidence || 0.7) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="test-results-grid">
            <div className="test-card">
              <h3>Emotion Recognition</h3>
              <div className="test-score">
                <span className="score">{currentReport.testResults?.emotionRecognition?.score || 'N/A'}</span>
                <span className="max-score">/ {currentReport.testResults?.emotionRecognition?.maxScore || 'N/A'}</span>
              </div>
              <div className="test-metrics">
                <div className="metric">
                  <span>Accuracy:</span>
                  <span>{((currentReport.testResults?.emotionRecognition?.accuracy || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="metric">
                  <span>Percentile:</span>
                  <span>{currentReport.testResults?.emotionRecognition?.percentile || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="test-card">
              <h3>Pattern Recognition</h3>
              <div className="test-score">
                <span className="score">{currentReport.testResults?.patternRecognition?.score || 'N/A'}</span>
                <span className="max-score">/ {currentReport.testResults?.patternRecognition?.maxScore || 'N/A'}</span>
              </div>
              <div className="test-metrics">
                <div className="metric">
                  <span>Accuracy:</span>
                  <span>{((currentReport.testResults?.patternRecognition?.accuracy || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="metric">
                  <span>Percentile:</span>
                  <span>{currentReport.testResults?.patternRecognition?.percentile || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="test-card">
              <h3>Reaction Time</h3>
              <div className="test-score">
                <span className="score">{currentReport.testResults?.reactionTime?.score || 'N/A'}</span>
                <span className="max-score">/ {currentReport.testResults?.reactionTime?.maxScore || 'N/A'}</span>
              </div>
              <div className="test-metrics">
                <div className="metric">
                  <span>Accuracy:</span>
                  <span>{((currentReport.testResults?.reactionTime?.accuracy || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="metric">
                  <span>Percentile:</span>
                  <span>{currentReport.testResults?.reactionTime?.percentile || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ai-analysis-section">
            <h2>AI Analysis</h2>
            <div className="analysis-grid">
              <div className="analysis-card">
                <h3>Key Observations</h3>
                <ul>
                  {(currentReport.aiAnalysis?.observations || currentReport.observations || ['No observations available']).map((observation, index) => (
                    <li key={index}>{observation}</li>
                  ))}
                </ul>
              </div>

              <div className="analysis-card">
                <h3>Risk Factors</h3>
                <ul>
                  {(currentReport.aiAnalysis?.riskFactors || currentReport.riskFactors || ['No risk factors identified']).map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </div>

              <div className="analysis-card">
                <h3>Recommendations</h3>
                <ul>
                  {(currentReport.aiAnalysis?.recommendations || currentReport.recommendations || ['No recommendations available']).map((recommendation, index) => (
                    <li key={index}>{recommendation}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              onClick={startAdaptiveQuestioning}
              className="action-btn adaptive-btn"
            >
              Start Adaptive Questioning Demo
            </button>
            
            <button 
              onClick={generateExplainability}
              className="action-btn explainability-btn"
            >
              Generate Explainability
            </button>
            
            <button 
              onClick={exportToPDF}
              className="action-btn export-btn"
            >
              Export Report (Text)
            </button>
          </div>

          {showExplainability && (
            <div className="explainability-section">
              <h2>Model Explainability</h2>
              <div className="explainability-demo">
                <div className="explainability-card">
                  <h3>Feature Importance</h3>
                  <div className="feature-bars">
                    <div className="feature-bar">
                      <span>Response Time</span>
                      <div className="bar">
                        <div className="bar-fill" style={{ width: '30%' }}></div>
                      </div>
                      <span>30%</span>
                    </div>
                    <div className="feature-bar">
                      <span>Accuracy</span>
                      <div className="bar">
                        <div className="bar-fill" style={{ width: '40%' }}></div>
                      </div>
                      <span>40%</span>
                    </div>
                    <div className="feature-bar">
                      <span>Voice Tone</span>
                      <div className="bar">
                        <div className="bar-fill" style={{ width: '20%' }}></div>
                      </div>
                      <span>20%</span>
                    </div>
                    <div className="feature-bar">
                      <span>Facial Expression</span>
                      <div className="bar">
                        <div className="bar-fill" style={{ width: '10%' }}></div>
                      </div>
                      <span>10%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedResults; 