/** Difficulty band. Drives both the payout and how often a prompt is drawn. */
export type Tier = 1 | 2 | 3;

export interface TokenPrompt {
  id: string;
  kind: 'token';
  /** The exact string the player has to reproduce, case and all. */
  answer: string;
  /** Where a developer would meet this token, e.g. "environment variable". */
  label: string;
  tier: Tier;
}

export interface QuizPrompt {
  id: string;
  kind: 'quiz';
  /** What the player is being asked, e.g. "What is printed?". */
  ask: string;
  /** Optional snippet shown above the choices. */
  code?: string;
  /** Two to four answers to choose between. */
  options: string[];
  /** Index of the right answer in `options`. */
  correct: number;
  /** `pill` for short answers, `code` for choosing between two snippets. */
  layout: 'pill' | 'code';
  /** One line explaining why, shown after the answer is graded. */
  explain: string;
  tier: Tier;
}

export type CipherPrompt = TokenPrompt | QuizPrompt;

export interface CipherGrade {
  correct: boolean;
  expected: string;
  /** Payout before bonuses, or the penalty when wrong. */
  base: number;
  speedBonus: number;
  streakBonus: number;
  /** Signed change to the player's balance. */
  delta: number;
}

export interface CipherRunSummary {
  balance: number;
  cracked: number;
  failed: number;
  bestStreak: number;
  earned: number;
  lost: number;
}
