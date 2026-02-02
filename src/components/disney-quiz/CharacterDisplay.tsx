import type { DisneyCharacter } from '../../types/disney';

interface CharacterDisplayProps {
  character: DisneyCharacter | null;
  isLoading: boolean;
  onImageError: () => void;
}

export function CharacterDisplay({
  character,
  isLoading,
  onImageError,
}: CharacterDisplayProps) {
  if (isLoading) {
    return (
      <div className="character-display">
        <div className="character-loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (!character) {
    return null;
  }

  const hint =
    character.films.length > 0
      ? character.films[0]
      : character.tvShows.length > 0
        ? character.tvShows[0]
        : null;

  return (
    <div className="character-display">
      <img
        className="character-image"
        src={character.imageUrl}
        alt="Guess this Disney character"
        referrerPolicy="no-referrer"
        onError={onImageError}
      />
      {hint && <div className="character-hint">From: {hint}</div>}
    </div>
  );
}
