import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Program } from '@logiq/engine';
import { SEED_BALANCE } from '@logiq/engine';
import { api } from './api';

export interface ProgressEntry {
  stars: number;
  bestBlocks: number;
}

export interface Wallet {
  balance: number;
  cracked: number;
  failed: number;
  bestStreak: number;
}

const emptyWallet = (): Wallet => ({
  balance: SEED_BALANCE,
  cracked: 0,
  failed: 0,
  bestStreak: 0,
});

interface PlayerState {
  id: string | null;
  name: string;
  xp: number;
  progress: Record<string, ProgressEntry>;
  wallet: Wallet;
}

interface PlayerContextValue extends PlayerState {
  /** False when the API is unreachable; play carries on against local storage. */
  online: boolean;
  setName: (name: string) => void;
  recordSolve: (input: {
    gameId: string;
    levelId: string;
    program: Program;
    stars: number;
    blocksUsed: number;
    xp: number;
  }) => void;
  progressFor: (gameId: string, levelId: string) => ProgressEntry | undefined;
  starsInGame: (gameId: string) => number;
  recordCipherRound: (input: {
    promptId: string;
    typed: string;
    elapsedMs: number;
    streak: number;
    delta: number;
    correct: boolean;
  }) => void;
}

const STORAGE_KEY = 'logiq.player.v1';
const PlayerContext = createContext<PlayerContextValue | null>(null);

function readLocal(): PlayerState {
  const blank: PlayerState = {
    id: null,
    name: 'Explorer',
    xp: 0,
    progress: {},
    wallet: emptyWallet(),
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<PlayerState>;
      return { ...blank, ...saved, wallet: { ...blank.wallet, ...saved.wallet } };
    }
  } catch {
    /* corrupt or unavailable storage just means a fresh start */
  }
  return blank;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlayerState>(readLocal);
  const [online, setOnline] = useState(true);
  const registering = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Adopt a server profile once, then keep the local copy as the fast path.
  useEffect(() => {
    if (registering.current) return;
    registering.current = true;

    const sync = async () => {
      try {
        if (state.id) {
          const { player } = await api.getPlayer(state.id);
          setState((current) => ({
            ...current,
            xp: Math.max(current.xp, player.xp),
            wallet: player.cipher ?? current.wallet,
          }));
        } else {
          const { player } = await api.createPlayer(state.name);
          setState((current) => ({ ...current, id: player.id }));
        }
        setOnline(true);
      } catch {
        setOnline(false);
      }
    };

    void sync();
  }, [state.id, state.name]);

  const recordSolve = useCallback<PlayerContextValue['recordSolve']>(
    ({ gameId, levelId, program, stars, blocksUsed, xp }) => {
      const key = `${gameId}/${levelId}`;

      setState((current) => {
        const previous = current.progress[key];
        if (previous && previous.stars >= stars && previous.bestBlocks <= blocksUsed) return current;
        return {
          ...current,
          xp: current.xp + (previous && previous.stars >= stars ? 0 : xp),
          progress: {
            ...current.progress,
            [key]: {
              stars: Math.max(previous?.stars ?? 0, stars),
              bestBlocks: Math.min(previous?.bestBlocks ?? Number.MAX_SAFE_INTEGER, blocksUsed),
            },
          },
        };
      });

      const playerId = state.id;
      if (!playerId) return;
      api
        .submitAttempt(playerId, gameId, levelId, program)
        .then(({ player }) => {
          setOnline(true);
          setState((current) => ({ ...current, xp: Math.max(current.xp, player.xp) }));
        })
        .catch(() => setOnline(false));
    },
    [state.id],
  );

  const recordCipherRound = useCallback<PlayerContextValue['recordCipherRound']>(
    ({ promptId, typed, elapsedMs, streak, delta, correct }) => {
      const nextStreak = correct ? streak + 1 : 0;
      setState((current) => ({
        ...current,
        wallet: {
          balance: Math.max(0, current.wallet.balance + delta),
          cracked: current.wallet.cracked + (correct ? 1 : 0),
          failed: current.wallet.failed + (correct ? 0 : 1),
          bestStreak: Math.max(current.wallet.bestStreak, nextStreak),
        },
      }));

      const playerId = state.id;
      if (!playerId) return;
      api
        .submitCipher(playerId, { promptId, typed, elapsedMs, streak })
        .then(({ wallet }) => {
          setOnline(true);
          // The server prices the round, so its wallet wins any disagreement.
          setState((current) => ({ ...current, wallet }));
        })
        .catch(() => setOnline(false));
    },
    [state.id],
  );

  const value = useMemo<PlayerContextValue>(
    () => ({
      ...state,
      online,
      setName: (name: string) => setState((current) => ({ ...current, name })),
      recordSolve,
      recordCipherRound,
      progressFor: (gameId, levelId) => state.progress[`${gameId}/${levelId}`],
      starsInGame: (gameId) =>
        Object.entries(state.progress)
          .filter(([key]) => key.startsWith(`${gameId}/`))
          .reduce((sum, [, entry]) => sum + entry.stars, 0),
    }),
    [state, online, recordSolve, recordCipherRound],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used inside <PlayerProvider>');
  return context;
}
