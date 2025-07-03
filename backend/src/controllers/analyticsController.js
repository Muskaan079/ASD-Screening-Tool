import memoryDatabaseService from '../services/memoryDatabaseService.js';

export const getSessionStatistics = async (req, res) => {
  try {
    const statistics = await memoryDatabaseService.getSessionStatistics();
    
    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error('Error getting session statistics:', error);
    res.status(500).json({
      error: 'Failed to get session statistics',
      message: error.message
    });
  }
};

export const getCategoryAnalytics = async (req, res) => {
  try {
    const analytics = await memoryDatabaseService.getCategoryAnalytics();
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error getting category analytics:', error);
    res.status(500).json({
      error: 'Failed to get category analytics',
      message: error.message
    });
  }
};

export const getSessionHistory = async (req, res) => {
  try {
    const { 
      status, 
      patientName, 
      startDate, 
      endDate, 
      limit = 50, 
      offset = 0 
    } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (patientName) filters.patientName = patientName;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const sessions = await memoryDatabaseService.listSessions(filters);
    
    // Apply pagination
    const paginatedSessions = sessions.slice(offset, offset + parseInt(limit));
    
    res.json({
      success: true,
      sessions: paginatedSessions,
      pagination: {
        total: sessions.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + parseInt(limit) < sessions.length
      }
    });
  } catch (error) {
    console.error('Error getting session history:', error);
    res.status(500).json({
      error: 'Failed to get session history',
      message: error.message
    });
  }
};

export const getReportHistory = async (req, res) => {
  try {
    const { 
      sessionId, 
      patientName, 
      limit = 50, 
      offset = 0 
    } = req.query;

    const filters = {};
    if (sessionId) filters.sessionId = sessionId;
    if (patientName) filters.patientName = patientName;

    const reports = await memoryDatabaseService.listReports(filters);
    
    // Apply pagination
    const paginatedReports = reports.slice(offset, offset + parseInt(limit));
    
    res.json({
      success: true,
      reports: paginatedReports,
      pagination: {
        total: reports.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + parseInt(limit) < reports.length
      }
    });
  } catch (error) {
    console.error('Error getting report history:', error);
    res.status(500).json({
      error: 'Failed to get report history',
      message: error.message
    });
  }
};

// New endpoint for emotion trends
export const getEmotionTrends = async (req, res) => {
  try {
    const { sessionId, startDate, endDate, limit = 100 } = req.query;
    
    const filters = {};
    if (sessionId) filters.sessionId = sessionId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const sessions = await memoryDatabaseService.listSessions(filters);
    const emotionData = [];

    for (const session of sessions.slice(0, parseInt(limit))) {
      const sessionData = await memoryDatabaseService.getSession(session.id);
      if (sessionData?.emotionHistory) {
        sessionData.emotionHistory.forEach(emotion => {
          emotionData.push({
            timestamp: emotion.timestamp,
            dominantEmotion: emotion.dominant_emotion,
            confidence: emotion.confidence,
            emotions: emotion.emotions,
            sessionId: session.id,
            patientName: session.patientInfo?.name || 'Unknown'
          });
        });
      }
    }

    // Group by emotion and time
    const emotionTrends = processEmotionData(emotionData);
    
    res.json({
      success: true,
      emotionTrends,
      rawData: emotionData
    });
  } catch (error) {
    console.error('Error getting emotion trends:', error);
    res.status(500).json({
      error: 'Failed to get emotion trends',
      message: error.message
    });
  }
};

