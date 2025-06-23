import { useState, useCallback, useEffect } from 'react';

interface SpeechToTextState {
  isListening: boolean;
  transcript: string;
  error: string | null;
}

export const useSpeechToText = () => {
  const [state, setState] = useState<SpeechToTextState>({
    isListening: false,
    transcript: '',
    error: null,
  });

  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setState(prev => ({
        ...prev,
        error: 'Speech recognition is not supported in this browser',
      }));
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = (window as any)["SpeechRecognition"] || (window as any)["webkitSpeechRecognition"];
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => {
      setState(prev => ({
        ...prev,
        isListening: true,
        error: null,
      }));
    };

    recognitionInstance.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setState(prev => ({
        ...prev,
        transcript: finalTranscript + interimTranscript,
      }));
    };

    recognitionInstance.onerror = (event: any) => {
      setState(prev => ({
        ...prev,
        isListening: false,
        error: `Speech recognition error: ${event.error}`,
      }));
    };

    recognitionInstance.onend = () => {
      setState(prev => ({
        ...prev,
        isListening: false,
      }));
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognition && !state.isListening) {
      setState(prev => ({
        ...prev,
        transcript: '',
        error: null,
      }));
      recognition.start();
    }
  }, [recognition, state.isListening]);

  const stopListening = useCallback(() => {
    if (recognition && state.isListening) {
      recognition.stop();
    }
  }, [recognition, state.isListening]);

  const resetTranscript = useCallback(() => {
    setState(prev => ({
      ...prev,
      transcript: '',
    }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    resetTranscript,
  };
}; 