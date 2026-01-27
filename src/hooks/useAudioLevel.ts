import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioLevelReturn {
  audioLevel: number;
  isListening: boolean;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
}

export function useAudioLevel(): UseAudioLevelReturn {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const updateLevel = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    // Calculate average volume level (0-255 range, normalize to 0-100)
    const sum = dataArrayRef.current.reduce((acc, val) => acc + val, 0);
    const average = sum / dataArrayRef.current.length;
    const normalizedLevel = Math.round((average / 255) * 100);

    setAudioLevel(normalizedLevel);

    animationFrameRef.current = requestAnimationFrame(updateLevel);
  }, []);

  const startListening = useCallback(async () => {
    try {
      setError(null);

      // Check for secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        setError('Microphone requires HTTPS. Please access via localhost:5173 instead of an IP address.');
        return;
      }

      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Microphone not supported in this browser. Try Chrome or Firefox.');
        return;
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // We want to detect all noise
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      // Create audio context (handle Safari prefix)
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      // Resume context if suspended (required for some browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create analyser node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Connect microphone to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Set up data array for frequency data
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      setIsListening(true);

      // Start monitoring audio levels
      updateLevel();

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone';
      if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
        setError('Microphone permission denied. Please allow access and try again.');
      } else {
        setError(message);
      }
      setIsListening(false);
    }
  }, [updateLevel]);

  const stopListening = useCallback(() => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop media stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    dataArrayRef.current = null;

    setAudioLevel(0);
    setIsListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    audioLevel,
    isListening,
    error,
    startListening,
    stopListening
  };
}
