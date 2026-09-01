import type { KeyboardLevel } from './types';

export const KEYBOARD_LEVELS: KeyboardLevel[] = [
  {
    id: 1,
    title: 'Home row',
    blurb: 'Place the keys your fingers rest on — A through L.',
    hidden: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  },
  {
    id: 2,
    title: 'Top row',
    blurb: 'The QWERTY row above. Match each letter to its slot.',
    hidden: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  },
  {
    id: 3,
    title: 'Bottom row',
    blurb: 'Z through M on the lowest letter row.',
    hidden: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  },
  {
    id: 4,
    title: 'Number row',
    blurb: 'Digits across the top — 1 through 0.',
    hidden: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  },
  {
    id: 5,
    title: 'All letters',
    blurb: 'Every letter key on the board. Use the reference above.',
    hidden: [
      'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p',
      'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l',
      'z', 'x', 'c', 'v', 'b', 'n', 'm',
    ],
  },
  {
    id: 6,
    title: 'Full keyboard',
    blurb: 'Symbols, modifiers, and space — the complete layout.',
    hidden: [
      'grave', 'minus', 'equal', 'backspace',
      'tab', 'lbracket', 'rbracket', 'backslash',
      'caps', 'semicolon', 'quote', 'enter',
      'lshift', 'comma', 'period', 'slash', 'rshift',
      'lctrl', 'lwin', 'lalt', 'space', 'ralt', 'rwin', 'menu', 'rctrl',
    ],
  },
];

export function getKeyboardLevel(id: number): KeyboardLevel | undefined {
  return KEYBOARD_LEVELS.find((level) => level.id === id);
}
