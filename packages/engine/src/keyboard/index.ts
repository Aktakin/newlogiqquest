import { ALL_KEYS, keyById, QWERTY_LAYOUT } from './layout';
import { getKeyboardLevel, KEYBOARD_LEVELS } from './levels';
import type { KeyboardGrade, KeyboardPuzzle, KeySpec } from './types';

export * from './types';
export { QWERTY_LAYOUT, ALL_KEYS, keyById } from './layout';
export { KEYBOARD_LEVELS, getKeyboardLevel } from './levels';

function shuffle<T>(items: T[], random = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function createPuzzle(levelId: number, random = Math.random): KeyboardPuzzle {
  const level = getKeyboardLevel(levelId) ?? KEYBOARD_LEVELS[0]!;
  const hiddenSet = new Set(level.hidden);
  const bank = shuffle(
    level.hidden.map((id) => keyById(id)).filter((key): key is KeySpec => Boolean(key)),
    random,
  );

  return {
    level,
    bank,
    slots: level.hidden,
  };
}

export function isSlotHidden(levelId: number, keyId: string): boolean {
  const level = getKeyboardLevel(levelId);
  return level?.hidden.includes(keyId) ?? false;
}

export interface PlacementMap {
  [slotId: string]: string | null;
}

export function gradeKeyboard(slots: string[], placement: PlacementMap): KeyboardGrade {
  const wrong: string[] = [];
  let placed = 0;

  for (const slotId of slots) {
    const answer = placement[slotId];
    if (!answer) continue;
    placed += 1;
    if (answer !== slotId) wrong.push(slotId);
  }

  return {
    correct: placed === slots.length && wrong.length === 0,
    placed,
    total: slots.length,
    wrong,
  };
}

export function allSlotsFilled(slots: string[], placement: PlacementMap): boolean {
  return slots.every((slotId) => Boolean(placement[slotId]));
}
