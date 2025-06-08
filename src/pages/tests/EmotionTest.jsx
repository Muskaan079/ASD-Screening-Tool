import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTest } from '../../contexts/TestContext';
import { api } from '../../services/api';
import './TestStyles.css';

const EmotionTest = () => {
  const navigate = useNavigate();
  const { state, startTest, submitAnswer, completeTest, resetTest } = useTest();
  const [testData, setTestData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const data = await api.getEmotionTestData();
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
    startTest('emotion');
  };

  const handleAnswer = async (selectedEmotion) => {
    const currentItem = testData.items[currentQuestion];
    const isCorrect = selectedEmotion === currentItem.correctEmotion;

    submitAnswer({
      questionId: currentItem.id,
      selectedAnswer: selectedEmotion,
      correctAnswer: currentItem.correctEmotion,
      isCorrect,
      timeSpent: Date.now() - state.timeSpent,
    });

    if (currentQuestion + 1 >= testData.items.length) {
      completeTest();
      try {
        await api.saveTestResult({
          testType: 'emotion',
          score: state.score,
          answers: state.answers,
          totalTime: Date.now() - state.timeSpent,
        });
        navigate('/results');
      } catch (err) {
        setError('Failed to save test results');
      }
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
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
          <h1>Emotion Recognition Test</h1>
          <p>Identify emotions from facial expressions</p>
        </header>

        <div className="test-content">
          <div className="test-instructions">
            <h2>Instructions</h2>
            <p>
              You will be shown a series of facial expressions.
              Your task is to identify the emotion being expressed in each image.
              Select your answer from the provided options.
            </p>
            <ul className="test-rules">
              <li>Take your time to observe each expression carefully</li>
              <li>Trust your first impression</li>
              <li>There are {testData?.items.length} images in total</li>
              <li>You cannot go back to previous questions</li>
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

  const currentItem = testData.items[currentQuestion];

  return (
    <div className="test-container">
      <header className="test-header">
        <h1>Question {currentQuestion + 1} of {testData.items.length}</h1>
        <div className="progress-bar">
          <div 
            className="progress"
            style={{ width: `${(currentQuestion / testData.items.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="test-content emotion-test">
        <div className="emotion-image">
          <img src={currentItem.imageUrl} alt="Facial expression" />
        </div>

        <div className="emotion-options">
          {currentItem.options.map((emotion) => (
            <button
              key={emotion}
              className="emotion-option"
              onClick={() => handleAnswer(emotion)}
            >
              {emotion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmotionTest; 