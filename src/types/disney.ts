export interface DisneyCharacter {
  _id: number;
  name: string;
  imageUrl: string;
  films: string[];
  shortFilms: string[];
  tvShows: string[];
  videoGames: string[];
  parkAttractions: string[];
  allies: string[];
  enemies: string[];
  sourceUrl: string;
  url: string;
}

export interface DisneyApiResponse {
  info: {
    count: number;
    totalPages: number;
    previousPage: string | null;
    nextPage: string | null;
  };
  data: DisneyCharacter[] | DisneyCharacter;
}
