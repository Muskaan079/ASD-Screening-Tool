# Novel Features Setup Guide

This guide provides step-by-step instructions for setting up and configuring the novel features implemented in the ASD Screening Tool.

## 🚀 Overview of New Features

1. **🔁 Real-Time Adaptive Questioning** - Dynamic question adjustment based on multimodal analysis
2. **🎙️🧠 Multimodal LLM Integration** - Voice, facial expression, and behavioral analysis
3. **📑 GenAI Clinical Report Generator** - DSM-5/ICD-11 aligned reports with PDF export
4. **👁️ Visual Model Explainability** - SHAP/LIME-style explainability visualizations
5. **🔮 Predictive Simulation Module** - Developmental timeline projections
6. **🔗 End-to-End Screening Pipeline** - Complete workflow integration
7. **📊 Multi-Test UX with Adaptive Difficulty** - Tiered testing with real-time adjustment
8. **📤 One-Click PDF Export** - Professional clinical report generation

## 📋 Prerequisites

### System Requirements
- Node.js 16+ and npm 8+
- Python 3.8+ (for backend ML features)
- Modern browser with WebRTC support
- Camera and microphone access
- At least 4GB RAM

### API Keys Required
- OpenAI API key (for LLM features)
- Supabase credentials (for database)
- Optional: Azure Cognitive Services (for enhanced speech analysis)

## 🛠️ Installation Steps

### 1. Install Dependencies

#### Frontend Dependencies
```bash
cd asd-screening-frontend
npm install
```

#### Backend Dependencies
```bash
cd server
npm install
```

### 2. Environment Configuration

#### Frontend Environment Variables (.env)
```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001

# OpenAI Configuration
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here

# Authentication
REACT_APP_AUTH_DOMAIN=your_supabase_auth_domain
REACT_APP_AUTH_CLIENT_ID=your_supabase_client_id

# Feature Flags
REACT_APP_ENABLE_MULTIMODAL=true
REACT_APP_ENABLE_ADAPTIVE_QUESTIONING=true
REACT_APP_ENABLE_EXPLAINABILITY=true
REACT_APP_ENABLE_PDF_EXPORT=true
```

#### Backend Environment Variables (.env)
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Security
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost:3000

# Feature Configuration
ENABLE_WEBSOCKETS=true
ENABLE_MULTIMODAL_ANALYSIS=true
ENABLE_ADAPTIVE_ENGINE=true
ENABLE_PDF_GENERATION=true
```

### 3. Database Setup

#### Supabase Tables
Run the following SQL in your Supabase SQL editor:

```sql
-- Enhanced Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  age INTEGER,
  role VARCHAR DEFAULT 'patient',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Test Sessions Table
CREATE TABLE test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  status VARCHAR DEFAULT 'active',
  current_test VARCHAR,
  adaptive_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Adaptive Questioning Data
CREATE TABLE adaptive_questioning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES test_sessions(id),
  question_id VARCHAR NOT NULL,
  question_text TEXT NOT NULL,
  user_response TEXT,
  response_time INTEGER,
  accuracy DECIMAL,
  difficulty VARCHAR,
  voice_analysis JSONB,
  facial_analysis JSONB,
  behavioral_metrics JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clinical Reports
CREATE TABLE clinical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES test_sessions(id),
  patient_id UUID REFERENCES users(id),
  practitioner_id UUID REFERENCES users(id),
  report_data JSONB NOT NULL,
  dsm5_criteria JSONB,
  icd11_criteria JSONB,
  ai_analysis JSONB,
  explainability_data JSONB,
  developmental_projection JSONB,
  pdf_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Multimodal Analysis Data
CREATE TABLE multimodal_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES test_sessions(id),
  timestamp TIMESTAMP DEFAULT NOW(),
  voice_data JSONB,
  facial_data JSONB,
  behavioral_data JSONB,
  llm_analysis JSONB,
  confidence_score DECIMAL
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptive_questioning ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE multimodal_data ENABLE ROW LEVEL SECURITY;
```

### 4. Feature-Specific Setup

#### A. Multimodal Analysis Setup

1. **WebRTC Configuration**
```javascript
// In src/services/multimodal.ts
const constraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: 'user'
  }
};
```

2. **MediaPipe Setup**
```bash
npm install @mediapipe/camera_utils @mediapipe/face_detection @mediapipe/face_mesh
```

3. **TensorFlow.js Setup**
```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-backend-webgl
```

#### B. Adaptive Questioning Engine Setup

1. **Question Database**
Create a questions.json file in the server/data directory:

```json
{
  "questions": [
    {
      "id": "q1",
      "text": "What emotion do you see in this face?",
      "type": "emotional",
      "difficulty": "easy",
      "expectedResponseTime": 5000,
      "adaptiveFactors": {
        "voiceTone": { "emotion": "neutral" },
        "facialExpression": { "expressions": { "neutral": 0.8 } },
        "responseMetrics": { "accuracy": 0.7 }
      }
    }
  ]
}
```

2. **Difficulty Adjustment Logic**
```javascript
// In src/services/adaptiveEngine.ts
const difficultyAdjustment = {
  easy: { threshold: 0.8, nextLevel: 'medium' },
  medium: { threshold: 0.6, nextLevel: 'hard' },
  hard: { threshold: 0.4, nextLevel: 'medium' }
};
```

#### C. PDF Export Setup

1. **PDF Generation Dependencies**
```bash
npm install jspdf html2canvas
```

2. **PDF Template Configuration**
```javascript
// In src/services/pdfService.ts
const pdfConfig = {
  template: 'clinical',
  includeCharts: true,
  includeExplainability: true,
  clinicInfo: {
    name: 'Your Clinic Name',
    address: 'Your Address',
    phone: 'Your Phone',
    email: 'your@email.com'
  }
};
```

#### D. Explainability Visualization Setup

1. **Chart.js Setup**
```bash
npm install chart.js react-chartjs-2
```

2. **D3.js Setup (Alternative)**
```bash
npm install d3 @types/d3
```

## 🔧 Configuration

### 1. WebSocket Configuration

#### Frontend WebSocket Setup
```javascript
// In src/services/websocket.ts
const wsConfig = {
  url: process.env.REACT_APP_WS_URL || 'ws://localhost:3001',
  options: {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  }
};
```

#### Backend WebSocket Setup
```javascript
// In server/index.js
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true
  }
});
```

### 2. LLM Integration Configuration

#### OpenAI Configuration
```javascript
// In src/services/llmService.ts
const openaiConfig = {
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  model: 'gpt-4',
  maxTokens: 2000,
  temperature: 0.7
};
```

#### Prompt Engineering
```javascript
// Clinical Report Generation Prompt
const clinicalReportPrompt = `
You are a clinical psychologist analyzing ASD screening data.
Generate a comprehensive report following DSM-5 and ICD-11 criteria.
Include:
1. Executive summary
2. Test results analysis
3. DSM-5 criteria assessment
4. ICD-11 criteria assessment
5. Risk factors
6. Recommendations
7. Confidence level

Test Data: {testData}
Patient Age: {age}
Session Duration: {duration}
`;

