import { useCallback, useMemo, useRef, useState, type CSSProperties, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  KEYBOARD_LEVELS,
  QWERTY_LAYOUT,
  allSlotsFilled,
  createPuzzle,
  gradeKeyboard,
  keyById,
  type KeyboardGrade,
  type KeySpec,
} from '@logiq/engine';
import { IconArrowRight, IconBack, IconRestart, IconTarget } from '../components/Icons';
import { ThemeToggle } from '../components/ThemeToggle';
import { play as playCue } from '../lib/sfx';
import './keyboard.css';

const PROGRESS_KEY = 'logiq.keyboard.progress.v1';
const DRAG_MIME = 'application/x-frogiq-key';

type DragSource = { from: 'bank'; keyId: string } | { from: 'slot'; slotId: string; keyId: string };

function readDragSource(event: DragEvent, fallback: DragSource | null): DragSource | null {
  try {
    const raw = event.dataTransfer.getData(DRAG_MIME);
    if (raw) return JSON.parse(raw) as DragSource;
  } catch {
    /* ignore */
  }
  return fallback;
}

function writeDragSource(event: DragEvent, source: DragSource) {
  event.dataTransfer.setData(DRAG_MIME, JSON.stringify(source));
  event.dataTransfer.effectAllowed = 'move';
}

function readCleared(): number {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw) as { cleared?: number };
    return typeof data.cleared === 'number' ? data.cleared : 0;
  } catch {
    return 0;
  }
}

function writeCleared(levelId: number) {
  try {
    const cleared = Math.max(readCleared(), levelId);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ cleared }));
  } catch {
    /* ignore */
  }
}

function KeyFace({ spec, variant }: { spec: KeySpec; variant?: 'ref' | 'placed' }) {
  const classes = [
    'kbd-key',
    variant === 'ref' ? 'kbd-key--ref' : '',
    spec.kind === 'modifier' ? 'kbd-key--modifier' : '',
    spec.kind === 'space' ? 'kbd-key--space' : '',
    variant === 'placed' ? 'kbd-key--placed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={{ '--key-units': spec.width } as CSSProperties}>
      {spec.label}
    </div>
  );
}

