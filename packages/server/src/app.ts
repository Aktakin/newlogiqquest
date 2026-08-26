import {
  SEED_BALANCE,
  gameSummaries,
  games,
  getGame,
  getLevel,
  gradeCipher,
  promptById,
  run,
  xpFor,
} from '@logiq/engine';
import type { Program } from '@logiq/engine';
import cors from 'cors';
import express from 'express';
import type { Request, Response } from 'express';
import {
  createPlayer,
  getPlayer,
  leaderboard,
  recordAttempt,
  recordCipher,
  touch,
} from './store';

/** Shared Express app — local `listen` and the Vercel function both use this. */
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, games: games.length });
  });

  app.get('/api/games', (_req, res) => {
    res.json({ games: gameSummaries() });
  });

  app.get('/api/games/:gameId', (req: Request, res: Response) => {
    const game = getGame(req.params.gameId ?? '');
    if (!game) return res.status(404).json({ error: 'Unknown game.' });
    return res.json({ game });
  });

  app.post('/api/players', (req: Request, res: Response) => {
    const name = typeof req.body?.name === 'string' ? req.body.name : 'Explorer';
    return res.status(201).json({ player: createPlayer(name, SEED_BALANCE) });
  });

  app.get('/api/players/:playerId', (req: Request, res: Response) => {
    const player = getPlayer(req.params.playerId ?? '');
    if (!player) return res.status(404).json({ error: 'Unknown player.' });
    touch(player);
    return res.json({ player });
  });

  app.post('/api/players/:playerId/attempts', (req: Request, res: Response) => {
    const player = getPlayer(req.params.playerId ?? '');
    if (!player) return res.status(404).json({ error: 'Unknown player.' });

    const { gameId, levelId, program } = req.body ?? {};
    const level =
      typeof gameId === 'string' && typeof levelId === 'string'
        ? getLevel(gameId, levelId)
        : undefined;
    if (!level) return res.status(400).json({ error: 'Unknown level.' });
    if (!program || !Array.isArray(program.main) || !Array.isArray(program.routines)) {
      return res.status(400).json({ error: 'Malformed program.' });
    }

    const result = run(level, program as Program);
    const xpGained = recordAttempt(player, {
      key: `${gameId}/${levelId}`,
      success: result.success,
      stars: result.stars,
      blocks: result.blocksUsed,
      xp: xpFor(level, result.stars),
    });

    return res.json({
      result: {
        status: result.status,
        success: result.success,
        message: result.message,
        stars: result.stars,
        blocksUsed: result.blocksUsed,
      },
      xpGained,
      player,
    });
  });

  app.post('/api/players/:playerId/cipher', (req: Request, res: Response) => {
    const player = getPlayer(req.params.playerId ?? '');
    if (!player) return res.status(404).json({ error: 'Unknown player.' });

    const { promptId, typed, elapsedMs, streak } = req.body ?? {};
    const prompt = typeof promptId === 'string' ? promptById(promptId) : undefined;
    if (!prompt) return res.status(400).json({ error: 'Unknown prompt.' });
    if (typeof typed !== 'string') return res.status(400).json({ error: 'Malformed attempt.' });

    const grade = gradeCipher(prompt, typed, {
      streak: Number.isFinite(streak) ? Math.max(0, Math.floor(streak)) : 0,
      elapsedMs: Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : Number.MAX_SAFE_INTEGER,
    });

    const wallet = recordCipher(player, {
      delta: grade.delta,
      correct: grade.correct,
      streak: (Number.isFinite(streak) ? Math.floor(streak) : 0) + (grade.correct ? 1 : 0),
      seedBalance: SEED_BALANCE,
    });

    return res.json({ grade, wallet });
  });

  app.get('/api/leaderboard', (_req, res) => {
    res.json({ entries: leaderboard() });
  });

  return app;
}
