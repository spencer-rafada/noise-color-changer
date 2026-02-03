import { useState, useCallback, useEffect, useRef } from 'react';
import { ColorBackground } from '../ColorBackground';
import { CharacterDisplay } from './CharacterDisplay';
import { ScoreBoard } from './ScoreBoard';
import { SpeechFeedback } from './SpeechFeedback';
import { QuizResult } from './QuizResult';
import { MovieFilter } from './MovieFilter';
import { useDisneyCharacter } from '../../hooks/useDisneyCharacter';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { isNameMatch } from '../../utils/nameMatching';
import { getInitialColor, getRandomPastelColor } from '../../utils/colors';

export function DisneyQuizMode() {
  const [filmFilter, setFilmFilter] = useState('');

  const { character, isLoading, error, fetchNextCharacter } =
    useDisneyCharacter(filmFilter || undefined);

  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const [backgroundColor, setBackgroundColor] = useState(getInitialColor);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Track whether we've already evaluated the current transcript
  const evaluatedRef = useRef(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track whether voice was active so we can auto-restart after advancing
  const wasListeningRef = useRef(false);

  // Evaluate answer when speech recognition produces a final transcript
  useEffect(() => {
    if (!transcript || !character || result || evaluatedRef.current) return;
    evaluatedRef.current = true;
    wasListeningRef.current = true;

    const { isMatch } = isNameMatch(transcript, character.name);
    setTotalAttempts((prev) => prev + 1);

    if (isMatch) {
      setScore((prev) => prev + 1);
      setBackgroundColor(getRandomPastelColor());
      setResult('correct');
    } else {
      setResult('incorrect');
    }
  }, [transcript, character, result]);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
  }, []);

  const handleNext = useCallback(() => {
    clearCountdown();
    const shouldAutoListen = wasListeningRef.current;
    setResult(null);
    evaluatedRef.current = false;
    resetTranscript();
    fetchNextCharacter();
    if (shouldAutoListen) {
      startListening();
    }
  }, [fetchNextCharacter, resetTranscript, clearCountdown, startListening]);

  const handleListen = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      evaluatedRef.current = false;
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleImageError = useCallback(() => {
    fetchNextCharacter();
  }, [fetchNextCharacter]);

  const handleRetry = useCallback(() => {
    fetchNextCharacter();
  }, [fetchNextCharacter]);

  // Auto-advance countdown when result is shown
  useEffect(() => {
    if (!result) return;

    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    countdownRef.current = interval;

    return () => {
      clearInterval(interval);
      countdownRef.current = null;
    };
  }, [result]);

  // Trigger advance when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      handleNext();
    }
  }, [countdown, handleNext]);

  // Reset score when film filter changes
  const prevFilterRef = useRef(filmFilter);
  useEffect(() => {
    if (prevFilterRef.current !== filmFilter) {
      prevFilterRef.current = filmFilter;
      setScore(0);
      setTotalAttempts(0);
      setResult(null);
      evaluatedRef.current = false;
      resetTranscript();
    }
  }, [filmFilter, resetTranscript]);

  return (
    <ColorBackground color={backgroundColor}>
      <div className="disney-quiz">
        <ScoreBoard score={score} totalAttempts={totalAttempts} />
        <MovieFilter value={filmFilter} onChange={setFilmFilter} />

        {error ? (
          <div className="quiz-error">
            <div className="error-message">{error}</div>
            <button className="quiz-action-button" onClick={handleRetry}>
              Try Again
            </button>
          </div>
        ) : (
          <>
            <CharacterDisplay
              character={character}
              isLoading={isLoading}
              onImageError={handleImageError}
            />

            {!isLoading && character && !result && (
              <SpeechFeedback
                isListening={isListening}
                transcript={transcript}
                interimTranscript={interimTranscript}
              />
            )}

            {(speechError && !result) && (
              <div className="error-message">{speechError}</div>
            )}

            {result && character && (
              <QuizResult
                result={result}
                characterName={character.name}
                countdown={countdown}
              />
            )}

            {!isLoading && character && !result && (
              <div className="quiz-controls">
                {isSupported ? (
                  <button
                    className={`quiz-action-button listen ${isListening ? 'active' : ''}`}
                    onClick={handleListen}
                  >
                    {isListening ? 'Stop' : 'Speak Answer'}
                  </button>
                ) : (
                  <div className="browser-warning">
                    Voice recognition requires Chrome or Edge.
                  </div>
                )}
                <button
                  className="quiz-action-button skip"
                  onClick={handleNext}
                  disabled={isListening}
                >
                  Skip
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </ColorBackground>
  );
}
