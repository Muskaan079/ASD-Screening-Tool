import jwt from 'jsonwebtoken';

// Simple API key authentication for production
export const authenticateAPI = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key required',
      message: 'Please provide a valid API key in the x-api-key header or Authorization header'
    });
  }

  // Check against environment variable
  const validApiKey = process.env.API_SECRET_KEY;
  if (!validApiKey) {
    console.warn('API_SECRET_KEY not set in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (apiKey !== validApiKey) {
    return res.status(401).json({ 
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }

  next();
};

// JWT authentication for user sessions (if needed)
export const authenticateJWT = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      message: 'Please provide a valid JWT token in the Authorization header'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Token verification failed' });
  }
};

// Rate limiting middleware
export const rateLimit = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // Max 100 requests per window

  // Simple in-memory rate limiting (use Redis in production)
  if (!req.app.locals.rateLimit) {
    req.app.locals.rateLimit = new Map();
  }

  const clientData = req.app.locals.rateLimit.get(clientIP) || { count: 0, resetTime: now + windowMs };

  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + windowMs;
  } else {
    clientData.count++;
  }

  req.app.locals.rateLimit.set(clientIP, clientData);

  if (clientData.count > maxRequests) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later'
    });
  }

  next();
}; 