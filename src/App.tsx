import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import confetti from 'canvas-confetti'
import { Bot, Eraser, Globe, LogOut, Timer, Undo2, Users, Volume2, VolumeX } from 'lucide-react'
import { Board } from './components/Board'
import { Lobby } from './components/Lobby'
import { Glyph } from './components/Marks'
import { Scoreboard, type Scores, type Streak } from './components/Scoreboard'
import { chooseMove, type Difficulty } from './game/ai'
import { boardFromMoves, emptyCells, getResult, otherPlayer, playerForMove, type Player } from './game/logic'
import { type NetMessage, isValidCode } from './net/protocol'
import { useOnline } from './net/useOnline'
import { playDraw, playTap, playTick, playWin } from './audio'

type Mode = 'pvp' | 'ai' | 'online'

const TURN_MS = 5000
const AI_DELAY_MS = 450
// How long a finished round stays on screen before the board prints a fresh one.
const RESET_AFTER_WIN_MS = 3000
const RESET_AFTER_DRAW_MS = 2200
const HUMAN: Player = 'X'
const AI: Player = 'O'

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'impossible', label: 'Impossible' },
]

const SHADOW = 'shadow-[3px_3px_0_0_#1A2250]'
const PRESS = 'active:translate-x-[3px] active:translate-y-[3px] active:shadow-none'

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
      className={`flex w-full overflow-hidden rounded-md border-2 border-ink bg-paper ${SHADOW}`}
    >
      {options.map((o, i) => {
        const active = o.id === value
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={[
              'flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-sm font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cobalt',
              i > 0 ? 'border-l-2 border-ink' : '',
              active ? 'bg-ink text-paper' : 'text-ink hover:bg-ink/10',
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

  // The position is derived from the ordered move list; undo = drop moves.
  const [moves, setMoves] = useState<number[]>([])
  // Who opens the round. It alternates so neither side always moves first.
  const [first, setFirst] = useState<Player>('X')
  // Bumps every round so the grid and marks are printed again.
  const [round, setRound] = useState(0)
  const [scores, setScores] = useState<Scores>({ X: 0, O: 0, ties: 0 })
  const [streak, setStreak] = useState<Streak>({ player: null, count: 0 })
  const [timeLeft, setTimeLeft] = useState(TURN_MS)

  // Latest values for code that runs outside React's render (network events, timers).
  const movesRef = useRef(moves)
  movesRef.current = moves
  const firstRef = useRef(first)
  firstRef.current = first
  const roleRef = useRef<'host' | 'guest' | null>(null)
  const guestMoveRef = useRef<(i: number) => void>(() => {})

  // ---- Online ----------------------------------------------------------------
  // The host owns the game and sends its full state after every change.
  // The guest shows that state and only asks the host to play a cell.
  const handleMessage = useCallback((m: NetMessage) => {
    if (m.t === 'state' && roleRef.current === 'guest') {
      setMoves(m.s.moves)
      setFirst(m.s.first)
      setRound(m.s.round)
      setScores(m.s.scores)
      setStreak(m.s.streak)
    } else if (m.t === 'move' && roleRef.current === 'host') {
      guestMoveRef.current(m.i)
    }
  }, [])
  const net = useOnline(handleMessage)

  const isOnline = mode === 'online'
  const isGuest = isOnline && net.role === 'guest'
  const isHost = isOnline && net.role === 'host'
  roleRef.current = isOnline ? net.role : null
  // Online, the host is always X and the guest is always O.
  const me: Player = isGuest ? 'O' : HUMAN
  const connected = !isOnline || net.status === 'connected'
  const waitingOnline = isOnline && net.status !== 'connected'
  const timedOn = timed && !isOnline

  const board = useMemo(() => boardFromMoves(moves, first), [moves, first])
  const result = useMemo(() => getResult(board), [board])
  const current = playerForMove(moves.length, first)
  const aiThinking = mode === 'ai' && current === AI && !result
  const gameOver = result !== null
  const resetMs = result?.winner ? RESET_AFTER_WIN_MS : RESET_AFTER_DRAW_MS

  const mutedRef = useRef(muted)
  mutedRef.current = muted
  const sfx = useCallback((fn: () => void) => {
    if (!mutedRef.current) fn()
  }, [])

  const labelX = mode === 'ai' ? 'You' : isOnline ? (me === 'X' ? 'You' : 'Friend') : 'X'
  const labelO = mode === 'ai' ? 'AI' : isOnline ? (me === 'O' ? 'You' : 'Friend') : 'O'

  // `as` lets the host check that a move from the guest really is the guest's turn.
  const play = useCallback(
    (index: number, as?: Player) => {
      setMoves((prev) => {
        if (prev.includes(index)) return prev
        if (getResult(boardFromMoves(prev, first))) return prev
        if (as && playerForMove(prev.length, first) !== as) return prev
        return [...prev, index]
      })
    },
    [first],
  )

  guestMoveRef.current = (i: number) => {
    const b = boardFromMoves(movesRef.current, firstRef.current)
    if (getResult(b) || b[i] !== null) return
    play(i, 'O')
  }

  // Start the next round: clear the board and swap who opens.
  const nextRound = useCallback(() => {
    setMoves([])
    setFirst((f) => otherPlayer(f))
    setRound((r) => r + 1)
  }, [])

  // Start over with the default opener (used when the settings change).
  const restart = useCallback(() => {
    setMoves([])
    setFirst('X')
    setRound((r) => r + 1)
  }, [])

  const resetScores = useCallback(() => {
    setScores({ X: 0, O: 0, ties: 0 })
    setStreak({ player: null, count: 0 })
  }, [])

  // The board resets itself a moment after someone wins or the round is drawn.
  // Online, only the host does this; the guest receives the fresh board.
  useEffect(() => {
    if (!gameOver || isGuest) return
    const id = setTimeout(nextRound, resetMs)
    return () => clearTimeout(id)
  }, [gameOver, isGuest, moves.length, resetMs, nextRound])

  // Sound and confetti for a finished round, once per round, on both sides.
  const celebratedFor = useRef<number>(-1)
  useEffect(() => {
    if (!result) {
      celebratedFor.current = -1
      return
    }
    if (celebratedFor.current === moves.length) return
    celebratedFor.current = moves.length

    if (result.winner) {
      const w = result.winner
      sfx(playWin)
      if (mode === 'pvp' || w === me) {
        const colors = w === 'X' ? ['#2742F5', '#1A2250', '#8FA0FF'] : ['#E8530A', '#1A2250', '#FFB28A']
        confetti({ particleCount: 110, spread: 80, origin: { y: 0.65 }, colors })
        setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors }), 180)
        setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors }), 180)
      }
    } else {
      sfx(playDraw)
    }
  }, [result, moves.length, mode, me, sfx])

  // Score and streak for a finished round, exactly once. A guest never scores:
  // it receives the host's numbers.
  const scoredFor = useRef<number>(-1)
  useEffect(() => {
    if (!result) {
      scoredFor.current = -1
      return
    }
    if (isGuest || scoredFor.current === moves.length) return
    scoredFor.current = moves.length

    if (result.winner) {
      const w = result.winner
      setScores((s) => ({ ...s, [w]: s[w] + 1 }))
      setStreak((st) => ({ player: w, count: st.player === w ? st.count + 1 : 1 }))
    } else {
      setScores((s) => ({ ...s, ties: s.ties + 1 }))
      setStreak({ player: null, count: 0 })
    }
  }, [result, isGuest, moves.length])

  // The host sends the whole game to the guest after every change.
  useEffect(() => {
    if (!isHost || net.status !== 'connected') return
    net.send({ t: 'state', s: { moves, first, round, scores, streak } })
  }, [isHost, net.status, net.send, moves, first, round, scores, streak])

  // Tap sound for every newly placed mark (yours, the AI's, a friend's, or a timeout move).
  const lastCount = useRef(0)
  useEffect(() => {
    if (moves.length > lastCount.current && moves.length > 0) {
      const placedBy = playerForMove(moves.length - 1, first)
      // The finishing move gets the win or draw sound instead of the tap.
      if (!getResult(boardFromMoves(moves, first))) sfx(() => playTap(placedBy))
    }
    lastCount.current = moves.length
  }, [moves, first, sfx])

  // AI turn.
  useEffect(() => {
    if (!aiThinking) return
    const id = setTimeout(() => {
      play(chooseMove(board, AI, difficulty))
    }, AI_DELAY_MS)
    return () => clearTimeout(id)
  }, [aiThinking, board, difficulty, play])

  // Speed run: 5 seconds per human turn; a random move is played on timeout.
  const playRef = useRef(play)
  playRef.current = play
  const boardRef = useRef(board)
  boardRef.current = board
  const timerActive = timedOn && !gameOver && !aiThinking
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

  const changeMode = (m: Mode) => {
    if (m === mode) return
    if (mode === 'online') net.leave()
    setMode(m)
    restart()
    resetScores()
  }

  const startHosting = () => {
    restart()
    resetScores()
    net.host()
  }

  const startJoining = useCallback(
    (code: string) => {
      restart()
      resetScores()
      net.join(code)
    },
    [net.join, restart, resetScores],
  )

  const leaveOnline = () => {
    net.leave()
    restart()
    resetScores()
  }

  // An invite link (?join=1234) opens the game straight into joining that code.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('join')
    if (code === null) return
    window.history.replaceState(null, '', window.location.pathname)
    if (isValidCode(code)) {
      setMode('online')
      startJoining(code)
    }
    // Runs once on load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clickCell = (i: number) => {
    if (!isOnline) return play(i)
    if (!connected || gameOver || current !== me || board[i] !== null) return
    if (isGuest) net.send({ t: 'move', i })
    else play(i, 'X')
  }

  // Undo: one move in two-player mode; your last move and everything after it against the AI.
  const lastHumanIndex = (() => {
    for (let i = moves.length - 1; i >= 0; i--) if (playerForMove(i, first) === HUMAN) return i
    return -1
  })()
  const canUndo =
    !isOnline && !timed && !gameOver && !aiThinking && (mode === 'pvp' ? moves.length > 0 : lastHumanIndex >= 0)
  const undo = () => {
    if (!canUndo) return
    setMoves((prev) => (mode === 'pvp' ? prev.slice(0, -1) : prev.slice(0, lastHumanIndex)))
  }

  const winnerName = (w: Player) =>
    mode === 'ai' ? (w === HUMAN ? 'You' : 'AI') : isOnline ? (w === me ? 'You' : 'Friend') : w
  const statusText = result
    ? result.winner
      ? winnerName(result.winner) === 'You'
        ? 'You win'
        : `${winnerName(result.winner)} wins`
      : 'Draw'
    : aiThinking
      ? 'AI is thinking'
      : mode === 'pvp'
        ? `${current}'s turn`
        : current === me
          ? 'Your turn'
          : isOnline
            ? "Friend's turn"
            : 'Your turn'

  const timePct = Math.max(0, Math.min(100, (timeLeft / TURN_MS) * 100))
  const urgent = timeLeft <= 2000 && timerActive
  const statusPlayer: Player | null = result ? result.winner : current
  const boardLocked = gameOver || aiThinking || (isOnline && (!connected || current !== me))

  const softButton = `inline-flex items-center justify-center gap-2 rounded-md border-2 border-ink bg-paper px-3.5 py-2 text-sm font-semibold ${SHADOW} ${PRESS} transition-[transform,box-shadow] hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:active:translate-x-0 disabled:active:translate-y-0`

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-5xl grid-cols-1 content-start gap-x-14 gap-y-8 px-5 py-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:py-14">
      {/* Title and settings */}
      <header className="flex flex-col gap-6 lg:col-start-1 lg:row-start-1">
        <h1 className="text-[clamp(2.6rem,11vw,4rem)] font-extrabold leading-[0.88] tracking-tight lg:text-[5.75rem]">
          tic tac toe
        </h1>

        <div className="flex flex-col gap-3">
          <Segmented
            label="Game mode"
            value={mode}
            onChange={changeMode}
            options={[
              { id: 'pvp', label: 'Local', icon: <Users size={16} /> },
              { id: 'ai', label: 'Versus AI', icon: <Bot size={16} /> },
              { id: 'online', label: 'Online', icon: <Globe size={16} /> },
            ]}
          />
          {mode === 'ai' && (
            <Segmented
              label="AI difficulty"
              value={difficulty}
              onChange={(d) => {
                setDifficulty(d)
                restart()
              }}
              options={DIFFICULTIES}
            />
          )}
          {!isOnline && (
            <button
              role="switch"
              aria-checked={timed}
              onClick={() => {
                setTimed((t) => !t)
                restart()
              }}
              className={[
                `flex items-center justify-between gap-3 rounded-md border-2 border-ink px-3.5 py-2.5 text-sm font-semibold ${SHADOW} ${PRESS} transition-[transform,box-shadow,background-color]`,
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
                timed ? 'bg-ink text-paper' : 'bg-paper hover:bg-white/60',
              ].join(' ')}
            >
              <span className="flex items-center gap-2">
                <Timer size={16} /> Speed run: 5 seconds a move
              </span>
              <span
                aria-hidden="true"
                className={`flex h-5 w-9 items-center rounded-full border-2 px-0.5 ${timed ? 'justify-end border-paper' : 'justify-start border-ink'}`}
              >
                <span className={`h-3 w-3 rounded-full ${timed ? 'bg-paper' : 'bg-ink'}`} />
              </span>
            </button>
          )}
        </div>
      </header>

      {/* The board, or the lobby while there is no friend connected */}
      <main className="flex flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-3">
        {waitingOnline ? (
          <Lobby
            status={net.status}
            code={net.code}
            error={net.error}
            onHost={startHosting}
            onJoin={startJoining}
            onLeave={leaveOnline}
          />
        ) : (
          <>
            <div className="mx-auto flex w-full max-w-[34rem] items-center justify-between gap-4">
              <div aria-live="polite" className="flex items-center gap-3 text-3xl font-extrabold leading-none sm:text-4xl">
                {statusPlayer ? <Glyph player={statusPlayer} size={34} /> : <span className="h-[34px] w-[34px]" />}
                <span>{statusText}</span>
              </div>
              <div className="flex gap-2">
                {isOnline ? (
                  <button onClick={leaveOnline} className={softButton}>
                    <LogOut size={16} /> Leave
                  </button>
                ) : (
                  <button
                    onClick={undo}
                    disabled={!canUndo}
                    title={timed ? 'Undo is off in speed run' : 'Undo your last move'}
                    className={softButton}
                  >
                    <Undo2 size={16} /> Undo
                  </button>
                )}
              </div>
            </div>

            {/* One strip: the speed-run clock while playing, the next-round bar once a round ends. */}
            <div className="mx-auto flex min-h-[2rem] w-full max-w-[34rem] items-center gap-3">
              {gameOver ? (
                <>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full border-2 border-ink">
                    <div
                      key={`reset-${round}-${moves.length}`}
                      className="reset-bar h-full bg-ink"
                      style={{ animationDuration: `${resetMs}ms` }}
                    />
                  </div>
                  {!isGuest && (
                    <button
                      onClick={nextRound}
                      className="shrink-0 rounded text-sm font-semibold underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                    >
                      Next round now
                    </button>
                  )}
                </>
              ) : timedOn ? (
                <div className="h-2.5 flex-1 overflow-hidden rounded-full border-2 border-ink" aria-hidden="true">
                  <div
                    className={`h-full transition-[width] duration-100 ease-linear ${urgent ? 'pulse-bar bg-flame' : 'bg-ink'}`}
                    style={{ width: `${aiThinking ? 100 : timePct}%` }}
                  />
                </div>
              ) : null}
            </div>

            <Board
              board={board}
              line={result?.line ?? null}
              winner={result?.winner ?? null}
              disabled={boardLocked}
              currentPlayer={current}
              round={round}
              onCellClick={clickCell}
            />
          </>
        )}
      </main>

      {/* Tally */}
      <section className="lg:col-start-1 lg:row-start-2">
        <Scoreboard scores={scores} streak={streak} labelX={labelX} labelO={labelO} />
        {!isGuest && (
          <button onClick={resetScores} className={`${softButton} mt-5`}>
            <Eraser size={16} /> Clear scores
          </button>
        )}
      </section>

      <footer className="pb-14 text-sm text-ink-soft lg:col-span-2">
        Designed and developed by{' '}
        <a
          href="https://github.com/AdarshSingh2508"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-ink underline decoration-2 underline-offset-4 hover:text-cobalt"
        >
          Adarsh Singh
        </a>
      </footer>

      <button
        onClick={() => setMuted((m) => !m)}
        aria-pressed={muted}
        aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
        className={`fixed bottom-5 right-5 z-10 flex h-12 w-12 items-center justify-center rounded-md border-2 border-ink bg-paper ${SHADOW} ${PRESS} transition-[transform,box-shadow] hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-paper`}
      >
        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </div>
  )
}
