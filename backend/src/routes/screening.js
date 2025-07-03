import express from 'express';
import { 
  startScreening, 
  getNextQuestion, 
  submitAnswer, 
  generateReport, 
  getScreeningStatus,
  updateEmotionData,
  updateMotionData,
  endScreening
} from '../controllers/screeningController.js';

const router = express.Router();

// Start a new screening session
router.post('/start', startScreening);

// Get the next adaptive question
router.post('/next-question', getNextQuestion);

// Submit an answer with multimodal data
router.post('/submit-answer', submitAnswer);

// Update emotion tracking data
router.post('/emotion-data', updateEmotionData);

// Update motion tracking data
router.post('/motion-data', updateMotionData);

// Get current screening status
router.get('/status/:sessionId', getScreeningStatus);

// Generate clinical report
router.post('/generate-report', generateReport);

// End screening session
router.post('/end/:sessionId', endScreening);

export default router; 