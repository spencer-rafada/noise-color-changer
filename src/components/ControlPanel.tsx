import { useState, useEffect } from 'react';
import { Slider } from './Slider';
import { SoundLevelMeter } from './SoundLevelMeter';

interface ControlPanelProps {
  isListening: boolean;
  audioLevel: number;
  sensitivity: number;
  bufferTime: number;
  musicVolume: number;
  error: string | null;
  onToggle: () => void;
  onSensitivityChange: (value: number) => void;
  onBufferTimeChange: (value: number) => void;
  onMusicVolumeChange: (value: number) => void;
}

export function ControlPanel({
  isListening,
  audioLevel,
  sensitivity,
  bufferTime,
  musicVolume,
  error,
  onToggle,
  onSensitivityChange,
  onBufferTimeChange,
  onMusicVolumeChange,
}: ControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (isListening) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  }, [isListening]);

  return (
    <div className={`control-panel ${!isExpanded ? 'control-panel--collapsed' : ''}`}>
      <div className="control-panel-header">
        <button
          className={`control-button ${isListening ? 'listening' : 'not-listening'}`}
          onClick={onToggle}
        >
          {isListening ? 'Stop' : 'Start'}
        </button>

        {isListening && (
          <button
            className={`expand-toggle ${isExpanded ? 'expanded' : ''}`}
            onClick={() => setIsExpanded(prev => !prev)}
            aria-label={isExpanded ? 'Collapse settings' : 'Expand settings'}
          >
            ▾
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className={`collapsible-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="collapsible-inner">
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
            <div className="volume-slider-wrapper">
              <Slider
                label="Music Volume"
                value={Math.round(musicVolume * 100)}
                min={0}
                max={100}
                unit="%"
                onChange={(value) => onMusicVolumeChange(value / 100)}
              />
            </div>
          </div>

          {!isListening && !error && (
            <div className="hint-text">
              Tap Start to begin detecting sounds
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
