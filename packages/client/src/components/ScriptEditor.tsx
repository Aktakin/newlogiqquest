import { Fragment, useState } from 'react';
import type { Block, RoutineDef } from '@logiq/engine';
import type { ContainerId } from '../lib/program';
import { useDrag } from '../lib/dragContext';
import { BLOCK_LABEL, BlockChip } from './BlockChip';
import { IconTrash } from './Icons';

interface SharedProps {
  routines: RoutineDef[];
  activeContainer: ContainerId;
  onActivate: (containerId: ContainerId) => void;
  onDropAt: (containerId: ContainerId, index: number) => void;
  onRemove: (blockId: string) => void;
  onTimes: (blockId: string, times: number) => void;
  onNudge: (blockId: string, delta: number) => void;
  runningBlockId?: string | undefined;
  runningTrail: string[];
  repeatRange: [number, number];
}

interface ListProps extends SharedProps {
  containerId: ContainerId;
  blocks: Block[];
  depth: number;
  numbering?: { next: number } | undefined;
  emptyHint: string;
}

function Gap({
  containerId,
  index,
  onDropAt,
}: {
  containerId: ContainerId;
  index: number;
  onDropAt: (containerId: ContainerId, index: number) => void;
}) {
  const [over, setOver] = useState(false);
  const { payload, setPayload } = useDrag();

  return (
    <li
      className={`gap${over && payload ? ' gap--active' : ''}`}
      onDragOver={(event) => {
        if (!payload) return;
        event.preventDefault();
        event.stopPropagation();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setOver(false);
        onDropAt(containerId, index);
        setPayload(null);
      }}
    >
      <span className="gap__line" />
    </li>
  );
}

function BlockRow({ block, containerId, depth, numbering, ...shared }: ListProps & { block: Block }) {
  const { setPayload } = useDrag();
  const routine =
    block.kind === 'call' ? shared.routines.find((r) => r.id === block.fnId) : undefined;
  const isRunning = shared.runningBlockId === block.id;
  const inTrail = shared.runningTrail.includes(block.id);
  const isActiveContainer = block.kind === 'repeat' && shared.activeContainer === block.id;
  const line = numbering ? (numbering.next += 1) : undefined;

  return (
    <li className={`row-wrap${block.kind === 'repeat' ? ' row-wrap--group' : ''}`}>
      <div
        className={`row${isRunning ? ' row--running' : ''}${inTrail ? ' row--trail' : ''}${
          isActiveContainer ? ' row--active' : ''
        }`}
        draggable
        tabIndex={0}
        role="button"
        aria-label={`${BLOCK_LABEL[block.kind]}${routine ? ` ${routine.name}` : ''}`}
        onDragStart={(event) => {
          event.stopPropagation();
          setPayload({ source: 'script', blockId: block.id });
          event.dataTransfer.effectAllowed = 'move';
        }}
        onDragEnd={() => setPayload(null)}
        onClick={(event) => {
          event.stopPropagation();
          if (block.kind === 'repeat') shared.onActivate(block.id);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Delete' || event.key === 'Backspace') {
            event.preventDefault();
            shared.onRemove(block.id);
          }
          if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
            event.preventDefault();
            shared.onNudge(block.id, event.key === 'ArrowUp' ? -1 : 1);
          }
        }}
      >
        <span className="row__line">{line ?? ''}</span>
        <BlockChip
          kind={block.kind}
          routine={routine}
          label={block.kind === 'call' ? (routine?.name ?? 'missing routine') : undefined}
        >
          {block.kind === 'repeat' && (
            <span className="chip__counter">
              <button
                type="button"
                aria-label="Repeat fewer times"
                onClick={(event) => {
                  event.stopPropagation();
                  shared.onTimes(block.id, Math.max(shared.repeatRange[0], block.times - 1));
                }}
              >
                −
              </button>
              <span className="chip__count">{block.times}×</span>
              <button
                type="button"
                aria-label="Repeat more times"
                onClick={(event) => {
                  event.stopPropagation();
                  shared.onTimes(block.id, Math.min(shared.repeatRange[1], block.times + 1));
                }}
              >
                +
              </button>
            </span>
          )}
        </BlockChip>
        <button
          type="button"
          className="row__remove"
          aria-label="Remove block"
          onClick={(event) => {
            event.stopPropagation();
            shared.onRemove(block.id);
          }}
        >
          <IconTrash width={15} height={15} />
        </button>
      </div>

      {block.kind === 'repeat' && (
        <div className={`nest${isActiveContainer ? ' nest--active' : ''}`}>
          <ScriptList
            {...shared}
            containerId={block.id}
            blocks={block.body}
            depth={depth + 1}
            numbering={numbering}
            emptyHint="Drop the blocks to repeat here"
          />
          <div className="nest__end">end repeat</div>
        </div>
      )}
    </li>
  );
}

export function ScriptList({ containerId, blocks, depth, numbering, emptyHint, ...shared }: ListProps) {
  const { payload, setPayload } = useDrag();
  const [over, setOver] = useState(false);

  return (
    <ol
      className={`script${blocks.length === 0 ? ' script--empty' : ''}${
        over && payload ? ' script--over' : ''
      }`}
      onClick={(event) => {
        // Nested lists must claim the event, or the outer list would steal focus
        // back and every drop would land twice.
        event.stopPropagation();
        shared.onActivate(containerId);
      }}
      onDragOver={(event) => {
        if (!payload) return;
        event.preventDefault();
        event.stopPropagation();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setOver(false);
        shared.onDropAt(containerId, blocks.length);
        setPayload(null);
      }}
    >
      {blocks.length === 0 ? (
        <li className="script__empty">{emptyHint}</li>
      ) : (
        <Gap containerId={containerId} index={0} onDropAt={shared.onDropAt} />
      )}
      {blocks.map((block, index) => (
        <Fragment key={block.id}>
          <BlockRow
            {...shared}
            containerId={containerId}
            blocks={blocks}
            block={block}
            depth={depth}
            numbering={numbering}
            emptyHint={emptyHint}
          />
          <Gap containerId={containerId} index={index + 1} onDropAt={shared.onDropAt} />
        </Fragment>
      ))}
    </ol>
  );
}
