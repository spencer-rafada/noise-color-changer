# Disney Character Voice Quiz

## Overview

Extend the existing Noise Color Changer into a two-mode application. The new **Disney Character Voice Quiz** mode displays a random Disney character image and challenges the user to say the character's name out loud. The app transcribes the speech and validates whether the answer is correct.

The existing Noise Color Changer mode remains fully functional. Users switch between modes via a top-level tab control.

**Target audience:** General / all ages.

---

## User Flow

```
┌─────────────────────────────────────────┐
│         Mode Switcher (tabs)            │
│  [ Noise Colors ]  [ Disney Quiz ]      │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
  Noise Color Changer     Disney Quiz Mode
  (existing behavior)     (new feature)
```

### Disney Quiz Flow

1. App fetches a random Disney character (image + name) from the API.
2. Character image is displayed prominently on screen.
3. User taps **"Start Listening"** to activate the microphone.
4. User speaks the character's name.
5. App transcribes the speech in real-time (interim results shown as the user speaks).
6. Once speech ends, the app compares the transcript to the character name using fuzzy matching.
7. **Correct** — green celebration feedback, score increments, background color changes.
8. **Incorrect** — the correct name is revealed.
9. After a brief delay, the next character loads automatically. A "Next" button is also available.

---

## Part 1: Disney Character API

### API: disneyapi.dev

| Detail | Value |
|---|---|
| Base URL | `https://api.disneyapi.dev` |
| Auth | None required |
| Methods | GET only |
| Format | REST (GraphQL also available) |
| Characters | 9,820 total |

### Endpoints

| Endpoint | Description |
|---|---|
| `GET /character` | List all characters (paginated) |
| `GET /character/:id` | Get a single character by ID |
| `GET /character?name=value` | Filter characters by name |

**Query parameters:** `page` (default: 1), `pageSize` (default: 50).

### Response Format

```json
{
  "info": {
    "count": 9820,
    "totalPages": 197,
    "previousPage": null,
    "nextPage": "https://api.disneyapi.dev/character?page=2&pageSize=50"
  },
  "data": [
    {
      "_id": 112,
      "name": "Mickey Mouse",
      "imageUrl": "https://static.wikia.nocookie.net/disney/images/...",
      "films": ["Fantasia", "Fun and Fancy Free"],
      "tvShows": ["Mickey Mouse Clubhouse"],
      "videoGames": ["Kingdom Hearts"],
      "parkAttractions": ["Mickey's PhilharMagic"],
      "allies": ["Minnie Mouse", "Donald Duck"],
      "enemies": ["Pete"],
      "sourceUrl": "https://disney.fandom.com/wiki/Mickey_Mouse",
      "url": "https://api.disneyapi.dev/character/112"
    }
  ]
}
```

### Random Character Strategy

Fetching all 9,820 characters upfront is wasteful. Instead:

1. On first call, fetch page 1 to learn `totalPages`. Cache this value.
2. Generate a random page number (1 to `totalPages`).
3. Fetch that page (`GET /character?page=<random>&pageSize=50`).
4. Pick a random character from the returned array.
5. Filter out characters without a valid `imageUrl` or with no `films` entries (ensures recognizable characters with images).

Cache fetched pages in memory to avoid redundant requests during a session.

### Image Handling

Character images come from the Disney Fandom wiki CDN. Some URLs may be broken or low-resolution.

- Use an `onError` handler on the `<img>` element to detect broken images.
- On error, show a fallback placeholder and auto-advance to the next character.
- Use `object-fit: contain` for varying aspect ratios.

---

## Part 2: Voice Recognition & Transcription

### Technology: Web Speech API

The Web Speech API is a browser-native interface — no external libraries or API keys required.

| Detail | Value |
|---|---|
| Interface | `SpeechRecognition` (or `webkitSpeechRecognition` in Chrome) |
| Browser support | Chrome, Edge, Safari (partial). No Firefox support. |
| Privacy | Chrome sends audio to Google servers. On-device recognition available in some browsers. |
| Cost | Free (built into the browser) |

