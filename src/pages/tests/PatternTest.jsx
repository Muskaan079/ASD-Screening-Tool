import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '../../contexts/TestContext';
import { api } from '../../services/api';
import './TestStyles.css';

const PatternTest = () => {
  const navigate = useNavigate();
  const { state, startTest, submitAnswer, completeTest, resetTest } = useTest();
  const [testData, setTestData] = useState(null);
  const [currentPattern, setCurrentPattern] = useState(0);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPattern, setShowPattern] = useState(false);

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const data = await api.getPatternTestData();
        setTestData(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load test data');
        setLoading(false);
      }
    };

    fetchTestData();
    return () => resetTest();
  }, [resetTest]);

  const handleStartTest = () => {
    startTest('pattern');
    showNextPattern();
  };

  const showNextPattern = () => {
    setShowPattern(true);
    setSelectedTiles([]);
    
    // Hide pattern after 3 seconds
    setTimeout(() => {
      setShowPattern(false);
    }, 3000);
  };

  const handleTileClick = (index) => {
    if (showPattern) return; // Prevent clicking while pattern is shown

    setSelectedTiles(prev => {
      // Prevent selecting the same tile twice
      if (prev.includes(index)) return prev;
      return [...prev, index];
    });
  };

  const handleSubmit = () => {
    const currentItem = testData.patterns[currentPattern];
    const isCorrect = arraysEqual(selectedTiles, currentItem.sequence);

    submitAnswer({
      patternId: currentItem.id,
      selectedSequence: selectedTiles,
      correctSequence: currentItem.sequence,
      isCorrect,
    });

    if (currentPattern + 1 >= testData.patterns.length) {
      handleTestComplete();
    } else {
      setCurrentPattern(prev => prev + 1);
      showNextPattern();
    }
  };

  const handleTestComplete = async () => {
    setLoading(true);
    try {
      completeTest();
      await api.saveTestResult({
        testType: 'pattern',
        score: state.score,
        answers: state.answers,
        totalTime: Date.now() - state.timeSpent,
      });
      navigate('/results');
    } catch (err) {
      setError('Failed to save test results');
    } finally {
      setLoading(false);
    }
  };

  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  };

  if (loading) {
    return (
      <div className="test-container">
        <div className="test-content">
          <div className="loading">Loading test data...</div>
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
          <h1>Pattern Recognition Test</h1>
          <p>Test your visual memory and pattern recognition skills</p>
        </header>

        <div className="test-content">
          <div className="test-instructions">
            <h2>Instructions</h2>
            <p>
              This test will show you a sequence of highlighted tiles that you need to remember and reproduce:
            </p>
            <ul className="test-rules">
              <li>Watch carefully as tiles light up in sequence</li>
              <li>After 3 seconds, the pattern will disappear</li>
              <li>Click the tiles in the same order as shown</li>
              <li>Click Submit when you've completed the sequence</li>
              <li>Patterns will get progressively more complex</li>
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
              onClick={handleStartTest}
            >
              Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentItem = testData.patterns[currentPattern];

  return (
    <div className="test-container">
      <header className="test-header">
        <h1>Pattern {currentPattern + 1} of {testData.patterns.length}</h1>
        <div className="progress-bar">
          <div 
            className="progress"
            style={{ width: `${(currentPattern / testData.patterns.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="test-content">
        <div className="pattern-grid">
          {Array.from({ length: 16 }, (_, index) => (
            <div
              key={index}
              className={`pattern-tile ${
                showPattern && currentItem.sequence.includes(index) ? 'highlighted' :
                selectedTiles.includes(index) ? 'selected' : ''
              }`}
              onClick={() => handleTileClick(index)}
            />
          ))}
        </div>

        <div className="pattern-controls">
          <p className="pattern-status">
            {showPattern ? 
              'Memorize the pattern...' : 
              `Select ${currentItem.sequence.length} tiles in order`
            }
          </p>
          
          {!showPattern && (
            <>
              <button 
                className="secondary-button"
                onClick={() => setSelectedTiles([])}
                disabled={selectedTiles.length === 0}
              >
                Reset Selection
              </button>
              <button
                className="primary-button"
                onClick={handleSubmit}
                disabled={selectedTiles.length !== currentItem.sequence.length}
              >
                Submit Pattern
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatternTest; 