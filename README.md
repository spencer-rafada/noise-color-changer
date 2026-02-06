# Baby Noise Color Changer & Disney Character Quiz

A dual-mode React app: change background colors with noise, or test your Disney knowledge with voice recognition!

## Getting Started
```bash
npm install
npm run dev
```

## Modes

### 🎨 Noise Color Mode
A fun app that changes background colors when your baby makes noise!

**Features:**
- Pastel color palette (baby-friendly)
- Adjustable sensitivity
- Configurable buffer time between changes
- Sound level indicator
- Optional background music
- Works on mobile and desktop

### 🎬 Disney Character Quiz
Test your Disney knowledge with voice recognition!

**Features:**
- Voice-activated answering (Web Speech API)
- 9,000+ Disney characters from the Disney API
- Filter by specific movies (Frozen, Moana, Lion King, etc.)
- Auto-advancing quiz with 3-second countdown
- Real-time score tracking
- Procedural audio feedback (Web Audio API)
- Fuzzy name matching (handles variations)

## Usage

### Noise Color Mode
1. Select "Noise Colors" tab
2. Click "Start Listening"
3. Allow microphone access
4. Make noise to see the colors change!

**Controls:**
- **Start/Stop Button** - Enable or disable noise detection
- **Sensitivity Slider** - Adjust how loud sounds need to be to trigger color changes
- **Buffer Time Slider** - Set minimum time between color changes (1-10 seconds)

### Disney Quiz Mode
1. Select "Disney Quiz" tab
2. (Optional) Choose a movie filter
3. Click "Speak Answer" to start
4. Say the character's name
5. Get instant feedback - quiz auto-advances!
6. Click "Stop" to pause or "Skip" to pass

## Browser Compatibility

- **Noise Mode**: Works on all modern browsers (requires microphone access)
- **Quiz Mode**: Requires Web Speech API (Chrome, Edge, Safari - Firefox not supported)
- **Best Experience**: Chrome or Edge on desktop/mobile

## Credits

- Disney character data: [Disney API](https://disneyapi.dev)
- Audio: Procedurally generated using Web Audio API
