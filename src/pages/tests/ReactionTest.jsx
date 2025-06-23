import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '../../contexts/TestContext';
import { api } from '../../services/api';
import './TestStyles.css';

const ReactionTest = () => {
  const navigate = useNavigate();
  const { state, startTest, submitAnswer, completeTest, resetTest } = useTest();
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [trials, setTrials] = useState([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const totalTrials = 5;

  useEffect(() => {
    return () => resetTest();
  }, [resetTest]);

  const startNewTrial = useCallback(() => {
    if (currentTrial >= totalTrials) {
      return;
    }

    // Random delay between 1-5 seconds
    const delay = Math.random() * 4000 + 1000;
    setTimeout(() => {
      setIsActive(true);
      setStartTime(Date.now());
    }, delay);
  }, [currentTrial]);

  const handleClick = () => {
    if (!state.isTestStarted) {
      startTest('reaction');
      startNewTrial();
      return;
    }

    if (!isActive) {
      // Clicked too early
      setTrials(prev => [...prev, { time: -1, valid: false }]);
      setCurrentTrial(prev => prev + 1);
      startNewTrial();
      return;
    }

    const endTime = Date.now();
    const reactionTime = endTime - startTime;
    setIsActive(false);

    // Save trial result
    setTrials(prev => [...prev, { time: reactionTime, valid: true }]);
    submitAnswer({
      trialNumber: currentTrial + 1,
      reactionTime,
      valid: true,
    });

    // Move to next trial or complete test
    const nextTrial = currentTrial + 1;
    setCurrentTrial(nextTrial);

    if (nextTrial < totalTrials) {
      startNewTrial();
    } else {
      handleTestComplete();
    }
  };

  const handleTestComplete = async () => {
    setLoading(true);
    try {
      const validTrials = trials.filter(t => t.valid);
      const averageTime = validTrials.reduce((acc, curr) => acc + curr.time, 0) / validTrials.length;
      
      completeTest();
      await api.saveTestResult({
        testType: 'reaction',
        score: averageTime,
        trials: trials,
        totalTime: Date.now() - state.timeSpent,
      });
      
      navigate('/results');
    } catch (err) {
      setError('Failed to save test results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="test-container">
        <div className="test-content">
          <div className="loading">Saving results...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="test-container">
        <div className="test-content">
          <div className="error">{error}</div>
          <button className="secondary-button" onClick={() => navigate('/tests')}>
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  if (!state.isTestStarted) {
    return (
      <div className="test-container">
        <header className="test-header">
          <h1>Reaction Time Test</h1>
          <p>Measure your response time to visual stimuli</p>
        </header>

        <div className="test-content">
          <div className="test-instructions">
            <h2>Instructions</h2>
            <p>
              This test will measure your reaction time across {totalTrials} trials:
            </p>
            <ul className="test-rules">
              <li>Wait for the screen to turn green</li>
              <li>Click/tap as quickly as possible when it does</li>
              <li>Don't click before the screen changes color</li>
              <li>Try to maintain your focus throughout all trials</li>
            </ul>
          </div>

          <div className="test-actions">
            <button 
              className="secondary-button"
              onClick={() => navigate('/tests')}
            >
              Back to Tests
            </button>
            <button 
              className="primary-button"
              onClick={handleClick}
            >
              Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="test-container">
      <header className="test-header">
        <h1>Trial {currentTrial + 1} of {totalTrials}</h1>
        <div className="progress-bar">
          <div 
            className="progress"
            style={{ width: `${(currentTrial / totalTrials) * 100}%` }}
          />
        </div>
      </header>

      <div 
        className={`test-content reaction-test ${isActive ? 'active' : ''}`}
        onClick={handleClick}
      >
        <div className="reaction-area">
          {isActive ? (
            <p>Click Now!</p>
          ) : (
            <p>Wait for green...</p>
          )}
        </div>

        <div className="trial-results">
          {trials.map((trial, index) => (
            <div key={index} className={`trial-result ${trial.valid ? 'valid' : 'invalid'}`}>
              {trial.valid ? `${trial.time}ms` : 'Too early'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReactionTest; 