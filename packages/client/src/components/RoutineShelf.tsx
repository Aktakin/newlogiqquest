import type { Program, RoutineRules } from '@logiq/engine';
import { countBlocks, toIdentifier } from '@logiq/engine';
import type { ContainerId } from '../lib/program';
import { useDrag } from '../lib/dragContext';
import { IconPlus, IconTrash } from './Icons';
import { ScriptList } from './ScriptEditor';

interface RoutineShelfProps {
  program: Program;
  rules: RoutineRules;
  activeContainer: ContainerId;
  onActivate: (containerId: ContainerId) => void;
  onDropAt: (containerId: ContainerId, index: number) => void;
  onRemove: (blockId: string) => void;
  onTimes: (blockId: string, times: number) => void;
  onNudge: (blockId: string, delta: number) => void;
  onRename: (routineId: string, name: string) => void;
  onDelete: (routineId: string) => void;
  onCreate: () => void;
  onCall: (routineId: string) => void;
  runningBlockId?: string | undefined;
  runningTrail: string[];
  repeatRange: [number, number];
}

/**
 * Where routines are defined. Each card is a miniature editor plus the call
 * chip that puts it to work, which keeps definition and use side by side.
 */
export function RoutineShelf(props: RoutineShelfProps) {
  const { program, rules } = props;
  const { setPayload } = useDrag();
  const canCreate = program.routines.length < rules.max;

  return (
    <div className="routines">
      {program.routines.map((routine) => {
        const size = countBlocks({ main: routine.body, routines: [] });
        const hue = routine.hue;
        return (
          <section
            key={routine.id}
            className={`routine${props.activeContainer === routine.id ? ' routine--active' : ''}`}
            style={
              {
                '--chip-color': `hsl(${hue} 78% 74%)`,
                '--chip-bg': `hsl(${hue} 60% 62% / 0.13)`,
                '--chip-border': `hsl(${hue} 60% 68% / 0.4)`,
              } as React.CSSProperties
            }
            onClick={() => props.onActivate(routine.id)}
          >
            <header className="routine__head">
              <span className="routine__keyword">function</span>
              <input
                className="routine__name"
                value={routine.name}
                spellCheck={false}
                maxLength={18}
                aria-label="Routine name"
                onChange={(event) => props.onRename(routine.id, event.target.value)}
                onClick={(event) => event.stopPropagation()}
              />
              <span className="routine__parens">()</span>
              <span className="routine__size">
                {size}/{rules.maxBlocksPerRoutine}
              </span>
              <button
                type="button"
                className="routine__delete"
                aria-label={`Delete ${routine.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  props.onDelete(routine.id);
                }}
              >
                <IconTrash width={14} height={14} />
              </button>
            </header>

            <ScriptList
              containerId={routine.id}
              blocks={routine.body}
              depth={0}
              emptyHint="Add the moves this routine performs"
              routines={program.routines}
              activeContainer={props.activeContainer}
              onActivate={props.onActivate}
              onDropAt={props.onDropAt}
              onRemove={props.onRemove}
              onTimes={props.onTimes}
              onNudge={props.onNudge}
              runningBlockId={props.runningBlockId}
              runningTrail={props.runningTrail}
              repeatRange={props.repeatRange}
            />

            <button
              type="button"
              className="routine__call"
              draggable
              onDragStart={(event) => {
                setPayload({ source: 'palette', kind: 'call', fnId: routine.id });
                event.dataTransfer.effectAllowed = 'copy';
              }}
              onDragEnd={() => setPayload(null)}
              onClick={(event) => {
                event.stopPropagation();
                props.onCall(routine.id);
              }}
            >
              <code>{toIdentifier(routine.name)}()</code>
              <span>use it</span>
            </button>
          </section>
        );
      })}

      <button
        type="button"
        className="routines__new"
        disabled={!canCreate}
        onClick={props.onCreate}
      >
        <IconPlus width={16} height={16} />
        {canCreate
          ? 'New routine'
          : `Routine limit reached (${rules.max})`}
      </button>
    </div>
  );
}