### Configuration

```typescript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = false;       // Single utterance per guess
recognition.interimResults = true;    // Show words as user speaks
recognition.lang = 'en-US';          // English character names
```

### Key Events

| Event | Purpose |
|---|---|
| `onresult` | Fires with transcription results. Check `isFinal` to distinguish interim vs final results. |
| `onend` | Fires when recognition stops. Used to trigger answer validation. |
| `onerror` | Fires on errors: `not-allowed` (mic denied), `no-speech`, `network`. |

### Name Matching Logic

Speech recognition is imperfect. The matching algorithm uses a layered approach from strict to fuzzy:

1. **Exact match** — Normalize both strings (lowercase, trim, remove punctuation). Direct comparison. Confidence: 1.0.
2. **Contains match** — Check if the character name appears within the transcript (handles "I think it's Elsa"). Confidence: 0.95.
3. **First-name match** — For multi-word names like "Captain Hook", check if any significant word (4+ chars) from the name appears in the transcript. Confidence: 0.85.
4. **Levenshtein distance** — Compute edit distance. If `1 - (distance / maxLength) >= 0.7`, count as a match. Handles minor transcription errors like "Elssa" for "Elsa". Confidence: varies.

The threshold is configurable (default: 0.7). No external string-matching libraries are needed — Levenshtein distance is ~20 lines of code.

### Browser Compatibility

The Web Speech API is only reliable in Chrome/Chromium. When the API is not available:

- Detect support on mount: `'SpeechRecognition' in window || 'webkitSpeechRecognition' in window`.
- Show a clear message: "Voice recognition requires Chrome or Edge."
- The Noise Color Changer mode remains available in all browsers regardless.

---

## Architecture

### Mode Switching

State-based switching in `App.tsx` — no router needed for two modes.

```typescript
type AppMode = 'noise-color' | 'disney-quiz';

function App() {
  const [mode, setMode] = useState<AppMode>('noise-color');
  return (
    <>
      <ModeSwitcher mode={mode} onModeChange={setMode} />
      {mode === 'noise-color' ? <NoiseColorMode /> : <DisneyQuizMode />}
    </>
  );
}
```

When switching modes, React unmounts the previous mode component, which triggers cleanup (microphone release, audio context teardown) via existing `useEffect` return functions.

### New File Structure

```
src/
├── components/
│   ├── ModeSwitcher.tsx              # NEW — tab control for mode selection
│   ├── NoiseColorMode.tsx            # NEW — extracted existing App.tsx logic
│   ├── disney-quiz/
│   │   ├── DisneyQuizMode.tsx        # NEW — main quiz orchestrator
│   │   ├── CharacterDisplay.tsx      # NEW — character image display
│   │   ├── SpeechFeedback.tsx        # NEW — transcript & listening indicator
│   │   ├── QuizResult.tsx            # NEW — correct/incorrect feedback
│   │   └── ScoreBoard.tsx            # NEW — score tracker
│   ├── ColorBackground.tsx           # UNCHANGED (reused by quiz)
│   ├── ControlPanel.tsx              # UNCHANGED
│   ├── Slider.tsx                    # UNCHANGED
│   └── SoundLevelMeter.tsx           # UNCHANGED
├── hooks/
│   ├── useSpeechRecognition.ts       # NEW — Web Speech API wrapper
│   ├── useDisneyCharacter.ts         # NEW — character fetching logic
│   ├── useAudioLevel.ts              # UNCHANGED
│   └── useBackgroundMusic.ts         # UNCHANGED
├── utils/
│   ├── nameMatching.ts               # NEW — fuzzy name comparison
│   └── colors.ts                     # UNCHANGED (reused for quiz bg)
├── types/
│   ├── disney.ts                     # NEW — Disney API type definitions
│   └── speechRecognition.d.ts        # NEW — Web Speech API types
├── App.tsx                           # MODIFIED — thin shell with mode state
└── App.css                           # MODIFIED — add quiz & switcher styles
```

### Component Hierarchy (Disney Quiz)

