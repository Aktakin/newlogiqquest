import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  countBlocks,
  getGame,
  getLevel,
  parseBoard,
  run,
  xpFor,
} from '@logiq/engine';
import type { BlockKind, Frame, Program, RunResult } from '@logiq/engine';
import { Board } from '../components/Board';
import type { FrogView } from '../components/Board';
import { CodePanel } from '../components/CodePanel';
import {
  IconBack,
  IconBlocks,
  IconBulb,
  IconCode,
  IconPause,
  IconPlay,
  IconRestart,
  IconStep,
  IconStepBack,
  IconTarget,
  IconTrash,
} from '../components/Icons';
import { Palette } from '../components/Palette';
import { ResultCard } from '../components/ResultCard';
import { RoutineShelf } from '../components/RoutineShelf';
import { ScriptList } from '../components/ScriptEditor';
import { StarRow } from '../components/StarRow';
import { ThemeToggle } from '../components/ThemeToggle';
import { DragProvider, useDrag } from '../lib/dragContext';
import { usePlayer } from '../lib/player';
import {
  MAIN,
  createBlock,
  createRoutine,
  insertBlock,
  locate,
  moveBlock,
  removeBlock,
  removeRoutine,
  renameRoutine,
  setRepeatTimes,
} from '../lib/program';
import type { ContainerId } from '../lib/program';
import { play as playCue } from '../lib/sfx';
import { useRunner } from '../lib/useRunner';
import './play.css';

const emptyProgram = (): Program => ({ main: [], routines: [] });

export function Play() {
  return (
    <DragProvider>
      <PlayInner />
    </DragProvider>
  );
}

