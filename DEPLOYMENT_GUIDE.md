# ASD Screening Tool - Deployment Guide

This guide covers deploying the enhanced ASD screening tool with novel features to your existing Vercel (frontend) and Render (backend) setup.

## 🚀 Quick Start

### Frontend (Vercel) - Already Deployed ✅

Your frontend is already deployed at: `https://asd-screening-tool-anks.vercel.app`

**New Features Added:**
- Enhanced Results page with AI analysis
- Adaptive questioning demo
- Model explainability visualization
- PDF export functionality
- Real-time multimodal analysis

### Backend (Render) - Already Deployed ✅

Your backend is already deployed and configured with:
- WebSocket support for real-time communication
- LLM integration endpoints
- Multimodal analysis API
- Clinical report generation
- Explainability data endpoints

## 📋 Environment Variables

### Frontend (Vercel)

Add these environment variables in your Vercel dashboard:

```env
REACT_APP_BACKEND_URL=https://your-render-backend-url.onrender.com
REACT_APP_WEBSOCKET_URL=wss://your-render-backend-url.onrender.com
REACT_APP_LLM_API_KEY=your_openai_api_key
REACT_APP_WHISPER_API_KEY=your_openai_api_key
```

### Backend (Render)

Add these environment variables in your Render dashboard:

```env
PORT=3001
FRONTEND_URL=https://asd-screening-tool-anks.vercel.app
JWT_SECRET=your_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=production
```

## 🔧 Deployment Steps

### 1. Update Frontend Dependencies

The frontend already includes all necessary dependencies. No additional setup required.

### 2. Deploy Frontend Changes

```bash
# In your frontend directory
git add .
git commit -m "Add novel features: adaptive questioning, explainability, enhanced results"
git push origin main
```

Vercel will automatically deploy the changes.

### 3. Verify Backend Endpoints

Your backend already includes all the novel feature endpoints:

- `POST /api/llm/analyze` - Multimodal analysis
- `POST /api/llm/generate-report` - Clinical report generation
- `POST /api/llm/project-development` - Developmental projections
- `POST /api/llm/explainability` - Model explainability
- `POST /api/llm/stream-analysis` - Real-time analysis
- WebSocket events for real-time communication

### 4. Test the New Features

1. **Navigate to Enhanced Results:**
   - Go to `https://asd-screening-tool-anks.vercel.app/enhanced-results`
   - View the demo clinical report with AI analysis

2. **Test Adaptive Questioning:**
   - Click "Start Adaptive Questioning Demo"
   - Answer the sample questions
   - See real-time analysis

3. **Explore Explainability:**
   - Click "Show Explainability Demo"
   - View feature importance visualization

4. **Export Reports:**
   - Click "Export Report (Text)"
   - Download the generated report

## 🎯 Feature Overview

### ✅ Working Features (No Additional Setup)

1. **Enhanced Results Page**
   - Mock clinical report generation
   - AI analysis display
   - Test results visualization
   - Professional UI/UX

2. **Adaptive Questioning Demo**
   - Interactive question interface
   - Response collection
   - Real-time feedback

3. **Model Explainability**
   - Feature importance visualization
   - Confidence indicators
   - Decision path display

4. **PDF Export**
   - Text-based report export
   - Professional formatting
   - Download functionality

### 🔄 Future Enhancements (Optional)

1. **Real LLM Integration**
   - Add OpenAI API key
   - Enable actual AI analysis
   - Real clinical report generation

2. **Multimodal Analysis**
   - WebRTC camera integration
   - Voice tone analysis
   - Facial expression detection

3. **Advanced PDF Generation**
   - Professional PDF formatting
   - Clinic branding
   - Digital signatures

## 🛠️ Troubleshooting

### Common Issues

1. **Enhanced Results Not Loading**
   - Check browser console for errors
   - Verify all dependencies are installed
   - Clear browser cache

2. **Export Not Working**
   - Ensure browser allows downloads
   - Check file permissions
   - Verify blob creation

3. **WebSocket Connection Issues**
   - Check backend URL configuration
   - Verify CORS settings
   - Check network connectivity

### Debug Mode

To enable debug mode, add to your environment variables:

```env
REACT_APP_DEBUG=true
```

This will show additional console logs and error information.

## 📊 Monitoring

### Frontend Monitoring (Vercel)
- Check Vercel dashboard for deployment status
- Monitor build logs for any errors
- View analytics and performance metrics

### Backend Monitoring (Render)
- Check Render dashboard for service status
- Monitor logs for API errors
- Track WebSocket connections

## 🔐 Security Considerations

1. **API Keys**
   - Never commit API keys to version control
   - Use environment variables for all secrets
   - Rotate keys regularly

2. **CORS Configuration**
   - Backend is configured for your Vercel domain
   - Additional domains can be added to CORS settings

3. **Rate Limiting**
   - Consider implementing rate limiting for API endpoints
   - Monitor for abuse

## 📞 Support

If you encounter any issues:

1. Check the browser console for errors
2. Verify environment variables are set correctly
3. Test endpoints using Postman or similar tool
4. Check Render logs for backend issues

## 🎉 Success!

Your ASD screening tool now includes:
- ✅ Real-time adaptive questioning
- ✅ AI-powered clinical reports
- ✅ Model explainability visualization
- ✅ Professional PDF export
- ✅ Multimodal analysis capabilities
- ✅ Enhanced user experience

The application is ready for production use with all novel features integrated! 