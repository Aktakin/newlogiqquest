import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MAZE_LEVELS,
  createMaze,
  getMazeLevel,
  moveFrog,
  reshuffleMaze,
  resetFrog,
  type MazeFacing,
  type MazeState,
} from '@logiq/engine';
import { IconBack, IconHop, IconRestart, IconTurnLeft, IconTurnRight } from '../components/Icons';
import { Frog, GoldenLily } from '../components/PondArt';
import { ThemeToggle } from '../components/ThemeToggle';
import './maze.css';

const PROGRESS_KEY = 'logiq.maze.progress.v1';

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

function facingToDeg(facing: MazeFacing): number {
  return facing * 90;
}

export function MazeRunner() {
  const [levelId, setLevelId] = useState(1);
  const [cleared, setCleared] = useState(() => readCleared());
  const [state, setState] = useState<MazeState>(() => createMaze(1));
  const level = getMazeLevel(levelId) ?? MAZE_LEVELS[0]!;

  const loadLevel = useCallback((id: number, seed?: number) => {
    const next = createMaze(id, seed);
    setLevelId(id);
    setState(next);
  }, []);

  useEffect(() => {
    if (!state.won) return;
    writeCleared(state.levelId);
    setCleared((prev) => Math.max(prev, state.levelId));
  }, [state.won, state.levelId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (state.won) return;
      const key = event.key.toLowerCase();
      let facing: MazeFacing | null = null;
      if (key === 'arrowup' || key === 'w') facing = 0;
      else if (key === 'arrowright' || key === 'd') facing = 1;
      else if (key === 'arrowdown' || key === 's') facing = 2;
      else if (key === 'arrowleft' || key === 'a') facing = 3;
      if (facing === null) return;
      event.preventDefault();
      setState((current) => moveFrog(current, facing!));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.won]);

  const efficiency = useMemo(() => {
    if (!state.won || state.optimal <= 0) return null;
    return Math.round((state.optimal / Math.max(1, state.moves)) * 100);
  }, [state.won, state.optimal, state.moves]);

  const maxUnlocked = Math.min(MAZE_LEVELS.length, Math.max(1, cleared + 1));

  return (
    <div className="maze" data-accent="mint">
      <header className="maze__bar">
        <Link to="/" className="btn maze__back">
          <IconBack width={16} height={16} />
          Home
        </Link>
        <div className="maze__brand">
          <span className="maze__mark" aria-hidden>
            <Frog />
          </span>
          <div className="maze__titles">
            <span className="maze__name">Maze Runner</span>
            <span className="maze__sub">Hop start → golden lily</span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div className="maze__toolbar">
        <div className="maze__level">
          <span className="maze__level-label">Level</span>
          <strong>
            {level.id}
            <span className="maze__level-of"> / {MAZE_LEVELS.length}</span>
          </strong>
          <span className="maze__level-title">{level.title}</span>
        </div>
          <p className="maze__blurb">
            {level.blurb}
            {state.branching ? ' Three exits from start — only one reaches the lily.' : ''}
          </p>
        <div className="maze__actions">
          <button type="button" className="btn" onClick={() => setState((s) => reshuffleMaze(s))}>
            <IconRestart width={15} height={15} />
            New maze
          </button>
          <button type="button" className="btn" onClick={() => setState((s) => resetFrog(s))} disabled={state.won}>
            Reset frog
          </button>
        </div>
      </div>

      <div className="maze__stage">
        <aside className="maze-rail">
          <div className="maze-stat">
            <span className="maze-stat__label">Moves</span>
            <strong className="maze-stat__value">{state.moves}</strong>
          </div>
          <div className="maze-stat">
            <span className="maze-stat__label">Best path</span>
            <strong className="maze-stat__value maze-stat__value--muted">{state.optimal}</strong>
          </div>
          <div className="maze-stat">
            <span className="maze-stat__label">Explored</span>
            <strong className="maze-stat__value maze-stat__value--muted">
              {state.visited.length}
            </strong>
          </div>

          <nav className="maze-levels" aria-label="Levels">
            {MAZE_LEVELS.map((entry) => {
              const locked = entry.id > maxUnlocked;
              return (
                <button
                  key={entry.id}
                  type="button"
                  className={[
                    'maze-levels__btn',
                    entry.id === levelId ? 'is-active' : '',
                    entry.id <= cleared ? 'is-cleared' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={locked}
                  onClick={() => loadLevel(entry.id)}
                  title={locked ? 'Clear the previous level first' : entry.title}
                >
                  {entry.id}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="maze-board-wrap">
          <div
            className="maze-board"
            style={{ gridTemplateColumns: `repeat(${state.size}, 1fr)` }}
            role="img"
            aria-label={`Maze level ${level.id}`}
          >
            {state.grid.flatMap((row, y) =>
              row.map((open, x) => {
                const key = `${x},${y}`;
                const isStart = x === state.start.x && y === state.start.y;
                const isGoal = x === state.goal.x && y === state.goal.y;
                const isFrog = x === state.frog.x && y === state.frog.y;
                const isVisited = state.visited.includes(key);
                return (
                  <span
                    key={key}
                    className={[
                      'mcell',
                      open ? 'mcell--path' : 'mcell--wall',
                      isVisited && open ? 'mcell--visited' : '',
                      isStart ? 'mcell--start' : '',
                      isGoal ? 'mcell--goal' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {isGoal && !isFrog && (
                      <span className="mcell__goal">
                        <GoldenLily />
                      </span>
                    )}
                    {isStart && !isFrog && <span className="mcell__tag mcell__tag--start">Start</span>}
                    {isGoal && !isFrog && <span className="mcell__tag mcell__tag--end">End</span>}
                    {isFrog && (
                      <span
                        className="mcell__frog"
                        style={{ transform: `rotate(${facingToDeg(state.facing)}deg)` }}
                      >
                        <Frog />
                      </span>
                    )}
                  </span>
                );
              }),
            )}
          </div>

          {state.won && (
            <div className="maze-win" role="dialog" aria-modal="true">
              <div className="maze-win__card">
                <h2 className="maze-win__title">Lily reached</h2>
                <p className="maze-win__line">
                  {state.moves} hops
                  {efficiency !== null && <> · {efficiency}% of the shortest path</>}
                </p>
                <div className="maze-win__actions">
                  {levelId < MAZE_LEVELS.length ? (
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => loadLevel(levelId + 1)}
                    >
                      <IconHop width={16} height={16} />
                      Next level
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => loadLevel(1, Date.now())}
                    >
                      Play again
                    </button>
                  )}
                  <button type="button" className="btn" onClick={() => setState((s) => reshuffleMaze(s))}>
                    <IconRestart width={15} height={15} />
                    New maze here
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="maze-rail maze-rail--controls">
          <p className="maze-hint">Arrow keys or WASD to hop. Walls block — plan the corridor.</p>
          <div className="maze-pad" aria-label="Move controls">
            <button
              type="button"
              className="maze-pad__btn maze-pad__btn--n"
              onClick={() => setState((s) => moveFrog(s, 0))}
              disabled={state.won}
              aria-label="Hop north"
            >
              <IconHop width={18} height={18} />
            </button>
            <button
              type="button"
              className="maze-pad__btn maze-pad__btn--w"
              onClick={() => setState((s) => moveFrog(s, 3))}
              disabled={state.won}
              aria-label="Hop west"
            >
              <IconTurnLeft width={18} height={18} />
            </button>
            <button
              type="button"
              className="maze-pad__btn maze-pad__btn--e"
              onClick={() => setState((s) => moveFrog(s, 1))}
              disabled={state.won}
              aria-label="Hop east"
            >
              <IconTurnRight width={18} height={18} />
            </button>
            <button
              type="button"
              className="maze-pad__btn maze-pad__btn--s"
              onClick={() => setState((s) => moveFrog(s, 2))}
              disabled={state.won}
              aria-label="Hop south"
            >
              <IconHop width={18} height={18} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
