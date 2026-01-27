// Baby-friendly pastel color palette
export const PASTEL_COLORS = [
  '#f8b4d9', // soft pink
  '#b4d9f8', // sky blue
  '#d9f8b4', // mint green
  '#f8d9b4', // peach
  '#d9b4f8', // lavender
  '#b4f8d9', // seafoam
  '#f8f8b4', // buttercup
  '#f8b4b4', // coral pink
  '#b4f8f8', // aqua
  '#d9d9f8', // periwinkle
  '#f8d9d9', // blush
  '#b4d9b4', // sage
];

let lastColorIndex = -1;

export function getRandomPastelColor(): string {
  let newIndex: number;

  // Avoid picking the same color twice in a row
  do {
    newIndex = Math.floor(Math.random() * PASTEL_COLORS.length);
  } while (newIndex === lastColorIndex && PASTEL_COLORS.length > 1);

  lastColorIndex = newIndex;
  return PASTEL_COLORS[newIndex];
}

export function getInitialColor(): string {
  lastColorIndex = 0;
  return PASTEL_COLORS[0];
}
