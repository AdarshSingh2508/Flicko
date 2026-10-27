import type { Player } from '../game/logic'

/** Neon X / O glyphs drawn as SVG so they can animate and glow. */
export function Mark({ player }: { player: Player }) {
  if (player === 'X') {
    return (
      <svg
        viewBox="0 0 100 100"
        className="h-3/5 w-3/5"
        style={{ filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.9))' }}
        aria-label="X"
      >
        <line
          x1="22" y1="22" x2="78" y2="78"
          pathLength={1}
          stroke="#22d3ee" strokeWidth="11" strokeLinecap="round"
          className="mark-draw"
        />
        <line
          x1="78" y1="22" x2="22" y2="78"
          pathLength={1}
          stroke="#22d3ee" strokeWidth="11" strokeLinecap="round"
          className="mark-draw mark-draw-2"
        />
      </svg>
    )
  }
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-3/5 w-3/5"
      style={{ filter: 'drop-shadow(0 0 8px rgba(255,77,141,0.9))' }}
      aria-label="O"
    >
      <circle
        cx="50" cy="50" r="30"
        pathLength={1}
        fill="none" stroke="#ff4d8d" strokeWidth="11" strokeLinecap="round"
        className="mark-draw"
        transform="rotate(-90 50 50)"
      />
    </svg>
  )
}
