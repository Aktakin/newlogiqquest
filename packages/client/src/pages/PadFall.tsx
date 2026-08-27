import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  cellsOf,
  createPadGame,
  ghostY,
  hardDrop,
  holdPiece,
  moveHorizontal,
  previewMatrix,
  rotateActive,
  softDrop,
  tickGravity,
  togglePause,
  type PadColor,
  type PadState,
  type QueuedPiece,
} from '@logiq/engine';
import { IconBack, IconPause, IconPlay, IconRestart } from '../components/Icons';
import { ThemeToggle } from '../components/ThemeToggle';
import './padfall.css';

const BEST_KEY = 'logiq.padfall.best.v1';

function readBest(): number {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return 0;
    const map = JSON.parse(raw) as Record<string, number>;
    return Math.max(0, map.score ?? map.hard ?? 0);
  } catch {
    return 0;
  }
}

function writeBest(score: number) {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    const previous = Math.max(0, map.score ?? map.hard ?? 0);
    if (previous < score) {
      map.score = score;
      localStorage.setItem(BEST_KEY, JSON.stringify(map));
    }
  } catch {
    /* ignore */
  }
}

function MiniPiece({ piece }: { piece: QueuedPiece }) {
  const matrix = previewMatrix(piece.kind);
  return (
    <div className={`mini mini--${piece.color}`} aria-hidden>
      {matrix.flatMap((row, y) =>
        row.map((on, x) =>
          on ? <span key={`${x}-${y}`} className="mini__cell" style={{ gridColumn: x + 1, gridRow: y + 1 }} /> : null,
        ),
      )}
    </div>
  );
}

