import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  const handleStartScreening = () => {
    navigate('/screening');
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to ASD Screening Tool</h1>
        <div className="purpose-section">
          <h2>About This Tool</h2>
          <p>
            This comprehensive screening tool assists healthcare practitioners in conducting
            Autism Spectrum Disorder (ASD) assessments through:
          </p>
          <ul>
            <li>Interactive conversational screening</li>
            <li>Engaging behavioral tasks and games</li>
            <li>Real-time response analysis</li>
            <li>Detailed clinical reports generation</li>
          </ul>
          <p>
            Our evidence-based approach combines modern technology with established
            clinical practices to provide reliable screening results.
          </p>
        </div>
        <button className="start-screening-btn" onClick={handleStartScreening}>
          Start Screening
        </button>
      </div>
    </div>
  );
};

export default Home; 