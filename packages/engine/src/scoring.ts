import type { LevelDef } from './types';

/**
 * Three stars means the player found a solution as tight as the intended one.
 * The middle band is deliberately generous: finishing should always feel good.
 */
export function starsFor(level: LevelDef, blocksUsed: number): 1 | 2 | 3 {
  if (blocksUsed <= level.par) return 3;
  if (blocksUsed <= level.par + Math.max(2, Math.round(level.par * 0.4))) return 2;
  return 1;
}

export function xpFor(level: LevelDef, stars: number): number {
  const base = 40 + level.index * 10;
  return Math.round(base * (0.6 + 0.2 * stars));
}
