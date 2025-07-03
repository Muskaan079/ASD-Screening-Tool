import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/LandingPage';
import UnifiedASDScreening from './components/UnifiedASDScreening';
import ReportPage from './pages/Report';

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
                // Navigate to report page with results
                window.location.href = `/report?sessionId=${results.sessionId}`;
              }}
            />
          } />
          <Route path="/report" element={<ReportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 