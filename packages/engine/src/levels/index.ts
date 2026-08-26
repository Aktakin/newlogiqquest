import type { GameDef, LevelDef } from '../types';
import { functionPond } from './functionPond';
import { hopQuest } from './hopQuest';

export const games: GameDef[] = [hopQuest, functionPond];

export const getGame = (gameId: string): GameDef | undefined =>
  games.find((game) => game.id === gameId);

export const getLevel = (gameId: string, levelId: string): LevelDef | undefined =>
  getGame(gameId)?.levels.find((level) => level.id === levelId);

/** Card-sized view of a game, without shipping every level map. */
export const gameSummaries = () =>
  games.map(({ levels, ...game }) => ({ ...game, levelCount: levels.length }));

export { functionPond, hopQuest };
