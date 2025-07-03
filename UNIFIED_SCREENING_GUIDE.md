# 🧠 Unified ASD Screening Tool

## Overview

The Unified ASD Screening Tool is a comprehensive, multimodal autism screening application that analyzes voice, gestures, text, and emotions simultaneously to provide accurate ASD risk assessment. This tool combines advanced AI technologies with clinical expertise to deliver reliable screening results.

## 🚀 Key Features

### Multimodal Analysis
- **Voice Analysis**: Real-time speech pattern and prosody analysis
- **Gesture Tracking**: Advanced hand and body movement detection using MediaPipe
- **Emotion Detection**: Facial emotion analysis using face-api.js
- **Text Analysis**: Natural language processing for communication patterns

### Real-time Processing
- Live video and audio capture
- Continuous data analysis during screening session
- Real-time feedback and status updates
- Adaptive analysis based on collected data

### Comprehensive Reporting
- DSM-5 aligned assessment criteria
- Risk level classification (Low/Medium/High)
- Domain-specific scoring (Social, Communication, Behavior, Sensory)
- Clinical recommendations and next steps
- Detailed behavioral observations

## 🏗️ Architecture

### Frontend (React + TypeScript)
```
frontend/src/
├── components/
│   └── UnifiedASDScreening.tsx    # Main screening component
├── services/
│   ├── api.ts                     # API service for backend communication
│   └── useSpeechToText.ts         # Speech recognition hook
└── pages/
    ├── LandingPage.tsx            # Welcome page
    └── Report.tsx                 # Results display
```

### Backend (Node.js + Express)
```
backend/src/
├── controllers/
│   └── comprehensiveScreeningController.js  # API endpoints
├── services/
│   └── comprehensiveScreeningService.js     # Business logic
├── routes/
│   └── comprehensiveScreening.js            # Route definitions
└── app.js                                   # Main application
```

## 🛠️ Technology Stack

### AI/ML Libraries
- **TensorFlow.js**: Pose detection and gesture analysis
- **MediaPipe**: Real-time hand and body tracking
- **face-api.js**: Facial emotion detection
- **Web Speech API**: Speech-to-text and voice analysis

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and development server

### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework
- **In-memory Database**: Session and data storage

## 📊 Screening Process

### 1. Initialization
- Load AI models (TensorFlow.js, MediaPipe, face-api.js)
- Initialize camera and microphone access
- Create backend screening session

### 2. Data Collection (5 minutes)
- **Emotion Analysis**: Continuous facial expression monitoring
- **Voice Analysis**: Speech pattern and prosody detection
- **Gesture Tracking**: Hand and body movement analysis
- **Real-time Processing**: Immediate data analysis and storage

### 3. Comprehensive Analysis
- Multimodal data integration
- DSM-5 criteria evaluation
- Risk level calculation
- Domain-specific scoring

### 4. Report Generation
- Clinical assessment summary
- Risk level classification
- Recommendations and next steps
- Detailed behavioral observations

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+
- Modern web browser with camera/microphone support
- Internet connection for AI model loading

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
npm install
npm start
```

### Environment Variables
```env
# Backend
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173
API_SECRET_KEY=asd_screening_secure_key_2024

# Optional: OpenAI API for advanced analysis
OPENAI_API_KEY=your_openai_api_key
```

## 📈 API Endpoints

### Comprehensive Screening
- `POST /api/comprehensive-screening/start` - Start screening session
- `POST /api/comprehensive-screening/emotion-data` - Update emotion data
- `POST /api/comprehensive-screening/motion-data` - Update motion data
- `POST /api/comprehensive-screening/voice-data` - Update voice data
- `GET /api/comprehensive-screening/status/:sessionId` - Get session status
- `GET /api/comprehensive-screening/analysis/:sessionId` - Get real-time analysis
- `POST /api/comprehensive-screening/generate-report` - Generate final report

## 🎯 Usage Instructions

### For Healthcare Professionals

1. **Access the Tool**
   - Navigate to the application URL
   - Review the welcome page and disclaimers

2. **Start Screening**
   - Click "Start Comprehensive Screening"
   - Grant camera and microphone permissions
   - Ensure patient is positioned in front of camera

3. **Monitor Session**
   - Watch real-time analysis indicators
   - Observe patient behavior during 5-minute session
   - Note any technical issues or interruptions

4. **Review Results**
   - Examine risk level classification
   - Review domain-specific scores
   - Consider recommendations and next steps
   - Share results with patient/family

### For Patients/Families

1. **Preparation**
   - Ensure good lighting and quiet environment
   - Position child comfortably in front of camera
   - Explain the process in age-appropriate terms

2. **During Screening**
   - Allow natural interaction and behavior
   - Avoid coaching or prompting responses
   - Maintain calm, supportive environment

3. **After Screening**
   - Review results with healthcare provider
   - Discuss recommendations and next steps
   - Schedule follow-up as recommended

## 📋 Clinical Considerations

### Screening Limitations
- This tool is for screening purposes only
- Not a diagnostic tool
- Should be used as part of comprehensive evaluation
- Results should be interpreted by qualified professionals

### Best Practices
- Use in conjunction with clinical judgment
- Consider patient age and developmental level
- Account for cultural and linguistic factors
- Document any technical issues or interruptions

### Follow-up Recommendations
- **Low Risk**: Continue routine monitoring
- **Medium Risk**: Schedule follow-up screening in 6 months
- **High Risk**: Consider comprehensive diagnostic evaluation

## 🔒 Privacy & Security

### Data Protection
- All data processed locally when possible
- Session data stored temporarily in memory
- No permanent storage of personal information
- Secure API communication with encryption

### Compliance
- HIPAA-compliant data handling
- Patient privacy protection measures
- Secure session management
- Audit trail for data access

## 🐛 Troubleshooting

### Common Issues

**Camera/Microphone Access**
- Ensure browser permissions are granted
- Check device settings for camera/microphone access
- Try refreshing the page and granting permissions again

**Model Loading Issues**
- Check internet connection for AI model downloads
- Clear browser cache and try again
- Ensure browser supports WebGL for TensorFlow.js

**Analysis Interruptions**
- Check for stable internet connection
- Ensure device has sufficient processing power
- Close other resource-intensive applications

### Technical Support
- Check browser console for error messages
- Verify all dependencies are properly installed
- Ensure backend server is running and accessible

## 📚 References

### Clinical Guidelines
- DSM-5 Diagnostic Criteria for Autism Spectrum Disorder
- American Academy of Pediatrics Screening Guidelines
- Early Intervention Best Practices

### Technical Documentation
- TensorFlow.js Documentation
- MediaPipe Pose Detection Guide
- face-api.js Implementation Guide
- Web Speech API Reference

## 🤝 Contributing

### Development
- Fork the repository
- Create feature branch
- Implement changes with tests
- Submit pull request

### Clinical Input
- Review screening questions and criteria
- Validate assessment algorithms
- Provide feedback on clinical accuracy
- Suggest improvements for sensitivity/specificity

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This tool is designed to assist healthcare professionals in ASD screening and is not intended to replace clinical judgment or provide definitive diagnosis. Always use in conjunction with comprehensive clinical evaluation by qualified professionals. 