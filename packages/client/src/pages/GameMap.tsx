import { Link, useParams } from 'react-router-dom';
import { getGame, parseBoard } from '@logiq/engine';
import type { LevelDef } from '@logiq/engine';
import { IconArrowRight, IconBack, IconCheck, IconLock } from '../components/Icons';
import { StarRow } from '../components/StarRow';
import { ThemeToggle } from '../components/ThemeToggle';
import { usePlayer } from '../lib/player';
import './gamemap.css';

/** A tiny abstract preview of the map, enough to hint at the shape of a level. */
function LevelMinimap({ level }: { level: LevelDef }) {
  const board = parseBoard(level);
  return (
    <div
      className="minimap"
      style={{ '--cols': board.width, '--rows': board.height } as React.CSSProperties}
      aria-hidden
    >
      {board.tiles.map((row, y) =>
        row.map((tile, x) => (
          <span key={`${x}-${y}`} className={`minimap__cell minimap__cell--${tile.kind}`} />
        )),
      )}
    </div>
  );
}

export function GameMap() {
  const { gameId = '' } = useParams();
  const player = usePlayer();
  const game = getGame(gameId);

  if (!game) {
    return (
      <div className="gamemap gamemap--missing">
        <p>That game does not exist.</p>
        <Link className="btn" to="/">
          Back to the library
        </Link>
      </div>
    );
  }

  const stars = player.starsInGame(game.id);
  const max = game.levels.length * 3;
  const solved = game.levels.filter((level) => player.progressFor(game.id, level.id)).length;

  return (
    <div className="gamemap" data-accent={game.accent}>
      <header className="gamemap__head">
        <div className="gamemap__nav">
          <Link className="btn btn--ghost" to="/">
            <IconBack width={18} height={18} />
            Library
          </Link>
          <ThemeToggle />
        </div>
        <div className="gamemap__intro">
          <p className="eyebrow">{game.tagline}</p>
          <h1 className="gamemap__title">{game.title}</h1>
          <p className="gamemap__body">{game.description}</p>
          <div className="gamemap__stats">
            <span className="tag">
              <StarRow value={Math.min(3, Math.ceil((stars / max) * 3))} size={13} />
              {stars} / {max} stars
            </span>
            <span className="tag">
              {solved} of {game.levels.length} levels solved
            </span>
            {!player.online && <span className="tag">Offline — progress saved on this device</span>}
          </div>
        </div>
      </header>

      <ol className="levels">
        {game.levels.map((level, index) => {
          const best = player.progressFor(game.id, level.id);
          const previous = game.levels[index - 1];
          const unlocked = index === 0 || !!player.progressFor(game.id, previous?.id ?? '');
          const content = (
            <>
              <div className="levelcard__top">
                <span className="levelcard__index">{String(index + 1).padStart(2, '0')}</span>
                {best ? (
                  <StarRow value={best.stars} size={14} />
                ) : unlocked ? (
                  <span className="levelcard__state">Unsolved</span>
                ) : (
                  <IconLock width={15} height={15} />
                )}
              </div>

              <LevelMinimap level={level} />

              <div className="levelcard__text">
                <h2>{level.title}</h2>
                <p>{level.brief}</p>
              </div>

              <div className="levelcard__foot">
                <span className="levelcard__concept">{level.concepts[0]}</span>
                {best ? (
                  <span className="levelcard__best">
                    <IconCheck width={14} height={14} />
                    {best.bestBlocks} blocks
                  </span>
                ) : unlocked ? (
                  <span className="levelcard__go">
                    Solve
                    <IconArrowRight width={14} height={14} />
                  </span>
                ) : (
                  <span className="levelcard__concept">Solve the level before</span>
                )}
              </div>
            </>
          );

          return (
            <li key={level.id}>
              {unlocked ? (
                <Link className="levelcard" to={`/play/${game.id}/${level.id}`}>
                  {content}
                </Link>
              ) : (
                <div className="levelcard levelcard--locked" aria-disabled>
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
