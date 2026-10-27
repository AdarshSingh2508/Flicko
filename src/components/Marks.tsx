import type { Player } from '../game/logic'

/** The two inks. X prints in cobalt, O in orange. */
export const INK: Record<Player, string> = {
  X: '#2742F5',
  O: '#E8530A',
}

// Slightly curved, hand-drawn strokes (not perfect geometry).
const X_STROKES = ['M24 22 C 38 38, 60 62, 77 79', 'M77 21 C 62 38, 40 62, 23 78']
const O_STROKES = ['M58 20 C 82 22, 86 58, 72 76 C 58 92, 26 84, 21 58 C 17 34, 38 20, 56 21']

function Strokes({ player, animate }: { player: Player; animate: boolean }) {
  const paths = player === 'X' ? X_STROKES : O_STROKES
  return (
    <>
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength={1}
          fill="none"
          stroke={INK[player]}
          strokeWidth={10}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animate ? (i === 1 ? 'mark-draw mark-draw-2' : 'mark-draw') : undefined}
        />
      ))}
    </>
  )
}

/**
 * A printed mark. A paler copy sits a few pixels off-register underneath and the
 * layers multiply, so the ink looks overprinted, like a two-colour print run.
 */
export function Mark({ player, ghost = false }: { player: Player; ghost?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-[72%] w-[72%] overflow-visible"
      style={{ mixBlendMode: 'multiply' }}
      role="img"
      aria-label={player}
    >
      <g transform="translate(3 2.5)" opacity={0.38}>
        <Strokes player={player} animate={!ghost} />
      </g>
      <g>
        <Strokes player={player} animate={!ghost} />
      </g>
    </svg>
  )
}

/** Small static X or O used as a player label. */
export function Glyph({ player, size = 28 }: { player: Player; size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className="shrink-0">
      <Strokes player={player} animate={false} />
    </svg>
  )
}
