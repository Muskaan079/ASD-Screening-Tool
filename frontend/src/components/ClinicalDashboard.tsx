import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ComposedChart, ScatterChart, Scatter, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

interface Session {
  id: string;
  patientInfo: {
    name: string;
    age: number;
    gender?: string;
  };
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'ended';
  responses: any[];
  progress: {
    questionsAnswered: number;
    totalQuestions: number;
    percentage: number;
  };
}

interface Statistics {
  totalSessions: number;
  completedSessions: number;
  activeSessions: number;
  averageQuestionsPerSession: number;
  averageSessionDuration: number;
  totalReports: number;
  completionRate: number;
}

interface CategoryAnalytics {
  [key: string]: {
    responses: number;
    averageScore: number;
  };
}

interface EmotionTrends {
  emotionCounts: { [key: string]: number };
  timeSeries: Array<{ date: string; [key: string]: string | number }>;
  averageConfidence: { [key: string]: number };
}

interface MotionPatterns {
  patternCounts: { [key: string]: number };
  repetitiveMotionTrends: Array<{ date: string; percentage: number }>;
  fidgetingTrends: Array<{ date: string; percentage: number }>;
}

interface SessionTimeline {
  date: string;
  total: number;
  completed: number;
  active: number;
  ended: number;
}

interface RiskAnalytics {
  riskLevels: { low: number; medium: number; high: number };
  categoryRisks: { [key: string]: number };
  timeTrends: Array<{ date: string; averageRisk: number }>;
}

interface Filters {
  timeRange: string;
  status: string;
  patientName: string;
  riskLevel: string;
  startDate: string;
  endDate: string;
}

const ClinicalDashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [categoryAnalytics, setCategoryAnalytics] = useState<CategoryAnalytics>({});
  const [emotionTrends, setEmotionTrends] = useState<EmotionTrends | null>(null);
  const [motionPatterns, setMotionPatterns] = useState<MotionPatterns | null>(null);
  const [sessionTimeline, setSessionTimeline] = useState<SessionTimeline[]>([]);
  const [riskAnalytics, setRiskAnalytics] = useState<RiskAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    timeRange: '7d',
    status: 'all',
    patientName: '',
    riskLevel: 'all',
    startDate: '',
    endDate: ''
  });
  const [activeTab, setActiveTab] = useState('overview');

  const API_BASE_URL = 'https://asd-screening-backend.onrender.com/api';

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.patientName) queryParams.append('patientName', filters.patientName);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      // Fetch all data in parallel
      const [
        statsResponse,
        sessionsResponse,
        analyticsResponse,
        emotionResponse,
        motionResponse,
        timelineResponse,
        riskResponse
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/analytics/statistics`),
        fetch(`${API_BASE_URL}/api/analytics/sessions?${queryParams.toString()}`),
        fetch(`${API_BASE_URL}/api/analytics/category-analytics`),
        fetch(`${API_BASE_URL}/api/analytics/emotion-trends?${queryParams.toString()}`),
        fetch(`${API_BASE_URL}/api/analytics/motion-patterns?${queryParams.toString()}`),
        fetch(`${API_BASE_URL}/api/analytics/session-timeline?${queryParams.toString()}`),
        fetch(`${API_BASE_URL}/api/analytics/risk-analytics?${queryParams.toString()}`)
      ]);

      const [
        statsData,
        sessionsData,
        analyticsData,
        emotionData,
        motionData,
        timelineData,
        riskData
      ] = await Promise.all([
        statsResponse.json(),
        sessionsResponse.json(),
        analyticsResponse.json(),
        emotionResponse.json(),
        motionResponse.json(),
        timelineResponse.json(),
        riskResponse.json()
      ]);

      setStatistics(statsData.statistics);
      setSessions(sessionsData.sessions);
      setCategoryAnalytics(analyticsData.analytics);
      setEmotionTrends(emotionData.emotionTrends);
      setMotionPatterns(motionData.motionPatterns);
      setSessionTimeline(timelineData.timeline);
      setRiskAnalytics(riskData.riskAnalytics);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'active': return '#3B82F6';
      case 'ended': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'active': return '🔄';
      case 'ended': return '⏹️';
      default: return '❓';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      timeRange: '7d',
      status: 'all',
      patientName: '',
      riskLevel: 'all',
      startDate: '',
      endDate: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Clinical Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive overview of ASD screening sessions and analytics
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Range
              </label>
              <select
                value={filters.timeRange}
                onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="ended">Ended</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Risk Level
              </label>
              <select
                value={filters.riskLevel}
                onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient Name
              </label>
              <input
                type="text"
                value={filters.patientName}
                onChange={(e) => handleFilterChange('patientName', e.target.value)}
                placeholder="Search by name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalSessions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.completedSessions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatDuration(statistics.averageSessionDuration)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(statistics.completionRate)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'emotions', name: 'Emotion Trends', icon: '😊' },
              { id: 'motion', name: 'Motion Patterns', icon: '🔄' },
              { id: 'timeline', name: 'Session Timeline', icon: '📅' },
              { id: 'risk', name: 'Risk Analysis', icon: '⚠️' },
              { id: 'sessions', name: 'Sessions', icon: '👥' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Category Performance Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(categoryAnalytics).map(([category, data]) => ({
                  category: category.charAt(0).toUpperCase() + category.slice(1),
                  responses: data.responses,
                  averageScore: Math.round(data.averageScore * 100)
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="responses" fill="#3B82F6" name="Responses" />
                  <Bar dataKey="averageScore" fill="#10B981" name="Avg Score (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Session Status Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: statistics?.completedSessions || 0, color: '#10B981' },
                      { name: 'Active', value: statistics?.activeSessions || 0, color: '#3B82F6' },
                      { name: 'Ended', value: (statistics?.totalSessions || 0) - (statistics?.completedSessions || 0) - (statistics?.activeSessions || 0), color: '#EF4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#3B82F6" />
                    <Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'emotions' && emotionTrends && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Emotion Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Emotion Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(emotionTrends.emotionCounts).map(([emotion, count]) => ({
                      name: emotion,
                      value: count
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {Object.entries(emotionTrends.emotionCounts).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Emotion Time Series */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Emotion Trends Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={emotionTrends.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {Object.keys(emotionTrends.emotionCounts).map((emotion, index) => (
                    <Line
                      key={emotion}
                      type="monotone"
                      dataKey={emotion}
                      stroke={`hsl(${index * 60}, 70%, 50%)`}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'motion' && motionPatterns && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Motion Patterns */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Motion Patterns</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(motionPatterns.patternCounts).map(([pattern, count]) => ({
                  pattern,
                  count
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="pattern" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Repetitive Motion Trends */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Repetitive Motion & Fidgeting Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={motionPatterns.repetitiveMotionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="#EF4444"
                    strokeWidth={2}
                    name="Repetitive Motions (%)"
                  />
                  <Area
                    type="monotone"
                    dataKey="percentage"
                    fill="#EF4444"
                    fillOpacity={0.1}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Timeline</h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={sessionTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="active"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="ended"
                  stackId="1"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'risk' && riskAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Risk Level Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Level Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(riskAnalytics.riskLevels).map(([level, count]) => ({
                      name: level.charAt(0).toUpperCase() + level.slice(1),
                      value: count,
                      color: getRiskColor(level)
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {Object.entries(riskAnalytics.riskLevels).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getRiskColor(entry[0])} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category Risk Analysis */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Risk Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={Object.entries(riskAnalytics.categoryRisks).map(([category, risk]) => ({
                  category: category.charAt(0).toUpperCase() + category.slice(1),
                  risk: Math.round(risk * 100)
                }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Risk Score (%)"
                    dataKey="risk"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Sessions</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {session.patientInfo.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Age: {session.patientInfo.age}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={{ backgroundColor: `${getStatusColor(session.status)}20`, color: getStatusColor(session.status) }}>
                          {getStatusIcon(session.status)} {session.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${session.progress.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">
                            {session.progress.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(session.startTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.endTime 
                          ? formatDuration((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)
                          : 'In Progress'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          View
                        </button>
                        {session.status === 'completed' && (
                          <button className="text-green-600 hover:text-green-900">
                            Report
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicalDashboard;
