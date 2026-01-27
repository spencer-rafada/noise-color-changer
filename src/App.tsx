import { useState, useEffect, useRef } from 'react';
import { ColorBackground } from './components/ColorBackground';
import { ControlPanel } from './components/ControlPanel';
import { useAudioLevel } from './hooks/useAudioLevel';
import { getRandomPastelColor, getInitialColor } from './utils/colors';

const DEFAULT_SENSITIVITY = 10;
const DEFAULT_BUFFER_TIME = 3; // seconds

function App() {
  const [currentColor, setCurrentColor] = useState(getInitialColor);
  const [sensitivity, setSensitivity] = useState(DEFAULT_SENSITIVITY);
  const [bufferTime, setBufferTime] = useState(DEFAULT_BUFFER_TIME);
  const lastChangeTimeRef = useRef(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const {
    audioLevel,
    isListening,
    error,
    startListening,
    stopListening
  } = useAudioLevel();

  // Wake Lock: keep screen on while listening
  useEffect(() => {
    const requestWakeLock = async () => {
      if (!('wakeLock' in navigator)) return;

      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (err) {
        // Wake lock request failed (e.g., low battery, tab not visible)
        console.log('Wake lock not available:', err);
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };

    if (isListening) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [isListening]);

  // Check audio level and trigger color change
  useEffect(() => {
    if (!isListening) return;

    const now = Date.now();
    const timeSinceLastChange = now - lastChangeTimeRef.current;
    const bufferTimeMs = bufferTime * 1000;

    if (audioLevel > sensitivity && timeSinceLastChange > bufferTimeMs) {
      setCurrentColor(getRandomPastelColor());
      lastChangeTimeRef.current = now;
    }
  }, [audioLevel, isListening, sensitivity, bufferTime]);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <ColorBackground color={currentColor}>
      <ControlPanel
        isListening={isListening}
        audioLevel={audioLevel}
        sensitivity={sensitivity}
        bufferTime={bufferTime}
        error={error}
        onToggle={handleToggle}
        onSensitivityChange={setSensitivity}
        onBufferTimeChange={setBufferTime}
      />
    </ColorBackground>
  );
}

export default App;
