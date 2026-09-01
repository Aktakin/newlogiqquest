import { games } from './levels/index';

/** One row in the library. Not every activity is a grid of levels. */
export interface LibraryEntry {
  id: string;
  title: string;
  blurb: string;
  accent: string;
  path: string;
  /** Short right-hand detail, e.g. a level count or a mode name. */
  meta: string;
}

export const library: LibraryEntry[] = [
  ...games.map((game) => ({
    id: game.id,
    title: game.title,
    blurb: game.blurb,
    accent: game.accent,
    path: `/game/${game.id}`,
    meta: `${game.levels.length} levels`,
  })),
  {
    id: 'case-cipher',
    title: 'Case Cipher',
    blurb: 'Type it exactly. Capitals count.',
    accent: 'gold',
    path: '/cipher',
    meta: 'Endless run',
  },
  {
    id: 'case-cipher-mini',
    title: 'Case Cipher Mini',
    blurb: 'Easy words and fun questions for little typists.',
    accent: 'sky',
    path: '/cipher/mini',
    meta: 'Kids mode',
  },
  {
    id: 'games',
    title: 'Tetris',
    blurb: 'Stack pads. Spot colours. Pause and plan.',
    accent: 'sky',
    path: '/games',
    meta: '5 colours',
  },
  {
    id: 'maze-runner',
    title: 'Maze Runner',
    blurb: 'Hop the frog from start to the golden lily.',
    accent: 'mint',
    path: '/maze',
    meta: '20 levels',
  },
  {
    id: 'keyboard-lab',
    title: 'Key Lab',
    blurb: 'Study the full keyboard, then drag keys into place.',
    accent: 'violet',
    path: '/keyboard',
    meta: '6 levels',
  },
];
