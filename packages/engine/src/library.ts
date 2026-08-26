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
];