function ReferenceBoard() {
  return (
    <div className="kbd-board kbd-board--ref" aria-label="Reference keyboard">
      {QWERTY_LAYOUT.map((row, rowIndex) => (
        <div key={rowIndex} className="kbd-row">
          {row.keys.map((spec) => (
            <KeyFace key={spec.id} spec={spec} variant="ref" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function KeyboardLab() {
  const [levelId, setLevelId] = useState(1);
  const [cleared, setCleared] = useState(() => readCleared());
  const [started, setStarted] = useState(false);
  const [puzzle, setPuzzle] = useState(() => createPuzzle(1));
  const [placement, setPlacement] = useState<Record<string, string | null>>({});
  const [bank, setBank] = useState<KeySpec[]>(() => puzzle.bank);
  const [grade, setGrade] = useState<KeyboardGrade | null>(null);
  const [dragging, setDragging] = useState<DragSource | null>(null);
  const [overSlot, setOverSlot] = useState<string | null>(null);
  const [overBank, setOverBank] = useState(false);
  const dragRef = useRef<DragSource | null>(null);

  const level = puzzle.level;
  const hiddenSet = useMemo(() => new Set(level.hidden), [level.hidden]);
  const reviewing = grade !== null;
  const maxUnlocked = Math.min(KEYBOARD_LEVELS.length, Math.max(1, cleared + 1));

  const loadLevel = useCallback((id: number) => {
    const next = createPuzzle(id);
    setLevelId(id);
    setPuzzle(next);
    setPlacement({});
    setBank(next.bank);
    setGrade(null);
    setDragging(null);
    dragRef.current = null;
  }, []);

  const begin = useCallback(() => {
    loadLevel(levelId);
    setStarted(true);
  }, [levelId, loadLevel]);

  const returnToBank = useCallback((keyId: string) => {
    const spec = keyById(keyId);
    if (!spec) return;
    setBank((current) => [...current, spec]);
  }, []);

  const removeFromBank = useCallback((keyId: string) => {
    setBank((current) => current.filter((key) => key.id !== keyId));
  }, []);

  const placeKey = useCallback(
    (slotId: string, keyId: string) => {
      setPlacement((current) => {
        const displaced = current[slotId];
        if (displaced) returnToBank(displaced);
        return { ...current, [slotId]: keyId };
      });
      removeFromBank(keyId);
      setGrade(null);
    },
    [removeFromBank, returnToBank],
  );

  const clearSlot = useCallback(
    (slotId: string) => {
      setPlacement((current) => {
        const keyId = current[slotId];
        if (keyId) returnToBank(keyId);
        return { ...current, [slotId]: null };
      });
      setGrade(null);
    },
    [returnToBank],
  );

  const onDragStart = useCallback((event: DragEvent, source: DragSource) => {
    dragRef.current = source;
    setDragging(source);
    writeDragSource(event, source);
  }, []);

  const onDragEnd = useCallback(() => {
    setDragging(null);
    setOverSlot(null);
    setOverBank(false);
    window.setTimeout(() => {
      dragRef.current = null;
    }, 0);
  }, []);

  const handleDropOnSlot = useCallback(
    (slotId: string, event: DragEvent) => {
      const source = readDragSource(event, dragRef.current);
      if (!source) return;

      if (source.from === 'bank') {
        placeKey(slotId, source.keyId);
      } else {
        const existing = placement[slotId];
        if (source.slotId === slotId) return;
        setPlacement((current) => {
          const next = { ...current, [source.slotId]: existing ?? null };
          next[slotId] = source.keyId;
          return next;
        });
        setGrade(null);
      }
      onDragEnd();
    },
    [onDragEnd, placeKey, placement],
  );

  const handleDropOnBank = useCallback(
    (event: DragEvent) => {
      const source = readDragSource(event, dragRef.current);
      if (!source) return;

      if (source.from === 'slot') {
        clearSlot(source.slotId);
      }
      onDragEnd();
    },
    [clearSlot, onDragEnd],
  );

  const checkAnswer = useCallback(() => {
    const result = gradeKeyboard(puzzle.slots, placement);
    setGrade(result);
    playCue(result.correct ? 'eat' : 'fail');
    if (result.correct) {
      writeCleared(levelId);
      setCleared((prev) => Math.max(prev, levelId));
    }
  }, [levelId, placement, puzzle.slots]);

  const canCheck = allSlotsFilled(puzzle.slots, placement) && !reviewing;

  const nextLevel = useCallback(() => {
    const next = Math.min(KEYBOARD_LEVELS.length, levelId + 1);
    if (next <= maxUnlocked || next === levelId + 1) {
      loadLevel(next);
    }
  }, [levelId, loadLevel, maxUnlocked]);

  if (!started) {
    return (
      <div className="kbd" data-accent="violet">
        <header className="kbd__bar">
          <Link to="/" className="btn kbd__back">
            <IconBack width={16} height={16} />
            Home
          </Link>
          <div className="kbd__brand">
            <span className="kbd__name">Key Lab</span>
            <span className="kbd__sub">Learn the keyboard layout</span>
          </div>
          <ThemeToggle />
        </header>

        <div className="kbd-brief">
          <div className="kbd-brief__icon" aria-hidden>
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} />
            ))}
          </div>
          <h1 className="kbd-brief__title">Build the keyboard</h1>
          <p className="kbd-brief__line">
            Study the full reference layout, then drag keys from the bank into the empty slots on
            your board.
          </p>
          <ul className="kbd-brief__rules">
            <li>Use the labelled keyboard above as your guide</li>
            <li>Drag keys into the dashed slots on the board below</li>
            <li>Drop a key back in the bank to remove it from a slot</li>
            <li>Check your answer when every slot is filled</li>
          </ul>
          <button type="button" className="btn btn--primary" onClick={begin}>
            Start level 1
            <IconArrowRight width={16} height={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="kbd" data-accent="violet">
      <header className="kbd__bar">
        <Link to="/" className="btn kbd__back">
          <IconBack width={16} height={16} />
          Home
        </Link>
        <div className="kbd__brand">
          <span className="kbd__name">Key Lab</span>
          <span className="kbd__sub">Learn the keyboard layout</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="kbd__toolbar">
        <div className="kbd__level">
          <span className="kbd__level-label">Level</span>
          <strong>
            {level.id}
            <span className="kbd__level-of"> / {KEYBOARD_LEVELS.length}</span>
          </strong>
          <span className="kbd__level-title">{level.title}</span>
        </div>
        <p className="kbd__blurb">{level.blurb}</p>
        <div className="kbd__actions">
          <button type="button" className="btn" onClick={() => loadLevel(levelId)}>
            <IconRestart width={15} height={15} />
            Shuffle
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={checkAnswer}
            disabled={!canCheck}
          >
            <IconTarget width={15} height={15} />
            Check
          </button>
        </div>
      </div>

      <div className="kbd__stage">
        <section className="kbd-panel">
          <div className="kbd-panel__head">
            <h2 className="kbd-panel__title">Reference</h2>
            <p className="kbd-panel__hint">Full keyboard — use this as your guide</p>
          </div>
          <ReferenceBoard />
        </section>

        <section className="kbd-panel">
          <div className="kbd-panel__head">
            <h2 className="kbd-panel__title">Your board</h2>
            <p className="kbd-panel__hint">Drag keys into the dashed slots</p>
          </div>
          <div
            className="kbd-board kbd-board--work"
            aria-label="Keyboard to fill"
            onDragOver={(event) => {
              if (reviewing) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }}
          >
            {QWERTY_LAYOUT.map((row, rowIndex) => (
              <div key={rowIndex} className="kbd-row">
                {row.keys.map((spec) => {
                  const isHidden = hiddenSet.has(spec.id);
                  if (!isHidden) {
                    return <KeyFace key={spec.id} spec={spec} variant="ref" />;
                  }

                  const placedId = placement[spec.id];
                  const placed = placedId ? keyById(placedId) : null;
                  const isWrong = reviewing && grade && placedId !== spec.id;
                  const isCorrect = reviewing && grade?.correct && placedId === spec.id;
                  const isDraggingThis =
                    dragging?.from === 'slot' && dragging.slotId === spec.id;

                  if (placed) {
                    return (
                      <div
                        key={spec.id}
                        className={`kbd-key kbd-key--placed${isDraggingThis ? ' kbd-key--dragging' : ''}${spec.kind === 'modifier' ? ' kbd-key--modifier' : ''}${spec.kind === 'space' ? ' kbd-key--space' : ''}`}
                        style={{ '--key-units': spec.width } as CSSProperties}
                        draggable={!reviewing}
                        data-wrong={isWrong || undefined}
                        data-correct={isCorrect || undefined}
                        onDragStart={(event) => {
                          onDragStart(event, { from: 'slot', slotId: spec.id, keyId: placed.id });
                        }}
                        onDragEnd={onDragEnd}
                        onDoubleClick={() => !reviewing && clearSlot(spec.id)}
                        title="Double-click to return to bank"
                      >
                        {placed.label}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={spec.id}
                      className="kbd-key kbd-key--slot"
                      style={{ '--key-units': spec.width } as CSSProperties}
                      data-over={overSlot === spec.id || undefined}
                      data-wrong={isWrong || undefined}
                      onDragOver={(event) => {
                        if (reviewing) return;
                        event.preventDefault();
                        event.stopPropagation();
                        event.dataTransfer.dropEffect = 'move';
                        setOverSlot(spec.id);
                      }}
                      onDragLeave={() => setOverSlot((current) => (current === spec.id ? null : current))}
                      onDrop={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (!reviewing) handleDropOnSlot(spec.id, event);
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <section className="kbd-bank">
          <h2 className="kbd-bank__title">Key bank — drag from here</h2>
          <div
            className="kbd-bank__keys"
            data-over={overBank || undefined}
            onDragOver={(event) => {
              if (reviewing) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              if (dragging?.from === 'slot') setOverBank(true);
            }}
            onDragLeave={() => setOverBank(false)}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (!reviewing) handleDropOnBank(event);
            }}
          >
            {bank.map((spec) => {
              const isDraggingThis = dragging?.from === 'bank' && dragging.keyId === spec.id;
              return (
                <div
                  key={spec.id}
                  role="button"
                  tabIndex={reviewing ? -1 : 0}
                  className={`kbd-chip${isDraggingThis ? ' kbd-chip--dragging' : ''}${spec.kind === 'modifier' || spec.kind === 'space' ? ' kbd-chip--modifier' : ''}`}
                  draggable={!reviewing}
                  onDragStart={(event) => {
                    onDragStart(event, { from: 'bank', keyId: spec.id });
                  }}
                  onDragEnd={onDragEnd}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') event.preventDefault();
                  }}
                >
                  {spec.label}
                </div>
              );
            })}
            {bank.length === 0 && (
              <span className="kbd-panel__hint">All keys placed — hit Check</span>
            )}
          </div>
        </section>

        {grade && (
          <div className="kbd-verdict" data-state={grade.correct ? 'win' : 'fail'}>
            <p className="kbd-verdict__text">
              {grade.correct ? (
                <>
                  <strong>Perfect!</strong> Every key is in the right place.
                </>
              ) : (
                <>
                  <strong>Not quite.</strong> {grade.wrong.length} key
                  {grade.wrong.length === 1 ? '' : 's'} in the wrong slot — try again or shuffle.
                </>
              )}
            </p>
            {grade.correct && levelId < KEYBOARD_LEVELS.length ? (
              <button type="button" className="btn btn--primary" onClick={nextLevel}>
                Next level
                <IconArrowRight width={16} height={16} />
              </button>
            ) : (
              <button type="button" className="btn" onClick={() => setGrade(null)}>
                Try again
              </button>
            )}
          </div>
        )}

        <nav className="kbd-levels" aria-label="Levels">
          {KEYBOARD_LEVELS.map((entry) => {
            const locked = entry.id > maxUnlocked;
            return (
              <button
                key={entry.id}
                type="button"
                className="kbd-levels__btn"
                data-active={entry.id === levelId || undefined}
                disabled={locked}
                onClick={() => !locked && loadLevel(entry.id)}
                title={entry.title}
              >
                {entry.id}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
