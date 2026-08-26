import type { Program } from '@logiq/engine';

export interface RemoteWallet {
  balance: number;
  cracked: number;
  failed: number;
  bestStreak: number;
}

export interface RemotePlayer {
  id: string;
  name: string;
  xp: number;
  progress: Record<string, { stars: number; bestBlocks: number; attempts: number; solvedAt: string | null }>;
  cipher?: RemoteWallet;
}

export interface AttemptResponse {
  result: {
    status: string;
    success: boolean;
    message: string;
    stars: number;
    blocksUsed: number;
  };
  xpGained: number;
  player: RemotePlayer;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return (await response.json()) as T;
}

export const api = {
  createPlayer: (name: string) =>
    request<{ player: RemotePlayer }>('/players', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  getPlayer: (id: string) => request<{ player: RemotePlayer }>(`/players/${id}`),

  submitAttempt: (playerId: string, gameId: string, levelId: string, program: Program) =>
    request<AttemptResponse>(`/players/${playerId}/attempts`, {
      method: 'POST',
      body: JSON.stringify({ gameId, levelId, program }),
    }),

  submitCipher: (
    playerId: string,
    round: { promptId: string; typed: string; elapsedMs: number; streak: number },
  ) =>
    request<{ grade: { correct: boolean; delta: number }; wallet: RemoteWallet }>(
      `/players/${playerId}/cipher`,
      { method: 'POST', body: JSON.stringify(round) },
    ),

  leaderboard: () =>
    request<{ entries: Array<{ id: string; name: string; xp: number; solved: number }> }>(
      '/leaderboard',
    ),
};
