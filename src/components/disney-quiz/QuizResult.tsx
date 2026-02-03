interface QuizResultProps {
  result: 'correct' | 'incorrect' | null;
  characterName: string;
  userTranscript: string;
  countdown: number | null;
}

export function QuizResult({
  result,
  characterName,
  userTranscript,
  countdown,
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
      {countdown !== null && countdown > 0 && (
        <div className="quiz-countdown">
          Next in {countdown}...
        </div>
      )}
    </div>
  );
}
