# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

`npm` is not in PATH — always use the full node binary:

```bash
# Dev server (port 5173)
/opt/homebrew/bin/node ./node_modules/.bin/vite

# Type-check (no emit)
/opt/homebrew/bin/node ./node_modules/.bin/tsc --noEmit

# Production build
/opt/homebrew/bin/node ./node_modules/.bin/vite build
```

The preview server is configured in `.claude/launch.json` under the name `edugame` (port 5173).

## Architecture

**Stack**: React 18 + TypeScript + Vite. No external UI libraries. All styling is a single `src/index.css`.

### Navigation model

`App.tsx` is a single-level state machine. `AppState.screen` (a `Screen` union type from `src/types/index.ts`) drives a `switch` that renders one component at a time. There is no router.

- `activityKey` is incremented on every activity start/replay to force a full remount via React's `key` prop.
- Scored activities (`phonics`, `subitizing`, `more-or-less`, `ten-frame`, `quiz`) call `onComplete(score)` → `showSummary()` → `SummaryScreen`. Replay re-navigates to `replayScreen`.

### Adding a new activity

1. Add the screen name to the `Screen` union in `src/types/index.ts`
2. Create `src/components/YourScreen.tsx` with props `{ onComplete: (score: QuizScore) => void; onBack: () => void }` (or just `onBack` for non-scored activities)
3. Add `onYourActivity: () => void` to `MenuScreenProps` and a button in `MenuScreen.tsx`
4. Wire up in `App.tsx`: pass the prop via `startActivity('your-screen')` and add a `case` in the switch

### Speech (`src/hooks/useSpeech.ts`)

`useSpeech()` returns `{ speak, cancel }`. Voice is loaded async via the `voiceschanged` event and cached in a ref. Key settings: `lang='fr-FR'`, `rate=0.82`, `pitch=1.1`. A `setInterval` every 5 s does pause/resume to work around a Chrome bug that cuts off long utterances. Always call `cancel()` in the component's cleanup effect.

### Data (`src/data/`)

- `alphabet.ts` — 26 entries `{ key, emoji, word, article }`. Emojis match French words (e.g. A = 🍍 Ananas, not Apple).
- `numbers.ts` — 10 entries `{ key, digit, name, emoji }`. Each digit has a distinct fruit emoji.
- `quiz.ts` — shared config (`QUIZ_CONFIG`: 5 questions, 4 choices, 400 ms speech delay), feedback phrases, `shuffleArray`, `pickRandom`, question generators, `pickPhrase`.

### Activity patterns

All scored activities share the same pattern:
- `scoreRef` (ref, not state) for accumulation to avoid stale closures in callbacks
- `answeredRef` boolean guard prevents double-answers
- After feedback speech ends → 400 ms delay → next round or `onComplete`

### TracingScreen

Hidden from the menu (`_onTracing` is unused in `MenuScreen`). The waypoint system (`LETTER_PATHS`, `NUMBER_PATHS` with normalized [0,1] coords, `HIT_RADIUS_RATIO = 0.13`) works but the UX needs improvement before re-enabling.

### CSS conventions

All CSS is in `src/index.css`. Color variables are in `:root`. Each activity has a dedicated `page-*` class for its background gradient and a section comment block. The menu grid is 3 columns (`1fr 1fr 1fr`); the Quiz button uses `.wide` (`grid-column: span 2`) to pair with "Cadre de 10" in the last row. Responsive breakpoints: 600 px (tablet) and 900 px (desktop).
