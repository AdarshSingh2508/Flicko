import type { Player } from '../game/logic'
import type { Scores, Streak } from '../components/Scoreboard'

/**
 * The host owns the game. It sends the full state after every change, and the
 * guest only ever sends the cell it wants to play.
 */
export interface SyncState {
  moves: number[]
  first: Player
  round: number
  scores: Scores
  streak: Streak
}

export type NetMessage = { t: 'move'; i: number } | { t: 'state'; s: SyncState }

const isCell = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 8
const isPlayer = (p: unknown): p is Player => p === 'X' || p === 'O'
const isCount = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 9999

/** Anything arriving over the wire is untrusted: check its shape before using it. */
export function parseMessage(raw: unknown): NetMessage | null {
  if (typeof raw !== 'object' || raw === null) return null
  const m = raw as Record<string, unknown>

  if (m.t === 'move') return isCell(m.i) ? { t: 'move', i: m.i } : null

  if (m.t === 'state') {
    if (typeof m.s !== 'object' || m.s === null) return null
    const s = m.s as Record<string, unknown>
    const { moves, first, round, scores, streak } = s

    if (!Array.isArray(moves) || moves.length > 9 || !moves.every(isCell)) return null
    if (new Set(moves).size !== moves.length) return null
    if (!isPlayer(first) || !isCount(round)) return null

    if (typeof scores !== 'object' || scores === null) return null
    const sc = scores as Record<string, unknown>
    if (!isCount(sc.X) || !isCount(sc.O) || !isCount(sc.ties)) return null

    if (typeof streak !== 'object' || streak === null) return null
    const st = streak as Record<string, unknown>
    if (!(st.player === null || isPlayer(st.player)) || !isCount(st.count)) return null

    return {
      t: 'state',
      s: {
        moves: [...moves],
        first,
        round,
        scores: { X: sc.X, O: sc.O, ties: sc.ties },
        streak: { player: st.player, count: st.count },
      },
    }
  }

  return null
}

export const CODE_LENGTH = 4
export const isValidCode = (c: string): boolean => /^\d{4}$/.test(c)

export function randomCode(): string {
  const n = new Uint32Array(1)
  crypto.getRandomValues(n)
  return String(n[0] % 10000).padStart(CODE_LENGTH, '0')
}

// The public PeerJS broker is shared by everyone, so the game code is
// namespaced to keep it from colliding with other apps' ids.
export const peerIdFor = (code: string): string => `flicko-ttt-${code}`
