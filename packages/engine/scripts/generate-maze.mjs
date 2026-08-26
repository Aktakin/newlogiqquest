/**
 * Authoring tool. Carves a perfect maze out of a lily-pad grid, measures the
 * optimal block count with a breadth-first search, and prints candidates that
 * fall inside a target difficulty band. The winning maps are pasted into the
 * level files by hand so the shipped puzzles stay fixed and reviewable.
 *
 *   node packages/engine/scripts/generate-maze.mjs <cells> <count> <minPar> <maxPar>
 */

const [, , cellsArg = '4', countArg = '6', minParArg = '20', maxParArg = '40'] = process.argv;
const CELLS = Number(cellsArg);
const COUNT = Number(countArg);
const MIN_PAR = Number(minParArg);
const MAX_PAR = Number(maxParArg);

const mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const DIRS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
];

function carve(seed) {
  const size = CELLS * 2 + 1;
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => '~'));
  const rand = mulberry32(seed);
  const visited = new Set();
  const stack = [{ x: 0, y: 0 }];
  visited.add('0,0');
  grid[1][1] = 'o';

  while (stack.length) {
    const cell = stack[stack.length - 1];
    const options = DIRS.map((d, i) => ({ ...d, i }))
      .map((d) => ({ ...d, nx: cell.x + d.dx, ny: cell.y + d.dy }))
      .filter(
        (d) =>
          d.nx >= 0 &&
          d.ny >= 0 &&
          d.nx < CELLS &&
          d.ny < CELLS &&
          !visited.has(`${d.nx},${d.ny}`),
      );
    if (!options.length) {
      stack.pop();
      continue;
    }
    const pick = options[Math.floor(rand() * options.length)];
    visited.add(`${pick.nx},${pick.ny}`);
    grid[pick.ny * 2 + 1][pick.nx * 2 + 1] = 'o';
    grid[cell.y * 2 + 1 + pick.dy][cell.x * 2 + 1 + pick.dx] = 'o';
    stack.push({ x: pick.nx, y: pick.ny });
  }

  // A few dead ends become rocks: visual variety, and a reminder that a bump
  // is recoverable while deep water is not.
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      if (grid[y][x] !== '~') continue;
      const open = DIRS.filter((d) => grid[y + d.dy]?.[x + d.dx] === 'o').length;
      if (open >= 3 && rand() < 0.5) grid[y][x] = '#';
    }
  }

  return grid;
}

const walkable = (ch) => ch === 'o' || ch === 'S' || ch === 'G' || ch === '*';

/** Optimal number of hop/turn blocks between two tiles, or null if cut off. */
function optimal(grid, start, goal, startDir) {
  const key = (s) => `${s.x},${s.y},${s.dir}`;
  const queue = [{ x: start.x, y: start.y, dir: startDir, cost: 0 }];
  const seen = new Set([key({ x: start.x, y: start.y, dir: startDir })]);
  while (queue.length) {
    const state = queue.shift();
    if (state.x === goal.x && state.y === goal.y) return state.cost;
    const next = [
      { ...state, dir: (state.dir + 1) % 4, cost: state.cost + 1 },
      { ...state, dir: (state.dir + 3) % 4, cost: state.cost + 1 },
    ];
    const step = DIRS[state.dir];
    const tx = state.x + step.dx;
    const ty = state.y + step.dy;
    if (walkable(grid[ty]?.[tx])) next.push({ x: tx, y: ty, dir: state.dir, cost: state.cost + 1 });
    for (const candidate of next) {
      const k = key(candidate);
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push(candidate);
    }
  }
  return null;
}

const found = [];
for (let seed = 1; seed < 4000 && found.length < COUNT; seed += 1) {
  const grid = carve(seed);
  const size = grid.length;
  const start = { x: 1, y: size - 2 };
  const goal = { x: size - 2, y: 1 };
  if (!walkable(grid[start.y][start.x]) || !walkable(grid[goal.y][goal.x])) continue;
  const par = optimal(grid, start, goal, 1);
  if (par === null || par < MIN_PAR || par > MAX_PAR) continue;

  const rows = grid.map((row) => row.join(''));
  rows[start.y] = rows[start.y].slice(0, start.x) + 'S' + rows[start.y].slice(start.x + 1);
  rows[goal.y] = rows[goal.y].slice(0, goal.x) + 'G' + rows[goal.y].slice(goal.x + 1);
  // Drop the dead water border the carver leaves behind.
  const trimmed = rows.slice(1, -1).map((row) => row.slice(1, -1));
  found.push({ seed, par, rows: trimmed });
}

for (const candidate of found) {
  console.log(`\n// seed ${candidate.seed} — optimal ${candidate.par} blocks`);
  console.log(candidate.rows.map((r) => `      '${r}',`).join('\n'));
}
if (!found.length) console.log('No maze matched that difficulty band.');
