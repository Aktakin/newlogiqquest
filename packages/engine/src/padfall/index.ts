import {
  MATCH_MIN,
  PAD_COLORS,
  PAD_COLS,
  PAD_ROWS,
  QUEUE_LEN,
  type ActivePiece,
  type Cell,
  type ClearPulse,
  type PadColor,
  type PadState,
  type QueuedPiece,
} from './types';
import { PIECE_KINDS, shapeCells } from './pieces';

export * from './types';
export { PIECE_KINDS, previewMatrix, shapeCells } from './pieces';

function emptyBoard(cols = PAD_COLS, rows = PAD_ROWS): Array<Cell | null> {
  return Array.from({ length: cols * rows }, () => null);
}

function idx(x: number, y: number, cols = PAD_COLS): number {
  return y * cols + x;
}

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** 7-bag: each kind appears once before reshuffle. */
let bag: Array<(typeof PIECE_KINDS)[number]> = [];

function nextKind(): (typeof PIECE_KINDS)[number] {
  if (bag.length === 0) bag = shuffle(PIECE_KINDS);
  return bag.pop()!;
}

function makeQueued(): QueuedPiece {
  return { kind: nextKind(), color: pick(PAD_COLORS) };
}

function fillQueue(existing: QueuedPiece[] = []): QueuedPiece[] {
  const queue = [...existing];
  while (queue.length < QUEUE_LEN) queue.push(makeQueued());
  return queue;
}

function gravityFor(level: number): number {
  return Math.max(80, 800 - (level - 1) * 55);
}

function spawnFrom(queued: QueuedPiece): ActivePiece {
  return {
    ...queued,
    x: 3,
    y: 0,
    rotation: 0,
  };
}

function occupied(
  board: Array<Cell | null>,
  piece: ActivePiece,
  cols = PAD_COLS,
  rows = PAD_ROWS,
): boolean {
  for (const { dx, dy } of shapeCells(piece.kind, piece.rotation)) {
    const x = piece.x + dx;
    const y = piece.y + dy;
    if (x < 0 || x >= cols || y >= rows) return true;
    if (y < 0) continue;
    if (board[idx(x, y, cols)]) return true;
  }
  return false;
}

function lockPiece(board: Array<Cell | null>, piece: ActivePiece, cols = PAD_COLS): Array<Cell | null> {
  const next = [...board];
  for (const { dx, dy } of shapeCells(piece.kind, piece.rotation)) {
    const x = piece.x + dx;
    const y = piece.y + dy;
    if (y < 0 || y >= PAD_ROWS || x < 0 || x >= cols) continue;
    next[idx(x, y, cols)] = { color: piece.color };
  }
  return next;
}

/** Drop the active piece as far as it can go; used for ghost + hard drop. */
export function ghostY(state: PadState): number {
  if (!state.active) return 0;
  let y = state.active.y;
  while (!occupied(state.board, { ...state.active, y: y + 1 }, state.cols, state.rows)) {
    y += 1;
  }
  return y;
}

function findFullRows(board: Array<Cell | null>, cols: number, rows: number): number[] {
  const full: number[] = [];
  for (let y = 0; y < rows; y += 1) {
    let filled = true;
    for (let x = 0; x < cols; x += 1) {
      if (!board[idx(x, y, cols)]) {
        filled = false;
        break;
      }
    }
    if (filled) full.push(y);
  }
  return full;
}

/** 4-connected groups of the same colour with size >= MATCH_MIN. */
function findMatchGroups(
  board: Array<Cell | null>,
  cols: number,
  rows: number,
): Array<Array<{ x: number; y: number }>> {
  const seen = new Set<number>();
  const groups: Array<Array<{ x: number; y: number }>> = [];

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const start = idx(x, y, cols);
      const cell = board[start];
      if (!cell || seen.has(start)) continue;

      const color = cell.color;
      const stack = [{ x, y }];
      const group: Array<{ x: number; y: number }> = [];
      seen.add(start);

      while (stack.length) {
        const cur = stack.pop()!;
        group.push(cur);
        for (const [nx, ny] of [
          [cur.x + 1, cur.y],
          [cur.x - 1, cur.y],
          [cur.x, cur.y + 1],
          [cur.x, cur.y - 1],
        ] as const) {
          if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
          const ni = idx(nx, ny, cols);
          if (seen.has(ni)) continue;
          const neighbour = board[ni];
          if (!neighbour || neighbour.color !== color) continue;
          seen.add(ni);
          stack.push({ x: nx, y: ny });
        }
      }

      if (group.length >= MATCH_MIN) groups.push(group);
    }
  }

  return groups;
}

function applyGravity(board: Array<Cell | null>, cols: number, rows: number): Array<Cell | null> {
  const next = emptyBoard(cols, rows);
  for (let x = 0; x < cols; x += 1) {
    let write = rows - 1;
    for (let y = rows - 1; y >= 0; y -= 1) {
      const cell = board[idx(x, y, cols)];
      if (cell) {
        next[idx(x, write, cols)] = cell;
        write -= 1;
      }
    }
  }
  return next;
}

interface ResolveResult {
  board: Array<Cell | null>;
  scoreDelta: number;
  linesCleared: number;
  matchesCleared: number;
  lastClear: ClearPulse | null;
}

