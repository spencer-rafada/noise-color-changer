import { useState, useCallback } from 'react';
import { ColorBackground } from '../ColorBackground';
import { CharacterDisplay } from './CharacterDisplay';
import { ScoreBoard } from './ScoreBoard';
import { SpeechFeedback } from './SpeechFeedback';
import { QuizResult } from './QuizResult';
import { MovieFilter } from './MovieFilter';
import { useDisneyCharacter } from '../../hooks/useDisneyCharacter';
import { getInitialColor } from '../../utils/colors';

export function DisneyQuizMode() {
  const [filmFilter, setFilmFilter] = useState('');

  const { character, isLoading, error, fetchNextCharacter } =
    useDisneyCharacter(filmFilter || undefined);

  const [backgroundColor] = useState(getInitialColor);
  const [score] = useState(0);
  const [totalAttempts] = useState(0);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [transcript, setTranscript] = useState('');

  // Placeholder states for speech — will be connected in Part 2
  const [isListening] = useState(false);
  const [interimTranscript] = useState('');

  const handleNext = useCallback(() => {
    setResult(null);
    setTranscript('');
    fetchNextCharacter();
  }, [fetchNextCharacter]);

  const handleImageError = useCallback(() => {
    fetchNextCharacter();
  }, [fetchNextCharacter]);

  const handleRetry = useCallback(() => {
    fetchNextCharacter();
  }, [fetchNextCharacter]);

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

            {result && character && (
              <QuizResult
                result={result}
                characterName={character.name}
                userTranscript={transcript}
                onNext={handleNext}
              />
            )}

            {!isLoading && character && !result && (
              <div className="quiz-controls">
                <button
                  className="quiz-action-button listen"
                  disabled={true}
                  title="Voice recognition coming in Part 2"
                >
                  Speak Answer (Coming Soon)
                </button>
                <button
                  className="quiz-action-button skip"
                  onClick={handleNext}
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
