import type { Block, Program, RoutineDef } from './types';

/** `Cross the bridge` -> `crossTheBridge`, so generated code always compiles. */
export function toIdentifier(name: string, fallback = 'routine'): string {
  const cleaned = name
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, i) =>
      i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join('');
  if (!cleaned || /^[0-9]/.test(cleaned)) return fallback;
  return cleaned;
}

export interface CodeLine {
  text: string;
  depth: number;
  /** Set when the line came from a block, so a running program can be traced. */
  blockId?: string;
}

const CALLS: Record<string, string> = {
  hop: 'hop()',
  turnLeft: 'turnLeft()',
  turnRight: 'turnRight()',
};

function emit(blocks: Block[], routines: RoutineDef[], depth: number, out: CodeLine[]): void {
  const pad = '  '.repeat(depth);
  blocks.forEach((block) => {
    switch (block.kind) {
      case 'hop':
      case 'turnLeft':
      case 'turnRight':
        out.push({ text: `${pad}${CALLS[block.kind]};`, depth, blockId: block.id });
        break;
      case 'repeat':
        out.push({
          text: `${pad}for (let i = 0; i < ${block.times}; i++) {`,
          depth,
          blockId: block.id,
        });
        if (block.body.length === 0) {
          out.push({ text: `${pad}  // drop blocks in here`, depth: depth + 1 });
        }
        emit(block.body, routines, depth + 1, out);
        out.push({ text: `${pad}}`, depth });
        break;
      case 'call': {
        const routine = routines.find((r) => r.id === block.fnId);
        out.push({
          text: `${pad}${toIdentifier(routine?.name ?? 'routine')}();`,
          depth,
          blockId: block.id,
        });
        break;
      }
    }
  });
}

/**
 * Renders the block script as the TypeScript a developer would have written.
 * Shown beside the blocks so the notation stops feeling foreign, and line by
 * line during a run so players see their code execute.
 */
export function toCodeLines(program: Program): CodeLine[] {
  const out: CodeLine[] = [];

  program.routines.forEach((routine) => {
    out.push({ text: `function ${toIdentifier(routine.name)}() {`, depth: 0 });
    if (routine.body.length === 0) out.push({ text: '  // empty for now', depth: 1 });
    emit(routine.body, program.routines, 1, out);
    out.push({ text: '}', depth: 0 });
    out.push({ text: '', depth: 0 });
  });

  out.push({ text: 'function main() {', depth: 0 });
  if (program.main.length === 0) out.push({ text: '  // your script goes here', depth: 1 });
  emit(program.main, program.routines, 1, out);
  out.push({ text: '}', depth: 0 });

  return out;
}

export const toTypeScript = (program: Program): string =>
  toCodeLines(program)
    .map((line) => line.text)
    .join('\n');
