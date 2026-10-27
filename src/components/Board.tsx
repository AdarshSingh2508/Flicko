import type { Board as BoardType, Player } from '../game/logic'
import { INK, Mark } from './Marks'

interface Props {
  board: BoardType
  line: readonly [number, number, number] | null
  winner: Player | null
  disabled: boolean
  currentPlayer: Player
  /** Changes every round, so the grid is printed again from scratch. */
  round: number
  onCellClick: (index: number) => void
}

// The four lines of the classic # grid, each with a slight wobble.
const GRID = [
  'M100 12 C 101 90, 99 210, 100 288',
  'M200 12 C 199 90, 201 210, 200 288',
  'M12 100 C 90 101, 210 99, 288 100',
  'M12 200 C 90 199, 210 201, 288 200',
]

const center = (i: number) => ({ x: (i % 3) * 100 + 50, y: Math.floor(i / 3) * 100 + 50 })

function strikePath(line: readonly [number, number, number]): string {
  const a = center(line[0])
  const b = center(line[2])
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const ext = 30
  const x1 = a.x - (dx / len) * ext
  const y1 = a.y - (dy / len) * ext
  const x2 = b.x + (dx / len) * ext
  const y2 = b.y + (dy / len) * ext
  // Pull the middle of the stroke sideways a little so it looks drawn, not ruled.
  const cx = (x1 + x2) / 2 + (-dy / len) * 6
  const cy = (y1 + y2) / 2 + (dx / len) * 6
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
}

export function Board({ board, line, winner, disabled, currentPlayer, round, onCellClick }: Props) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[34rem]">
      <svg
        key={round}
        viewBox="0 0 300 300"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {GRID.map((d, i) => (
          <path
            key={i}
            d={d}
            pathLength={1}
            fill="none"
            stroke="#1A2250"
            strokeWidth={6}
            strokeLinecap="round"
            className="grid-draw"
            style={{ animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </svg>

      <div role="group" aria-label="Tic-Tac-Toe board" className="absolute inset-0 grid grid-cols-3 grid-rows-3">
        {board.map((cell, i) => {
          const inWin = line?.includes(i) ?? false
          const dim = line !== null && !inWin
          const open = cell === null && !disabled
          return (
            <button
              key={i}
              aria-label={`Cell ${i + 1}, ${cell ?? 'empty'}`}
              disabled={!open}
              onClick={() => onCellClick(i)}
              className={[
                'group relative flex items-center justify-center transition-opacity duration-300',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink',
                open ? 'cursor-pointer' : 'cursor-default',
                dim ? 'opacity-30' : 'opacity-100',
              ].join(' ')}
            >
              {cell && <Mark player={cell} />}
              {open && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-25 group-focus-visible:opacity-25">
                  <Mark player={currentPlayer} ghost />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {line && winner && (
        <svg
          key={`win-${round}`}
          viewBox="0 0 300 300"
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ mixBlendMode: 'multiply' }}
          aria-hidden="true"
        >
          <path
            d={strikePath(line)}
            pathLength={1}
            fill="none"
            stroke={INK[winner]}
            strokeWidth={9}
            strokeLinecap="round"
            opacity={0.88}
            className="win-line"
          />
        </svg>
      )}
    </div>
  )
}
