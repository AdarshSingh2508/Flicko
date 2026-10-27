export type Player = 'X' | 'O'
export type Cell = Player | null
export type Board = Cell[]

export const LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

export interface Result {
  winner: Player | null
  line: readonly [number, number, number] | null
  draw: boolean
}

export function getResult(board: Board): Result | null {
  for (const line of LINES) {
    const [a, b, c] = line
    const v = board[a]
    if (v && v === board[b] && v === board[c]) {
      return { winner: v, line, draw: false }
    }
  }
  if (board.every((c) => c !== null)) return { winner: null, line: null, draw: true }
  return null
}

export const emptyCells = (board: Board): number[] =>
  board.reduce<number[]>((acc, c, i) => (c === null ? [...acc, i] : acc), [])

/** Rebuild a board from an ordered list of moves (X always starts). */
export function boardFromMoves(moves: readonly number[]): Board {
  const board: Board = Array<Cell>(9).fill(null)
  moves.forEach((idx, i) => {
    board[idx] = i % 2 === 0 ? 'X' : 'O'
  })
  return board
}

export const playerForMove = (moveCount: number): Player => (moveCount % 2 === 0 ? 'X' : 'O')
