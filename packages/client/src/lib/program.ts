import type { Block, BlockKind, Program, RoutineDef } from '@logiq/engine';

/**
 * A container is anywhere blocks can live: the main script, a routine body, or
 * the body of a repeat block. Editing is expressed as "replace the list inside
 * container X", which keeps every operation a simple immutable tree rewrite.
 */
export type ContainerId = string;
export const MAIN: ContainerId = 'main';

let counter = 0;
const nextId = (prefix: string) => `${prefix}${(counter += 1).toString(36)}_${Date.now().toString(36).slice(-4)}`;

export function createBlock(kind: BlockKind, options: { times?: number; fnId?: string } = {}): Block {
  switch (kind) {
    case 'repeat':
      return { id: nextId('r'), kind: 'repeat', times: options.times ?? 4, body: [] };
    case 'call':
      return { id: nextId('c'), kind: 'call', fnId: options.fnId ?? '' };
    default:
      return { id: nextId('b'), kind } as Block;
  }
}

export const ROUTINE_HUES = [268, 198, 42, 152, 330];

export function createRoutine(name: string, index: number): RoutineDef {
  return { id: nextId('fn'), name, hue: ROUTINE_HUES[index % ROUTINE_HUES.length] ?? 268, body: [] };
}

type Rewrite = (blocks: Block[]) => Block[];

function rewriteNested(blocks: Block[], containerId: ContainerId, fn: Rewrite): Block[] {
  return blocks.map((block) => {
    if (block.kind !== 'repeat') return block;
    if (block.id === containerId) return { ...block, body: fn(block.body) };
    return { ...block, body: rewriteNested(block.body, containerId, fn) };
  });
}

export function updateContainer(program: Program, containerId: ContainerId, fn: Rewrite): Program {
  if (containerId === MAIN) return { ...program, main: fn(program.main) };

  if (program.routines.some((routine) => routine.id === containerId)) {
    return {
      ...program,
      routines: program.routines.map((routine) =>
        routine.id === containerId ? { ...routine, body: fn(routine.body) } : routine,
      ),
    };
  }

  return {
    ...program,
    main: rewriteNested(program.main, containerId, fn),
    routines: program.routines.map((routine) => ({
      ...routine,
      body: rewriteNested(routine.body, containerId, fn),
    })),
  };
}

export function insertBlock(
  program: Program,
  containerId: ContainerId,
  block: Block,
  index?: number,
): Program {
  return updateContainer(program, containerId, (blocks) => {
    const at = index ?? blocks.length;
    return [...blocks.slice(0, at), block, ...blocks.slice(at)];
  });
}

function withoutBlock(blocks: Block[], blockId: string): Block[] {
  return blocks
    .filter((block) => block.id !== blockId)
    .map((block) =>
      block.kind === 'repeat' ? { ...block, body: withoutBlock(block.body, blockId) } : block,
    );
}

export function removeBlock(program: Program, blockId: string): Program {
  return {
    main: withoutBlock(program.main, blockId),
    routines: program.routines.map((routine) => ({
      ...routine,
      body: withoutBlock(routine.body, blockId),
    })),
  };
}

export function findBlock(program: Program, blockId: string): Block | undefined {
  const search = (blocks: Block[]): Block | undefined => {
    for (const block of blocks) {
      if (block.id === blockId) return block;
      if (block.kind === 'repeat') {
        const nested = search(block.body);
        if (nested) return nested;
      }
    }
    return undefined;
  };
  return search(program.main) ?? program.routines.map((r) => search(r.body)).find(Boolean);
}

/** Which container holds a block, and at what position. */
export function locate(
  program: Program,
  blockId: string,
): { containerId: ContainerId; index: number } | null {
  const search = (
    blocks: Block[],
    containerId: ContainerId,
  ): { containerId: ContainerId; index: number } | null => {
    const index = blocks.findIndex((block) => block.id === blockId);
    if (index >= 0) return { containerId, index };
    for (const block of blocks) {
      if (block.kind !== 'repeat') continue;
      const nested = search(block.body, block.id);
      if (nested) return nested;
    }
    return null;
  };

  const inMain = search(program.main, MAIN);
  if (inMain) return inMain;
  for (const routine of program.routines) {
    const inRoutine = search(routine.body, routine.id);
    if (inRoutine) return inRoutine;
  }
  return null;
}

/** True when `containerId` sits inside `blockId` — a move that would eat itself. */
function containsContainer(block: Block, containerId: ContainerId): boolean {
  if (block.kind !== 'repeat') return false;
  if (block.id === containerId) return true;
  return block.body.some((child) => containsContainer(child, containerId));
}

export function moveBlock(
  program: Program,
  blockId: string,
  targetContainer: ContainerId,
  targetIndex: number,
): Program {
  const block = findBlock(program, blockId);
  const origin = locate(program, blockId);
  if (!block || !origin) return program;
  if (containsContainer(block, targetContainer)) return program;

  let index = targetIndex;
  if (origin.containerId === targetContainer && origin.index < targetIndex) index -= 1;

  return insertBlock(removeBlock(program, blockId), targetContainer, block, index);
}

export function setRepeatTimes(program: Program, blockId: string, times: number): Program {
  const apply = (blocks: Block[]): Block[] =>
    blocks.map((block) => {
      if (block.kind !== 'repeat') return block;
      if (block.id === blockId) return { ...block, times };
      return { ...block, body: apply(block.body) };
    });
  return {
    main: apply(program.main),
    routines: program.routines.map((routine) => ({ ...routine, body: apply(routine.body) })),
  };
}

export function renameRoutine(program: Program, routineId: string, name: string): Program {
  return {
    ...program,
    routines: program.routines.map((routine) =>
      routine.id === routineId ? { ...routine, name } : routine,
    ),
  };
}

function stripCalls(blocks: Block[], routineId: string): Block[] {
  return blocks
    .filter((block) => !(block.kind === 'call' && block.fnId === routineId))
    .map((block) =>
      block.kind === 'repeat' ? { ...block, body: stripCalls(block.body, routineId) } : block,
    );
}

export function removeRoutine(program: Program, routineId: string): Program {
  return {
    main: stripCalls(program.main, routineId),
    routines: program.routines
      .filter((routine) => routine.id !== routineId)
      .map((routine) => ({ ...routine, body: stripCalls(routine.body, routineId) })),
  };
}
