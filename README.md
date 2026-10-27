# Neon Tic-Tac-Toe

A sleek, dark-mode Tic-Tac-Toe with glowing neon accents, an unbeatable Minimax AI, a speed-run timer, synthesized sound effects, and confetti.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AdarshSingh2508/neon-tic-tac-toe)

## Features

- **Pass & Play**: local two-player on the same device.
- **vs AI** with three difficulties:
  - **Easy**: random valid moves.
  - **Medium**: takes wins and blocks your wins most of the time, with a bit of randomness so it can be beaten.
  - **Impossible**: classic Minimax with alpha-beta pruning. It cannot be beaten (best case for you is a draw).
- **Speed run mode**: 5-second timer per move. If time runs out, a random move is played for you.
- **Scoreboard**: X wins, O wins, ties, and the current win streak, with a **Reset scores** button.
- **Undo** the last move (in vs-AI mode it rolls back your move and the AI's reply). Disabled in speed run mode.
- **Visuals**: glassmorphism board, cyan glow for X, coral/pink glow for O, animated marker draw-in, animated strike-through line on the winning row/column/diagonal, and a confetti burst on victory.
- **Audio**: all sounds are synthesized with the Web Audio API, so there are no audio files to load. Crisp tap on placing a marker, a high chime on a win, a low buzz on a draw, and a floating mute/unmute button.
- Responsive and keyboard accessible; respects `prefers-reduced-motion`.

## Tech stack

- [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide](https://lucide.dev) icons
- [canvas-confetti](https://github.com/catdad/canvas-confetti)
- Web Audio API (no external audio assets)

## Getting started

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

### Other scripts

```bash
npm run build     # type-check and create a production build in dist/
npm run preview   # serve the production build locally
```

## Project structure

```
src/
  App.tsx                 # game state, modes, timer, undo, sound/confetti triggers
  audio.ts                # Web Audio synthesized sound effects
  game/
    logic.ts              # board helpers, win/draw detection
    ai.ts                 # easy / medium / minimax AI
  components/
    Board.tsx             # 3x3 grid + animated winning strike line
    Marks.tsx             # neon X and O glyphs
    Scoreboard.tsx        # wins, ties, streak
```

## Deploy

### Vercel

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new). The Vite preset is detected automatically.
3. Build command `npm run build`, output directory `dist`.

### GitHub Pages

The build uses relative asset paths (`base: './'`), so it works on project sites.

```bash
npm run build
# publish the dist/ folder, e.g. with the gh-pages package:
npx gh-pages -d dist
```

Then set **Settings → Pages → Source** to the `gh-pages` branch.

## License

MIT