function Board({ state }: { state: PadState }) {
  const flash = useMemo(() => {
    const set = new Set<string>();
    for (const cell of state.lastClear?.cells ?? []) set.add(`${cell.x},${cell.y}`);
    return set;
  }, [state.lastClear]);

  const activeCells = useMemo(() => {
    if (!state.active) return new Map<string, PadColor>();
    const map = new Map<string, PadColor>();
    for (const cell of cellsOf(state.active)) {
      if (cell.y < 0) continue;
      map.set(`${cell.x},${cell.y}`, cell.color);
    }
    return map;
  }, [state.active]);

  const ghostCells = useMemo(() => {
    if (!state.active) return new Set<string>();
    const gy = ghostY(state);
    const ghost = { ...state.active, y: gy };
    const set = new Set<string>();
    for (const cell of cellsOf(ghost)) {
      if (cell.y < 0) continue;
      const key = `${cell.x},${cell.y}`;
      if (!activeCells.has(key)) set.add(key);
    }
    return set;
  }, [state, activeCells]);

  const tiles = [];
  for (let y = 0; y < state.rows; y += 1) {
    for (let x = 0; x < state.cols; x += 1) {
      const key = `${x},${y}`;
      const locked = state.board[y * state.cols + x];
      const falling = activeCells.get(key);
      const color = falling ?? locked?.color;
      const isGhost = !color && ghostCells.has(key);
      const isFlash = flash.has(key);
      tiles.push(
        <span
          key={key}
          className={[
            'pad',
            color ? `pad--${color}` : '',
            falling ? 'pad--live' : '',
            isGhost ? `pad--ghost pad--ghost-${state.active?.color ?? 'mint'}` : '',
            isFlash ? 'pad--flash' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />,
      );
    }
  }

  return (
    <div
      className="well"
      style={{ gridTemplateColumns: `repeat(${state.cols}, 1fr)`, gridTemplateRows: `repeat(${state.rows}, 1fr)` }}
      role="img"
      aria-label="Tetris board"
    >
      {tiles}
    </div>
  );
}

export function PadFall() {
  const [state, setState] = useState<PadState>(() => createPadGame());
  const [best, setBest] = useState(() => readBest());
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (state.over || state.score > best) {
      writeBest(state.score);
      if (state.score > best) setBest(state.score);
    }
  }, [state, best]);

  const apply = useCallback((fn: (s: PadState) => PadState) => {
    setState((current) => fn(current));
  }, []);

  useEffect(() => {
    if (state.paused || state.over) return;
    const id = window.setInterval(() => {
      const current = stateRef.current;
      if (!current || current.paused || current.over) return;
      setState(tickGravity(current));
    }, state.gravityMs);
    return () => window.clearInterval(id);
  }, [state.gravityMs, state.paused, state.over]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const current = stateRef.current;
      if (!current) return;
      const key = event.key.toLowerCase();

      if (key === 'p' || key === 'escape') {
        event.preventDefault();
        apply(togglePause);
        return;
      }
      if (current.paused || current.over) return;

      if (key === 'arrowleft' || key === 'a') {
        event.preventDefault();
        apply((s) => moveHorizontal(s, -1));
      } else if (key === 'arrowright' || key === 'd') {
        event.preventDefault();
        apply((s) => moveHorizontal(s, 1));
      } else if (key === 'arrowdown' || key === 's') {
        event.preventDefault();
        apply(softDrop);
      } else if (key === 'arrowup' || key === 'w' || key === 'x') {
        event.preventDefault();
        apply((s) => rotateActive(s, 1));
      } else if (key === 'z') {
        event.preventDefault();
        apply((s) => rotateActive(s, -1));
      } else if (key === ' ') {
        event.preventDefault();
        apply(hardDrop);
      } else if (key === 'c' || key === 'shift') {
        event.preventDefault();
        apply(holdPiece);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [apply]);

  return (
    <div className="padfall" data-accent="sky">
      <header className="padfall__bar">
        <Link to="/" className="btn padfall__back">
          <IconBack width={16} height={16} />
          Home
        </Link>
        <div className="padfall__title">
          <span className="padfall__mode">Tetris</span>
          <span className="padfall__tag">Five colours · match &amp; clear</span>
        </div>
        <div className="padfall__tools">
          <ThemeToggle />
        </div>
      </header>

      <div className="padfall__stage">
        <aside className="rail rail--left">
          <div className="stat">
            <span className="stat__label">Hold</span>
            <div className="stat__box">
              {state.hold ? <MiniPiece piece={state.hold} /> : <span className="stat__empty">C</span>}
            </div>
          </div>
          <div className="stat">
            <span className="stat__label">Score</span>
            <strong className="stat__value">{state.score.toLocaleString('en-US')}</strong>
          </div>
          <div className="stat">
            <span className="stat__label">Best</span>
            <strong className="stat__value stat__value--muted">{best.toLocaleString('en-US')}</strong>
          </div>
          <div className="stat-row">
            <div className="stat">
              <span className="stat__label">Lines</span>
              <strong className="stat__value">{state.lines}</strong>
            </div>
            <div className="stat">
              <span className="stat__label">Matches</span>
              <strong className="stat__value">{state.matches}</strong>
            </div>
            <div className="stat">
              <span className="stat__label">Level</span>
              <strong className="stat__value">{state.level}</strong>
            </div>
          </div>
        </aside>

        <div className="padfall__board-wrap">
          <Board state={state} />
          {state.paused && !state.over && (
            <div className="pause-chip" role="status">
              <span className="pause-chip__label">Paused — study the board &amp; next five</span>
              <button type="button" className="btn btn--primary pause-chip__btn" onClick={() => apply(togglePause)}>
                <IconPlay width={14} height={14} />
                Resume
              </button>
            </div>
          )}
          {state.over && (
            <div className="veil" role="dialog" aria-modal="true">
              <div className="veil__card">
                <h2 className="veil__title">Pond full</h2>
                <p className="veil__line">
                  The pads stacked too high. Try another run — and use the next-five peek next time.
                </p>
                <div className="veil__actions">
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => {
                      setState(createPadGame());
                    }}
                  >
                    <IconRestart width={16} height={16} />
                    New run
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="rail rail--right">
          <div className="stat">
            <span className="stat__label">Next five</span>
            <ol className="queue">
              {state.queue.map((piece, index) => (
                <li key={`${piece.kind}-${piece.color}-${index}`} className="queue__item">
                  <span className="queue__n">{index + 1}</span>
                  <MiniPiece piece={piece} />
                </li>
              ))}
            </ol>
          </div>

          <div className="controls">
            <button
              type="button"
              className="btn btn--primary controls__pause"
              onClick={() => apply(togglePause)}
              disabled={state.over}
            >
              {state.paused ? <IconPlay width={16} height={16} /> : <IconPause width={16} height={16} />}
              {state.paused ? 'Resume' : 'Pause'}
            </button>
            <p className="controls__hint">
              ← → move · ↑ rotate · ↓ soft · Space drop · C hold · P pause
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
