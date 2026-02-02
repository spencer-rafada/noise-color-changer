interface QuizResultProps {
  result: 'correct' | 'incorrect' | null;
  characterName: string;
  userTranscript: string;
  onNext: () => void;
}

export function QuizResult({
  result,
  characterName,
  userTranscript,
  onNext,
}: QuizResultProps) {
  if (!result) return null;

  return (
    <div className={`quiz-result ${result}`}>
      <div className="quiz-result-icon">
        {result === 'correct' ? '\u2713' : '\u2717'}
      </div>
      <div className="quiz-result-text">
        {result === 'correct' ? (
          <span>Correct!</span>
        ) : (
          <span>
            It was <strong>{characterName}</strong>
          </span>
        )}
      </div>
      {userTranscript && (
        <div className="quiz-result-transcript">
          You said: &ldquo;{userTranscript}&rdquo;
        </div>
      )}
      <button className="quiz-next-button" onClick={onNext}>
        Next
      </button>
    </div>
  );
}
