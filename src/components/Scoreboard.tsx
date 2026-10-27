import type { ReactNode } from 'react'
import type { Player } from '../game/logic'
import { Glyph } from './Marks'

export interface Scores {
  X: number
  O: number
  ties: number
}

export interface Streak {
  player: Player | null
  count: number
}

interface Props {
  scores: Scores
  streak: Streak
  labelX: string
  labelO: string
}

const MAX_SHOWN = 20

/** Tally marks: four strokes and a slash per group of five. */
function Tally({ count, color }: { count: number; color: string }) {
  const shown = Math.min(count, MAX_SHOWN)
  const groups = Math.floor(shown / 5)
  const rest = shown % 5
  const bars = (n: number, slash: boolean, key: string) => (
    <svg key={key} width={34} height={30} viewBox="0 0 34 30" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <line key={i} x1={4 + i * 8} y1={3} x2={4 + i * 8} y2={27} stroke={color} strokeWidth={3} strokeLinecap="round" />
      ))}
      {slash && <line x1={1} y1={24} x2={33} y2={6} stroke={color} strokeWidth={3} strokeLinecap="round" />}
    </svg>
  )
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      {Array.from({ length: groups }, (_, g) => bars(4, true, `g${g}`))}
      {rest > 0 && bars(rest, false, 'rest')}
      {count > MAX_SHOWN && <span className="text-sm font-semibold text-ink-soft">+{count - MAX_SHOWN}</span>}
    </div>
  )
}

function Row({ glyph, name, value, color }: { glyph: ReactNode; name: string; value: number; color: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 border-b-2 border-ink/15 pb-3">
      <div className="flex items-center gap-2">
        {glyph}
        <span className="text-lg font-bold">{name}</span>
      </div>
      <div className="min-h-[30px]">
        <Tally count={value} color={color} />
      </div>
      <span className="min-w-[2ch] text-right text-4xl font-extrabold tabular-nums leading-none">{value}</span>
    </div>
  )
}

export function Scoreboard({ scores, streak, labelX, labelO }: Props) {
  const who = streak.player === 'X' ? labelX : labelO
  const verb = who === 'You' ? 'have' : 'has'
  return (
    <section aria-label="Scoreboard" className="flex flex-col gap-3">
      <Row glyph={<Glyph player="X" />} name={labelX} value={scores.X} color="#2742F5" />
      <Row glyph={<Glyph player="O" />} name={labelO} value={scores.O} color="#E8530A" />
      <Row glyph={null} name="Draws" value={scores.ties} color="#5B6384" />
      <p className="min-h-[1.5rem] text-sm font-medium text-ink-soft">
        {streak.player && streak.count >= 2 ? `${who} ${verb} won ${streak.count} in a row.` : 'Win two in a row to start a streak.'}
      </p>
    </section>
  )
}
