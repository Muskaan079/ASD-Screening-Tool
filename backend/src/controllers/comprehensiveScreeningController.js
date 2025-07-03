import {
  createComprehensiveSession,
  analyzeEmotionData,
  analyzeGestureData,
  analyzeVoiceData,
  generateComprehensiveAssessment,
  generateClinicalReport
} from '../services/comprehensiveScreeningService.js';
import memoryDatabaseService from '../services/memoryDatabaseService.js';

// Start comprehensive screening session
export const startComprehensiveScreening = async (req, res) => {
  try {
    const { patientInfo } = req.body;
    
    if (!patientInfo || !patientInfo.name || !patientInfo.age) {
      return res.status(400).json({
        error: 'Missing required patient information',
        required: ['name', 'age']
      });
    }

    const session = await createComprehensiveSession(patientInfo);
    await memoryDatabaseService.createSession(session.id, session.patientInfo);

    res.status(201).json({
      success: true,
      sessionId: session.id,
      message: 'Comprehensive screening session started successfully',
      session: {
        id: session.id,
        patientInfo: session.patientInfo,
        startTime: session.startTime,
        status: session.status,
        phase: session.phase
      }
    });
  } catch (error) {
    console.error('Error starting comprehensive screening:', error);
    res.status(500).json({
      error: 'Failed to start comprehensive screening session',
      message: error.message
    });
  }
};

// Update emotion data during screening
export const updateComprehensiveEmotionData = async (req, res) => {
  try {
    const { sessionId, emotionData } = req.body;
    
    if (!sessionId || !emotionData) {
      return res.status(400).json({
        error: 'Session ID and emotion data are required'
      });
    }

    const session = await memoryDatabaseService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Screening session not found'
      });
    }

    // Store emotion data
    if (!session.emotionData) {
      session.emotionData = [];
    }
    
    session.emotionData.push({
      ...emotionData,
      timestamp: new Date().toISOString()
    });

    // Keep only last 200 emotion readings
    if (session.emotionData.length > 200) {
      session.emotionData = session.emotionData.slice(-200);
    }

    session.lastUpdated = new Date().toISOString();
    await memoryDatabaseService.updateSession(sessionId, session);

    res.json({
      success: true,
      message: 'Emotion data updated successfully',
      emotionCount: session.emotionData.length
    });
  } catch (error) {
    console.error('Error updating emotion data:', error);
    res.status(500).json({
      error: 'Failed to update emotion data',
      message: error.message
    });
  }
};

// Update motion data during screening
export const updateComprehensiveMotionData = async (req, res) => {
  try {
    const { sessionId, motionData } = req.body;
    
    if (!sessionId || !motionData) {
      return res.status(400).json({
        error: 'Session ID and motion data are required'
      });
    }

    const session = await memoryDatabaseService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Screening session not found'
      });
    }

    // Store motion data
    if (!session.motionData) {
      session.motionData = [];
    }
    
    session.motionData.push({
      ...motionData,
      timestamp: new Date().toISOString()
    });

    // Keep only last 200 motion readings
    if (session.motionData.length > 200) {
      session.motionData = session.motionData.slice(-200);
    }

    session.lastUpdated = new Date().toISOString();
    await memoryDatabaseService.updateSession(sessionId, session);

    res.json({
      success: true,
      message: 'Motion data updated successfully',
      motionCount: session.motionData.length
    });
  } catch (error) {
    console.error('Error updating motion data:', error);
    res.status(500).json({
      error: 'Failed to update motion data',
      message: error.message
    });
  }
};

