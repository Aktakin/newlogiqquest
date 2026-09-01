import type { KeyboardRow } from './types';

/** Full ANSI QWERTY — every key a learner might see on a real keyboard. */
export const QWERTY_LAYOUT: KeyboardRow[] = [
  {
    keys: [
      { id: 'grave', label: '`', width: 1, kind: 'symbol' },
      { id: '1', label: '1', width: 1, kind: 'number' },
      { id: '2', label: '2', width: 1, kind: 'number' },
      { id: '3', label: '3', width: 1, kind: 'number' },
      { id: '4', label: '4', width: 1, kind: 'number' },
      { id: '5', label: '5', width: 1, kind: 'number' },
      { id: '6', label: '6', width: 1, kind: 'number' },
      { id: '7', label: '7', width: 1, kind: 'number' },
      { id: '8', label: '8', width: 1, kind: 'number' },
      { id: '9', label: '9', width: 1, kind: 'number' },
      { id: '0', label: '0', width: 1, kind: 'number' },
      { id: 'minus', label: '-', width: 1, kind: 'symbol' },
      { id: 'equal', label: '=', width: 1, kind: 'symbol' },
      { id: 'backspace', label: '⌫', width: 2, kind: 'modifier' },
    ],
  },
  {
    keys: [
      { id: 'tab', label: 'Tab', width: 1.5, kind: 'modifier' },
      { id: 'q', label: 'Q', width: 1, kind: 'letter' },
      { id: 'w', label: 'W', width: 1, kind: 'letter' },
      { id: 'e', label: 'E', width: 1, kind: 'letter' },
      { id: 'r', label: 'R', width: 1, kind: 'letter' },
      { id: 't', label: 'T', width: 1, kind: 'letter' },
      { id: 'y', label: 'Y', width: 1, kind: 'letter' },
      { id: 'u', label: 'U', width: 1, kind: 'letter' },
      { id: 'i', label: 'I', width: 1, kind: 'letter' },
      { id: 'o', label: 'O', width: 1, kind: 'letter' },
      { id: 'p', label: 'P', width: 1, kind: 'letter' },
      { id: 'lbracket', label: '[', width: 1, kind: 'symbol' },
      { id: 'rbracket', label: ']', width: 1, kind: 'symbol' },
      { id: 'backslash', label: '\\', width: 1.5, kind: 'symbol' },
    ],
  },
  {
    keys: [
      { id: 'caps', label: 'Caps', width: 1.75, kind: 'modifier' },
      { id: 'a', label: 'A', width: 1, kind: 'letter' },
      { id: 's', label: 'S', width: 1, kind: 'letter' },
      { id: 'd', label: 'D', width: 1, kind: 'letter' },
      { id: 'f', label: 'F', width: 1, kind: 'letter' },
      { id: 'g', label: 'G', width: 1, kind: 'letter' },
      { id: 'h', label: 'H', width: 1, kind: 'letter' },
      { id: 'j', label: 'J', width: 1, kind: 'letter' },
      { id: 'k', label: 'K', width: 1, kind: 'letter' },
      { id: 'l', label: 'L', width: 1, kind: 'letter' },
      { id: 'semicolon', label: ';', width: 1, kind: 'symbol' },
      { id: 'quote', label: "'", width: 1, kind: 'symbol' },
      { id: 'enter', label: '↵', width: 2.25, kind: 'modifier' },
    ],
  },
  {
    keys: [
      { id: 'lshift', label: 'Shift', width: 2.25, kind: 'modifier' },
      { id: 'z', label: 'Z', width: 1, kind: 'letter' },
      { id: 'x', label: 'X', width: 1, kind: 'letter' },
      { id: 'c', label: 'C', width: 1, kind: 'letter' },
      { id: 'v', label: 'V', width: 1, kind: 'letter' },
      { id: 'b', label: 'B', width: 1, kind: 'letter' },
      { id: 'n', label: 'N', width: 1, kind: 'letter' },
      { id: 'm', label: 'M', width: 1, kind: 'letter' },
      { id: 'comma', label: ',', width: 1, kind: 'symbol' },
      { id: 'period', label: '.', width: 1, kind: 'symbol' },
      { id: 'slash', label: '/', width: 1, kind: 'symbol' },
      { id: 'rshift', label: 'Shift', width: 2.75, kind: 'modifier' },
    ],
  },
  {
    keys: [
      { id: 'lctrl', label: 'Ctrl', width: 1.25, kind: 'modifier' },
      { id: 'lwin', label: 'Win', width: 1.25, kind: 'modifier' },
      { id: 'lalt', label: 'Alt', width: 1.25, kind: 'modifier' },
      { id: 'space', label: 'Space', width: 6.25, kind: 'space' },
      { id: 'ralt', label: 'Alt', width: 1.25, kind: 'modifier' },
      { id: 'rwin', label: 'Win', width: 1.25, kind: 'modifier' },
      { id: 'menu', label: 'Menu', width: 1.25, kind: 'modifier' },
      { id: 'rctrl', label: 'Ctrl', width: 1.25, kind: 'modifier' },
    ],
  },
];

const keyMap = new Map<string, (typeof QWERTY_LAYOUT)[number]['keys'][number]>();
for (const row of QWERTY_LAYOUT) {
  for (const key of row.keys) keyMap.set(key.id, key);
}

export const ALL_KEYS = [...keyMap.values()];

export function keyById(id: string) {
  return keyMap.get(id);
}
