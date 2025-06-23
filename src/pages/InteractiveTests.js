import React, { useState } from 'react';
import './InteractiveTests.css';

const InteractiveTests = () => {
  const [currentTest, setCurrentTest] = useState(null);
  const [testResults, setTestResults] = useState({});

  const tests = [
    {
      id: 'facial-recognition',
      name: 'Facial Expression Recognition',
      description: 'Identify different emotions from facial expressions.',
      duration: '5-7 minutes',
    },
    {
      id: 'pattern-matching',
      name: 'Pattern Recognition',
      description: 'Find and complete visual patterns.',
      duration: '3-5 minutes',
    },
    {
      id: 'social-scenarios',
      name: 'Social Scenarios',
      description: 'Respond to various social situations.',
      duration: '8-10 minutes',
    },
    {
      id: 'attention-test',
      name: 'Attention Test',
      description: 'Track and respond to moving objects.',
      duration: '4-6 minutes',
    },
  ];

  const handleStartTest = (test) => {
    setCurrentTest(test);
    // In a real implementation, this would load the specific test component
  };

  return (
    <div className="interactive-tests-container">
      <div className="tests-header">
        <h1>Interactive Assessment Tasks</h1>
        <p>Complete these engaging activities as part of your screening</p>
      </div>

      {!currentTest ? (
        <div className="tests-grid">
          {tests.map((test) => (
            <div key={test.id} className="test-card">
              <div className="test-card-content">
                <h3>{test.name}</h3>
                <p>{test.description}</p>
                <span className="duration">Duration: {test.duration}</span>
                <button
                  className="start-test-btn"
                  onClick={() => handleStartTest(test)}
                >
                  Start Test
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="test-interface">
          <h2>{currentTest.name}</h2>
          <p>Test interface would be implemented here</p>
          <button
            className="back-btn"
            onClick={() => setCurrentTest(null)}
          >
            Back to Tests
          </button>
        </div>
      )}
    </div>
  );
};

export default InteractiveTests; 