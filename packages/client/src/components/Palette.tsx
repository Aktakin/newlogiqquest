import type { BlockKind } from '@logiq/engine';
import { useDrag } from '../lib/dragContext';
import { BLOCK_CODE, BLOCK_LABEL, BlockIcon } from './BlockChip';

interface PaletteProps {
  kinds: BlockKind[];
  onAdd: (kind: BlockKind) => void;
  disabled?: boolean;
}

/** The instruction set for the current level, click to append or drag to place. */
export function Palette({ kinds, onAdd, disabled }: PaletteProps) {
  const { setPayload } = useDrag();

  return (
    <div className="palette">
      {kinds.map((kind) => (
        <button
          key={kind}
          type="button"
          className={`palette__item palette__item--${kind}`}
          draggable={!disabled}
          disabled={disabled}
          onDragStart={(event) => {
            setPayload({ source: 'palette', kind });
            event.dataTransfer.effectAllowed = 'copy';
          }}
          onDragEnd={() => setPayload(null)}
          onClick={() => onAdd(kind)}
        >
          <span className="palette__icon">
            <BlockIcon kind={kind} />
          </span>
          <span className="palette__text">
            <span className="palette__label">{BLOCK_LABEL[kind]}</span>
            <code className="palette__code">{BLOCK_CODE[kind]}</code>
          </span>
        </button>
      ))}
    </div>
  );
}
