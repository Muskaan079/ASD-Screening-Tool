import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LiveGestureAnalysis from '../components/LiveGestureAnalysis';

interface PatientInfo {
  name: string;
  age: number;
  gender: string;
}

const LiveAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: '',
    age: 0,
    gender: 'Male'
  });

  const handleStartAnalysis = (formData: PatientInfo) => {
    setPatientInfo(formData);
    setShowAnalysis(true);
  };

  const handleAnalysisComplete = (results: any) => {
    console.log('Analysis completed:', results);
    // You can navigate to report page or show results here
    // navigate('/report', { state: { results } });
  };

  const handleBackToForm = () => {
    setShowAnalysis(false);
  };

  if (showAnalysis) {
    return (
      <div style={{ padding: 20 }}>
        <button
          onClick={handleBackToForm}
          style={{
            marginBottom: 20,
            padding: '8px 16px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          ← Back to Setup
        </button>
        <LiveGestureAnalysis
          patientInfo={patientInfo}
          onAnalysisComplete={handleAnalysisComplete}
          sessionDuration={120} // 2 minutes
        />
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: 600, 
      margin: '0 auto', 
      padding: 40,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 36, marginBottom: 16 }}>🎬 Live Gesture Analysis</h1>
        <p style={{ fontSize: 18, opacity: 0.9 }}>
          Set up patient information to begin real-time behavioral analysis
        </p>
      </div>

      <div style={{ 
        background: 'rgba(255, 255, 255, 0.1)', 
        padding: 32, 
        borderRadius: 16,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleStartAnalysis(patientInfo);
        }}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              Patient Name *
            </label>
            <input
              type="text"
              value={patientInfo.name}
              onChange={(e) => setPatientInfo(prev => ({ ...prev, name: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 8,
                border: 'none',
                fontSize: 16,
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#333'
              }}
              placeholder="Enter patient's full name"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              Age *
            </label>
            <input
              type="number"
              value={patientInfo.age || ''}
              onChange={(e) => setPatientInfo(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
              required
              min="1"
              max="120"
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 8,
                border: 'none',
                fontSize: 16,
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#333'
              }}
              placeholder="Enter patient's age"
            />
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              Gender
            </label>
            <select
              value={patientInfo.gender}
              onChange={(e) => setPatientInfo(prev => ({ ...prev, gender: e.target.value }))}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 8,
                border: 'none',
                fontSize: 16,
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#333'
              }}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            padding: 16, 
            borderRadius: 8,
            marginBottom: 24
          }}>
            <h4 style={{ margin: '0 0 12px 0' }}>📋 Analysis Session Details</h4>
            <ul style={{ margin: 0, paddingLeft: 20, opacity: 0.9 }}>
              <li>Real-time video analysis (2 minutes)</li>
              <li>Facial emotion detection</li>
              <li>Hand gesture tracking</li>
              <li>Motion pattern analysis</li>
              <li>Comprehensive behavioral report</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={!patientInfo.name || patientInfo.age === 0}
            style={{
              width: '100%',
              padding: 16,
              background: patientInfo.name && patientInfo.age > 0 
                ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' 
                : 'rgba(255, 255, 255, 0.3)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 18,
              fontWeight: 'bold',
              cursor: patientInfo.name && patientInfo.age > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              if (patientInfo.name && patientInfo.age > 0) {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🎬 Start Live Analysis Session
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveAnalysis; 