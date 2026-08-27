/** Pad Fall — frog-themed stacking puzzle for pattern recognition. */

export type PadColor = 'mint' | 'sky' | 'gold' | 'violet' | 'coral';

export type PieceKind = 'I' | 'O' | 'T' | 'L' | 'J' | 'S' | 'Z';

export interface Cell {
  color: PadColor;
}

export interface QueuedPiece {
  kind: PieceKind;
  color: PadColor;
}

export interface ActivePiece extends QueuedPiece {
  /** Grid column of the piece origin (top-left of its 4×4 box). */
  x: number;
  /** Grid row of the piece origin. */
  y: number;
  rotation: 0 | 1 | 2 | 3;
}

export interface ClearPulse {
  /** Cells that just vanished (for a brief flash). */
  cells: Array<{ x: number; y: number }>;
  /** How many cascade steps deep this clear was (1 = first). */
  chain: number;
  kind: 'row' | 'match';
}

export interface PadState {
  cols: number;
  rows: number;
  /** Row-major board; null = empty. */
  board: Array<Cell | null>;
  active: ActivePiece | null;
  /** Always length 5 while playing. */
  queue: QueuedPiece[];
  hold: QueuedPiece | null;
  holdLocked: boolean;
  score: number;
  lines: number;
  matches: number;
  level: number;
  paused: boolean;
  over: boolean;
  /** Soft-drop / gravity tick ms at the current level. */
  gravityMs: number;
  lastClear: ClearPulse | null;
}

export const PAD_COLS = 10;
export const PAD_ROWS = 20;
export const QUEUE_LEN = 5;
/** Same-colour cluster size that splashes away. */
export const MATCH_MIN = 5;
/** The five pond colours used on every piece. */
export const PAD_COLORS: PadColor[] = ['mint', 'sky', 'gold', 'violet', 'coral'];
