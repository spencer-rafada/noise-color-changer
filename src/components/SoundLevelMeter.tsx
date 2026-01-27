interface SoundLevelMeterProps {
  level: number;
  threshold: number;
}

export function SoundLevelMeter({ level, threshold }: SoundLevelMeterProps) {
  const isAboveThreshold = level > threshold;

  return (
    <div className="sound-meter">
      <div className="sound-meter-label">
        <span>Sound Level</span>
        <span className={`sound-meter-value ${isAboveThreshold ? 'above-threshold' : ''}`}>
          {level}%
        </span>
      </div>
      <div className="sound-meter-track">
        <div
          className={`sound-meter-fill ${isAboveThreshold ? 'above-threshold' : ''}`}
          style={{ width: `${Math.min(level, 100)}%` }}
        />
        <div
          className="sound-meter-threshold"
          style={{ left: `${threshold}%` }}
        />
      </div>
    </div>
  );
}
