import { useEffect } from 'react';
import type { LevelDef, Program, RunResult } from '@logiq/engine';
import { toTypeScript, xpFor } from '@logiq/engine';
import { IconArrowRight, IconRestart, IconTarget } from './Icons';
import { StarRow } from './StarRow';

interface ResultCardProps {
  result: RunResult;
  level: LevelDef;
  program: Program;
  hasNext: boolean;
  onRetry: () => void;
  onNext: () => void;
  onReplay: () => void;
}

const HEADLINE: Record<string, string> = {
  success: 'Solved',
  sink: 'Splash!',
  blocked: 'Bump!',
  incomplete: 'Not quite there',
  hungry: 'One fly short',
  overflow: 'Runaway loop',
  invalid: 'Check the rules',
};

const COACHING: Record<string, string> = {
  sink: 'Count the pads between the frog and its target before adding hops — a hop into open water always ends the run.',
  blocked: 'The frog stopped where the rock is. Turn before that square and go around it.',
  incomplete: 'Your instructions all ran, but the frog ran out of them early. Step through the program to see where it stopped.',
  hungry: 'The golden lily only counts once every fly is gone. Add a detour for the ones you missed.',
  overflow: 'A loop repeated far more than it needed to. Lower the counter or shrink what is inside it.',
  invalid: 'Adjust the script to fit the level rules, then run it again.',
};

export function ResultCard({
  result,
  level,
  program,
  hasNext,
  onRetry,
  onNext,
  onReplay,
}: ResultCardProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onRetry();
      if (event.key === 'Enter' && result.success && hasNext) onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onRetry, onNext, result.success, hasNext]);

  const perfect = result.stars === 3;

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={HEADLINE[result.status]}>
      <div className="sheet__scrim" onClick={onRetry} />
      <div className={`sheet__card sheet__card--${result.success ? 'win' : 'lose'}`}>
        {result.success ? (
          <>
            <StarRow value={result.stars} size={34} animate />
            <h2 className="sheet__title">
              {perfect ? 'Perfect run' : HEADLINE.success}
            </h2>
            <p className="sheet__body">
              {perfect
                ? `You matched the target of ${level.par} blocks. That is the tightest solution there is.`
                : `You used ${result.blocksUsed} blocks. The three-star target is ${level.par} — see if you can find a shorter way.`}
            </p>

            <dl className="sheet__stats">
              <div>
                <dt>Blocks</dt>
                <dd>{result.blocksUsed}</dd>
              </div>
              <div>
                <dt>Target</dt>
                <dd>{level.par}</dd>
              </div>
              <div>
                <dt>XP earned</dt>
                <dd>+{xpFor(level, result.stars)}</dd>
              </div>
            </dl>

            <div className="sheet__code">
              <p className="eyebrow">The code you just wrote</p>
              <pre>{toTypeScript(program)}</pre>
            </div>

            <div className="sheet__actions">
              <button type="button" className="btn btn--ghost" onClick={onReplay}>
                <IconRestart width={16} height={16} />
                Watch again
              </button>
              <button type="button" className="btn btn--ghost" onClick={onRetry}>
                Keep tinkering
              </button>
              {hasNext && (
                <button type="button" className="btn btn--primary" onClick={onNext}>
                  Next level
                  <IconArrowRight width={16} height={16} />
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="sheet__title">{HEADLINE[result.status] ?? 'Try again'}</h2>
            <p className="sheet__body">{result.message}</p>
            <p className="sheet__coaching">
              <IconTarget width={16} height={16} />
              <span>{COACHING[result.status] ?? level.hint}</span>
            </p>
            <div className="sheet__actions">
              <button type="button" className="btn btn--primary" onClick={onRetry}>
                <IconRestart width={16} height={16} />
                Try again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
