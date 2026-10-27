import { type Board, type Player, emptyCells, getResult, LINES } from './logic'

export type Difficulty = 'easy' | 'medium' | 'impossible'

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]

/** Find a cell that completes a line for `player`, if any. */
function findWinningCell(board: Board, player: Player): number | null {
  for (const [a, b, c] of LINES) {
    const cells = [a, b, c]
    const mine = cells.filter((i) => board[i] === player).length
    const empty = cells.filter((i) => board[i] === null)
    if (mine === 2 && empty.length === 1) return empty[0]
  }
  return null
}

function easyMove(board: Board): number {
  return pick(emptyCells(board))
}

/**
 * Medium: takes a win or blocks a win most of the time (85%),
 * otherwise plays randomly, so it can be beaten.
 */
function mediumMove(board: Board, me: Player): number {
  const opp: Player = me === 'X' ? 'O' : 'X'
  if (Math.random() < 0.85) {
    const win = findWinningCell(board, me)
    if (win !== null) return win
    const block = findWinningCell(board, opp)
    if (block !== null) return block
  }
  return pick(emptyCells(board))
}

/** Classic minimax with alpha-beta pruning. Prefers faster wins and slower losses. */
function minimax(
  board: Board,
  turn: Player,
  me: Player,
  depth: number,
  alpha: number,
  beta: number,
): number {
  const result = getResult(board)
  if (result) {
    if (result.winner === me) return 10 - depth
    if (result.winner) return depth - 10
    return 0
  }
  const maximizing = turn === me
  let best = maximizing ? -Infinity : Infinity
  for (const i of emptyCells(board)) {
    board[i] = turn
    const score = minimax(board, turn === 'X' ? 'O' : 'X', me, depth + 1, alpha, beta)
    board[i] = null
    if (maximizing) {
      best = Math.max(best, score)
      alpha = Math.max(alpha, best)
    } else {
      best = Math.min(best, score)
      beta = Math.min(beta, best)
    }
    if (beta <= alpha) break
  }
  return best
}

function impossibleMove(board: Board, me: Player): number {
  const empties = emptyCells(board)
  // Opening move: every cell is a draw at worst, so vary between corners/center.
  if (empties.length === 9) return pick([0, 2, 4, 6, 8])

  const work = [...board]
  let bestScore = -Infinity
  let bestMoves: number[] = []
  for (const i of empties) {
    work[i] = me
    const score = minimax(work, me === 'X' ? 'O' : 'X', me, 1, -Infinity, Infinity)
    work[i] = null
    if (score > bestScore) {
      bestScore = score
      bestMoves = [i]
    } else if (score === bestScore) {
      bestMoves.push(i)
    }
  }
  return pick(bestMoves)
}

export function chooseMove(board: Board, me: Player, difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':
      return easyMove(board)
    case 'medium':
      return mediumMove(board, me)
    case 'impossible':
      return impossibleMove(board, me)
  }
}
