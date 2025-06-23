import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    riskLevel: 'all',
    dateRange: 'all',
  });

  useEffect(() => {
    if (!user || user.role !== 'practitioner') {
      navigate('/login');
      return;
    }

    fetchReports();
  }, [user, navigate]);

  const fetchReports = async () => {
    try {
      const response = await api.getPractitionerReports();
      setReports(response.reports);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch reports');
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    setFilters(prev => ({
      ...prev,
      searchTerm: event.target.value,
    }));
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const getRiskLevel = (scores) => {
    const avgScore = (scores.emotionScore + scores.patternScore) / 2;
    if (avgScore < 60 || scores.reactionScore > 500) return 'High Risk';
    if (avgScore < 75 || scores.reactionScore > 400) return 'Medium Risk';
    return 'Low Risk';
  };

  const filterReports = () => {
    return reports.filter(report => {
      // Search filter
      const searchMatch = 
        report.patientInfo.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        report.patientInfo.id.toLowerCase().includes(filters.searchTerm.toLowerCase());

      // Risk level filter
      const riskLevel = getRiskLevel(report.scores);
      const riskMatch = filters.riskLevel === 'all' || filters.riskLevel === riskLevel.toLowerCase().replace(' ', '-');

      // Date range filter
      const reportDate = new Date(report.timestamp);
      let dateMatch = true;
      if (filters.dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateMatch = reportDate >= weekAgo;
      } else if (filters.dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateMatch = reportDate >= monthAgo;
      }

      return searchMatch && riskMatch && dateMatch;
    });
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error">{error}</div>
        <button className="secondary-button" onClick={fetchReports}>
          Retry
        </button>
      </div>
    );
  }

  const filteredReports = filterReports();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Practitioner Dashboard</h1>
        <div className="practitioner-info">
          <span>Dr. {user.name}</span>
          <span className="separator">•</span>
          <span>{user.email}</span>
        </div>
      </div>

      <div className="dashboard-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by patient name or ID..."
            value={filters.searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="filter-controls">
          <select
            name="riskLevel"
            value={filters.riskLevel}
            onChange={handleFilterChange}
          >
            <option value="all">All Risk Levels</option>
            <option value="high-risk">High Risk</option>
            <option value="medium-risk">Medium Risk</option>
            <option value="low-risk">Low Risk</option>
          </select>

          <select
            name="dateRange"
            value={filters.dateRange}
            onChange={handleFilterChange}
          >
            <option value="all">All Time</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
          </select>
        </div>
      </div>

      <div className="reports-grid">
        {filteredReports.map((report) => {
          const riskLevel = getRiskLevel(report.scores);
          return (
            <div 
              key={report.id} 
              className={`report-card ${riskLevel.toLowerCase().replace(' ', '-')}`}
              onClick={() => navigate(`/reports/${report.id}`)}
            >
              <div className="report-header">
                <h3>{report.patientInfo.name}</h3>
                <span className={`risk-badge ${riskLevel.toLowerCase().replace(' ', '-')}`}>
                  {riskLevel}
                </span>
              </div>

              <div className="report-details">
                <div className="detail-item">
                  <label>Patient ID:</label>
                  <span>{report.patientInfo.id}</span>
                </div>
                <div className="detail-item">
                  <label>Age:</label>
                  <span>{report.patientInfo.age} years</span>
                </div>
                <div className="detail-item">
                  <label>Assessment Date:</label>
                  <span>{new Date(report.timestamp).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="report-scores">
                <div className="score-item">
                  <label>Emotion</label>
                  <span>{report.scores.emotionScore}%</span>
                </div>
                <div className="score-item">
                  <label>Reaction</label>
                  <span>{report.scores.reactionScore}ms</span>
                </div>
                <div className="score-item">
                  <label>Pattern</label>
                  <span>{report.scores.patternScore}%</span>
                </div>
              </div>

              <div className="report-flags">
                {report.redFlags && report.redFlags.length > 0 && (
                  <div className="flags-preview">
                    <strong>Red Flags:</strong> {report.redFlags.length}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredReports.length === 0 && (
        <div className="no-results">
          <p>No reports match your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 