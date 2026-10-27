import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import confetti from 'canvas-confetti'
import { Bot, RotateCcw, Timer, Trash2, Undo2, Users, Volume2, VolumeX } from 'lucide-react'
import { Board } from './components/Board'
import { Scoreboard, type Scores, type Streak } from './components/Scoreboard'
import { chooseMove, type Difficulty } from './game/ai'
import { boardFromMoves, emptyCells, getResult, playerForMove } from './game/logic'
import { playDraw, playTap, playTick, playWin } from './audio'

type Mode = 'pvp' | 'ai'

const TURN_MS = 5000
const AI_DELAY_MS = 450
const HUMAN = 'X' as const
const AI = 'O' as const

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'impossible', label: 'Impossible' },
]

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { id: T; label: string; icon?: ReactNode }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex w-full rounded-2xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur-md"
    >
      {options.map((o) => {
        const active = o.id === value
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={[
              'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-sm font-medium transition-all',
              active
                ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]'
                : 'text-slate-400 hover:text-slate-200',
            ].join(' ')}
          >
            {o.icon}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export default function App() {
  const [mode, setMode] = useState<Mode>('ai')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [timed, setTimed] = useState(false)
  const [muted, setMuted] = useState(false)

  // The whole position is derived from the ordered move list; undo = pop.
  const [moves, setMoves] = useState<number[]>([])
  const [scores, setScores] = useState<Scores>({ X: 0, O: 0, ties: 0 })
  const [streak, setStreak] = useState<Streak>({ player: null, count: 0 })
  const [timeLeft, setTimeLeft] = useState(TURN_MS)

  const board = useMemo(() => boardFromMoves(moves), [moves])
  const result = useMemo(() => getResult(board), [board])
  const current = playerForMove(moves.length)
  const aiThinking = mode === 'ai' && current === AI && !result
  const gameOver = result !== null

  const mutedRef = useRef(muted)
  mutedRef.current = muted
  const sfx = useCallback((fn: () => void) => {
    if (!mutedRef.current) fn()
  }, [])

  const labelX = mode === 'ai' ? 'You' : 'X'
  const labelO = mode === 'ai' ? 'AI' : 'O'

  const play = useCallback(
    (index: number) => {
      setMoves((prev) => {
        if (prev.includes(index)) return prev
        const before = getResult(boardFromMoves(prev))
        if (before) return prev
        return [...prev, index]
      })
    },
    [],
  )

  // Side effects that follow a finished game (score, streak, sound, confetti).
  // Keyed on the move count so each finished game is scored exactly once.
  const scoredFor = useRef<number>(-1)
  useEffect(() => {
    if (!result) {
      scoredFor.current = -1
      return
    }
    if (scoredFor.current === moves.length) return
    scoredFor.current = moves.length

    if (result.winner) {
      const w = result.winner
      setScores((s) => ({ ...s, [w]: s[w] + 1 }))
      setStreak((st) => ({ player: w, count: st.player === w ? st.count + 1 : 1 }))
      sfx(playWin)
      if (mode === 'pvp' || w === HUMAN) {
        const colors = w === 'X' ? ['#22d3ee', '#67e8f9', '#ffffff'] : ['#ff4d8d', '#fda4af', '#ffffff']
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.65 }, colors })
        setTimeout(
          () => confetti({ particleCount: 70, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors }),
          180,
        )
        setTimeout(
          () => confetti({ particleCount: 70, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors }),
          180,
        )
      }
    } else {
      setScores((s) => ({ ...s, ties: s.ties + 1 }))
      setStreak({ player: null, count: 0 })
      sfx(playDraw)
    }
  }, [result, moves.length, mode, sfx])

  // Tap sound for every newly placed marker (human, AI, or timeout move).
  const lastCount = useRef(0)
  useEffect(() => {
    if (moves.length > lastCount.current && moves.length > 0) {
      const placedBy = playerForMove(moves.length - 1)
      // The finishing move gets the win/draw sound instead of the tap.
      if (!getResult(boardFromMoves(moves))) sfx(() => playTap(placedBy))
    }
    lastCount.current = moves.length
  }, [moves, sfx])

  // AI turn.
  useEffect(() => {
    if (!aiThinking) return
    const id = setTimeout(() => {
      const idx = chooseMove(board, AI, difficulty)
      play(idx)
    }, AI_DELAY_MS)
    return () => clearTimeout(id)
  }, [aiThinking, board, difficulty, play])

  // Speed run: 5 seconds per human turn, a random move is played on timeout.
  const playRef = useRef(play)
  playRef.current = play
  const boardRef = useRef(board)
  boardRef.current = board
  const timerActive = timed && !gameOver && !aiThinking
  useEffect(() => {
    if (!timerActive) return
    const deadline = Date.now() + TURN_MS
    let lastWholeSecond = Math.ceil(TURN_MS / 1000)
    setTimeLeft(TURN_MS)
    const id = setInterval(() => {
      const left = deadline - Date.now()
      if (left <= 0) {
        clearInterval(id)
        setTimeLeft(0)
        const options = emptyCells(boardRef.current)
        if (options.length) playRef.current(options[Math.floor(Math.random() * options.length)])
        return
      }
      setTimeLeft(left)
      const whole = Math.ceil(left / 1000)
      if (whole !== lastWholeSecond && whole <= 2) sfx(playTick)
      lastWholeSecond = whole
    }, 100)
    return () => clearInterval(id)
  }, [timerActive, moves.length, sfx])

  const newGame = useCallback(() => setMoves([]), [])

  const resetScores = () => {
    setScores({ X: 0, O: 0, ties: 0 })
    setStreak({ player: null, count: 0 })
  }

  const changeMode = (m: Mode) => {
    if (m === mode) return
    setMode(m)
    setMoves([])
    resetScores()
  }

  const canUndo = !timed && !gameOver && moves.length > 0 && !aiThinking
  const undo = () => {
    if (!canUndo) return
    setMoves((prev) => {
      // Against the AI, roll back to the human's previous turn (AI move + human move).
      const drop = mode === 'ai' ? Math.min(2, prev.length) : 1
      return prev.slice(0, prev.length - drop)
    })
  }

  const statusText = result
    ? result.winner
      ? mode === 'ai'
        ? result.winner === HUMAN
          ? 'You win!'
          : 'AI wins'
        : `${result.winner} wins!`
      : "It's a draw"
    : aiThinking
      ? 'AI is thinking…'
      : mode === 'ai'
        ? 'Your turn'
        : `${current}'s turn`

  const statusColor = result
    ? result.winner === 'X'
      ? 'text-neon-cyan'
      : result.winner === 'O'
        ? 'text-neon-coral'
        : 'text-slate-300'
    : current === 'X'
      ? 'text-neon-cyan'
      : 'text-neon-coral'

  const timePct = Math.max(0, Math.min(100, (timeLeft / TURN_MS) * 100))
  const urgent = timeLeft <= 2000

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center gap-5 px-4 py-8 sm:py-12">
      <header className="text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-wider sm:text-4xl">
          <span className="text-neon-cyan drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]">NEON</span>{' '}
          <span className="text-neon-coral drop-shadow-[0_0_12px_rgba(255,77,141,0.8)]">TIC-TAC-TOE</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">First to three in a row wins.</p>
      </header>

      <div className="flex w-full flex-col gap-2.5">
        <Segmented
          label="Game mode"
          value={mode}
          onChange={changeMode}
          options={[
            { id: 'pvp', label: 'Pass & Play', icon: <Users size={16} /> },
            { id: 'ai', label: 'vs AI', icon: <Bot size={16} /> },
          ]}
        />
        {mode === 'ai' && (
          <Segmented
            label="AI difficulty"
            value={difficulty}
            onChange={(d) => {
              setDifficulty(d)
              setMoves([])
            }}
            options={DIFFICULTIES}
          />
        )}
        <button
          role="switch"
          aria-checked={timed}
          onClick={() => {
            setTimed((t) => !t)
            setMoves([])
          }}
          className={[
            'flex items-center justify-between rounded-2xl border px-4 py-2.5 text-sm font-medium backdrop-blur-md transition-all',
            timed
              ? 'border-amber-300/40 bg-amber-300/10 text-amber-200'
              : 'border-white/10 bg-white/[0.04] text-slate-400 hover:text-slate-200',
          ].join(' ')}
        >
          <span className="flex items-center gap-2">
            <Timer size={16} /> Speed run · 5s per move
          </span>
          <span className="text-xs uppercase tracking-widest">{timed ? 'On' : 'Off'}</span>
        </button>
      </div>

      <Scoreboard scores={scores} streak={streak} labelX={labelX} labelO={labelO} />

      <div className="flex w-full flex-col items-center gap-3">
        <div
          aria-live="polite"
          className={`font-display text-xl font-bold tracking-wide drop-shadow-[0_0_10px_currentColor] ${statusColor}`}
        >
          {statusText}
        </div>

        {timed && (
          <div className="h-1.5 w-full max-w-[420px] overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div
              className={`h-full rounded-full transition-[width] duration-100 ease-linear ${
                urgent && timerActive ? 'pulse-bar bg-rose-400' : 'bg-amber-300'
              }`}
              style={{ width: `${gameOver || aiThinking ? 100 : timePct}%` }}
            />
          </div>
        )}

        <Board
          board={board}
          line={result?.line ?? null}
          winner={result?.winner ?? null}
          disabled={gameOver || aiThinking}
          currentPlayer={current}
          onCellClick={(i) => play(i)}
        />
      </div>

      <div className="grid w-full max-w-[420px] grid-cols-3 gap-2.5">
        <button
          onClick={newGame}
          className="flex items-center justify-center gap-2 rounded-2xl border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-2.5 text-sm font-semibold text-neon-cyan transition hover:bg-neon-cyan/20"
        >
          <RotateCcw size={16} /> New game
        </button>
        <button
          onClick={undo}
          disabled={!canUndo}
          title={timed ? 'Undo is disabled in speed run mode' : 'Undo last move'}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Undo2 size={16} /> Undo
        </button>
        <button
          onClick={resetScores}
          className="flex items-center justify-center gap-2 rounded-2xl border border-neon-coral/40 bg-neon-coral/10 px-3 py-2.5 text-sm font-semibold text-neon-coral transition hover:bg-neon-coral/20"
        >
          <Trash2 size={16} /> Reset scores
        </button>
      </div>

      <footer className="mt-auto pb-12 pt-4 text-center text-xs text-slate-500">
        Designed &amp; developed by{' '}
        <a
          href="https://github.com/AdarshSingh2508"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-slate-300 underline decoration-neon-cyan/50 underline-offset-4 transition hover:text-neon-cyan"
        >
          Adarsh Singh
        </a>
      </footer>

      <button
        onClick={() => setMuted((m) => !m)}
        aria-pressed={muted}
        aria-label={muted ? 'Unmute sound' : 'Mute sound'}
        className="fixed bottom-5 right-5 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-slate-900/70 text-slate-200 shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-slate-800"
      >
        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </div>
  )
}
