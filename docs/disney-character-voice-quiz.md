# Disney Character Voice Quiz

## Overview

The Noise Color Changer app has been extended into a two-mode application. The new **Disney Character Voice Quiz** mode displays a random Disney character image and challenges the user to identify the character. A top-level tab control switches between modes.

**Target audience:** General / all ages.

**Status:** Complete. Part 1 (character display, filtering, skipping), Part 2 (voice recognition), and Part 3 (auto-advance timer) are all implemented.

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

### Quiz Flow

1. App fetches a random Disney character from the API (or hardcoded pool).
2. Character image is displayed with a film hint ("From: Frozen").
3. A **Movie Filter** dropdown lets users limit characters to a specific film.
4. User taps **"Speak Answer"** to activate the microphone.
5. User speaks the character's name.
6. App transcribes speech in real-time (interim results shown).
7. Final transcript is compared to the character name using fuzzy matching.
8. **Correct** — green feedback, score increments, background color changes.
9. **Incorrect** — the correct name is revealed.
10. A **3-second countdown** ("Next in 3... 2... 1...") auto-advances to the next character.
11. The quiz loops endlessly until the user navigates away — no manual "Next" button needed.
12. User can **Skip** at any time to load the next character without answering.

---

## Disney API

### API: disneyapi.dev

| Detail | Value |
|---|---|
| Base URL | `https://api.disneyapi.dev` |
| Auth | None required |
| Methods | GET only |
| Format | REST |
| Characters | ~9,820 total |

### Endpoints Used

| Endpoint | Description |
|---|---|
| `GET /character?page=N&pageSize=50` | Paginated character listing |
| `GET /character?films=NAME&pageSize=200` | Filter by film name |

### API Quirks Discovered

**Single-object response:** When a query returns exactly one character, the API returns `data` as a single object instead of an array. Our `DisneyApiResponse` type accounts for this:

```typescript
export interface DisneyApiResponse {
  info: { count: number; totalPages: number; ... };
  data: DisneyCharacter[] | DisneyCharacter;  // Union type
}
```

A `normalizeData()` helper wraps single objects in an array before processing.

**Sparse coverage for some films:** The API has very few entries for some popular films. For example, "Cars" only has Lightning McQueen — Mater, Sally, Doc Hudson, and others are completely absent. This led to the hardcoded character fallback system (see below).

---

## Architecture

### Mode Switching

State-based switching in `App.tsx` with no router. When switching modes, React unmounts the previous mode component, triggering cleanup (microphone release, audio context teardown) via existing `useEffect` return functions.

### File Structure

```
src/
├── components/
│   ├── ModeSwitcher.tsx              # Tab control for mode selection
│   ├── NoiseColorMode.tsx            # Extracted existing App.tsx logic
│   ├── disney-quiz/
│   │   ├── DisneyQuizMode.tsx        # Main quiz orchestrator
│   │   ├── CharacterDisplay.tsx      # Character image + loading spinner
│   │   ├── MovieFilter.tsx           # Film dropdown selector
│   │   ├── SpeechFeedback.tsx        # Transcript & listening indicator
│   │   ├── QuizResult.tsx            # Correct/incorrect feedback + countdown
│   │   └── ScoreBoard.tsx            # Score tracker
│   ├── ColorBackground.tsx           # Unchanged (reused by quiz)
│   ├── ControlPanel.tsx              # Unchanged
│   ├── Slider.tsx                    # Unchanged
│   └── SoundLevelMeter.tsx           # Unchanged
├── hooks/
│   ├── useDisneyCharacter.ts         # Character fetching + filtering
│   ├── useSpeechRecognition.ts       # Web Speech API wrapper
│   ├── useAudioLevel.ts              # Unchanged
│   └── useBackgroundMusic.ts         # Unchanged
├── utils/
│   ├── nameMatching.ts               # Fuzzy name comparison
│   └── colors.ts                     # Unchanged (reused for quiz bg)
├── types/
│   ├── disney.ts                     # Disney API type definitions
│   └── speechRecognition.d.ts        # Web Speech API types
├── data/
│   └── carsCharacters.ts             # Hardcoded Cars characters
├── App.tsx                           # Thin shell with mode state
└── App.css                           # Extended with quiz styles

public/
└── images/
    └── cars/                         # 13 locally-served character images
        ├── lightning-mcqueen.webp
        ├── mater.webp
        ├── sally-carrera.webp
        ├── doc-hudson.webp
        ├── chick-hicks.webp
        ├── cruz-ramirez.webp
        ├── jackson-storm.webp
        ├── luigi.webp
        ├── guido.webp
        ├── fillmore.webp
        ├── ramone.webp
        ├── sarge.webp
        └── the-king.webp
```

