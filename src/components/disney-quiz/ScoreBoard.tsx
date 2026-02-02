interface ScoreBoardProps {
  score: number;
  totalAttempts: number;
}

export function ScoreBoard({ score, totalAttempts }: ScoreBoardProps) {
  if (totalAttempts === 0) return null;

  return (
    <div className="score-board">
      {score} / {totalAttempts}
    </div>
  );
}
