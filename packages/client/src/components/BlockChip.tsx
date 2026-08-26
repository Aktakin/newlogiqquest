import type { ReactNode } from 'react';
import type { BlockKind, RoutineDef } from '@logiq/engine';
import { IconHop, IconLoop, IconRoutine, IconTurnLeft, IconTurnRight } from './Icons';

export const BLOCK_LABEL: Record<BlockKind, string> = {
  hop: 'Hop forward',
  turnLeft: 'Turn left',
  turnRight: 'Turn right',
  repeat: 'Repeat',
  call: 'Call routine',
};

export const BLOCK_CODE: Record<BlockKind, string> = {
  hop: 'hop()',
  turnLeft: 'turnLeft()',
  turnRight: 'turnRight()',
  repeat: 'for (…)',
  call: 'call()',
};

export function BlockIcon({ kind }: { kind: BlockKind }): ReactNode {
  switch (kind) {
    case 'hop':
      return <IconHop />;
    case 'turnLeft':
      return <IconTurnLeft />;
    case 'turnRight':
      return <IconTurnRight />;
    case 'repeat':
      return <IconLoop />;
    case 'call':
      return <IconRoutine />;
  }
}

interface ChipProps {
  kind: BlockKind;
  label?: string;
  routine?: RoutineDef;
  children?: ReactNode;
  compact?: boolean;
}

/**
 * The visual identity of an instruction. Colour is meaning here: movement is
 * mint, rotation is sky, control flow is gold, and a routine borrows the hue
 * assigned to its definition.
 */
export function BlockChip({ kind, label, routine, children, compact }: ChipProps) {
  const style = routine
    ? ({
        '--chip-hue': routine.hue,
        '--chip-color': `hsl(${routine.hue} 78% 72%)`,
        '--chip-bg': `hsl(${routine.hue} 60% 62% / 0.14)`,
        '--chip-border': `hsl(${routine.hue} 60% 68% / 0.42)`,
      } as React.CSSProperties)
    : undefined;

  return (
    <span
      className={`chip chip--${kind}${compact ? ' chip--compact' : ''}`}
      style={style}
      data-kind={kind}
    >
      <span className="chip__icon">
        <BlockIcon kind={kind} />
      </span>
      <span className="chip__label">{label ?? BLOCK_LABEL[kind]}</span>
      {children}
    </span>
  );
}
