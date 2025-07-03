import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/LandingPage';
import ChatInterface from './components/ChatInterface';
import ReportPage from './pages/Report';
import LiveGestureAnalysis from './components/LiveGestureAnalysis';
import EnhancedGestureAnalysis from './components/EnhancedGestureAnalysis';
import LiveAnalysis from './pages/LiveAnalysis';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/test-gesture" element={
            <LiveGestureAnalysis 
              patientInfo={{ name: 'Test Patient', age: 8, gender: 'Male' }}
              sessionDuration={30}
              onAnalysisComplete={(results) => console.log('Test completed:', results)}
            />
          } />
          <Route path="/enhanced-gesture" element={
            <EnhancedGestureAnalysis 
              patientInfo={{ name: 'Test Patient', age: 8, gender: 'Male' }}
              sessionDuration={60}
              onAnalysisComplete={(results) => console.log('Enhanced analysis completed:', results)}
            />
          } />
          <Route path="/live-analysis" element={<LiveAnalysis />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 