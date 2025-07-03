import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'development mode (in-memory)'
  });
});

// Hello World route
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Hello from ASD Screening Tool backend! (Development Mode)' });
});

// Development mode message
app.get('/api/dev-info', (req, res) => {
  res.json({
    message: 'Running in development mode',
    instructions: [
      '1. Set up Supabase project at supabase.com',
      '2. Update .env file with your credentials',
      '3. Run npm run migration to get SQL script',
      '4. Execute SQL script in Supabase SQL Editor',
      '5. Run npm run setup-db to test connection',
      '6. Switch to production mode with npm start'
    ],
    currentMode: 'development',
    supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && 
                          !process.env.SUPABASE_URL.includes('your_'))
  });
});

// Mock screening endpoints for development
app.post('/api/screening/start', (req, res) => {
  const { patientInfo } = req.body;
  
  if (!patientInfo || !patientInfo.name || !patientInfo.age) {
    return res.status(400).json({ error: 'Missing required patient information' });
  }

  const sessionId = 'dev-session-' + Date.now();
  
  res.status(201).json({
    success: true,
    sessionId,
    session: {
      id: sessionId,
      patientInfo,
      status: 'active',
      startTime: new Date().toISOString(),
      message: 'Development mode - data not persisted'
    }
  });
});

app.get('/api/screening/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  res.json({
    success: true,
    session: {
      id: sessionId,
      status: 'active',
      progress: 0,
      message: 'Development mode - mock data'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Development server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  console.log(`⚠️  Running in DEVELOPMENT MODE - no database connection`);
  console.log(`📋 Visit http://localhost:${PORT}/api/dev-info for setup instructions`);
}); 