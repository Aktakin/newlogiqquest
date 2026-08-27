import type { PieceKind } from './types';

/** Local 4×4 matrices for rotation 0 of each tetromino. */
const SHAPES: Record<PieceKind, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  T: [
    [0, 1, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  L: [
    [0, 0, 1, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  S: [
    [0, 1, 1, 0],
    [1, 1, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  Z: [
    [1, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
};

export const PIECE_KINDS: PieceKind[] = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];

/** Rotate a 4×4 matrix clockwise `times` times. */
export function rotateMatrix(matrix: number[][], times: number): number[][] {
  let current = matrix.map((row) => [...row]);
  const n = ((times % 4) + 4) % 4;
  for (let t = 0; t < n; t += 1) {
    const next: number[][] = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 4; x += 1) {
        next[x]![3 - y] = current[y]![x]!;
      }
    }
    current = next;
  }
  return current;
}

export function shapeCells(
  kind: PieceKind,
  rotation: 0 | 1 | 2 | 3,
): Array<{ dx: number; dy: number }> {
  const matrix = rotateMatrix(SHAPES[kind], rotation);
  const cells: Array<{ dx: number; dy: number }> = [];
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 4; x += 1) {
      if (matrix[y]![x]) cells.push({ dx: x, dy: y });
    }
  }
  return cells;
}

/** Preview matrix for queue thumbnails (rotation 0). */
export function previewMatrix(kind: PieceKind): number[][] {
  return SHAPES[kind].map((row) => [...row]);
}