// New endpoint for motion patterns
export const getMotionPatterns = async (req, res) => {
  try {
    const { sessionId, startDate, endDate, limit = 100 } = req.query;
    
    const filters = {};
    if (sessionId) filters.sessionId = sessionId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const sessions = await memoryDatabaseService.listSessions(filters);
    const motionData = [];

    for (const session of sessions.slice(0, parseInt(limit))) {
      const sessionData = await memoryDatabaseService.getSession(session.id);
      if (sessionData?.motionHistory) {
        sessionData.motionHistory.forEach(motion => {
          motionData.push({
            timestamp: motion.timestamp,
            repetitiveMotions: motion.repetitive_motions,
            fidgeting: motion.fidgeting,
            patterns: motion.patterns,
            motionData: motion.motion_data,
            sessionId: session.id,
            patientName: session.patientInfo?.name || 'Unknown'
          });
        });
      }
    }

    // Process motion data for patterns
    const motionPatterns = processMotionData(motionData);
    
    res.json({
      success: true,
      motionPatterns,
      rawData: motionData
    });
  } catch (error) {
    console.error('Error getting motion patterns:', error);
    res.status(500).json({
      error: 'Failed to get motion patterns',
      message: error.message
    });
  }
};

// New endpoint for session timeline
export const getSessionTimeline = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const sessions = await databaseService.listSessions(filters);
    
    // Group sessions by time period
    const timeline = processSessionTimeline(sessions, groupBy);
    
    res.json({
      success: true,
      timeline,
      totalSessions: sessions.length
    });
  } catch (error) {
    console.error('Error getting session timeline:', error);
    res.status(500).json({
      error: 'Failed to get session timeline',
      message: error.message
    });
  }
};

// New endpoint for risk level analytics
export const getRiskLevelAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const sessions = await databaseService.listSessions(filters);
    const riskData = [];

    for (const session of sessions) {
      const sessionData = await databaseService.getSession(session.id);
      if (sessionData?.responses) {
        const riskScore = calculateRiskScore(sessionData);
        riskData.push({
          sessionId: session.id,
          patientName: session.patientInfo?.name || 'Unknown',
          riskLevel: riskScore.level,
          riskScore: riskScore.score,
          date: session.startTime,
          category: riskScore.category
        });
      }
    }

    const riskAnalytics = processRiskData(riskData);
    
    res.json({
      success: true,
      riskAnalytics,
      sessions: riskData
    });
  } catch (error) {
    console.error('Error getting risk level analytics:', error);
    res.status(500).json({
      error: 'Failed to get risk level analytics',
      message: error.message
    });
  }
};

export const exportData = async (req, res) => {
  try {
    const data = await databaseService.exportData();
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({
      error: 'Failed to export data',
      message: error.message
    });
  }
};

export const importData = async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        error: 'Data is required for import'
      });
    }

    const result = await databaseService.importData(data);
    
    res.json({
      success: true,
      message: 'Data imported successfully',
      result
    });
  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({
      error: 'Failed to import data',
      message: error.message
    });
  }
};

// Helper functions for data processing
function processEmotionData(emotionData) {
  const emotionCounts = {};
  const timeSeries = {};
  const emotionConfidence = {};

  emotionData.forEach(entry => {
    const emotion = entry.dominantEmotion;
    const date = new Date(entry.timestamp).toDateString();
    
    // Count emotions
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    
    // Time series data
    if (!timeSeries[date]) timeSeries[date] = {};
    timeSeries[date][emotion] = (timeSeries[date][emotion] || 0) + 1;
    
    // Confidence tracking
    if (!emotionConfidence[emotion]) emotionConfidence[emotion] = [];
    emotionConfidence[emotion].push(entry.confidence);
  });

  return {
    emotionCounts,
    timeSeries: Object.entries(timeSeries).map(([date, emotions]) => ({
      date,
      ...emotions
    })),
    averageConfidence: Object.fromEntries(
      Object.entries(emotionConfidence).map(([emotion, confidences]) => [
        emotion,
        confidences.reduce((a, b) => a + b, 0) / confidences.length
      ])
    )
  };
}

