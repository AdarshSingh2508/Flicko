import type { Board as BoardType, Player } from '../game/logic'
import { Mark } from './Marks'

interface Props {
  board: BoardType
  line: readonly [number, number, number] | null
  winner: Player | null
  disabled: boolean
  currentPlayer: Player
  onCellClick: (index: number) => void
}

const center = (i: number) => ({ x: (i % 3) * 100 + 50, y: Math.floor(i / 3) * 100 + 50 })

export function Board({ board, line, winner, disabled, currentPlayer, onCellClick }: Props) {
  const hoverColor =
    currentPlayer === 'X' ? 'hover:bg-neon-cyan/10' : 'hover:bg-neon-coral/10'

  let strike: { x1: number; y1: number; x2: number; y2: number } | null = null
  if (line) {
    const a = center(line[0])
    const b = center(line[2])
    // Extend slightly past the end cells so the strike clearly spans the row.
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    const ext = 28
    strike = {
      x1: a.x - (dx / len) * ext,
      y1: a.y - (dy / len) * ext,
      x2: b.x + (dx / len) * ext,
      y2: b.y + (dy / len) * ext,
    }
  }
  const strikeColor = winner === 'X' ? '#22d3ee' : '#ff4d8d'

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      <div
        role="grid"
        aria-label="Tic-Tac-Toe board"
        className="grid h-full w-full grid-cols-3 grid-rows-3 gap-2.5 rounded-3xl border border-white/10 bg-white/[0.04] p-3 shadow-[0_0_60px_-15px_rgba(34,211,238,0.35)] backdrop-blur-xl sm:gap-3 sm:p-4"
      >
        {board.map((cell, i) => {
          const inWin = line?.includes(i) ?? false
          const dim = line !== null && !inWin
          return (
            <button
              key={i}
              role="gridcell"
              aria-label={`Cell ${i + 1}${cell ? `, ${cell}` : ', empty'}`}
              disabled={disabled || cell !== null}
              onClick={() => onCellClick(i)}
              className={[
                'flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900/60 transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                cell === null && !disabled ? `cursor-pointer ${hoverColor}` : 'cursor-default',
                dim ? 'opacity-40' : 'opacity-100',
              ].join(' ')}
            >
              {cell && <Mark player={cell} />}
            </button>
          )
        })}
      </div>

      {strike && (
        <svg
          viewBox="0 0 300 300"
          className="pointer-events-none absolute inset-0 h-full w-full p-3 sm:p-4"
          style={{ filter: `drop-shadow(0 0 10px ${strikeColor})` }}
          aria-hidden="true"
        >
          <line
            {...strike}
            pathLength={1}
            stroke={strikeColor}
            strokeWidth="7"
            strokeLinecap="round"
            className="win-line"
          />
        </svg>
      )}
    </div>
  )
}
