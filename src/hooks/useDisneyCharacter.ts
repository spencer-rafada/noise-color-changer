import { useState, useRef, useCallback, useEffect } from 'react';
import type { DisneyCharacter, DisneyApiResponse } from '../types/disney';
import { CARS_CHARACTERS } from '../data/carsCharacters';

const API_BASE = 'https://api.disneyapi.dev/character';
const PAGE_SIZE = 50;
const FILM_PAGE_SIZE = 200;

const HARDCODED_FILMS: Record<string, DisneyCharacter[]> = {
  Cars: CARS_CHARACTERS,
};

interface UseDisneyCharacterReturn {
  character: DisneyCharacter | null;
  isLoading: boolean;
  error: string | null;
  fetchNextCharacter: () => void;
}

const MIN_POPULARITY_SCORE = 10;

function popularityScore(c: DisneyCharacter): number {
  return (
    c.films.length +
    c.tvShows.length +
    c.videoGames.length +
    c.parkAttractions.length +
    c.allies.length +
    c.enemies.length
  );
}

function isValidCharacter(c: DisneyCharacter): boolean {
  return Boolean(
    c.imageUrl && c.films.length > 0 && popularityScore(c) >= MIN_POPULARITY_SCORE,
  );
}

function pickRandom<T>(arr: T[]): T | undefined {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalizeData(
  data: DisneyCharacter | DisneyCharacter[],
): DisneyCharacter[] {
  return Array.isArray(data) ? data : [data];
}

export function useDisneyCharacter(
  filmFilter?: string,
): UseDisneyCharacterReturn {
  const [character, setCharacter] = useState<DisneyCharacter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPagesRef = useRef<number | null>(null);
  const filmPoolRef = useRef<DisneyCharacter[]>([]);
  const currentIdRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset state when filter changes
  useEffect(() => {
    totalPagesRef.current = null;
    filmPoolRef.current = [];
    currentIdRef.current = null;
  }, [filmFilter]);

  const fetchPage = useCallback(
    async (page: number, signal: AbortSignal): Promise<DisneyApiResponse> => {
      const params = new URLSearchParams();
      if (filmFilter) {
        params.set('films', filmFilter);
        params.set('pageSize', String(FILM_PAGE_SIZE));
      } else {
        params.set('pageSize', String(PAGE_SIZE));
      }
      params.set('page', String(page));
      const res = await fetch(`${API_BASE}?${params}`, { signal });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
    [filmFilter],
  );

  const pickDifferent = useCallback(
    (pool: DisneyCharacter[]): DisneyCharacter | null => {
      if (pool.length === 0) return null;
      if (pool.length === 1) return pool[0];
      // Pick a random character that isn't the current one
      const others = pool.filter((c) => c._id !== currentIdRef.current);
      return pickRandom(others.length > 0 ? others : pool) ?? null;
    },
    [],
  );

  const fetchNextCharacter = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      if (filmFilter) {
        // Film filter mode: load full pool once, then pick from it
        if (filmPoolRef.current.length === 0) {
          const hardcoded = HARDCODED_FILMS[filmFilter];
          if (hardcoded) {
            filmPoolRef.current = hardcoded;
          } else {
            const data = await fetchPage(1, controller.signal);
            filmPoolRef.current = normalizeData(data.data).filter(isValidCharacter);
            if (data.info.totalPages > 1) {
              const remaining = Array.from(
                { length: data.info.totalPages - 1 },
                (_, i) => i + 2,
              );
              const pages = await Promise.all(
                remaining.map((p) => fetchPage(p, controller.signal)),
              );
              for (const page of pages) {
                filmPoolRef.current.push(
                  ...normalizeData(page.data).filter(isValidCharacter),
                );
              }
            }
          }
        }

        const picked = pickDifferent(filmPoolRef.current);
        if (!picked) {
          throw new Error('No characters with images found for this movie.');
        }
        currentIdRef.current = picked._id;
        setCharacter(picked);
      } else {
        // "All" mode: fetch a random page each time for variety
        // First call: learn totalPages
        if (totalPagesRef.current === null) {
          const data = await fetchPage(1, controller.signal);
          totalPagesRef.current = data.info.totalPages;
        }

        const totalPages = totalPagesRef.current;
        let picked: DisneyCharacter | null = null;
        let attempts = 0;

        while (!picked && attempts < 5) {
          attempts++;
          const randomPage = Math.floor(Math.random() * totalPages) + 1;
          const data = await fetchPage(randomPage, controller.signal);
          const valid = normalizeData(data.data).filter(isValidCharacter);
          picked = pickDifferent(valid);
        }

        if (!picked) {
          throw new Error(
            'Could not find a character with a valid image. Try again.',
          );
        }
        currentIdRef.current = picked._id;
        setCharacter(picked);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(
        err instanceof Error ? err.message : 'Failed to fetch character',
      );
    } finally {
      setIsLoading(false);
    }
  }, [filmFilter, fetchPage, pickDifferent]);

  useEffect(() => {
    fetchNextCharacter();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchNextCharacter]);

  return { character, isLoading, error, fetchNextCharacter };
}