function resolveBoard(
  board: Array<Cell | null>,
  cols: number,
  rows: number,
  level: number,
): ResolveResult {
  let current = board;
  let scoreDelta = 0;
  let linesCleared = 0;
  let matchesCleared = 0;
  let chain = 0;
  let lastClear: ClearPulse | null = null;

  for (let guard = 0; guard < 40; guard += 1) {
    const fullRows = findFullRows(current, cols, rows);
    const matchGroups = findMatchGroups(current, cols, rows);

    if (fullRows.length === 0 && matchGroups.length === 0) break;

    chain += 1;
    const flash: Array<{ x: number; y: number }> = [];
    const remove = new Set<number>();

    if (fullRows.length) {
      for (const y of fullRows) {
        for (let x = 0; x < cols; x += 1) {
          flash.push({ x, y });
          remove.add(idx(x, y, cols));
        }
      }
      const lineScore = [0, 100, 300, 500, 800][fullRows.length] ?? 800;
      scoreDelta += lineScore * level * chain;
      linesCleared += fullRows.length;
    }

    if (matchGroups.length) {
      let cellCount = 0;
      for (const group of matchGroups) {
        cellCount += group.length;
        for (const cell of group) {
          remove.add(idx(cell.x, cell.y, cols));
          flash.push(cell);
        }
      }
      scoreDelta += cellCount * 40 * level * chain;
      matchesCleared += matchGroups.length;
    }

    current = current.map((cell, i) => (remove.has(i) ? null : cell));
    current = applyGravity(current, cols, rows);
    lastClear = {
      cells: flash,
      chain,
      kind: matchGroups.length ? 'match' : 'row',
    };
  }

  return { board: current, scoreDelta, linesCleared, matchesCleared, lastClear };
}

function afterLock(state: PadState, board: Array<Cell | null>): PadState {
  const resolved = resolveBoard(board, state.cols, state.rows, state.level);
  const lines = state.lines + resolved.linesCleared;
  const level = Math.max(1, Math.floor(lines / 10) + 1);
  const queue = fillQueue(state.queue);
  const nextPiece = queue.shift()!;
  const active = spawnFrom(nextPiece);
  const over = occupied(resolved.board, active, state.cols, state.rows);

  return {
    ...state,
    board: resolved.board,
    score: state.score + resolved.scoreDelta,
    lines,
    matches: state.matches + resolved.matchesCleared,
    level,
    gravityMs: gravityFor(level),
    queue: fillQueue(queue),
    active: over ? null : active,
    over,
    holdLocked: false,
    lastClear: resolved.lastClear,
  };
}

export function createPadGame(): PadState {
  bag = [];
  const queue = fillQueue();
  const first = queue.shift()!;
  const active = spawnFrom(first);
  return {
    cols: PAD_COLS,
    rows: PAD_ROWS,
    board: emptyBoard(),
    active,
    queue: fillQueue(queue),
    hold: null,
    holdLocked: false,
    score: 0,
    lines: 0,
    matches: 0,
    level: 1,
    paused: false,
    over: false,
    gravityMs: gravityFor(1),
    lastClear: null,
  };
}

function withActive(state: PadState, active: ActivePiece | null, extra: Partial<PadState> = {}): PadState {
  return { ...state, active, lastClear: null, ...extra };
}

export function togglePause(state: PadState): PadState {
  if (state.over) return state;
  return { ...state, paused: !state.paused };
}

export function moveHorizontal(state: PadState, dir: -1 | 1): PadState {
  if (!state.active || state.paused || state.over) return state;
  const next = { ...state.active, x: state.active.x + dir };
  if (occupied(state.board, next, state.cols, state.rows)) return state;
  return withActive(state, next);
}

export function rotateActive(state: PadState, dir: 1 | -1 = 1): PadState {
  if (!state.active || state.paused || state.over) return state;
  const rotation = ((((state.active.rotation + dir) % 4) + 4) % 4) as 0 | 1 | 2 | 3;
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    const next = { ...state.active, rotation, x: state.active.x + kick };
    if (!occupied(state.board, next, state.cols, state.rows)) {
      return withActive(state, next);
    }
  }
  return state;
}

export function softDrop(state: PadState): PadState {
  if (!state.active || state.paused || state.over) return state;
  const next = { ...state.active, y: state.active.y + 1 };
  if (!occupied(state.board, next, state.cols, state.rows)) {
    return withActive(state, next, { score: state.score + 1 });
  }
  return afterLock(state, lockPiece(state.board, state.active, state.cols));
}

export function hardDrop(state: PadState): PadState {
  if (!state.active || state.paused || state.over) return state;
  const y = ghostY(state);
  const dropped = { ...state.active, y };
  const distance = Math.max(0, y - state.active.y);
  return afterLock(
    { ...state, score: state.score + distance * 2 },
    lockPiece(state.board, dropped, state.cols),
  );
}

export function tickGravity(state: PadState): PadState {
  if (!state.active || state.paused || state.over) return state;
  const next = { ...state.active, y: state.active.y + 1 };
  if (!occupied(state.board, next, state.cols, state.rows)) {
    return withActive(state, next);
  }
  return afterLock(state, lockPiece(state.board, state.active, state.cols));
}

export function holdPiece(state: PadState): PadState {
  if (!state.active || state.paused || state.over || state.holdLocked) return state;
  const parking: QueuedPiece = { kind: state.active.kind, color: state.active.color };
  if (state.hold) {
    return withActive(state, spawnFrom(state.hold), { hold: parking, holdLocked: true });
  }
  const queue = [...state.queue];
  const next = queue.shift()!;
  return withActive(state, spawnFrom(next), {
    hold: parking,
    holdLocked: true,
    queue: fillQueue(queue),
  });
}

export function cellsOf(piece: ActivePiece): Array<{ x: number; y: number; color: PadColor }> {
  return shapeCells(piece.kind, piece.rotation).map(({ dx, dy }) => ({
    x: piece.x + dx,
    y: piece.y + dy,
    color: piece.color,
  }));
}
