import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleStartScreening = () => {
    navigate('/chat');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: 800,
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: '60px 40px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Logo/Icon */}
        <div style={{
          fontSize: 80,
          marginBottom: 20,
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
        }}>
          🧠
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#2d3748',
          margin: '0 0 16px 0',
          lineHeight: 1.2
        }}>
          AI-Powered ASD Screening Assistant
        </h1>

        {/* Tagline */}
        <p style={{
          fontSize: '1.25rem',
          color: '#4a5568',
          margin: '0 0 40px 0',
          lineHeight: 1.6,
          maxWidth: 600,
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          Early autism screening with real-time multimodal insights
        </p>

        {/* Features */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 24,
          marginBottom: 40
        }}>
          <div style={{
            background: '#f7fafc',
            padding: 24,
            borderRadius: 12,
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎭</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#2d3748', fontSize: '1.1rem' }}>
              Facial Emotion Detection
            </h3>
            <p style={{ margin: 0, color: '#4a5568', fontSize: '0.9rem' }}>
              Real-time emotion analysis using advanced AI
            </p>
          </div>

          <div style={{
            background: '#f7fafc',
            padding: 24,
            borderRadius: 12,
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎙️</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#2d3748', fontSize: '1.1rem' }}>
              Voice Input Support
            </h3>
            <p style={{ margin: 0, color: '#4a5568', fontSize: '0.9rem' }}>
              Natural speech-to-text for easy interaction
            </p>
          </div>

          <div style={{
            background: '#f7fafc',
            padding: 24,
            borderRadius: 12,
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🧠</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#2d3748', fontSize: '1.1rem' }}>
              Adaptive Questions
            </h3>
            <p style={{ margin: 0, color: '#4a5568', fontSize: '0.9rem' }}>
              AI-powered dynamic screening based on responses
            </p>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartScreening}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 50,
            padding: '16px 40px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.3)';
          }}
        >
          🚀 Start Screening
        </button>

        {/* Disclaimer */}
        <div style={{
          marginTop: 40,
          padding: 16,
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: 8,
          fontSize: '0.9rem',
          color: '#856404',
          maxWidth: 600,
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <strong>Important:</strong> This tool is for screening purposes only and does not provide a clinical diagnosis. 
          Please consult with a qualified healthcare professional for comprehensive evaluation.
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 