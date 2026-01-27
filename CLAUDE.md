# Baby Noise Color Changer

## Quick Start
```bash
npm install && npm run dev
```

## Tech Stack
- Vite + React + TypeScript
- Web Audio API for microphone

## Project Structure
- src/hooks/ - Custom React hooks (audio detection)
- src/components/ - UI components
- src/utils/ - Utility functions (colors)

## Key Files
- `src/hooks/useAudioLevel.ts` - Microphone access and level detection
- `src/utils/colors.ts` - Pastel color palette

## Testing
Open browser, allow microphone, make noise to see color changes
