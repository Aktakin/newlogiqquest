import { MAZE_DIRS, MAZE_LEVELS, type MazeCoord, type MazeFacing, type MazeState } from './types';

export * from './types';

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function keyOf(c: MazeCoord): string {
  return `${c.x},${c.y}`;
}

function emptyGrid(size: number): boolean[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => false));
}

function openCell(grid: boolean[][], cell: MazeCoord) {
  grid[cell.y * 2 + 1]![cell.x * 2 + 1] = true;
}

function openBetween(grid: boolean[][], a: MazeCoord, b: MazeCoord) {
  openCell(grid, a);
  openCell(grid, b);
  const wx = a.x * 2 + 1 + (b.x - a.x);
  const wy = a.y * 2 + 1 + (b.y - a.y);
  grid[wy]![wx] = true;
}

/** Recursive backtracker constrained to an allowed set of cell coordinates. */
function carveWithin(
  grid: boolean[][],
  allowed: Set<string>,
  entry: MazeCoord,
  rand: () => number,
) {
  openCell(grid, entry);
  const visited = new Set<string>([keyOf(entry)]);
  const stack: MazeCoord[] = [entry];

  while (stack.length) {
    const cell = stack[stack.length - 1]!;
    const options = MAZE_DIRS.map((d) => ({ x: cell.x + d.dx, y: cell.y + d.dy })).filter(
      (n) => allowed.has(keyOf(n)) && !visited.has(keyOf(n)),
    );
    if (!options.length) {
      stack.pop();
      continue;
    }
    const pick = options[Math.floor(rand() * options.length)]!;
    visited.add(keyOf(pick));
    openBetween(grid, cell, pick);
    stack.push(pick);
  }
}

function rotateGridCW(grid: boolean[][]): boolean[][] {
  const n = grid.length;
  const next = emptyGrid(n);
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      next[x]![n - 1 - y] = grid[y]![x]!;
    }
  }
  return next;
}

function rotateCoordCW(c: MazeCoord, size: number): MazeCoord {
  return { x: size - 1 - c.y, y: c.x };
}

function farthestInRegion(
  grid: boolean[][],
  fromGrid: MazeCoord,
  region: Set<string>,
): MazeCoord {
  let best = fromGrid;
  let bestDist = -1;
  for (const token of region) {
    const [cx, cy] = token.split(',').map(Number) as [number, number];
    const g = { x: cx * 2 + 1, y: cy * 2 + 1 };
    const dist = shortestPath(grid, fromGrid, g);
    if (dist > bestDist) {
      bestDist = dist;
      best = g;
    }
  }
  return best;
}

/** Perfect maze via recursive backtracker on a cell lattice. */
export function carveMaze(cells: number, seed: number): boolean[][] {
  const size = cells * 2 + 1;
  const grid = emptyGrid(size);
  const allowed = new Set<string>();
  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) allowed.add(`${x},${y}`);
  }
  carveWithin(grid, allowed, { x: 0, y: 0 }, mulberry32(seed));
  return grid;
}

/**
 * Base layout (before rotation):
 * - Start on the left edge at mid-height
 * - North / south = large decoy mazes (no lily)
 * - East = true arm with the goal at its farthest cell
 * The finished maze is rotated 0–3 turns so the true arm is not always east.
 */
