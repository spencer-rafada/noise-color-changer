const POPULAR_MOVIES = [
  'Frozen',
  'Moana',
  'The Lion King',
  'Aladdin',
  'The Little Mermaid',
  'Tangled',
  'Toy Story',
  'Mulan',
  'Beauty and the Beast',
  'The Jungle Book',
  'Cinderella',
  'Sleeping Beauty',
  'Wreck-It Ralph',
  'Big Hero 6',
  'Zootopia',
  'Encanto',
  'Cars',
];

interface MovieFilterProps {
  value: string;
  onChange: (film: string) => void;
}

export function MovieFilter({ value, onChange }: MovieFilterProps) {
  return (
    <div className="movie-filter">
      <select
        className="movie-filter-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All Movies</option>
        {POPULAR_MOVIES.map((movie) => (
          <option key={movie} value={movie}>
            {movie}
          </option>
        ))}
      </select>
    </div>
  );
}
