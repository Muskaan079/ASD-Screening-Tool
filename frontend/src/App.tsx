import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/LandingPage';
import UnifiedASDScreening from './components/UnifiedASDScreening';
import ReportPage from './pages/Report';
import LiveAnalysis from './pages/LiveAnalysis';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/screening" element={
            <UnifiedASDScreening 
              patientInfo={{ name: 'Test Patient', age: 8, gender: 'Male' }}
              sessionDuration={300}
              onScreeningComplete={(results) => {
                console.log('Screening completed:', results);
                // Store data in localStorage and navigate to report page
                localStorage.setItem(`screening_${results.sessionId}`, JSON.stringify(results));
                window.location.href = `/report?sessionId=${results.sessionId}`;
              }}
            />
          } />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/live-analysis" element={<LiveAnalysis />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 