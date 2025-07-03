# 🎬 Live Video Analysis Feature Guide

## Overview

The Live Video Analysis feature provides real-time behavioral assessment using advanced computer vision and AI technologies. This feature is designed to complement the existing chat-based screening by providing objective, multimodal behavioral data.

## Features

### 📹 Real-time Video Feed
- Live camera stream with high-quality video capture
- Automatic camera permission handling
- Responsive video display with overlay graphics

### 🎭 Facial Emotion Detection
- Real-time emotion analysis using face-api.js
- Detects 7 primary emotions: happy, sad, angry, fearful, disgusted, surprised, neutral
- Confidence scoring for each detected emotion
- Emotion history tracking throughout the session

### 🤲 Hand Gesture Tracking
- MediaPipe Hands integration for precise hand landmark detection
- Tracks up to 2 hands simultaneously
- 21 landmarks per hand (fingertips, joints, wrist)
- Real-time gesture classification and motion pattern analysis

### 📊 Live Analytics Dashboard
- Real-time emotion display with confidence scores
- Motion point tracking visualization
- Detected gesture patterns
- Session statistics and progress indicators

### ⏱️ Session Management
- Configurable session duration (default: 2 minutes)
- Countdown timer with visual feedback
- Session ID generation for data tracking
- Automatic session completion and report generation

### 📋 Comprehensive Reporting
- Detailed session summary
- Emotion analysis results
- Motion pattern classification
- Behavioral insights and recommendations

## Technical Implementation

### Dependencies
```json
{
  "@mediapipe/camera_utils": "^0.3.1675466862",
  "@mediapipe/drawing_utils": "^0.3.1675466124",
  "@mediapipe/hands": "^0.4.1675469240",
  "face-api.js": "^0.22.2"
}
```

### Key Components

#### LiveGestureAnalysis.tsx
- Main component handling video capture and analysis
- Integrates face-api.js for emotion detection
- Manages MediaPipe Hands for gesture tracking
- Real-time data visualization and backend communication

#### LiveAnalysis.tsx
- Patient information collection form
- Session setup and configuration
- Integration with main screening flow

### Backend Integration

The component communicates with the backend API for:
- Session creation and management
- Real-time emotion data updates
- Motion pattern analysis
- Final report generation

## Usage Instructions

### Starting a Live Analysis Session

1. **Navigate to Live Analysis**
   - Click "🎬 Live Video Analysis" on the landing page
   - Or click "🎬 Live Analysis" button in the chat interface

2. **Enter Patient Information**
   - Patient name (required)
   - Age (required)
   - Gender (optional)

3. **Begin Analysis**
   - Click "🎬 Start Live Analysis Session"
   - Grant camera permissions when prompted
   - Position patient in front of camera

4. **During Analysis**
   - Monitor real-time emotion detection
   - Observe hand gesture tracking
   - Watch for motion pattern detection
   - Session automatically completes after 2 minutes

5. **Review Results**
   - View comprehensive analysis report
   - Export results for clinical review
   - Integrate with existing screening data

### Best Practices

#### Camera Setup
- Ensure good lighting conditions
- Position camera at eye level
- Maintain 2-3 feet distance from camera
- Keep patient's face and hands visible

#### Session Conduct
- Minimize background distractions
- Encourage natural behavior
- Avoid interrupting the session
- Monitor patient comfort throughout

#### Data Quality
- Ensure stable internet connection
- Check camera permissions before starting
- Verify model loading completion
- Monitor real-time feedback indicators

## Integration with Existing Features

### Chat Interface Integration
- Access live analysis from chat interface
- Seamless transition between modalities
- Combined data analysis and reporting

### Report Generation
- Integrated with existing report system
- Multi-modal data combination
- Comprehensive behavioral assessment

### Adaptive Engine
- Real-time data feeding into adaptive questioning
- Dynamic question selection based on behavioral cues
- Enhanced screening accuracy

## Troubleshooting

### Common Issues

#### Camera Not Working
- Check browser permissions
- Ensure HTTPS connection (required for camera access)
- Try refreshing the page
- Verify camera is not in use by other applications

#### Models Not Loading
- Check internet connection
- Wait for initial model download
- Refresh page if loading fails
- Verify CDN accessibility

#### Poor Detection Quality
- Improve lighting conditions
- Adjust camera positioning
- Ensure patient remains in frame
- Check for background interference

### Error Handling

The component includes comprehensive error handling for:
- Camera access failures
- Model loading errors
- Network connectivity issues
- Session management problems

## Performance Considerations

### Optimization
- Efficient model loading and caching
- Optimized video processing pipeline
- Minimal memory footprint
- Responsive UI updates

### Browser Compatibility
- Chrome/Edge (recommended)
- Firefox (supported)
- Safari (limited support)
- Mobile browsers (experimental)

## Security and Privacy

### Data Protection
- Local video processing (no video upload)
- Encrypted API communication
- Session-based data storage
- Automatic data cleanup

### Privacy Compliance
- Camera permission requirements
- Clear data usage notifications
- Patient consent management
- HIPAA-compliant data handling

## Future Enhancements

### Planned Features
- Multi-person analysis support
- Advanced gesture recognition
- Behavioral pattern learning
- Integration with wearable devices
- Real-time clinical alerts

### Technical Improvements
- Enhanced model accuracy
- Reduced latency
- Offline capability
- Mobile optimization
- Advanced analytics dashboard

## Support and Documentation

For technical support or feature requests, please refer to:
- Component documentation in code comments
- API documentation for backend integration
- Testing suite for validation
- Performance monitoring tools

---

**Note**: This feature is designed for screening purposes only and should not replace professional clinical evaluation. Always consult with qualified healthcare professionals for comprehensive assessment and diagnosis. 