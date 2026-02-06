import { useRef, useCallback, useEffect } from 'react';

interface UseQuizAudioReturn {
  playCorrect: () => void;
  playIncorrect: () => void;
  playTick: () => void;
  playTransition: () => void;
}

export function useQuizAudio(): UseQuizAudioReturn {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play a tone with specified frequency and duration
  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.error('Failed to play tone:', error);
    }
  }, [getAudioContext]);

  // Play multiple tones in sequence (for chords/melodies)
  const playSequence = useCallback((notes: Array<{ freq: number; duration: number; delay: number }>) => {
    try {
      const ctx = getAudioContext();
      notes.forEach(({ freq, duration, delay }) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        const startTime = ctx.currentTime + delay;
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });
    } catch (error) {
      console.error('Failed to play sequence:', error);
    }
  }, [getAudioContext]);

  // Celebratory ascending chime for correct answers
  const playCorrect = useCallback(() => {
    playSequence([
      { freq: 523.25, duration: 0.1, delay: 0 },     // C5
      { freq: 659.25, duration: 0.1, delay: 0.08 },  // E5
      { freq: 783.99, duration: 0.2, delay: 0.16 },  // G5
    ]);
  }, [playSequence]);

  // Subtle descending tone for incorrect answers
  const playIncorrect = useCallback(() => {
    playSequence([
      { freq: 392.00, duration: 0.15, delay: 0 },    // G4
      { freq: 293.66, duration: 0.25, delay: 0.1 },  // D4
    ]);
  }, [playSequence]);

  // Short tick sound for countdown
  const playTick = useCallback(() => {
    playTone(800, 0.05, 'square');
  }, [playTone]);

  // Whoosh transition sound
  const playTransition = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Frequency sweep from high to low
      oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
      oscillator.type = 'sawtooth';

      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (error) {
      console.error('Failed to play transition:', error);
    }
  }, [getAudioContext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return {
    playCorrect,
    playIncorrect,
    playTick,
    playTransition,
  };
}
