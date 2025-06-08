import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Import pages
import Home from './pages/Home';
import Screening from './pages/Screening';
import InteractiveTests from './pages/InteractiveTests';
import Results from './pages/Results';
import Settings from './pages/Settings';

// Import test pages
import TestsPage from './pages/tests/TestsPage';
import EmotionTest from './pages/tests/EmotionTest';
import ReactionTest from './pages/tests/ReactionTest';
import PatternTest from './pages/tests/PatternTest';

// Import context
import { TestProvider } from './contexts/TestContext';

function App() {
  return (
    <Router>
      <TestProvider>
        <div className="app">
          <nav className="navbar">
            <div className="nav-brand">
              <Link to="/">ASD Screening Tool</Link>
            </div>
            <ul className="nav-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/screening">Screening</Link>
              </li>
              <li>
                <Link to="/tests">Tests</Link>
              </li>
              <li>
                <Link to="/results">Results</Link>
              </li>
              <li>
                <Link to="/settings">Settings</Link>
              </li>
            </ul>
          </nav>

          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/screening" element={<Screening />} />
              <Route path="/tests" element={<TestsPage />} />
              <Route path="/tests/emotion" element={<EmotionTest />} />
              <Route path="/tests/reaction" element={<ReactionTest />} />
              <Route path="/tests/pattern" element={<PatternTest />} />
              <Route path="/results" element={<Results />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </TestProvider>
    </Router>
  );
}

export default App;
