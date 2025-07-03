import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticateAPI, rateLimit } from './middleware/auth.js';
import sessionCleanupService from './services/sessionCleanupService.js';
import memoryDatabaseService from './services/memoryDatabaseService.js';

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

// Apply rate limiting to all routes
app.use(rateLimit);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Hello World route
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Hello from ASD Screening Tool backend!' });
});

// Import and use screening routes
import screeningRoutes from './routes/screening.js';
import analyticsRoutes from './routes/analytics.js';

// Apply authentication to sensitive routes
app.use('/api/screening', authenticateAPI, screeningRoutes);
app.use('/api/analytics', authenticateAPI, analyticsRoutes);

// Admin endpoints for cleanup (additional authentication)
app.get('/api/admin/cleanup-stats', authenticateAPI, async (req, res) => {
  try {
    const stats = await sessionCleanupService.getCleanupStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cleanup stats', message: error.message });
  }
});

app.post('/api/admin/cleanup', authenticateAPI, async (req, res) => {
  try {
    await sessionCleanupService.manualCleanup();
    res.json({ success: true, message: 'Manual cleanup completed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to perform cleanup', message: error.message });
  }
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

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize in-memory database
    await memoryDatabaseService.initializeTables();
    
    // Start session cleanup service in production
    if (process.env.NODE_ENV === 'production') {
      sessionCleanupService.startCleanup();
      console.log('🧹 Session cleanup service started');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      console.log(`🗄️  Database: In-memory (no external dependencies)`);
      console.log(`🔐 Authentication: ${process.env.API_SECRET_KEY ? 'Enabled' : 'Disabled'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 