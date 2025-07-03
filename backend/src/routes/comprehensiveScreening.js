import express from 'express';
import {
  startComprehensiveScreening,
  updateComprehensiveEmotionData,
  updateComprehensiveMotionData,
  updateComprehensiveVoiceData,
  getComprehensiveScreeningStatus,
  generateComprehensiveReport,
  getRealTimeAnalysis
} from '../controllers/comprehensiveScreeningController.js';

const router = express.Router();

// Start comprehensive screening session
router.post('/start', startComprehensiveScreening);

// Update multimodal data during screening
router.post('/emotion-data', updateComprehensiveEmotionData);
router.post('/motion-data', updateComprehensiveMotionData);
router.post('/voice-data', updateComprehensiveVoiceData);

// Get screening status and real-time analysis
router.get('/status/:sessionId', getComprehensiveScreeningStatus);
router.get('/analysis/:sessionId', getRealTimeAnalysis);

// Generate comprehensive report
router.post('/generate-report', generateComprehensiveReport);

export default router; 