import { 
  createScreeningSession, 
  generateAdaptiveQuestion,
  analyzeResponse,
  generateClinicalReport
} from '../services/screeningService.js';
import databaseService from '../services/databaseService.js';

export const startScreening = async (req, res) => {
  try {
    const { patientInfo } = req.body;
    
    if (!patientInfo || !patientInfo.name || !patientInfo.age) {
      return res.status(400).json({
        error: 'Missing required patient information',
        required: ['name', 'age']
      });
    }

    const session = await createScreeningSession(patientInfo);
    await databaseService.createSession(session.id, session.patientInfo);

    res.status(201).json({
      success: true,
      sessionId: session.id,
      message: 'Screening session started successfully',
      session: {
        id: session.id,
        patientInfo: session.patientInfo,
        startTime: session.startTime,
        status: session.status
      }
    });
  } catch (error) {
    console.error('Error starting screening:', error);
    res.status(500).json({
      error: 'Failed to start screening session',
      message: error.message
    });
  }
};

export const getNextQuestion = async (req, res) => {
  try {
    const { sessionId, currentResponse, emotionData, motionData } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID is required'
      });
    }

    const session = await databaseService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Screening session not found'
      });
    }

    // Update session with current response data
    if (currentResponse) {
      session.responses.push({
        ...currentResponse,
        timestamp: new Date().toISOString(),
        emotionData,
        motionData
      });
    }

    // Generate next adaptive question
    const nextQuestion = await generateAdaptiveQuestion(session);
    
    // Update session
    session.currentQuestion = nextQuestion;
    session.lastUpdated = new Date().toISOString();
    await databaseService.updateSession(sessionId, session);

    res.json({
      success: true,
      question: nextQuestion,
      sessionProgress: {
        questionsAnswered: session.responses.length,
        totalQuestions: session.totalQuestions || 20,
        progress: Math.round((session.responses.length / (session.totalQuestions || 20)) * 100)
      }
    });
  } catch (error) {
    console.error('Error getting next question:', error);
    res.status(500).json({
      error: 'Failed to get next question',
      message: error.message
    });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { 
      sessionId, 
      questionId, 
      answer, 
      confidence, 
      responseTime,
      emotionData,
      motionData,
      voiceData
    } = req.body;

    if (!sessionId || !questionId || answer === undefined) {
      return res.status(400).json({
        error: 'Session ID, question ID, and answer are required'
      });
    }

    const session = await databaseService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Screening session not found'
      });
    }

    // Analyze the response
    const analysis = await analyzeResponse({
      questionId,
      answer,
      confidence,
      responseTime,
      emotionData,
      motionData,
      voiceData,
      patientAge: session.patientInfo.age
    });

    // Store the response
    const response = {
      questionId,
      answer,
      confidence,
      responseTime,
      emotionData,
      motionData,
      voiceData,
      analysis,
      timestamp: new Date().toISOString()
    };

    session.responses.push(response);
    session.lastUpdated = new Date().toISOString();
    await databaseService.updateSession(sessionId, session);

    res.json({
      success: true,
      analysis,
      sessionProgress: {
        questionsAnswered: session.responses.length,
        totalQuestions: session.totalQuestions || 20,
        progress: Math.round((session.responses.length / (session.totalQuestions || 20)) * 100)
      }
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({
      error: 'Failed to submit answer',
      message: error.message
    });
  }
};

export const updateEmotionData = async (req, res) => {
  try {
    const { sessionId, emotionData } = req.body;
    
    if (!sessionId || !emotionData) {
      return res.status(400).json({
        error: 'Session ID and emotion data are required'
      });
    }

    const session = await databaseService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Screening session not found'
      });
    }

    // Store emotion data
    if (!session.emotionHistory) {
      session.emotionHistory = [];
    }
    
    session.emotionHistory.push({
      ...emotionData,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 emotion readings
    if (session.emotionHistory.length > 100) {
      session.emotionHistory = session.emotionHistory.slice(-100);
    }

    await databaseService.updateSession(sessionId, session);

    res.json({
      success: true,
      message: 'Emotion data updated successfully'
    });
  } catch (error) {
    console.error('Error updating emotion data:', error);
    res.status(500).json({
      error: 'Failed to update emotion data',
      message: error.message
    });
  }
};

export const updateMotionData = async (req, res) => {
  try {
    const { sessionId, motionData } = req.body;
    
    if (!sessionId || !motionData) {
      return res.status(400).json({
        error: 'Session ID and motion data are required'
      });
    }

    const session = await databaseService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Screening session not found'
      });
    }

    // Store motion data
    if (!session.motionHistory) {
      session.motionHistory = [];
    }
    
    session.motionHistory.push({
      ...motionData,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 motion readings
    if (session.motionHistory.length > 100) {
      session.motionHistory = session.motionHistory.slice(-100);
    }

    await databaseService.updateSession(sessionId, session);

    res.json({
      success: true,
      message: 'Motion data updated successfully'
    });
  } catch (error) {
    console.error('Error updating motion data:', error);
    res.status(500).json({
      error: 'Failed to update motion data',
      message: error.message
    });
  }
};

export const getScreeningStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await databaseService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Screening session not found'
      });
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        patientInfo: session.patientInfo,
        status: session.status,
        startTime: session.startTime,
        lastUpdated: session.lastUpdated,
        progress: {
          questionsAnswered: session.responses.length,
          totalQuestions: session.totalQuestions || 20,
          percentage: Math.round((session.responses.length / (session.totalQuestions || 20)) * 100)
        },
        currentQuestion: session.currentQuestion
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

export const generateReport = async (req, res) => {
  try {
    const { sessionId, practitionerInfo } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID is required'
      });
    }

    const session = await databaseService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Screening session not found'
      });
    }

    // Generate comprehensive clinical report
    const report = await generateClinicalReport(session, practitionerInfo);
    
    // Update session status
    session.status = 'completed';
    session.endTime = new Date().toISOString();
    session.report = report;
    await databaseService.updateSession(sessionId, session);

    res.json({
      success: true,
      report,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      error: 'Failed to generate clinical report',
      message: error.message
    });
  }
};

export const endScreening = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await databaseService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Screening session not found'
      });
    }

    // Update session status
    session.status = 'ended';
    session.endTime = new Date().toISOString();
    await databaseService.updateSession(sessionId, session);

    res.json({
      success: true,
      message: 'Screening session ended successfully',
      sessionId: session.id
    });
  } catch (error) {
    console.error('Error ending screening:', error);
    res.status(500).json({
      error: 'Failed to end screening session',
      message: error.message
    });
  }
}; 