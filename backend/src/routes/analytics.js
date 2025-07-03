import express from 'express';
import { 
  getSessionStatistics, 
  getCategoryAnalytics, 
  getSessionHistory,
  getReportHistory,
  getEmotionTrends,
  getMotionPatterns,
  getSessionTimeline,
  getRiskLevelAnalytics,
  exportData,
  importData
} from '../controllers/analyticsController.js';

const router = express.Router();

// Get overall session statistics
router.get('/statistics', getSessionStatistics);

// Get category-wise analytics
router.get('/category-analytics', getCategoryAnalytics);

// Get session history with filters
router.get('/sessions', getSessionHistory);

// Get report history with filters
router.get('/reports', getReportHistory);

// Get emotion trends and patterns
router.get('/emotion-trends', getEmotionTrends);

// Get motion patterns and behaviors
router.get('/motion-patterns', getMotionPatterns);

// Get session timeline data
router.get('/session-timeline', getSessionTimeline);

// Get risk level analytics
router.get('/risk-analytics', getRiskLevelAnalytics);

// Export data for backup
router.get('/export', exportData);

// Import data from backup
router.post('/import', importData);

export default router; 