import { DIRECTION_NAME, STEP, inBounds, key, parseBoard, tileAt, turn } from './grid';
import type { Board } from './grid';
import { starsFor } from './scoring';
import type {
  Block,
  Frame,
  FrogState,
  LevelDef,
  Program,
  RunResult,
  RunStatus,
} from './types';

/** Guards against runaway loops and mutually recursive routines. */
const MAX_STEPS = 600;
const MAX_CALL_DEPTH = 12;

export const emptyProgram = (): Program => ({ main: [], routines: [] });

/** Blocks the player spent, counting routine bodies once each. */
export function countBlocks(program: Program): number {
  const walk = (blocks: Block[]): number =>
    blocks.reduce((sum, block) => sum + 1 + (block.kind === 'repeat' ? walk(block.body) : 0), 0);
  return walk(program.main) + program.routines.reduce((sum, r) => sum + walk(r.body), 0);
}

function collectKinds(blocks: Block[], seen: Set<string>): void {
  for (const block of blocks) {
    seen.add(block.kind);
    if (block.kind === 'repeat') collectKinds(block.body, seen);
  }
}

/** Checks a program against the level's rules before running a single hop. */
export function validate(level: LevelDef, program: Program): string | null {
  const kinds = new Set<string>();
  collectKinds(program.main, kinds);
  program.routines.forEach((routine) => collectKinds(routine.body, kinds));

  const allowed = new Set<string>(level.palette);
  if (level.routines) allowed.add('call');
  for (const kind of kinds) {
    if (!allowed.has(kind)) return `The "${kind}" block is not available on this level.`;
  }

  if (program.main.length === 0) return 'Your script is empty — add some blocks first.';

  const used = countBlocks(program);
  if (level.maxBlocks && used > level.maxBlocks) {
    return `This level allows ${level.maxBlocks} blocks and your script uses ${used}.`;
  }

  const rules = level.routines;
  if (rules) {
    if (program.routines.length > rules.max) {
      return `You can define at most ${rules.max} ${rules.max === 1 ? 'routine' : 'routines'} here.`;
    }
    for (const routine of program.routines) {
      const size = countBlocks({ main: routine.body, routines: [] });
      if (size > rules.maxBlocksPerRoutine) {
        return `"${routine.name}" holds ${size} blocks — the limit is ${rules.maxBlocksPerRoutine}.`;
      }
    }
    if (rules.requireUse) {
      const defined = program.routines.filter((r) => r.body.length > 0);
      if (defined.length === 0) return 'Define a routine first, then call it from your script.';
      const calls = new Set<string>();
      const findCalls = (blocks: Block[]) => {
        for (const block of blocks) {
          if (block.kind === 'call') calls.add(block.fnId);
          if (block.kind === 'repeat') findCalls(block.body);
        }
      };
      findCalls(program.main);
      program.routines.forEach((r) => findCalls(r.body));
      if (calls.size === 0) return 'This level is about reuse — call your routine from the script.';
    }
  } else if (program.routines.some((r) => r.body.length > 0)) {
    return 'Routines are not unlocked on this level yet.';
  }

  return null;
}

interface Machine {
  board: Board;
  frog: FrogState;
  flies: Set<string>;
  frames: Frame[];
  steps: number;
  finished: RunStatus | null;
}

function push(machine: Machine, frame: Omit<Frame, 'fliesLeft'>): void {
  machine.frames.push({ ...frame, fliesLeft: [...machine.flies] });
}

/** Eats a fly and/or ends the run when the frog settles on the golden lily. */
function settle(machine: Machine, trail: string[], blockId: string): void {
  const tile = tileAt(machine.board, machine.frog);
  const here = key(machine.frog);

  if (tile?.fly && machine.flies.has(here)) {
    machine.flies.delete(here);
    push(machine, {
      event: 'eat',
      frog: { ...machine.frog },
      blockId,
      trail,
      note: `Caught a fly — ${machine.flies.size} to go.`,
    });
  }

  if (tile?.kind === 'goal' && machine.flies.size === 0) {
    machine.finished = 'success';
    push(machine, {
      event: 'goal',
      frog: { ...machine.frog },
      blockId,
      trail,
      note: 'Landed on the golden lily!',
    });
  }
}

