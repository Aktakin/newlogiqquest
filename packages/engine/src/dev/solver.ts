import { STEP, inBounds, key, parseBoard, tileAt, turn } from '../grid';
import type { Block, Direction, LevelDef } from '../types';

interface Node {
  x: number;
  y: number;
  dir: Direction;
  eaten: number;
  cost: number;
  from?: { node: string; move: 'hop' | 'turnLeft' | 'turnRight' };
}

/**
 * Breadth-first search over (position, heading, flies eaten) for the shortest
 * hop/turn sequence. Authoring tool only: it proves a level is solvable and
 * tells us where par should sit.
 */
export function solve(level: LevelDef): { blocks: Block[]; cost: number } | null {
  const board = parseBoard(level);
  const flyIndex = new Map(board.flies.map((k, i) => [k, i]));
  const allEaten = (1 << board.flies.length) - 1;
  const id = (n: Pick<Node, 'x' | 'y' | 'dir' | 'eaten'>) => `${n.x},${n.y},${n.dir},${n.eaten}`;

  const startEaten = flyIndex.has(key(board.start)) ? 1 << flyIndex.get(key(board.start))! : 0;
  const start: Node = { ...board.start, eaten: startEaten, cost: 0 };
  const seen = new Map<string, Node>([[id(start), start]]);
  const queue: Node[] = [start];

  while (queue.length) {
    const node = queue.shift()!;
    if (node.eaten === allEaten && tileAt(board, node)?.kind === 'goal') {
      const blocks: Block[] = [];
      let cursor: Node | undefined = node;
      while (cursor?.from) {
        blocks.unshift({ id: `s${blocks.length}`, kind: cursor.from.move } as Block);
        cursor = seen.get(cursor.from.node);
      }
      return { blocks, cost: node.cost };
    }

    const successors: Node[] = [
      { ...node, dir: turn(node.dir, -1), cost: node.cost + 1, from: { node: id(node), move: 'turnLeft' } },
      { ...node, dir: turn(node.dir, 1), cost: node.cost + 1, from: { node: id(node), move: 'turnRight' } },
    ];

    const target = { x: node.x + STEP[node.dir].x, y: node.y + STEP[node.dir].y };
    const tile = inBounds(board, target) ? tileAt(board, target) : undefined;
    if (tile && tile.kind !== 'water' && tile.kind !== 'rock') {
      const flyBit = flyIndex.has(key(target)) ? 1 << flyIndex.get(key(target))! : 0;
      successors.push({
        ...target,
        dir: node.dir,
        eaten: node.eaten | flyBit,
        cost: node.cost + 1,
        from: { node: id(node), move: 'hop' },
      });
    }

    for (const next of successors) {
      const k = id(next);
      if (seen.has(k)) continue;
      seen.set(k, next);
      queue.push(next);
    }
  }

  return null;
}
