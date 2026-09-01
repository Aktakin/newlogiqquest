import { ALL_KEYS } from './layout';
import type { KeyboardLevel } from './types';

const ALL_KEY_IDS = ALL_KEYS.map((key) => key.id);

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
    title: 'Number extras',
    blurb: 'The symbols and backspace on the number row.',
    hidden: ['grave', 'minus', 'equal', 'backspace'],
  },
  {
    id: 7,
    title: 'Bracket keys',
    blurb: 'Tab and the square brackets on the edges of the letter rows.',
    hidden: ['tab', 'lbracket', 'rbracket', 'backslash'],
  },
  {
    id: 8,
    title: 'Punctuation',
    blurb: 'Semicolon, quote, comma, period, slash — and the big keys around them.',
    hidden: ['caps', 'semicolon', 'quote', 'enter', 'lshift', 'comma', 'period', 'slash', 'rshift'],
  },
  {
    id: 9,
    title: 'Space bar row',
    blurb: 'Ctrl, Alt, Win, Menu, and the long space bar at the bottom.',
    hidden: ['lctrl', 'lwin', 'lalt', 'space', 'ralt', 'rwin', 'menu', 'rctrl'],
  },
  {
    id: 10,
    title: 'Full keyboard',
    blurb: 'Every single key — build the complete keyboard from scratch.',
    hidden: ALL_KEY_IDS,
  },
];

export function getKeyboardLevel(id: number): KeyboardLevel | undefined {
  return KEYBOARD_LEVELS.find((level) => level.id === id);
}
