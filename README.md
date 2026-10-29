<div align="center">

# Flicko: Tic-Tac-Toe

**Tic-Tac-Toe printed in two inks. Play a friend or an unbeatable AI. The board clears itself after every round, so you never touch a reset button.**

### [▶ Play now](https://adarshsingh2508.github.io/Flicko/)

[![Play now](https://img.shields.io/badge/▶_Play_now-live_demo-2742F5?style=for-the-badge)](https://adarshsingh2508.github.io/Flicko/)
[![Build & Deploy](https://github.com/AdarshSingh2508/Flicko/actions/workflows/deploy.yml/badge.svg)](https://github.com/AdarshSingh2508/Flicko/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-E8530A.svg)](LICENSE)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AdarshSingh2508/Flicko)

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss&logoColor=white)

</div>

---

## Features

- **Rounds reset themselves**: when someone wins or the round is drawn, the result stays up for a few seconds, then the board prints a fresh grid. Tap **Next round now** to skip the wait. The opening player alternates every round.
- **Online with a friend**: one of you picks **Host a game** and gets a 4-digit code (or an invite link). The other picks **Join game** and types it in. You each play on your own device, with live moves, a shared scoreboard and automatic rounds. No account or sign-up.
- **Local**: two players pass and play on the same device.
- **Versus AI** with three difficulties:
  - **Easy**: random valid moves.
  - **Medium**: takes wins and blocks your wins most of the time, with a bit of randomness so it can be beaten.
  - **Impossible**: classic Minimax with alpha-beta pruning. It cannot be beaten (your best result is a draw).
- **Speed run mode**: 5-second timer per move. If time runs out, a random move is played for you.
- **Tally scoreboard**: wins and draws are kept as tally marks, with the current win streak and a **Clear scores** button.
- **Undo** your last move (against the AI it rolls back your move and everything after it). Off in speed run mode.
- **Look**: a two-ink print style. X prints in cobalt blue and O in orange (a pairing that is also easy to tell apart with colour-blindness), on cool paper with a hand-drawn `#` grid. Marks are slightly off-register and overprint like a real print run. A hand-drawn line strikes through the winning row, and confetti marks a victory. Set in Bricolage Grotesque.
- **Audio**: every sound is synthesized with the Web Audio API, so there are no audio files to load. Crisp tap when placing a mark, a high chime on a win, a low buzz on a draw, and a mute button.
- Responsive, keyboard accessible, and respects `prefers-reduced-motion`.

## Tech stack

- [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide](https://lucide.dev) icons
- [canvas-confetti](https://github.com/catdad/canvas-confetti)
- Web Audio API (no external audio assets)
- [PeerJS](https://peerjs.com) (WebRTC) for online play

## Getting started

Requires Node.js 18+.

```bash
git clone https://github.com/AdarshSingh2508/Flicko.git
cd Flicko
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
  net/
    protocol.ts           # message types, validation, 4-digit codes
    useOnline.ts          # host / join hook built on PeerJS
  components/
    Board.tsx             # 3x3 grid + animated winning strike line
    Marks.tsx             # printed X and O marks
    Scoreboard.tsx        # tally marks, streak
    Lobby.tsx             # host / join screen for online play
.github/workflows/
  deploy.yml              # CI build + automatic GitHub Pages deploy
```

## How online play works

Online games are peer-to-peer, so the site stays a static page and needs no server of its own.

- The host registers its 4-digit code as an id on the free public [PeerJS](https://peerjs.com) broker. The joining player looks that id up, and the two browsers connect directly over WebRTC. After the handshake, moves go straight between the two devices.
- The host owns the game. The guest only asks to play a cell, and the host checks it is really the guest's turn before accepting it, then sends the full state back. Everything that arrives over the connection is validated before use.
- The host plays X and the guest plays O. The opener alternates every round.
- Only one friend can join a game. Once someone is connected, anyone else who tries the code is turned away.

Things to know:

- A code is only valid while the host has the page open and is waiting. If the host closes or leaves, the game ends.
- The public broker is free and shared, so it can occasionally be slow or busy. If hosting or joining fails, try again.
- A few strict networks (some school, office or mobile networks) block direct connections and online play may not connect there.
- The 4-digit code is for convenience, not security. Share it only with the friend you want to play.

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