function processMotionData(motionData) {
  const patternCounts = {};
  const repetitiveMotionTrends = {};
  const fidgetingTrends = {};

  motionData.forEach(entry => {
    const date = new Date(entry.timestamp).toDateString();
    
    // Count patterns
    if (entry.patterns) {
      entry.patterns.forEach(pattern => {
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
      });
    }
    
    // Track repetitive motions
    if (!repetitiveMotionTrends[date]) repetitiveMotionTrends[date] = { count: 0, total: 0 };
    repetitiveMotionTrends[date].total++;
    if (entry.repetitiveMotions) repetitiveMotionTrends[date].count++;
    
    // Track fidgeting
    if (!fidgetingTrends[date]) fidgetingTrends[date] = { count: 0, total: 0 };
    fidgetingTrends[date].total++;
    if (entry.fidgeting) fidgetingTrends[date].count++;
  });

  return {
    patternCounts,
    repetitiveMotionTrends: Object.entries(repetitiveMotionTrends).map(([date, data]) => ({
      date,
      percentage: (data.count / data.total) * 100
    })),
    fidgetingTrends: Object.entries(fidgetingTrends).map(([date, data]) => ({
      date,
      percentage: (data.count / data.total) * 100
    }))
  };
}

function processSessionTimeline(sessions, groupBy) {
  const timeline = {};
  
  sessions.forEach(session => {
    const date = new Date(session.startTime);
    let key;
    
    switch (groupBy) {
      case 'hour':
        key = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
        break;
      case 'day':
        key = date.toDateString();
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toDateString();
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = date.toDateString();
    }
    
    if (!timeline[key]) {
      timeline[key] = {
        total: 0,
        completed: 0,
        active: 0,
        ended: 0
      };
    }
    
    timeline[key].total++;
    timeline[key][session.status]++;
  });

  return Object.entries(timeline).map(([date, data]) => ({
    date,
    ...data
  }));
}

function calculateRiskScore(sessionData) {
  let totalScore = 0;
  let categoryScores = {};
  let responseCount = 0;

  sessionData.responses.forEach(response => {
    if (response.analysis?.overallScore) {
      const score = response.analysis.overallScore;
      const category = response.question_id.split('_')[0];
      
      totalScore += score;
      responseCount++;
      
      if (!categoryScores[category]) categoryScores[category] = [];
      categoryScores[category].push(score);
    }
  });

  const averageScore = responseCount > 0 ? totalScore / responseCount : 0;
  
  // Determine risk level based on average score
  let level = 'low';
  if (averageScore > 0.7) level = 'high';
  else if (averageScore > 0.4) level = 'medium';
  
  // Find category with highest average score
  const categoryAverages = Object.entries(categoryScores).map(([category, scores]) => ({
    category,
    average: scores.reduce((a, b) => a + b, 0) / scores.length
  }));
  
  const highestCategory = categoryAverages.reduce((max, current) => 
    current.average > max.average ? current : max
  );

  return {
    score: averageScore,
    level,
    category: highestCategory.category,
    categoryScores: Object.fromEntries(
      categoryAverages.map(({ category, average }) => [category, average])
    )
  };
}

function processRiskData(riskData) {
  const riskLevels = { low: 0, medium: 0, high: 0 };
  const categoryRisks = {};
  const timeTrends = {};

  riskData.forEach(entry => {
    // Count risk levels
    riskLevels[entry.riskLevel]++;
    
    // Category risks
    if (!categoryRisks[entry.category]) categoryRisks[entry.category] = [];
    categoryRisks[entry.category].push(entry.riskScore);
    
    // Time trends
    const date = new Date(entry.date).toDateString();
    if (!timeTrends[date]) timeTrends[date] = [];
    timeTrends[date].push(entry.riskScore);
  });

  return {
    riskLevels,
    categoryRisks: Object.fromEntries(
      Object.entries(categoryRisks).map(([category, scores]) => [
        category,
        scores.reduce((a, b) => a + b, 0) / scores.length
      ])
    ),
    timeTrends: Object.entries(timeTrends).map(([date, scores]) => ({
      date,
      averageRisk: scores.reduce((a, b) => a + b, 0) / scores.length
    }))
  };
} 