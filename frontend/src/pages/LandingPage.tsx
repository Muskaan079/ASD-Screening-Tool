import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleStartScreening = () => {
    navigate('/screening');
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
          Comprehensive autism screening with real-time multimodal analysis
        </p>

        {/* Features */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 20,
          marginBottom: 40
        }}>
          <div style={{
            padding: 20,
            background: 'rgba(102, 126, 234, 0.1)',
            borderRadius: 12,
            border: '1px solid rgba(102, 126, 234, 0.2)'
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎭</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#2d3748' }}>Emotion Analysis</h3>
            <p style={{ margin: 0, color: '#4a5568', fontSize: 14 }}>
              Real-time facial emotion detection using advanced AI
            </p>
          </div>

          <div style={{
            padding: 20,
            background: 'rgba(118, 75, 162, 0.1)',
            borderRadius: 12,
            border: '1px solid rgba(118, 75, 162, 0.2)'
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🤲</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#2d3748' }}>Gesture Tracking</h3>
            <p style={{ margin: 0, color: '#4a5568', fontSize: 14 }}>
              Advanced hand and body movement analysis
            </p>
          </div>

          <div style={{
            padding: 20,
            background: 'rgba(102, 126, 234, 0.1)',
            borderRadius: 12,
            border: '1px solid rgba(102, 126, 234, 0.2)'
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎤</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#2d3748' }}>Voice Analysis</h3>
            <p style={{ margin: 0, color: '#4a5568', fontSize: 14 }}>
              Speech pattern and prosody analysis
            </p>
          </div>

          <div style={{
            padding: 20,
            background: 'rgba(118, 75, 162, 0.1)',
            borderRadius: 12,
            border: '1px solid rgba(118, 75, 162, 0.2)'
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#2d3748' }}>Comprehensive Report</h3>
            <p style={{ margin: 0, color: '#4a5568', fontSize: 14 }}>
              Detailed clinical assessment and recommendations
            </p>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartScreening}
          style={{
            padding: '20px 40px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 50,
            fontSize: '1.25rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s ease',
            minWidth: 250
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.3)';
          }}
        >
          🚀 Start Comprehensive Screening
        </button>

        {/* Disclaimer */}
        <div style={{
          marginTop: 30,
          padding: 16,
          background: 'rgba(255, 193, 7, 0.1)',
          borderRadius: 8,
          border: '1px solid rgba(255, 193, 7, 0.3)',
          fontSize: 14,
          color: '#856404'
        }}>
          <strong>Important:</strong> This tool is designed to assist healthcare professionals in ASD screening. 
          It is not a diagnostic tool and should be used as part of a comprehensive evaluation process.
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 