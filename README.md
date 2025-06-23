# AI-Powered ASD Screening Assistant

A multimodal autism screening tool that combines real-time facial emotion detection, voice input, and adaptive AI-powered questioning to provide comprehensive behavioral assessment.

## 🚀 Features

- **Real-time Facial Emotion Detection**: Uses face-api.js to analyze emotional responses during screening
- **Voice Input Support**: Speech-to-text functionality for natural interaction
- **Adaptive Questioning**: AI-powered dynamic question selection based on responses and emotions
- **Clinical Report Generation**: DSM-5-aligned reports with behavioral observations and recommendations
- **Reasoning Visualization**: Transparent explanation of why specific questions are asked
- **Professional UI**: Clean, accessible interface designed for clinical use

## 🏗️ Architecture

```
ASD-TOOL/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # Business logic & API calls
│   │   └── ...
│   └── ...
└── backend/           # Express + Node.js
    ├── src/
    │   ├── controllers/   # Route handlers
    │   ├── routes/        # API routes
    │   ├── services/      # Business logic
    │   └── ...
    └── ...
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **face-api.js** for facial emotion detection
- **Web Speech API** for voice input
- **Recharts** for data visualization

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **CORS** for cross-origin requests
- **Environment-based configuration**

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

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
npm run dev
```

## 🚀 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set root directory to `frontend`
4. Build command: `npm run build`
5. Output directory: `dist`

### Backend (Railway/Render)
1. Connect GitHub repository
2. Set root directory to `backend`
3. Build command: `npm run build`
4. Start command: `npm start`
5. Set environment variables as needed

## 🔧 Environment Variables

### Frontend
```env
VITE_API_URL=http://localhost:3001
```

### Backend
```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

## 📋 API Endpoints

### Screening
- `GET /api/health` - Health check
- `POST /api/screening/next-question` - Get adaptive next question
- `POST /api/screening/generate-report` - Generate clinical report

## 🎯 Usage

1. **Landing Page**: Brief introduction and start button
2. **Chat Interface**: 
   - Text or voice input
   - Real-time emotion detection
   - Adaptive questioning
   - Reasoning visualization
3. **Report Generation**: 
   - DSM-5-aligned clinical report
   - Behavioral observations
   - Recommendations
   - PDF download

## 🔒 Security & Privacy

- No data is permanently stored
- All processing happens in real-time
- Session data is cleared after report generation
- HTTPS required for production deployment

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## ⚠️ Disclaimer

This tool is for screening purposes only and does not provide a clinical diagnosis. Please consult with qualified healthcare professionals for comprehensive evaluation and diagnosis.

## 📞 Support

For questions or issues, please open a GitHub issue or contact the development team.
