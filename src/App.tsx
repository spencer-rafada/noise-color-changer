import { useState } from 'react';
import { ModeSwitcher, type AppMode } from './components/ModeSwitcher';
import { NoiseColorMode } from './components/NoiseColorMode';
import { DisneyQuizMode } from './components/disney-quiz/DisneyQuizMode';

function App() {
  const [mode, setMode] = useState<AppMode>('noise-color');

  return (
    <>
      <ModeSwitcher mode={mode} onModeChange={setMode} />
      {mode === 'noise-color' ? <NoiseColorMode /> : <DisneyQuizMode />}
    </>
  );
}

export default App;
