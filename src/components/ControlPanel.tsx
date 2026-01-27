import { Slider } from './Slider';
import { SoundLevelMeter } from './SoundLevelMeter';

interface ControlPanelProps {
  isListening: boolean;
  audioLevel: number;
  sensitivity: number;
  bufferTime: number;
  error: string | null;
  onToggle: () => void;
  onSensitivityChange: (value: number) => void;
  onBufferTimeChange: (value: number) => void;
}

export function ControlPanel({
  isListening,
  audioLevel,
  sensitivity,
  bufferTime,
  error,
  onToggle,
  onSensitivityChange,
  onBufferTimeChange,
}: ControlPanelProps) {
  return (
    <div className="control-panel">
      <button
        className={`control-button ${isListening ? 'listening' : 'not-listening'}`}
        onClick={onToggle}
      >
        {isListening ? 'Stop' : 'Start'}
      </button>

      {error && <div className="error-message">{error}</div>}

      {isListening && (
        <SoundLevelMeter level={audioLevel} threshold={sensitivity} />
      )}

      <div className="sliders-container">
        <Slider
          label="Sensitivity"
          value={sensitivity}
          min={1}
          max={50}
          unit="%"
          onChange={onSensitivityChange}
        />
        <Slider
          label="Buffer Time"
          value={bufferTime}
          min={1}
          max={10}
          unit="s"
          onChange={onBufferTimeChange}
        />
      </div>

      {!isListening && !error && (
        <div className="hint-text">
          Tap Start to begin detecting sounds
        </div>
      )}
    </div>
  );
}
