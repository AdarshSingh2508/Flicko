<div align="center">

# Neon Tic-Tac-Toe

**A sleek, dark-mode Tic-Tac-Toe with glowing neon accents, an unbeatable Minimax AI, a speed-run timer, synthesized sound effects and confetti.**

### [▶ Play now](https://adarshsingh2508.github.io/neon-tic-tac-toe/)

[![Play now](https://img.shields.io/badge/▶_Play_now-live_demo-22d3ee?style=for-the-badge)](https://adarshsingh2508.github.io/neon-tic-tac-toe/)
[![Build & Deploy](https://github.com/AdarshSingh2508/neon-tic-tac-toe/actions/workflows/deploy.yml/badge.svg)](https://github.com/AdarshSingh2508/neon-tic-tac-toe/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-ff4d8d.svg)](LICENSE)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AdarshSingh2508/neon-tic-tac-toe)

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss&logoColor=white)

</div>

---

## Features

- **Pass & Play**: local two-player on the same device.
- **vs AI** with three difficulties:
  - **Easy**: random valid moves.
  - **Medium**: takes wins and blocks your wins most of the time, with a bit of randomness so it can be beaten.
  - **Impossible**: classic Minimax with alpha-beta pruning. It cannot be beaten (your best result is a draw).
- **Speed run mode**: 5-second timer per move. If time runs out, a random move is played for you.
- **Scoreboard**: X wins, O wins, ties and the current win streak, with a **Reset scores** button.
- **Undo** the last move (in vs-AI mode it rolls back your move and the AI's reply). Disabled in speed run mode.
- **Visuals**: glassmorphism board, cyan glow for X, coral/pink glow for O, animated marker draw-in, an animated strike-through line on the winning row, column or diagonal, and a confetti burst on victory.
- **Audio**: every sound is synthesized with the Web Audio API, so there are no audio files to load. Crisp tap when placing a marker, a high chime on a win, a low buzz on a draw, and a floating mute/unmute button.
- Responsive, keyboard accessible, and respects `prefers-reduced-motion`.

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
git clone https://github.com/AdarshSingh2508/neon-tic-tac-toe.git
cd neon-tic-tac-toe
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

### Scripts

```bash
npm run dev       # start the dev server
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
.github/workflows/
  deploy.yml              # CI build + automatic GitHub Pages deploy
```

## Deployment

### GitHub Pages (automatic)

This repo ships with a workflow that builds the game and publishes it on every push to `main`.

1. Go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab).

The game goes live at `https://<your-username>.github.io/<repo-name>/`. The build uses relative asset paths (`base: './'`), so it works on project sites without extra configuration.

### Vercel

Click the **Deploy with Vercel** button above, or import the repo at [vercel.com/new](https://vercel.com/new). The Vite preset is detected automatically (build command `npm run build`, output directory `dist`).

## Contributing

Issues and pull requests are welcome. For larger changes, please open an issue first to discuss what you would like to change. Before opening a PR, make sure `npm run build` passes.

## Credits

Designed and developed by **[Adarsh Singh](https://github.com/AdarshSingh2508)**.

## License

Released under the [MIT License](LICENSE). Copyright © 2026 Adarsh Singh.
