import type { Direction, FrogState, LevelDef, Point, Tile } from './types';

export interface Board {
  width: number;
  height: number;
  tiles: Tile[][];
  start: FrogState;
  /** `x,y` keys of every fly on the map. */
  flies: string[];
  goal: Point;
}

export const key = (p: Point): string => `${p.x},${p.y}`;

/** Unit vector for a heading. Screen coordinates: y grows downward. */
export const STEP: Record<Direction, Point> = {
  0: { x: 0, y: -1 },
  1: { x: 1, y: 0 },
  2: { x: 0, y: 1 },
  3: { x: -1, y: 0 },
};

export const DIRECTION_NAME: Record<Direction, string> = {
  0: 'north',
  1: 'east',
  2: 'south',
  3: 'west',
};

export const turn = (dir: Direction, amount: 1 | -1): Direction =>
  (((dir + amount) % 4) + 4) % 4 as Direction;

const CHARS: Record<string, Tile> = {
  '~': { kind: 'water', fly: false },
  o: { kind: 'pad', fly: false },
  '#': { kind: 'rock', fly: false },
  '*': { kind: 'pad', fly: true },
  G: { kind: 'goal', fly: false },
  S: { kind: 'pad', fly: false },
};

/** Turns a level's character map into a board the interpreter can walk. */
export function parseBoard(level: LevelDef): Board {
  const height = level.rows.length;
  const width = Math.max(...level.rows.map((r) => r.length));
  const tiles: Tile[][] = [];
  const flies: string[] = [];
  let start: FrogState | null = null;
  let goal: Point | null = null;

  for (let y = 0; y < height; y += 1) {
    const row: Tile[] = [];
    const source = (level.rows[y] ?? '').padEnd(width, '~');
    for (let x = 0; x < width; x += 1) {
      const char = source[x] ?? '~';
      const tile = CHARS[char];
      if (!tile) throw new Error(`Level ${level.id}: unknown map character "${char}"`);
      row.push({ ...tile });
      if (char === 'S') start = { x, y, dir: level.startDir };
      if (char === 'G') goal = { x, y };
      if (tile.fly) flies.push(key({ x, y }));
    }
    tiles.push(row);
  }

  if (!start) throw new Error(`Level ${level.id}: map has no start tile "S"`);
  if (!goal) throw new Error(`Level ${level.id}: map has no golden lily "G"`);

  return { width, height, tiles, start, flies, goal };
}

export function tileAt(board: Board, p: Point): Tile | undefined {
  return board.tiles[p.y]?.[p.x];
}

export function inBounds(board: Board, p: Point): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < board.width && p.y < board.height;
}