function hop(machine: Machine, trail: string[], blockId: string): void {
  const target = {
    x: machine.frog.x + STEP[machine.frog.dir].x,
    y: machine.frog.y + STEP[machine.frog.dir].y,
  };
  const tile = inBounds(machine.board, target) ? tileAt(machine.board, target) : undefined;

  if (tile?.kind === 'rock') {
    machine.finished = 'blocked';
    push(machine, {
      event: 'blocked',
      frog: { ...machine.frog },
      blockId,
      trail,
      note: 'A rock blocks the way.',
    });
    return;
  }

  machine.frog = { ...target, dir: machine.frog.dir };

  if (!tile || tile.kind === 'water') {
    machine.finished = 'sink';
    push(machine, {
      event: 'sink',
      frog: { ...machine.frog },
      blockId,
      trail,
      note: tile ? 'Splash — that was deep water.' : 'Splash — the frog hopped off the pond.',
    });
    return;
  }

  push(machine, {
    event: 'hop',
    frog: { ...machine.frog },
    blockId,
    trail,
    note: `Hopped ${DIRECTION_NAME[machine.frog.dir]}.`,
  });
  settle(machine, trail, blockId);
}

function exec(
  machine: Machine,
  blocks: Block[],
  routines: Map<string, Block[]>,
  trail: string[],
  depth: number,
): void {
  for (const block of blocks) {
    if (machine.finished) return;
    if (machine.steps >= MAX_STEPS) {
      machine.finished = 'overflow';
      push(machine, {
        event: 'blocked',
        frog: { ...machine.frog },
        blockId: block.id,
        trail,
        note: 'That is a lot of hopping — check your loop.',
      });
      return;
    }
    machine.steps += 1;

    switch (block.kind) {
      case 'hop':
        hop(machine, trail, block.id);
        break;
      case 'turnLeft':
      case 'turnRight': {
        const amount = block.kind === 'turnLeft' ? -1 : 1;
        machine.frog = { ...machine.frog, dir: turn(machine.frog.dir, amount) };
        push(machine, {
          event: block.kind,
          frog: { ...machine.frog },
          blockId: block.id,
          trail,
          note: `Now facing ${DIRECTION_NAME[machine.frog.dir]}.`,
        });
        break;
      }
      case 'repeat': {
        const times = Math.max(0, Math.min(20, Math.floor(block.times)));
        for (let i = 0; i < times; i += 1) {
          exec(machine, block.body, routines, [...trail, block.id], depth);
          if (machine.finished || machine.steps >= MAX_STEPS) break;
        }
        break;
      }
      case 'call': {
        const body = routines.get(block.fnId);
        if (!body || depth >= MAX_CALL_DEPTH) {
          machine.finished = 'overflow';
          push(machine, {
            event: 'blocked',
            frog: { ...machine.frog },
            blockId: block.id,
            trail,
            note: body ? 'A routine is calling itself too deeply.' : 'That routine is empty.',
          });
          return;
        }
        exec(machine, body, routines, [...trail, block.id], depth + 1);
        break;
      }
    }
  }
}

const MESSAGES: Record<RunStatus, string> = {
  success: 'Solved — the frog made it to the golden lily.',
  incomplete: 'The script ended before the frog reached the golden lily.',
  sink: 'Splash! The frog needs a lily pad to land on.',
  blocked: 'Bump! A rock is in the way — try steering around it.',
  hungry: 'Almost — every fly has to be eaten before the golden lily counts.',
  overflow: 'The program ran too long. A loop is probably repeating forever.',
  invalid: 'That script breaks one of this level’s rules.',
};

/**
 * Runs a program against a level and returns the full animation trace.
 * Deterministic and side-effect free, so the browser and the server always agree.
 */
export function run(level: LevelDef, program: Program): RunResult {
  const blocksUsed = countBlocks(program);
  const problem = validate(level, program);
  if (problem) {
    return {
      status: 'invalid',
      success: false,
      message: problem,
      frames: [],
      blocksUsed,
      stars: 0,
    };
  }

  const board = parseBoard(level);
  const machine: Machine = {
    board,
    frog: { ...board.start },
    flies: new Set(board.flies),
    frames: [],
    steps: 0,
    finished: null,
  };

  push(machine, { event: 'start', frog: { ...machine.frog }, trail: [], note: 'Ready.' });

  const routines = new Map(level.routines ? program.routines.map((r) => [r.id, r.body]) : []);
  exec(machine, program.main, routines, [], 0);

  let status: RunStatus = machine.finished ?? 'incomplete';
  if (status === 'incomplete') {
    const tile = tileAt(board, machine.frog);
    if (tile?.kind === 'goal' && machine.flies.size > 0) status = 'hungry';
  }

  const success = status === 'success';
  return {
    status,
    success,
    message: MESSAGES[status],
    frames: machine.frames,
    blocksUsed,
    stars: success ? starsFor(level, blocksUsed) : 0,
  };
}
