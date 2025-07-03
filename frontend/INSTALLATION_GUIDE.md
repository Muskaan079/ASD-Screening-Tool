# ASD Screening Tool - Enhanced Installation Guide

## 🚀 New Features Added

This enhanced version includes:
- **MediaPipe Hands Integration** for real-time wrist tracking
- **FFT-based Repetitive Motion Detection** for hand flapping analysis
- **Adaptive Questioning** based on repetitive motion patterns
- **Enhanced Clinical Reports** with motor behavior analysis
- **Real-time Multi-modal Analysis** (facial emotion + hand movements)

## 📦 Dependencies

### Core Dependencies
```bash
npm install @mediapipe/hands @mediapipe/camera_utils @mediapipe/drawing_utils
```

### Existing Dependencies (should already be installed)
```bash
npm install face-api.js
npm install react react-dom
npm install typescript @types/react @types/react-dom
```

## 🔧 Setup Instructions

### 1. Install New Dependencies
```bash
cd frontend
npm install @mediapipe/hands @mediapipe/camera_utils @mediapipe/drawing_utils
```

### 2. Verify Installation
Check that all packages are properly installed:
```bash
npm list @mediapipe/hands @mediapipe/camera_utils @mediapipe/drawing_utils
```

### 3. Start Development Server
```bash
npm run dev
```

## 🎯 Usage Examples

### Basic Integration
```tsx
import FaceEmotionTracker from './components/FaceEmotionTracker';
import { useRepetitiveMotionDetector } from './hooks/useRepetitiveMotionDetector';

function MyComponent() {
  const { addWristData, analysis } = useRepetitiveMotionDetector();

  const handleWristData = (handData) => {
    addWristData(handData);
  };

  return (
    <FaceEmotionTracker
      onEmotionDetected={(emotion, confidence) => console.log(emotion, confidence)}
      onWristDataDetected={handleWristData}
      onRepetitiveMotionDetected={(analysis) => console.log(analysis)}
      enableHandTracking={true}
    />
  );
}
```

### Advanced Integration with Adaptive Engine
```tsx
import { getNextQuestion } from './services/adaptiveEngine';

const request = {
  history: conversationHistory,
  emotion: currentEmotion,
  emotionConfidence: currentConfidence,
  repetitiveMotion: {
    score: analysis.score,
    classification: analysis.classification,
    description: analysis.description,
    dominantFrequencies: analysis.dominantFrequencies,
    recommendations: analysis.recommendations
  }
};

const response = await getNextQuestion(request);
console.log(response.repetitiveMotionContext); // Shows if repetitive motion influenced the question
```

### Report Generation with Motor Analysis
```tsx
import { generateClinicalReport } from './services/reportGenerator';

const report = await generateClinicalReport({
  history: conversationHistory,
  emotionLog: emotionData,
  sessionDuration: 15, // minutes
  repetitiveMotion: {
    classification: 'MEDIUM',
    score: 0.65,
    description: 'Moderate repetitive motion patterns detected',
    dominantFrequencies: [2.1, 4.3],
    recommendations: ['Consider occupational therapy', 'Monitor patterns'],
    dataPoints: 150
  }
});
```

## 📊 Data Structures

### HandPoseData Interface
```typescript
interface HandPoseData {
  leftWrist: WristPosition | null;
  rightWrist: WristPosition | null;
  timestamp: number;
}

interface WristPosition {
  x: number;
  y: number;
  z: number;
  confidence: number;
}
```

### RepetitiveMotionAnalysis Interface
```typescript
interface RepetitiveMotionAnalysis {
  score: number;                    // 0-1 normalized score
  classification: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  description: string;
  leftWristData: number[];         // Y-coordinates for analysis
  rightWristData: number[];
  dominantFrequencies: number[];   // Hz frequencies from FFT
  recommendations: string[];
}
```

## 🔍 Key Features

### 1. Real-time Hand Tracking
- **MediaPipe Hands** integration for accurate wrist detection
- **Dual hand support** (left and right wrist tracking)
- **3D coordinate extraction** (X, Y, Z with confidence)

### 2. FFT-based Repetitive Motion Detection
- **Frequency domain analysis** using Fast Fourier Transform
- **Hand flapping detection** (1.5-3.5 Hz range)
- **General repetitive motion** (0.5-5.0 Hz range)
- **Real-time classification** (HIGH/MEDIUM/LOW/NONE)

