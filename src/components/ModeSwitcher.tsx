export type AppMode = 'noise-color' | 'disney-quiz';

interface ModeSwitcherProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export function ModeSwitcher({ mode, onModeChange }: ModeSwitcherProps) {
  return (
    <div className="mode-switcher">
      <button
        className={`mode-tab ${mode === 'noise-color' ? 'active' : ''}`}
        onClick={() => onModeChange('noise-color')}
      >
        Noise Colors
      </button>
      <button
        className={`mode-tab ${mode === 'disney-quiz' ? 'active' : ''}`}
        onClick={() => onModeChange('disney-quiz')}
      >
        Disney Quiz
      </button>
    </div>
  );
}
