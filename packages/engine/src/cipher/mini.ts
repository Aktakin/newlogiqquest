import { MINI_PROMPTS, MINI_QUIZZES, MINI_TOKENS } from './mini-bank';
import type { CipherPrompt } from './types';

export * from './mini-bank';

/** Keep letter hints on longer for beginners. */
export const MINI_HINT_CRACKS = 12;
/** A fun question every few typing rounds. */
export const MINI_QUIZ_EVERY = 3;

export const miniCaseHintsActive = (cracked: number) => cracked < MINI_HINT_CRACKS;

/** Generous timers — kids read and hunt for keys more slowly. */
export function timeLimitForMini(prompt: CipherPrompt): number {
  if (prompt.kind === 'quiz') return 35000;
  if (prompt.answer.length === 5) return 25000;
  return 15000 + prompt.answer.length * 900;
}

export interface MiniDrawOptions {
  round: number;
  cracked: number;
  recentIds?: string[];
  random?: () => number;
}

export function drawMiniPrompt({
  round,
  cracked,
  recentIds = [],
  random = Math.random,
}: MiniDrawOptions): CipherPrompt {
  const wantsQuiz = (round + 1) % MINI_QUIZ_EVERY === 0;
  const source = wantsQuiz ? MINI_QUIZZES : MINI_TOKENS;

  // Stay on short words for a long time; only stretch after many correct words.
  const maxLen = cracked < 6 ? 4 : cracked < 14 ? 5 : cracked < 22 ? 6 : 8;
  const sized =
    source === MINI_TOKENS
      ? MINI_TOKENS.filter((token) => token.answer.length <= maxLen)
      : source;

  const pool = sized.length ? sized : source;
  const fresh = pool.filter((prompt) => !recentIds.includes(prompt.id));
  const choices = fresh.length ? fresh : pool;

  return choices[Math.floor(random() * choices.length)] ?? MINI_PROMPTS[0]!;
}