// Update voice data during screening
export const updateComprehensiveVoiceData = async (req, res) => {
  try {
    const { sessionId, voiceData } = req.body;
    
    if (!sessionId || !voiceData) {
      return res.status(400).json({
        error: 'Session ID and voice data are required'
      });
    }

    const session = await memoryDatabaseService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Screening session not found'
      });
    }

    // Store voice data
    if (!session.voiceData) {
      session.voiceData = [];
    }
    
    session.voiceData.push({
      ...voiceData,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 voice readings
    if (session.voiceData.length > 100) {
      session.voiceData = session.voiceData.slice(-100);
    }

    session.lastUpdated = new Date().toISOString();
    await memoryDatabaseService.updateSession(sessionId, session);

    res.json({
      success: true,
      message: 'Voice data updated successfully',
      voiceCount: session.voiceData.length
    });
  } catch (error) {
    console.error('Error updating voice data:', error);
    res.status(500).json({
      error: 'Failed to update voice data',
      message: error.message
    });
  }
};

// Get comprehensive screening status
export const getComprehensiveScreeningStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID is required'
      });
    }

    const session = await memoryDatabaseService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Screening session not found'
      });
    }

    // Calculate session duration
    const startTime = new Date(session.startTime);
    const currentTime = new Date();
    const duration = Math.floor((currentTime - startTime) / 1000); // seconds

    res.json({
      success: true,
      session: {
        id: session.id,
        patientInfo: session.patientInfo,
        status: session.status,
        phase: session.phase,
        startTime: session.startTime,
        lastUpdated: session.lastUpdated,
        duration: duration,
        dataCounts: {
          emotionData: session.emotionData?.length || 0,
          motionData: session.motionData?.length || 0,
          voiceData: session.voiceData?.length || 0,
          textResponses: session.textResponses?.length || 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting screening status:', error);
    res.status(500).json({
      error: 'Failed to get screening status',
      message: error.message
    });
  }
};

// Generate comprehensive report
export const generateComprehensiveReport = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const practitionerInfo = req.body.practitionerInfo || {};
    
    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID is required'
      });
    }

    const session = await memoryDatabaseService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Screening session not found'
      });
    }

    // Calculate final duration
    const startTime = new Date(session.startTime);
    const endTime = new Date();
    const duration = Math.floor((endTime - startTime) / 1000);
    session.duration = duration;
    session.status = 'completed';
    session.completionStatus = 'completed';

    // Generate comprehensive assessment
    const assessment = await generateComprehensiveAssessment(session);
    
    // Generate clinical report
    const report = await generateClinicalReport(session, assessment);

    // Update session with results
    session.analysisResults = assessment;
    session.lastUpdated = new Date().toISOString();
    await memoryDatabaseService.updateSession(sessionId, session);

    res.json({
      success: true,
      report: report,
      sessionId: sessionId,
      assessment: assessment,
      message: 'Comprehensive report generated successfully'
    });
  } catch (error) {
    console.error('Error generating comprehensive report:', error);
    res.status(500).json({
      error: 'Failed to generate comprehensive report',
      message: error.message
    });
  }
};

// Get real-time analysis during screening
export const getRealTimeAnalysis = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID is required'
      });
    }

    const session = await memoryDatabaseService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Screening session not found'
      });
    }

    // Perform real-time analysis on available data
    const emotionAnalysis = session.emotionData?.length > 0 ? 
      await analyzeEmotionData(session.emotionData) : null;
    
    const gestureAnalysis = session.motionData?.length > 0 ? 
      await analyzeGestureData(session.motionData) : null;
    
    const voiceAnalysis = session.voiceData?.length > 0 ? 
      await analyzeVoiceData(session.voiceData) : null;

    res.json({
      success: true,
      realTimeAnalysis: {
        emotion: emotionAnalysis,
        gesture: gestureAnalysis,
        voice: voiceAnalysis,
        dataAvailable: {
          emotion: session.emotionData?.length > 0,
          motion: session.motionData?.length > 0,
          voice: session.voiceData?.length > 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting real-time analysis:', error);
    res.status(500).json({
      error: 'Failed to get real-time analysis',
      message: error.message
    });
  }
};

export default {
  startComprehensiveScreening,
  updateComprehensiveEmotionData,
  updateComprehensiveMotionData,
  updateComprehensiveVoiceData,
  getComprehensiveScreeningStatus,
  generateComprehensiveReport,
  getRealTimeAnalysis
}; 