export function carveBranchingMaze(
  cells: number,
  seed: number,
): { grid: boolean[][]; start: MazeCoord; goal: MazeCoord } {
  const size = cells * 2 + 1;
  const grid = emptyGrid(size);
  const rand = mulberry32(seed);

  const midY = Math.floor(cells / 2);
  // ~68% of width is decoy territory; the true arm is the smaller eastern strip.
  const splitX = Math.max(3, Math.min(cells - 3, Math.floor(cells * 0.68)));
  const startCell = { x: 0, y: midY };

  const decoyA = new Set<string>();
  const decoyB = new Set<string>();
  const correct = new Set<string>();

  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      if (x === startCell.x && y === startCell.y) continue;
      if (x < splitX && y < midY) decoyA.add(`${x},${y}`);
      else if (x < splitX && y > midY) decoyB.add(`${x},${y}`);
      else if (x >= splitX) correct.add(`${x},${y}`);
      else if (y === midY && x > 0) correct.add(`${x},${y}`);
    }
  }

  const entryA = { x: 0, y: midY - 1 };
  const entryB = { x: 0, y: midY + 1 };
  const entryC = { x: 1, y: midY };
  decoyA.add(keyOf(entryA));
  decoyB.add(keyOf(entryB));
  correct.add(keyOf(entryC));

  openCell(grid, startCell);
  openBetween(grid, startCell, entryA);
  openBetween(grid, startCell, entryB);
  openBetween(grid, startCell, entryC);

  carveWithin(grid, decoyA, entryA, rand);
  carveWithin(grid, decoyB, entryB, rand);
  carveWithin(grid, correct, entryC, rand);

  const startGrid = { x: startCell.x * 2 + 1, y: startCell.y * 2 + 1 };
  let goal = farthestInRegion(grid, startGrid, correct);

  // Rotate so players cannot memorize a compass direction.
  const turns = Math.floor(rand() * 4);
  let rotated = grid;
  let start = startGrid;
  for (let t = 0; t < turns; t += 1) {
    rotated = rotateGridCW(rotated);
    start = rotateCoordCW(start, size);
    goal = rotateCoordCW(goal, size);
  }

  return { grid: rotated, start, goal };
}

function walkable(grid: boolean[][], x: number, y: number): boolean {
  return Boolean(grid[y]?.[x]);
}

/** Shortest hop count between two path tiles. */
export function shortestPath(grid: boolean[][], start: MazeCoord, goal: MazeCoord): number {
  const key = (c: MazeCoord) => `${c.x},${c.y}`;
  const queue: Array<MazeCoord & { cost: number }> = [{ ...start, cost: 0 }];
  const seen = new Set([key(start)]);
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur.x === goal.x && cur.y === goal.y) return cur.cost;
    for (const d of MAZE_DIRS) {
      const next = { x: cur.x + d.dx, y: cur.y + d.dy };
      if (!walkable(grid, next.x, next.y)) continue;
      const k = key(next);
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push({ ...next, cost: cur.cost + 1 });
    }
  }
  return 0;
}

/** Count open neighbours of a path tile (degree of the junction). */
export function pathDegree(grid: boolean[][], cell: MazeCoord): number {
  let n = 0;
  for (const d of MAZE_DIRS) {
    if (walkable(grid, cell.x + d.dx, cell.y + d.dy)) n += 1;
  }
  return n;
}

export function getMazeLevel(id: number) {
  return MAZE_LEVELS.find((level) => level.id === id);
}

export function createMaze(levelId: number, seed = Date.now()): MazeState {
  const level = getMazeLevel(levelId) ?? MAZE_LEVELS[0]!;
  let grid: boolean[][];
  let start: MazeCoord;
  let goal: MazeCoord;

  if (level.branching) {
    const carved = carveBranchingMaze(level.cells, seed);
    grid = carved.grid;
    start = carved.start;
    goal = carved.goal;
  } else {
    grid = carveMaze(level.cells, seed);
    const size = grid.length;
    start = { x: 1, y: 1 };
    goal = { x: size - 2, y: size - 2 };
  }

  return {
    levelId: level.id,
    seed,
    grid,
    size: grid.length,
    start,
    goal,
    frog: { ...start },
    facing: 1,
    moves: 0,
    visited: [`${start.x},${start.y}`],
    won: false,
    optimal: shortestPath(grid, start, goal),
    branching: level.branching,
  };
}

export function reshuffleMaze(state: MazeState): MazeState {
  return createMaze(state.levelId, (state.seed + 0x9e3779b9) >>> 0);
}

export function moveFrog(state: MazeState, facing: MazeFacing): MazeState {
  if (state.won) return state;
  const step = MAZE_DIRS[facing]!;
  const next = { x: state.frog.x + step.dx, y: state.frog.y + step.dy };
  if (!walkable(state.grid, next.x, next.y)) {
    return { ...state, facing };
  }
  const key = `${next.x},${next.y}`;
  const visited = state.visited.includes(key) ? state.visited : [...state.visited, key];
  const won = next.x === state.goal.x && next.y === state.goal.y;
  return {
    ...state,
    frog: next,
    facing,
    moves: state.moves + 1,
    visited,
    won,
  };
}

export function resetFrog(state: MazeState): MazeState {
  return {
    ...state,
    frog: { ...state.start },
    facing: 1,
    moves: 0,
    visited: [`${state.start.x},${state.start.y}`],
    won: false,
  };
}
