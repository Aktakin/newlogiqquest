import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Frame } from '@logiq/engine';
import type { FrogMood, FrogView } from '../components/Board';

export type Phase = 'idle' | 'playing' | 'paused' | 'finished';

/** Per-event pacing: turns are quick, failures linger so the player can read them. */
const DURATION: Record<Frame['event'], number> = {
  start: 220,
  hop: 320,
  turnLeft: 230,
  turnRight: 230,
  eat: 300,
  goal: 520,
  sink: 720,
  blocked: 480,
};

const MOOD: Record<Frame['event'], FrogMood> = {
  start: 'idle',
  hop: 'hop',
  turnLeft: 'turn',
  turnRight: 'turn',
  eat: 'hop',
  goal: 'win',
  sink: 'sink',
  blocked: 'blocked',
};

export interface RunnerView {
  index: number;
  phase: Phase;
  speed: number;
  frame: Frame | undefined;
  frog: FrogView;
  visited: string[];
  atEnd: boolean;
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBack: () => void;
  restart: () => void;
  setSpeed: (speed: number) => void;
}

/**
 * Plays back an execution trace. The engine has already decided what happens;
 * this only decides when the player gets to see it.
 */
export function useRunner(frames: Frame[] | null, startFrog: FrogView): RunnerView {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    setIndex(0);
    setPhase(frames && frames.length > 1 ? 'playing' : 'idle');
  }, [frames]);

  const last = frames ? frames.length - 1 : 0;

  useEffect(() => {
    if (phase !== 'playing' || !frames) return undefined;
    if (index >= last) {
      setPhase('finished');
      return undefined;
    }
    const next = frames[index + 1];
    const delay = (next ? DURATION[next.event] : 260) / speed;
    const timer = window.setTimeout(() => setIndex((current) => current + 1), delay);
    return () => window.clearTimeout(timer);
  }, [phase, index, last, frames, speed]);

  /** Cumulative rotation, so west -> north turns 90 degrees and not 270. */
  const angles = useMemo(() => {
    if (!frames?.length) return [startFrog.angle];
    let angle = frames[0] ? frames[0].frog.dir * 90 : startFrog.angle;
    return frames.map((frame) => {
      if (frame.event === 'turnLeft') angle -= 90;
      if (frame.event === 'turnRight') angle += 90;
      return angle;
    });
  }, [frames, startFrog.angle]);

  const frame = frames?.[index];

  const frog: FrogView = frame
    ? {
        x: frame.frog.x,
        y: frame.frog.y,
        angle: angles[index] ?? startFrog.angle,
        tick: index,
        mood: MOOD[frame.event],
      }
    : startFrog;

  const visited = useMemo(() => {
    if (!frames) return [];
    const seen = new Set<string>();
    for (let i = 0; i <= index && i < frames.length; i += 1) {
      const at = frames[i];
      if (at && at.event !== 'sink') seen.add(`${at.frog.x},${at.frog.y}`);
    }
    return [...seen];
  }, [frames, index]);

  const play = useCallback(() => setPhase((current) => (current === 'finished' ? current : 'playing')), []);
  const pause = useCallback(() => setPhase((current) => (current === 'playing' ? 'paused' : current)), []);
  const stepForward = useCallback(() => {
    setPhase('paused');
    setIndex((current) => Math.min(current + 1, last));
  }, [last]);
  const stepBack = useCallback(() => {
    setPhase('paused');
    setIndex((current) => Math.max(current - 1, 0));
  }, []);
  const restart = useCallback(() => {
    setIndex(0);
    setPhase(frames && frames.length > 1 ? 'playing' : 'idle');
  }, [frames]);

  return {
    index,
    phase,
    speed,
    frame,
    frog,
    visited,
    atEnd: index >= last,
    play,
    pause,
    stepForward,
    stepBack,
    restart,
    setSpeed,
  };
}
