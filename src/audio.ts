/**
 * Synthesized sound effects via the Web Audio API.
 * No audio files are loaded, so nothing can fail to fetch.
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!ctx) ctx = new Ctor()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  freqEnd?: number,
) {
  const c = getCtx()
  if (!c) return
  const t0 = c.currentTime + start
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + duration)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

/** Crisp tap: short, slightly different pitch for X and O. */
export function playTap(player: 'X' | 'O') {
  tone(player === 'X' ? 880 : 660, 0, 0.09, 'triangle', 0.25, player === 'X' ? 520 : 400)
}

/** High-pitched ascending chime (C6, E6, G6, C7). */
export function playWin() {
  const notes = [1046.5, 1318.5, 1568, 2093]
  notes.forEach((f, i) => tone(f, i * 0.11, 0.35, 'sine', 0.22))
}

/** Low buzz for a draw. */
export function playDraw() {
  tone(110, 0, 0.32, 'sawtooth', 0.16)
  tone(104, 0, 0.32, 'square', 0.08)
}

/** Soft tick for the last seconds of a timed turn. */
export function playTick() {
  tone(1200, 0, 0.04, 'square', 0.06)
}