### Component Hierarchy (Disney Quiz)

```
DisneyQuizMode
  └── ColorBackground
        ├── ScoreBoard
        ├── MovieFilter
        ├── CharacterDisplay (image + loading spinner + film hint)
        ├── SpeechFeedback (listening indicator + transcript)
        ├── QuizResult (correct/incorrect feedback + auto-advance countdown)
        └── Quiz controls (Speak Answer, Skip)
```

---

## Key Design Decisions

### 1. Popularity Filter

**Problem:** The API contains ~9,820 characters, many extremely obscure (e.g., background extras, minor one-scene characters with no recognizable traits).

**Solution:** A popularity score heuristic filters characters before display. The score is the sum of array lengths across all metadata fields:

```
score = films + tvShows + videoGames + parkAttractions + allies + enemies
```

Characters must have `score >= 10` to be shown. This ensures only characters with meaningful media presence appear in the quiz.

Characters must also have a non-empty `imageUrl` and at least one film entry.

### 2. Movie Filter with Curated List

**Problem:** Users wanted to focus on characters from specific films rather than the entire Disney catalog.

**Decision:** A curated dropdown of 17 popular movies rather than a dynamically-fetched list. This avoids an extra API call and ensures only films with adequate character pools are offered.

**Curated films:** Frozen, Moana, The Lion King, Aladdin, The Little Mermaid, Tangled, Toy Story, Mulan, Beauty and the Beast, The Jungle Book, Cinderella, Sleeping Beauty, Wreck-It Ralph, Big Hero 6, Zootopia, Encanto, Cars.

Films with fewer than ~10 valid characters (e.g., Finding Nemo with 3) were excluded except Cars, which uses a hardcoded fallback.

### 3. Hardcoded Cars Characters

**Problem:** The Disney API has only 1 character (Lightning McQueen) for all Cars films. Mater, Sally, Doc Hudson, and others are absent.

**Decision:** 13 Cars characters are hardcoded in `src/data/carsCharacters.ts` with locally-served images. The `useDisneyCharacter` hook checks `HARDCODED_FILMS` before making API requests.

**Characters included:** Lightning McQueen, Mater, Sally Carrera, Doc Hudson, Chick Hicks, Cruz Ramirez, Jackson Storm, Luigi, Guido, Fillmore, Ramone, Sarge, The King.

This pattern is extensible — any film with poor API coverage can be added to `HARDCODED_FILMS`.

### 4. Local Image Serving for Cars

**Problem:** Disney Fandom wiki CDN has hotlink protection. When an `<img>` tag loads a wiki image, the browser sends a `Referer` header pointing to the app's domain. The CDN rejects non-Fandom referrers with a 404.

**Attempted fixes:**
- `referrerPolicy="no-referrer"` on `<img>` — did not resolve the issue
- Various URL formats (`/revision/latest/`, `scale-to-width-down`) — all 404'd

**Final solution:** All 13 Cars character images were downloaded as `.webp` files to `public/images/cars/` and served locally. Image URLs use `import.meta.env.BASE_URL` for correct paths under Vite's base config (`/noise-color-changer/`).

Note: `referrerPolicy="no-referrer"` is still set on the `<img>` tag as a general measure for API-sourced wiki images (non-Cars characters).

### 5. Fetching Strategy

**"All Movies" mode:**
- First call fetches page 1 (`pageSize=50`) to learn `totalPages`
- Each subsequent skip fetches a fresh random page and picks a random valid character
- No page caching — this was intentionally simplified after a bug where cached pages caused characters to repeat

**Film filter mode:**
- Fetches all characters for that film in one request (`pageSize=200`) — most films have <100 characters
- Caches the entire pool in a ref
- Picks randomly from the cached pool on each skip, avoiding the previously-shown character

**Why no preloading:** An earlier implementation attempted preloading the next character while the user viewed the current one. This introduced complexity (caching, shown-ID tracking, pool recycling) that caused a bug where "All" mode would cycle through the same 1-2 characters instead of fetching new pages. The simpler approach of fetching on each skip works reliably.

### 6. No New Runtime Dependencies

| Considered | Decision | Reason |
|---|---|---|
| `react-speech-recognition` | Skip | Custom hook is ~80 lines; avoids extra bundle size |
| `string-similarity` | Skip | Levenshtein distance is ~20 lines inline |
| `react-router-dom` | Skip | Two modes don't warrant a router |

### 7. Request Cancellation