```
DisneyQuizMode
  └── ColorBackground (reused — changes color on correct answer)
        ├── ScoreBoard (score / total in top corner)
        ├── CharacterDisplay (large character image, loading state)
        ├── SpeechFeedback (mic indicator, interim/final transcript)
        ├── QuizResult (correct/incorrect overlay with character name)
        └── Start/Next button
```

### New Hooks

**`useSpeechRecognition`** — follows the same ref-based resource pattern as `useAudioLevel`:
- Stores `SpeechRecognition` instance in a `useRef`
- Returns `{ transcript, interimTranscript, isListening, isSupported, error, startListening, stopListening, resetTranscript }`
- Cleans up via `recognition.abort()` on unmount

**`useDisneyCharacter`** — manages character fetching with in-memory page cache:
- Returns `{ character, isLoading, error, fetchNextCharacter }`
- Caches fetched pages in `useRef<Map<number, DisneyCharacter[]>>()`
- Uses `AbortController` for request cancellation on unmount

### Type Definitions

**`DisneyCharacter`**:
```typescript
interface DisneyCharacter {
  _id: number;
  name: string;
  imageUrl: string;
  films: string[];
  tvShows: string[];
  videoGames: string[];
  allies: string[];
  enemies: string[];
}
```

### No New Dependencies

The project currently has zero runtime dependencies beyond React. This feature maintains that:

| Considered | Decision | Reason |
|---|---|---|
| `react-speech-recognition` | Skip | Custom hook is ~80 lines; avoids 15KB for features we don't need |
| `string-similarity` | Skip | Levenshtein is ~20 lines to implement inline |
| `react-router-dom` | Skip | Two modes don't warrant a router |

---

## Implementation Phases

### Phase 1: Foundation
- Create `src/types/disney.ts` (TypeScript interfaces)
- Create `src/types/speechRecognition.d.ts` (Web Speech API types)
- Create `src/utils/nameMatching.ts` (matching logic)

### Phase 2: Hooks
- Create `src/hooks/useSpeechRecognition.ts`
- Create `src/hooks/useDisneyCharacter.ts`

### Phase 3: Refactor Existing Code
- Extract current `App.tsx` body into `src/components/NoiseColorMode.tsx`
- Simplify `App.tsx` to a mode-switching shell
- Verify existing behavior is unchanged

### Phase 4: Mode Switching UI
- Create `src/components/ModeSwitcher.tsx`
- Add mode state and conditional rendering in `App.tsx`
- Add switcher styles to `App.css`

### Phase 5: Quiz Components
- Build all `src/components/disney-quiz/` components
- Wire up `DisneyQuizMode` with hooks and child components
- Add quiz styles to `App.css`

### Phase 6: Integration & Polish
- End-to-end testing across the full quiz flow
- Handle edge cases (broken images, unsupported browser, API errors, empty transcript)
- Mobile responsive testing

---

## Known Limitations & Mitigations

| Limitation | Impact | Mitigation |
|---|---|---|
| Web Speech API is Chrome/Chromium only | Firefox/non-Chromium Safari users can't use quiz mode | Detect support and show a clear browser requirement message. Noise Color mode still works everywhere. |
| Disney API images may be broken | Some characters have 404 or low-res images | `onError` handler auto-skips to next character. Filter to characters with `films.length > 0` for better quality. |
| Unusual character names ("Yzma", "Pua", "Te Fiti") | Speech recognition may not transcribe these accurately | Fuzzy matching with 0.7 threshold. Optional film hint ("From: Moana"). Skip button for unrecognizable characters. |
| Disney API image URLs may be HTTP | Mixed content blocked on HTTPS pages | API base URL supports HTTPS. For image URLs, test and fall back to placeholder if blocked. |
| Microphone conflict between modes | Two modes both need mic access | Conditional rendering unmounts the inactive mode, which triggers cleanup and releases the mic before the new mode mounts. |

---

## References

- Disney API: https://disneyapi.dev / https://disneyapi.dev/docs
- Web Speech API (MDN): https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- Using the Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API
- SpeechRecognition interface: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
