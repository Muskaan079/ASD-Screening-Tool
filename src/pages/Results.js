import React, { useState } from 'react';
import './Results.css';

const Results = () => {
  const [reportGenerated, setReportGenerated] = useState(true);
  
  const mockResults = {
    patientInfo: {
      id: "P12345",
      age: 25,
      gender: "Female",
      date: new Date().toLocaleDateString(),
    },
    screeningResults: {
      conversationalAssessment: {
        score: 75,
        observations: [
          "Good eye contact maintained",
          "Appropriate emotional responses",
          "Some difficulty with abstract concepts",
        ],
      },
      interactiveTests: {
        facialRecognition: {
          score: 82,
          notes: "Strong performance in identifying basic emotions",
        },
        patternMatching: {
          score: 68,
          notes: "Moderate difficulty with complex patterns",
        },
        socialScenarios: {
          score: 71,
          notes: "Generally appropriate responses to social situations",
        },
      },
    },
  };

  const handleDownloadReport = () => {
    // In a real implementation, this would generate and download a PDF report
    const reportData = JSON.stringify(mockResults, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ASD_Screening_Report_${mockResults.patientInfo.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>Screening Results</h1>
        <p>Clinical Report Summary</p>
      </div>

      <div className="results-content">
        <div className="patient-info">
          <h2>Patient Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Patient ID:</label>
              <span>{mockResults.patientInfo.id}</span>
            </div>
            <div className="info-item">
              <label>Age:</label>
              <span>{mockResults.patientInfo.age}</span>
            </div>
            <div className="info-item">
              <label>Gender:</label>
              <span>{mockResults.patientInfo.gender}</span>
            </div>
            <div className="info-item">
              <label>Date:</label>
              <span>{mockResults.patientInfo.date}</span>
            </div>
          </div>
        </div>

        <div className="assessment-results">
          <h2>Assessment Results</h2>
          
          <div className="result-section">
            <h3>Conversational Assessment</h3>
            <div className="score-display">
              <div className="score">{mockResults.screeningResults.conversationalAssessment.score}%</div>
              <div className="observations">
                <h4>Key Observations:</h4>
                <ul>
                  {mockResults.screeningResults.conversationalAssessment.observations.map((obs, index) => (
                    <li key={index}>{obs}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="result-section">
            <h3>Interactive Tests</h3>
            <div className="tests-results">
              {Object.entries(mockResults.screeningResults.interactiveTests).map(([test, data]) => (
                <div key={test} className="test-result">
                  <h4>{test.replace(/([A-Z])/g, ' $1').trim()}</h4>
                  <div className="score">{data.score}%</div>
                  <p>{data.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="report-actions">
          <button
            className="download-report-btn"
            onClick={handleDownloadReport}
            disabled={!reportGenerated}
          >
            Download Full Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results; 