import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { useTest } from '../contexts/TestContext';
import { api } from '../services/api';
import './Results.css';

const Results = () => {
  const navigate = useNavigate();
  const { state } = useTest();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reportRef = useRef();

  useEffect(() => {
    if (!state.isTestComplete) {
      navigate('/tests');
      return;
    }

    generateReport();
  }, [state.isTestComplete, navigate]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const reportData = {
        testResults: {
          emotionTest: state.answers.filter(a => a.emotionId),
          reactionTest: state.answers.filter(a => a.reactionTime),
          patternTest: state.answers.filter(a => a.patternId),
          overallScore: state.score,
          timeSpent: state.timeSpent,
        },
        patientInfo: {
          // This would come from your auth/patient context
          id: '12345',
          name: 'John Doe',
          age: 6,
          gender: 'Male',
          dateOfAssessment: new Date().toISOString(),
        },
      };

      const response = await api.generateReport(reportData);
      setReport(response.report);
    } catch (err) {
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: 'ASD_Screening_Report',
    onAfterPrint: () => console.log('Report downloaded successfully'),
  });

  if (loading) {
    return (
      <div className="results-container">
        <div className="results-content">
          <div className="loading">Generating clinical report...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-container">
        <div className="results-content">
          <div className="error">{error}</div>
          <button className="secondary-button" onClick={generateReport}>
            Retry Report Generation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>Clinical Assessment Report</h1>
        <div className="results-actions">
          <button className="primary-button" onClick={handlePrint}>
            Download as PDF
          </button>
        </div>
      </div>

      <div className="report-container" ref={reportRef}>
        {report && (
          <>
            <div className="report-section patient-info">
              <h2>Patient Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <label>Name:</label>
                  <span>{report.patientInfo.name}</span>
                </div>
                <div className="info-item">
                  <label>Age:</label>
                  <span>{report.patientInfo.age} years</span>
                </div>
                <div className="info-item">
                  <label>Gender:</label>
                  <span>{report.patientInfo.gender}</span>
                </div>
                <div className="info-item">
                  <label>Date of Assessment:</label>
                  <span>{new Date(report.patientInfo.dateOfAssessment).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="report-section test-results">
              <h2>Test Results Summary</h2>
              <div className="test-scores">
                <div className="score-item">
                  <h3>Emotion Recognition</h3>
                  <p className="score">{report.scores.emotionScore}%</p>
                  <p className="interpretation">{report.interpretations.emotionTest}</p>
                </div>
                <div className="score-item">
                  <h3>Reaction Time</h3>
                  <p className="score">{report.scores.reactionScore}ms</p>
                  <p className="interpretation">{report.interpretations.reactionTest}</p>
                </div>
                <div className="score-item">
                  <h3>Pattern Recognition</h3>
                  <p className="score">{report.scores.patternScore}%</p>
                  <p className="interpretation">{report.interpretations.patternTest}</p>
                </div>
              </div>
            </div>

            <div className="report-section clinical-observations">
              <h2>Clinical Observations</h2>
              <div className="observations-content">
                {report.observations.map((observation, index) => (
                  <div key={index} className="observation-item">
                    <h3>{observation.category}</h3>
                    <p>{observation.details}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="report-section recommendations">
              <h2>Recommendations</h2>
              <ul className="recommendations-list">
                {report.recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>

            <div className="report-section disclaimer">
              <p>
                This report is generated based on automated screening tools and should be used as a preliminary assessment only. 
                A comprehensive evaluation by qualified healthcare professionals is recommended for accurate diagnosis.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Results; 