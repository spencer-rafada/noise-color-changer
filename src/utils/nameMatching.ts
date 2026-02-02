function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[a.length][b.length];
}

export function isNameMatch(
  transcript: string,
  characterName: string,
  threshold: number = 0.7,
): { isMatch: boolean; confidence: number } {
  const normalizedTranscript = normalize(transcript);
  const normalizedName = normalize(characterName);

  if (!normalizedTranscript || !normalizedName) {
    return { isMatch: false, confidence: 0 };
  }

  // 1. Exact match
  if (normalizedTranscript === normalizedName) {
    return { isMatch: true, confidence: 1.0 };
  }

  // 2. Contains match — character name found within transcript
  if (normalizedTranscript.includes(normalizedName)) {
    return { isMatch: true, confidence: 0.95 };
  }

  // 3. First-name / keyword match for multi-word names
  const nameWords = normalizedName.split(/\s+/);
  const transcriptWords = normalizedTranscript.split(/\s+/);
  if (nameWords.length > 1) {
    for (const word of nameWords) {
      if (word.length >= 4 && transcriptWords.includes(word)) {
        return { isMatch: true, confidence: 0.85 };
      }
    }
  }

  // 4. Levenshtein distance — handles minor transcription errors
  const distance = levenshteinDistance(normalizedTranscript, normalizedName);
  const maxLen = Math.max(normalizedTranscript.length, normalizedName.length);
  const similarity = 1 - distance / maxLen;

  if (similarity >= threshold) {
    return { isMatch: true, confidence: similarity };
  }

  // 5. Levenshtein against individual transcript words vs name
  for (const word of transcriptWords) {
    const wordDist = levenshteinDistance(word, normalizedName);
    const wordMaxLen = Math.max(word.length, normalizedName.length);
    const wordSim = 1 - wordDist / wordMaxLen;
    if (wordSim >= threshold) {
      return { isMatch: true, confidence: wordSim * 0.9 };
    }
  }

  return { isMatch: false, confidence: similarity };
}