function PlayInner() {
  const { gameId = '', levelId = '' } = useParams();
  const navigate = useNavigate();
  const player = usePlayer();
  const { payload, setPayload } = useDrag();

  const game = getGame(gameId);
  const level = getLevel(gameId, levelId);

  const [program, setProgram] = useState<Program>(emptyProgram);
  const [activeContainer, setActiveContainer] = useState<ContainerId>(MAIN);
  const [frames, setFrames] = useState<Frame[] | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<'blocks' | 'code'>('blocks');
  const [hintOpen, setHintOpen] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const recorded = useRef<string | null>(null);

  const board = useMemo(() => (level ? parseBoard(level) : null), [level]);

  const startFrog: FrogView = useMemo(
    () =>
      board
        ? { x: board.start.x, y: board.start.y, angle: board.start.dir * 90, tick: 0, mood: 'idle' }
        : { x: 0, y: 0, angle: 0, tick: 0, mood: 'idle' },
    [board],
  );

  const runner = useRunner(frames, startFrog);

  const reset = useCallback(() => {
    setProgram(emptyProgram());
    setActiveContainer(MAIN);
    setFrames(null);
    setResult(null);
    setNotice(null);
    setShowResult(false);
    setHintOpen(false);
    recorded.current = null;
  }, []);

  useEffect(() => {
    reset();
  }, [gameId, levelId, reset]);

  // Sound follows the animation rather than the program, so stepping is audible too.
  useEffect(() => {
    const frame = runner.frame;
    if (!frame || runner.index === 0) return;
    if (frame.event === 'hop') playCue('hop');
    else if (frame.event === 'turnLeft' || frame.event === 'turnRight') playCue('turn');
    else if (frame.event === 'eat') playCue('eat');
    else if (frame.event === 'goal') playCue('win');
    else if (frame.event === 'sink' || frame.event === 'blocked') playCue('fail');
  }, [runner.frame, runner.index]);

  useEffect(() => {
    if (runner.phase !== 'finished' || !result) return;
    const timer = window.setTimeout(() => setShowResult(true), result.success ? 620 : 420);
    return () => window.clearTimeout(timer);
  }, [runner.phase, result]);

  useEffect(() => {
    if (!level || !result?.success || runner.phase !== 'finished') return;
    const stamp = `${gameId}/${levelId}/${result.blocksUsed}/${result.stars}`;
    if (recorded.current === stamp) return;
    recorded.current = stamp;
    player.recordSolve({
      gameId,
      levelId,
      program,
      stars: result.stars,
      blocksUsed: result.blocksUsed,
      xp: xpFor(level, result.stars),
    });
  }, [result, runner.phase, level, gameId, levelId, player, program]);

  if (!game || !level || !board) {
    return (
      <div className="play play--missing">
        <p>That level does not exist.</p>
        <Link className="btn" to="/">
          Back to the library
        </Link>
      </div>
    );
  }

  const blocksUsed = countBlocks(program);
  const budget = level.maxBlocks;
  const overBudget = !!budget && blocksUsed > budget;
  const isRunning = frames !== null;
  const repeatRange = level.repeatRange ?? [2, 10];
  const best = player.progressFor(gameId, levelId);
  const levelIndex = game.levels.findIndex((entry) => entry.id === levelId);
  const nextLevel = game.levels[levelIndex + 1];

  const stopPlayback = () => {
    setFrames(null);
    setResult(null);
    setShowResult(false);
  };

  const mutate = (next: Program) => {
    stopPlayback();
    setNotice(null);
    setProgram(next);
  };

  const targetContainer = (): ContainerId => {
    if (activeContainer === MAIN) return MAIN;
    // A routine or loop the player deleted should not swallow new blocks.
    if (program.routines.some((routine) => routine.id === activeContainer)) return activeContainer;
    return locate(program, activeContainer) ? activeContainer : MAIN;
  };

  const handleAdd = (kind: BlockKind, fnId?: string) => {
    playCue('click');
    mutate(insertBlock(program, targetContainer(), createBlock(kind, fnId ? { fnId } : {})));
  };

  const handleDropAt = (containerId: ContainerId, index: number) => {
    if (!payload) return;
    if (payload.source === 'palette') {
      const block = createBlock(payload.kind, payload.fnId ? { fnId: payload.fnId } : {});
      mutate(insertBlock(program, containerId, block, index));
    } else {
      mutate(moveBlock(program, payload.blockId, containerId, index));
    }
    setPayload(null);
  };

  const handleNudge = (blockId: string, delta: number) => {
    const spot = locate(program, blockId);
    if (!spot) return;
    mutate(moveBlock(program, blockId, spot.containerId, spot.index + (delta > 0 ? 2 : -1)));
  };

  const handleRun = () => {
    const outcome = run(level, program);
    if (outcome.status === 'invalid') {
      setNotice(outcome.message);
      playCue('fail');
      return;
    }
    setNotice(null);
    setShowResult(false);
    setResult(outcome);
    setFrames(outcome.frames);
  };

  const goNext = () => {
    if (nextLevel) navigate(`/play/${gameId}/${nextLevel.id}`);
    else navigate(`/game/${gameId}`);
  };

  const numbering = { next: 0 };

  const activeRoutine = program.routines.find((routine) => routine.id === activeContainer);
  const activeLabel = activeRoutine ? `${activeRoutine.name}()` : 'the repeat block';

  const editorProps = {
    routines: program.routines,
    activeContainer,
    onActivate: setActiveContainer,
    onDropAt: handleDropAt,
    onRemove: (blockId: string) => mutate(removeBlock(program, blockId)),
    onTimes: (blockId: string, times: number) => mutate(setRepeatTimes(program, blockId, times)),
    onNudge: handleNudge,
    runningBlockId: runner.frame?.blockId,
    runningTrail: runner.frame?.trail ?? [],
    repeatRange: repeatRange as [number, number],
  };

  return (
    <div className="play" data-accent={game.accent}>
      <header className="play__bar">
        <Link className="btn btn--ghost play__back" to={`/game/${gameId}`}>
          <IconBack width={18} height={18} />
          {game.title}
        </Link>

        <nav className="play__rail" aria-label="Levels">
          {game.levels.map((entry, index) => {
            const entryBest = player.progressFor(gameId, entry.id);
            const unlocked =
              index === 0 || !!player.progressFor(gameId, game.levels[index - 1]?.id ?? '');
            return (
              <Link
                key={entry.id}
                to={`/play/${gameId}/${entry.id}`}
                className={`rail__node${entry.id === levelId ? ' rail__node--current' : ''}${
                  entryBest ? ' rail__node--done' : ''
                }${unlocked ? '' : ' rail__node--locked'}`}
                title={`${index + 1}. ${entry.title}`}
                aria-current={entry.id === levelId ? 'page' : undefined}
              >
                {index + 1}
              </Link>
            );
          })}
        </nav>

        <div className="play__score">
          <StarRow value={best?.stars ?? 0} size={15} />
          <span className="play__xp">{player.xp} XP</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="play__grid">
        <section className="panel play__toolkit">
          <div className="panel__head">
            <h2 className="panel__title">
              <IconBlocks width={16} height={16} />
              Toolkit
            </h2>
            <span className={`play__budget${overBudget ? ' play__budget--over' : ''}`}>
              {blocksUsed}
              {budget ? ` / ${budget}` : ''} blocks
            </span>
          </div>

          <div className="play__toolkit-body scroll">
            <Palette kinds={level.palette} onAdd={(kind) => handleAdd(kind)} />

            {level.routines && (
              <>
                <div className="play__divider">
                  <span>Routines</span>
                </div>
                <RoutineShelf
                  {...editorProps}
                  program={program}
                  rules={level.routines}
                  onRename={(routineId, name) => mutate(renameRoutine(program, routineId, name))}
                  onDelete={(routineId) => mutate(removeRoutine(program, routineId))}
                  onCreate={() => {
                    const index = program.routines.length;
                    const suggested = level.routines?.suggestedNames?.[index];
                    const routine = createRoutine(suggested ?? `routine${index + 1}`, index);
                    mutate({ ...program, routines: [...program.routines, routine] });
                    setActiveContainer(routine.id);
                  }}
                  onCall={(routineId) => handleAdd('call', routineId)}
                />
              </>
            )}
          </div>
        </section>

        <section className="play__stage">
          <div className="play__brief">
            <p className="eyebrow">
              Level {levelIndex + 1} of {game.levels.length} · {level.concepts.join(' · ')}
            </p>
            <h1 className="play__title">{level.title}</h1>
            <p className="play__objective">{level.brief}</p>
          </div>

          <div
            className="play__boardwrap"
            style={{ '--cols': board.width, '--rows': board.height } as React.CSSProperties}
          >
            <Board
              level={level}
              frog={runner.frog}
              fliesLeft={runner.frame?.fliesLeft ?? board.flies}
              visited={runner.visited}
            />
          </div>

          <div className="play__status" role="status">
            {notice ? (
              <span className="play__notice">{notice}</span>
            ) : runner.frame && runner.index > 0 ? (
              <span className="play__step">{runner.frame.note}</span>
            ) : (
              <span className="play__legend">
                <span className="legend__item legend__item--pad">Lily pad</span>
                <span className="legend__item legend__item--water">Deep water</span>
                <span className="legend__item legend__item--rock">Rock</span>
                <span className="legend__item legend__item--goal">Golden lily</span>
                {board.flies.length > 0 && (
                  <span className="legend__item legend__item--fly">Fly ×{board.flies.length}</span>
                )}
              </span>
            )}
          </div>

          <div className="play__controls">
            <button
              type="button"
              className="btn btn--primary play__run"
              onClick={handleRun}
              disabled={program.main.length === 0}
            >
              <IconPlay width={16} height={16} />
              Run program
            </button>

            <div className="transport">
              <button
                type="button"
                className="btn btn--icon"
                onClick={runner.stepBack}
                disabled={!isRunning || runner.index === 0}
                aria-label="Step back"
              >
                <IconStepBack width={16} height={16} />
              </button>
              <button
                type="button"
                className="btn btn--icon"
                onClick={runner.phase === 'playing' ? runner.pause : runner.play}
                disabled={!isRunning || runner.atEnd}
                aria-label={runner.phase === 'playing' ? 'Pause' : 'Resume'}
              >
                {runner.phase === 'playing' ? (
                  <IconPause width={16} height={16} />
                ) : (
                  <IconPlay width={16} height={16} />
                )}
              </button>
              <button
                type="button"
                className="btn btn--icon"
                onClick={runner.stepForward}
                disabled={!isRunning || runner.atEnd}
                aria-label="Step forward"
              >
                <IconStep width={16} height={16} />
              </button>
              <button
                type="button"
                className="btn btn--icon"
                onClick={stopPlayback}
                disabled={!isRunning}
                aria-label="Reset the pond"
              >
                <IconRestart width={16} height={16} />
              </button>
              <div className="transport__speed" role="group" aria-label="Playback speed">
                {[0.5, 1, 2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    className={runner.speed === rate ? 'is-on' : ''}
                    onClick={() => runner.setSpeed(rate)}
                  >
                    {rate}×
                  </button>
                ))}
              </div>
            </div>
          </div>

          <details
            className="play__lesson"
            open={hintOpen}
            onToggle={(event) => setHintOpen((event.target as HTMLDetailsElement).open)}
          >
            <summary>
              <IconBulb width={16} height={16} />
              What this level is teaching
              <span className="play__lesson-cue">{hintOpen ? 'Hide' : 'Show'}</span>
            </summary>
            <p className="play__lesson-body">{level.lesson}</p>
            <p className="play__hint">
              <IconTarget width={15} height={15} />
              <span>{level.hint}</span>
            </p>
          </details>
        </section>

        <section className="panel play__script">
          <div className="panel__head">
            <div className="tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'blocks'}
                className={tab === 'blocks' ? 'is-on' : ''}
                onClick={() => setTab('blocks')}
              >
                <IconBlocks width={15} height={15} />
                Script
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'code'}
                className={tab === 'code' ? 'is-on' : ''}
                onClick={() => setTab('code')}
              >
                <IconCode width={15} height={15} />
                TypeScript
              </button>
            </div>
            <button
              type="button"
              className="btn btn--ghost play__clear"
              onClick={reset}
              disabled={blocksUsed === 0}
            >
              <IconTrash width={15} height={15} />
              Clear
            </button>
          </div>

          {tab === 'blocks' && activeContainer !== MAIN && (
            <button type="button" className="play__target" onClick={() => setActiveContainer(MAIN)}>
              New blocks go into <strong>{activeLabel}</strong>
              <span>back to main script</span>
            </button>
          )}

          <div className="play__script-body scroll">
            {tab === 'blocks' ? (
              <ScriptList
                {...editorProps}
                containerId={MAIN}
                blocks={program.main}
                depth={0}
                numbering={numbering}
                emptyHint="Click a block on the left, or drag one here, to start your program."
              />
            ) : (
              <CodePanel
                program={program}
                activeBlockId={runner.frame?.blockId}
                trail={runner.frame?.trail ?? []}
              />
            )}
          </div>

          <footer className="play__script-foot">
            <span>
              Target: <strong>{level.par}</strong> blocks for three stars
            </span>
            {best && <span className="play__best">Best: {best.bestBlocks}</span>}
          </footer>
        </section>
      </main>

      {showResult && result && (
        <ResultCard
          result={result}
          level={level}
          program={program}
          hasNext={!!nextLevel}
          onRetry={() => {
            setShowResult(false);
            stopPlayback();
          }}
          onNext={goNext}
          onReplay={() => {
            setShowResult(false);
            runner.restart();
          }}
        />
      )}
    </div>
  );
}