// Adaptive Questioning Prompt
const adaptivePrompt = `
Based on the following multimodal data, suggest the next action:
- Voice tone analysis: {voiceData}
- Facial expression: {facialData}
- Response metrics: {behavioralData}
- Current difficulty: {difficulty}

Possible actions: continue, adjust_difficulty, repeat, move_to_next
Provide reasoning and suggested question if applicable.
`;
```

### 3. Security Configuration

#### JWT Authentication
```javascript
// In server/middleware/auth.js
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: '24h',
  algorithm: 'HS256'
};
```

#### CORS Configuration
```javascript
// In server/index.js
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-production-domain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

## 🚀 Running the Application

### 1. Start Backend Server
```bash
cd server
npm run dev
```

### 2. Start Frontend Application
```bash
cd asd-screening-frontend
npm start
```

### 3. Verify Features

#### Test Adaptive Questioning
1. Navigate to the screening page
2. Start a new session
3. Answer questions and observe real-time adaptation
4. Check multimodal feedback panels

#### Test PDF Export
1. Complete a screening session
2. Navigate to results page
3. Click "Export Report (PDF)"
4. Verify PDF generation and download

#### Test Explainability
1. Complete a screening session
2. Click "Show Explainability"
3. Verify charts and visualizations load correctly

## 🔍 Troubleshooting

### Common Issues

#### 1. WebRTC Permission Errors
```javascript
// Add error handling for media access
navigator.mediaDevices.getUserMedia(constraints)
  .then(stream => {
    // Handle success
  })
  .catch(error => {
    console.error('Media access error:', error);
    // Show user-friendly error message
  });
```

#### 2. WebSocket Connection Issues
```javascript
// Add reconnection logic
socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);
  // Implement exponential backoff
});
```

#### 3. PDF Generation Failures
```javascript
// Add fallback for PDF generation
try {
  const pdf = await generatePDF(report);
} catch (error) {
  console.error('PDF generation failed:', error);
  // Show alternative download option
}
```

#### 4. LLM API Rate Limits
```javascript
// Implement rate limiting
const rateLimiter = {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests from this IP'
};
```

### Performance Optimization

#### 1. Bundle Size Optimization
```javascript
// In package.json
{
  "scripts": {
    "build": "GENERATE_SOURCEMAP=false react-scripts build",
    "analyze": "source-map-explorer 'build/static/js/*.js'"
  }
}
```

#### 2. Image Optimization
```bash
npm install sharp
```

#### 3. Caching Strategy
```javascript
// Service worker for caching
const CACHE_NAME = 'asd-screening-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];
```

## 📊 Monitoring and Analytics

### 1. Performance Monitoring
```javascript
// Add performance tracking
const performanceMetrics = {
  sessionDuration: 0,
  questionResponseTime: [],
  adaptiveAdjustments: 0,
  multimodalAccuracy: 0
};
```

### 2. Error Tracking
```javascript
// Add error boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service
  }
}
```

### 3. User Analytics
```javascript
// Track feature usage
const trackFeatureUsage = (feature, data) => {
  analytics.track('feature_used', {
    feature,
    timestamp: new Date(),
    ...data
  });
};
```

## 🔄 Updates and Maintenance

### 1. Regular Updates
- Update dependencies monthly
- Monitor API rate limits
- Review and update prompts quarterly
- Backup database regularly

### 2. Feature Enhancements
- Collect user feedback
- Monitor performance metrics
- A/B test new features
- Iterate based on data

### 3. Security Updates
- Regular security audits
- Update JWT secrets
- Monitor for vulnerabilities
- Keep API keys secure

## 📞 Support

For technical support or questions about the novel features:

1. Check the troubleshooting section above
2. Review the code comments for implementation details
3. Check the GitHub issues for known problems
4. Contact the development team

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [WebRTC API Reference](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [MediaPipe Documentation](https://mediapipe.dev/)
- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [jsPDF Documentation](https://artskydj.github.io/jsPDF/docs/)

---

**Note**: This setup guide assumes you have basic knowledge of React, Node.js, and web development. For production deployment, additional security measures and performance optimizations may be required. 