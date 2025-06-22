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
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
REACT_APP_AUTH_DOMAIN=your_supabase_auth_domain
REACT_APP_AUTH_CLIENT_ID=your_supabase_client_id
```

#### Backend Environment Variables (.env)
```env
PORT=3001
NODE_ENV=development
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost:3000
```

### 3. Database Setup

Run the following SQL in your Supabase SQL editor:

```sql
-- Enhanced Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  age INTEGER,
  role VARCHAR DEFAULT 'patient',
  created_at TIMESTAMP DEFAULT NOW()
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
  created_at TIMESTAMP DEFAULT NOW()
);
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

## 🔍 Troubleshooting

### Common Issues

1. **WebRTC Permission Errors**: Ensure camera/microphone permissions are granted
2. **WebSocket Connection Issues**: Check CORS configuration and network connectivity
3. **PDF Generation Failures**: Verify jsPDF and html2canvas are properly installed
4. **LLM API Rate Limits**: Implement proper rate limiting and error handling

## 📞 Support

For technical support:
1. Check the troubleshooting section
2. Review code comments for implementation details
3. Contact the development team

---

**Note**: This setup guide assumes basic knowledge of React, Node.js, and web development. 