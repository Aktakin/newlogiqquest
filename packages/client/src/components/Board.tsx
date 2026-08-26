import { useMemo } from 'react';
import { parseBoard } from '@logiq/engine';
import type { LevelDef } from '@logiq/engine';
import { Fly, Frog, GoldenLily, LilyPad, Rock, Splash, tileSeed } from './PondArt';
import './board.css';

export type FrogMood = 'idle' | 'hop' | 'turn' | 'sink' | 'blocked' | 'win';

export interface FrogView {
  x: number;
  y: number;
  /** Cumulative rotation in degrees, so a turn never spins the long way round. */
  angle: number;
  /** Increments on every animated step to retrigger the hop keyframes. */
  tick: number;
  mood: FrogMood;
}

interface BoardProps {
  level: LevelDef;
  frog: FrogView;
  fliesLeft: string[];
  visited: string[];
}

export function Board({ level, frog, fliesLeft, visited }: BoardProps) {
  const board = useMemo(() => parseBoard(level), [level]);
  const remaining = useMemo(() => new Set(fliesLeft), [fliesLeft]);
  const trail = useMemo(() => new Set(visited), [visited]);

  return (
    <div
      className="board"
      style={{ '--cols': board.width, '--rows': board.height } as React.CSSProperties}
    >
      <div className="board__grid">
        {board.tiles.map((row, y) =>
          row.map((tile, x) => {
            const seed = tileSeed(x, y);
            const isStart = board.start.x === x && board.start.y === y;
            const onTrail = trail.has(`${x},${y}`);
            return (
              <div
                key={`${x}-${y}`}
                className={`tile tile--${tile.kind}${onTrail ? ' tile--trail' : ''}`}
                style={{ '--delay': `${(x + y) * 26}ms` } as React.CSSProperties}
              >
                {tile.kind === 'pad' && <LilyPad seed={seed} />}
                {tile.kind === 'rock' && <Rock seed={seed} />}
                {tile.kind === 'goal' && <GoldenLily />}
                {isStart && <span className="tile__start" aria-hidden />}
                {tile.fly && remaining.has(`${x},${y}`) && <Fly />}
                {onTrail && <span className="tile__ripple" aria-hidden />}
              </div>
            );
          }),
        )}
      </div>

      <div
        className={`frog frog--${frog.mood}`}
        style={{ '--x': frog.x, '--y': frog.y } as React.CSSProperties}
      >
        <div className="frog__shadow" />
        <div className="frog__spin" style={{ transform: `rotate(${frog.angle}deg)` }}>
          <div className="frog__lift" key={frog.tick}>
            <Frog />
          </div>
        </div>
        {frog.mood === 'sink' && (
          <div className="frog__splash">
            <Splash />
          </div>
        )}
      </div>
    </div>
  );
}