### 3. Adaptive Questioning
- **Repetitive motion-aware** question selection
- **Domain-specific** follow-up questions
- **Clinical context** integration
- **Dynamic severity** assessment

### 4. Enhanced Reporting
- **Motor behavior analysis** in clinical reports
- **Frequency pattern** documentation
- **Clinical recommendations** based on motion patterns
- **Multi-modal** data integration

## 🛠️ Configuration Options

### useRepetitiveMotionDetector Options
```typescript
const options = {
  windowSize: 100,              // Number of data points to analyze
  analysisInterval: 1000,       // Analysis frequency (ms)
  frameRate: 25.1,             // Expected video frame rate
  handFlappingRange: [1.5, 3.5], // Hz range for hand flapping
  generalRepetitiveRange: [0.5, 5.0] // Hz range for general repetitive motion
};
```

### FaceEmotionTracker Props
```typescript
interface FaceEmotionTrackerProps {
  onEmotionDetected?: (emotion: string, confidence: number) => void;
  onWristDataDetected?: (handData: HandPoseData) => void;
  onRepetitiveMotionDetected?: (analysis: RepetitiveMotionAnalysis) => void;
  width?: number;
  height?: number;
  enableHandTracking?: boolean;
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. MediaPipe Models Not Loading
```bash
# Check network connectivity
# Models are loaded from CDN by default
# If issues persist, consider hosting models locally
```

#### 2. Hand Tracking Not Working
- Ensure camera permissions are granted
- Check browser compatibility (Chrome recommended)
- Verify MediaPipe dependencies are installed correctly

#### 3. FFT Analysis Errors
- Ensure sufficient data points (minimum 20 recommended)
- Check for null/undefined wrist data
- Verify frame rate configuration matches actual video

#### 4. Performance Issues
- Reduce analysis frequency if needed
- Lower video resolution for better performance
- Consider reducing window size for analysis

### Debug Mode
Enable debug logging:
```typescript
// In your component
const { addWristData, analysis } = useRepetitiveMotionDetector({
  // ... options
});

// Monitor data flow
useEffect(() => {
  console.log('Repetitive motion analysis:', analysis);
}, [analysis]);
```

## 📈 Performance Optimization

### Recommended Settings
- **Window Size**: 100 frames (4 seconds at 25fps)
- **Analysis Interval**: 1000ms (1 second)
- **Video Resolution**: 640x480 or lower for better performance
- **Frame Rate**: 25fps (standard webcam rate)

### Memory Management
- Data history is automatically limited to window size
- Old wrist data is automatically cleaned up
- Canvas drawing is optimized for real-time performance

## 🔒 Privacy & Security

### Data Handling
- All analysis is performed client-side
- No wrist or facial data is transmitted to servers
- Only aggregated analysis results are used for adaptive questioning
- Raw video data is not stored or transmitted

### Browser Permissions
- Camera access required for both face and hand tracking
- Permissions are requested only when needed
- Users can revoke permissions at any time

## 📚 API Reference

### useRepetitiveMotionDetector Hook
```typescript
const {
  addWristData,           // Add new wrist data point
  clearHistory,           // Clear all stored data
  analysis,               // Current analysis results
  getCurrentWristPositions, // Get latest wrist positions
  getMovementStats,       // Get movement statistics
  hasData,                // Boolean: has sufficient data
  dataCount,              // Number of data points
  config                  // Current configuration
} = useRepetitiveMotionDetector(options);
```

### Adaptive Engine Integration
```typescript
// Enhanced request interface
interface AdaptiveQuestionRequest {
  history: ConversationEntry[];
  emotion: string;
  emotionConfidence?: number;
  repetitiveMotion?: RepetitiveMotionData; // NEW
}

// Enhanced response interface
interface AdaptiveQuestionResponse {
  question: string;
  reasoning: string;
  domain: string;
  severity: 'mild' | 'moderate' | 'severe';
  repetitiveMotionContext?: string; // NEW
}
```

## 🎯 Next Steps

1. **Test the integration** with the provided ChatInterface example
2. **Customize the analysis parameters** for your specific use case
3. **Integrate with your existing components** using the provided interfaces
4. **Monitor performance** and adjust settings as needed
5. **Add additional motor behavior analysis** as required

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify all dependencies are correctly installed
4. Test with the provided example components

---

**Note**: This enhanced version provides a comprehensive multi-modal analysis system for ASD screening. The repetitive motion detection is based on clinical research and should be used as part of a broader assessment protocol, not as a standalone diagnostic tool. 