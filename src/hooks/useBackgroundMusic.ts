import { useState, useRef, useCallback, useEffect } from 'react';

interface UseBackgroundMusicReturn {
  isPlaying: boolean;
  volume: number;
  error: string | null;
  startMusic: () => Promise<void>;
  stopMusic: () => void;
  setVolume: (volume: number) => void;
}

const MUSIC_PATH = `${import.meta.env.BASE_URL}music/lullaby.mp3`;
const DEFAULT_VOLUME = 0.5;

export function useBackgroundMusic(): UseBackgroundMusicReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(MUSIC_PATH);
      audio.loop = true;
      audio.volume = volume;
      audio.preload = 'auto';

      audio.onerror = () => {
        setError('Failed to load background music');
        setIsPlaying(false);
      };

      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const startMusic = useCallback(async () => {
    try {
      setError(null);
      const audio = getAudio();
      audio.volume = volume;

      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to play music';
      if (message.includes('NotAllowedError') || message.includes('play()')) {
        setError('Audio playback blocked. Please interact with the page first.');
      } else {
        setError(message);
      }
      setIsPlaying(false);
    }
  }, [getAudio, volume]);

  const stopMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    isPlaying,
    volume,
    error,
    startMusic,
    stopMusic,
    setVolume,
  };
}
