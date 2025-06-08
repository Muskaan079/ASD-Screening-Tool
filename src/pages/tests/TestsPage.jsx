import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TestsPage.css';

const TestsPage = () => {
  const navigate = useNavigate();

  const tests = [
    {
      id: 'emotion',
      name: 'Emotion Test',
      description: 'Identify and respond to different emotional expressions',
      path: '/tests/emotion'
    },
    {
      id: 'reaction',
      name: 'Reaction Time Test',
      description: 'Measure response time to visual and auditory stimuli',
      path: '/tests/reaction'
    },
    {
      id: 'pattern',
      name: 'Pattern Recognition Test',
      description: 'Identify and complete visual patterns',
      path: '/tests/pattern'
    }
  ];

  return (
    <div className="tests-page">
      <header className="tests-header">
        <h1>Interactive Screening Tests</h1>
        <p>Select a test to begin the assessment</p>
      </header>

      <div className="tests-grid">
        {tests.map((test) => (
          <div key={test.id} className="test-card">
            <h2>{test.name}</h2>
            <p>{test.description}</p>
            <button
              className="start-test-button"
              onClick={() => navigate(test.path)}
            >
              Start Test
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestsPage; 