import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/LandingPage';
import ChatInterface from './components/ChatInterface';
import ReportPage from './pages/Report';
import GestureAnalysisTest from './components/GestureAnalysisTest';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/test-gesture" element={<GestureAnalysisTest />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 