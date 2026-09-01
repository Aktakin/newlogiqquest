import { PROMPTS, QUIZZES, TOKENS, promptById } from './bank';
import { miniPromptById } from './mini-bank';
import type { CipherGrade, CipherPrompt, Tier } from './types';

export * from './types';
export { PROMPTS, QUIZZES, TOKENS, promptById };
export * from './mini';

/** Looks up a prompt from either the full or mini bank. */
export const resolvePromptById = (id: string): CipherPrompt | undefined =>
  promptById(id) ?? miniPromptById(id);

/** Mini mode reuses the same payout rules. */
export { gradeCipher as gradeCipherMini };

/** Seed money, so an early mistake costs something without ending the run. */
export const SEED_BALANCE = 500;
/** Uppercase and lowercase are tinted differently for this many cracks. */
export const HINT_CRACKS = 5;
/** A JavaScript question replaces the token on every nth round. */
export const QUIZ_EVERY = 4;

const TIER_MULTIPLIER: Record<Tier, number> = { 1: 1, 2: 1.45, 3: 2 };

const round5 = (value: number) => Math.round(value / 5) * 5;

export const caseHintsActive = (cracked: number) => cracked < HINT_CRACKS;

/**
 * How long the player has before the round is lost. Typing time scales with
 * the token; a question is a fixed window because reading is the slow part.
 */
export function timeLimitFor(prompt: CipherPrompt): number {
  if (prompt.kind === 'quiz') return 20000;
  return 9000 + prompt.answer.length * 480;
}

/** Beat this and the payout carries a speed bonus. */
const speedTarget = (prompt: CipherPrompt) => timeLimitFor(prompt) * 0.45;

/** Difficulty ramps with successful cracks, not with time spent. */
function tierFor(cracked: number, roll: number): Tier {
  if (cracked < 4) return 1;
  if (cracked < 10) return roll < 0.5 ? 1 : 2;
  if (cracked < 18) return roll < 0.55 ? 2 : 3;
  return roll < 0.25 ? 2 : 3;
}

export interface DrawOptions {
  /** Zero-based index of the round about to be played. */
  round: number;
  cracked: number;
  /** Recently seen ids, so the same prompt does not come round twice quickly. */
  recentIds?: string[];
  random?: () => number;
}

export function drawPrompt({
  round,
  cracked,
  recentIds = [],
  random = Math.random,
}: DrawOptions): CipherPrompt {
  const wantsQuiz = (round + 1) % QUIZ_EVERY === 0;
  const tier = tierFor(cracked, random());
  const source = wantsQuiz ? QUIZZES : TOKENS;

  const inTier = source.filter((prompt) => prompt.tier === tier);
  const pool = inTier.length ? inTier : source;
  const fresh = pool.filter((prompt) => !recentIds.includes(prompt.id));
  const choices = fresh.length ? fresh : pool;

  return choices[Math.floor(random() * choices.length)] ?? (PROMPTS[0] as CipherPrompt);
}

export const expectedAnswer = (prompt: CipherPrompt): string =>
  prompt.kind === 'token' ? prompt.answer : (prompt.options[prompt.correct] ?? '');

/** What a quiz answer looks like on the wire: the chosen option's index. */
export const choiceToAnswer = (index: number) => String(index);

/** The submission that would score, used to preview what a round is worth. */
export const winningSubmission = (prompt: CipherPrompt): string =>
  prompt.kind === 'token' ? prompt.answer : choiceToAnswer(prompt.correct);

export interface GradeOptions {
  /** Consecutive correct answers before this one. */
  streak: number;
  elapsedMs: number;
}

/**
 * Grades an attempt and prices it. A token is compared exactly apart from
 * surrounding whitespace — case and punctuation are the whole point. A quiz
 * answer arrives as the index of the option the player selected.
 */
export function gradeCipher(
  prompt: CipherPrompt,
  typed: string,
  { streak, elapsedMs }: GradeOptions,
): CipherGrade {
  const attempt = typed.trim();
  const multiplier = TIER_MULTIPLIER[prompt.tier];
  const expected = expectedAnswer(prompt);

  const correct =
    prompt.kind === 'token'
      ? attempt === prompt.answer
      : Number.parseInt(attempt, 10) === prompt.correct;

  const base =
    prompt.kind === 'token'
      ? round5((28 + prompt.answer.length * 3) * multiplier)
      : round5(150 * multiplier);

  if (!correct) {
    // A two-way question is a coin flip, so a wrong guess has to hurt more.
    const rate =
      prompt.kind === 'token' ? 0.5 : prompt.options.length === 2 ? 0.8 : 0.55;
    return { correct, expected, base, speedBonus: 0, streakBonus: 0, delta: -round5(base * rate) };
  }

  const speedBonus = elapsedMs <= speedTarget(prompt) ? round5(base * 0.3) : 0;
  const streakBonus = round5(base * 0.05 * Math.min(streak, 8));
  return { correct, expected, base, speedBonus, streakBonus, delta: base + speedBonus + streakBonus };
}

/** Balances never go negative: being broke should not mean being stuck. */
export const applyDelta = (balance: number, delta: number) => Math.max(0, balance + delta);
