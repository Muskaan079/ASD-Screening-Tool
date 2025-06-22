#!/bin/bash

echo "🚀 Deploying ASD Screening Tool with Real LLM Integration..."

# Frontend deployment
echo "📱 Deploying Frontend to GitHub..."
git add .
git commit -m "Add real LLM integration with OpenAI API

- Updated backend with real OpenAI integration
- Added LLM status indicators
- Enhanced API service with real LLM endpoints
- Updated EnhancedResults to use real AI analysis
- Added fallback to demo data when LLM unavailable
- Improved error handling and user feedback"

git push origin main

echo "✅ Frontend changes pushed to GitHub"
echo "🌐 Vercel will automatically deploy from: https://github.com/Muskaan079/ASD-Screening-Tool"

# Backend deployment
echo "🔧 Deploying Backend to GitHub..."
cd server

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in server directory"
    exit 1
fi

git add .
git commit -m "Add real OpenAI LLM integration

- Integrated OpenAI GPT-3.5-turbo for clinical analysis
- Added real LLM endpoints for report generation
- Implemented fallback to mock data when API unavailable
- Enhanced error handling and response parsing
- Added health check endpoint with LLM status
- Updated all novel feature endpoints with real AI"

git push origin main

echo "✅ Backend changes pushed to GitHub"
echo "🌐 Render will automatically deploy from: https://github.com/Muskaan079/ASD-Screening-Tool---Backend"

cd ..

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Set OPENAI_API_KEY in Render environment variables"
echo "2. Set REACT_APP_BACKEND_URL in Vercel environment variables"
echo "3. Test the application at: https://asd-screening-tool-anks.vercel.app/enhanced-results"
echo ""
echo "🔗 Links:"
echo "Frontend: https://asd-screening-tool-anks.vercel.app/"
echo "Backend: https://asd-screening-tool-backend.onrender.com"
echo "Frontend Repo: https://github.com/Muskaan079/ASD-Screening-Tool"
echo "Backend Repo: https://github.com/Muskaan079/ASD-Screening-Tool---Backend"
echo ""
echo "✨ Your ASD Screening Tool now has real LLM integration!" 