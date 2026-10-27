import { Flame } from 'lucide-react'
import type { Player } from '../game/logic'

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

function Tile({ label, value, tone }: { label: string; value: number; tone: 'cyan' | 'coral' | 'slate' }) {
  const color =
    tone === 'cyan'
      ? 'text-neon-cyan border-neon-cyan/30 shadow-glowCyan/20'
      : tone === 'coral'
        ? 'text-neon-coral border-neon-coral/30 shadow-glowCoral/20'
        : 'text-slate-300 border-white/10'
  return (
    <div className={`rounded-2xl border bg-white/[0.04] px-3 py-2.5 text-center backdrop-blur-md ${color}`}>
      <div className="text-[11px] font-medium uppercase tracking-widest opacity-80">{label}</div>
      <div className="font-display text-2xl font-extrabold tabular-nums">{value}</div>
    </div>
  )
}

export function Scoreboard({ scores, streak, labelX, labelO }: Props) {
  return (
    <section aria-label="Scoreboard" className="w-full">
      <div className="grid grid-cols-3 gap-2.5">
        <Tile label={`${labelX} wins`} value={scores.X} tone="cyan" />
        <Tile label="Ties" value={scores.ties} tone="slate" />
        <Tile label={`${labelO} wins`} value={scores.O} tone="coral" />
      </div>
      <div className="mt-2.5 flex items-center justify-center gap-2 text-sm text-slate-400">
        <Flame
          size={16}
          className={streak.count > 1 ? (streak.player === 'X' ? 'text-neon-cyan' : 'text-neon-coral') : 'text-slate-500'}
        />
        {streak.count > 0 && streak.player ? (
          <span>
            Streak:{' '}
            <strong className={streak.player === 'X' ? 'text-neon-cyan' : 'text-neon-coral'}>
              {streak.player === 'X' ? labelX : labelO} ×{streak.count}
            </strong>
          </span>
        ) : (
          <span>No active streak</span>
        )}
      </div>
    </section>
  )
}