The `useDisneyCharacter` hook uses `AbortController` to cancel in-flight requests when:
- The user skips before the current fetch completes
- The component unmounts (mode switch)
- The film filter changes

This prevents race conditions and state updates on unmounted components.

---

## Bugs Encountered & Fixed

### 1. `data.data.filter is not a function`

**Cause:** Disney API returns `data` as a single object (not an array) when exactly one character matches a query (e.g., `?films=Cars`).

**Fix:** Added `normalizeData()` helper that wraps single objects in an array. Updated `DisneyApiResponse` type to use a union: `data: DisneyCharacter[] | DisneyCharacter`.

### 2. Cars images returning 404

**Cause:** Disney Fandom wiki CDN blocks hotlinked images when a `Referer` header is present from a non-Fandom domain.

**Fix:** Downloaded all 13 Cars character images locally to `public/images/cars/`. Updated `carsCharacters.ts` to reference local paths.

### 3. "All" mode skip not changing character

**Cause:** The previous implementation cached page results and tracked shown character IDs in a `Set`. When all cached characters had been shown, it cleared the set and recycled — but never fetched new pages. With the popularity filter reducing most pages to 1-2 valid characters, users were stuck seeing the same characters repeatedly.

**Fix:** Simplified the hook to fetch a fresh random page on every skip in "All" mode, with no caching or shown-ID tracking.

---

## Voice Recognition (Part 2)

### Implementation

- **`src/hooks/useSpeechRecognition.ts`** — Custom hook wrapping the Web Speech API:
  - Stores `SpeechRecognition` instance in a ref
  - Returns `{ transcript, interimTranscript, isListening, isSupported, error, startListening, stopListening, resetTranscript }`
  - Cleans up via `recognition.abort()` on unmount
  - Configuration: `continuous = false`, `interimResults = true`, `lang = 'en-US'`

- **`src/utils/nameMatching.ts`** — Fuzzy name matching with 5 layers:
  1. Exact match (confidence: 1.0)
  2. Contains match (confidence: 0.95)
  3. First-name/keyword match for multi-word names (confidence: 0.85)
  4. Levenshtein distance on full strings (threshold: 0.7)
  5. Levenshtein distance on individual transcript words vs name

- **`DisneyQuizMode.tsx`** orchestration:
  - Calls `useSpeechRecognition` hook
  - "Speak Answer" button toggles microphone on/off
  - On speech end: compares transcript to `character.name` using `isNameMatch()`
  - Updates score/totalAttempts state
  - Changes background color on correct answer
  - Shows `QuizResult` with correct/incorrect feedback
  - Prevents double-evaluation via `evaluatedRef`

- **UI components:**
  - `SpeechFeedback` — Pulsing mic indicator while listening, displays interim and final transcripts
  - `QuizResult` — Green checkmark (correct) or red X (incorrect) with character name reveal
  - `ScoreBoard` — Score display (hidden when 0 attempts)

### Browser Support

| Browser | Web Speech API |
|---|---|
| Chrome/Chromium | Full support |
| Edge | Full support |
| Safari | Partial support |
| Firefox | Not supported |

Unsupported browsers show: "Voice recognition requires Chrome or Edge". The quiz remains usable without voice (skip-only mode).

---

## Auto-Advance Timer (Part 3)

### Design Goal

Minimize user interaction after answering. The quiz should feel like an endless loop — start it, answer by voice, and it keeps going. No need to tap "Next" between characters.

### Implementation

When a result is shown (correct or incorrect), a 3-second countdown starts automatically:

1. `result` state is set → `useEffect` fires, initializing `countdown` to 3
2. A `setInterval` ticks the countdown down every second (3 → 2 → 1 → 0)
3. A second `useEffect` watches for `countdown === 0` and calls `handleNext()`
4. `handleNext()` clears the countdown, resets state, and fetches the next character

The countdown is displayed in `QuizResult` as "Next in 3..." text (styled in indigo).

### Cleanup

- `countdownRef` stores the interval ID for manual cleanup
- `clearCountdown()` helper clears the interval and resets state
- The `useEffect` return function clears the interval on unmount or when `result` changes
- `handleNext()` calls `clearCountdown()` to prevent stale timers

### State

```typescript
const [countdown, setCountdown] = useState<number | null>(null);
const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
```

- `countdown: null` — no countdown active
- `countdown: 3/2/1` — counting down, displayed in UI
- `countdown: 0` — triggers auto-advance

---

## References

- Disney API: https://disneyapi.dev / https://disneyapi.dev/docs
- Web Speech API (MDN): https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- SpeechRecognition interface: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
