import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface LevelRecord {
  stars: number;
  bestBlocks: number;
  attempts: number;
  solvedAt: string | null;
}

export interface CipherRecord {
  balance: number;
  cracked: number;
  failed: number;
  bestStreak: number;
}

export interface Player {
  id: string;
  name: string;
  createdAt: string;
  lastSeenAt: string;
  xp: number;
  /** Keyed by `gameId/levelId`. */
  progress: Record<string, LevelRecord>;
  cipher: CipherRecord;
}

interface Database {
  players: Record<string, Player>;
}

const here = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(here, '../data/db.json');

let db: Database = { players: {} };
let writing: Promise<void> = Promise.resolve();

export async function load(): Promise<void> {
  try {
    const raw = await readFile(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<Database>;
    db = { players: parsed.players ?? {} };
  } catch {
    db = { players: {} };
    await persist();
  }
}

/** Writes are chained so concurrent requests cannot interleave a half file. */
function persist(): Promise<void> {
  writing = writing
    .then(async () => {
      await mkdir(dirname(DB_PATH), { recursive: true });
      await writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    })
    .catch((error: unknown) => {
      console.error('[store] failed to persist', error);
    });
  return writing;
}

const newId = (): string =>
  `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function createPlayer(name: string, seedBalance: number): Player {
  const now = new Date().toISOString();
  const player: Player = {
    id: newId(),
    name: name.trim().slice(0, 24) || 'Explorer',
    createdAt: now,
    lastSeenAt: now,
    xp: 0,
    progress: {},
    cipher: { balance: seedBalance, cracked: 0, failed: 0, bestStreak: 0 },
  };
  db.players[player.id] = player;
  void persist();
  return player;
}

export function getPlayer(id: string): Player | undefined {
  const player = db.players[id];
  // Profiles saved before Case Cipher existed have no wallet yet.
  if (player && !player.cipher) {
    player.cipher = { balance: 0, cracked: 0, failed: 0, bestStreak: 0 };
  }
  return player;
}

export function recordCipher(
  player: Player,
  input: { delta: number; correct: boolean; streak: number; seedBalance: number },
): CipherRecord {
  const wallet = player.cipher ?? {
    balance: input.seedBalance,
    cracked: 0,
    failed: 0,
    bestStreak: 0,
  };

  player.cipher = {
    balance: Math.max(0, wallet.balance + input.delta),
    cracked: wallet.cracked + (input.correct ? 1 : 0),
    failed: wallet.failed + (input.correct ? 0 : 1),
    bestStreak: Math.max(wallet.bestStreak, input.streak),
  };
  player.lastSeenAt = new Date().toISOString();
  void persist();
  return player.cipher;
}

export function touch(player: Player): void {
  player.lastSeenAt = new Date().toISOString();
  void persist();
}

export interface RecordInput {
  key: string;
  success: boolean;
  stars: number;
  blocks: number;
  xp: number;
}

/** Keeps the player's best result for a level and returns the awarded XP. */
export function recordAttempt(player: Player, input: RecordInput): number {
  const previous = player.progress[input.key] ?? {
    stars: 0,
    bestBlocks: Number.POSITIVE_INFINITY,
    attempts: 0,
    solvedAt: null,
  };

  const record: LevelRecord = {
    stars: Math.max(previous.stars, input.success ? input.stars : 0),
    bestBlocks: input.success ? Math.min(previous.bestBlocks, input.blocks) : previous.bestBlocks,
    attempts: previous.attempts + 1,
    solvedAt: previous.solvedAt ?? (input.success ? new Date().toISOString() : null),
  };
  if (!Number.isFinite(record.bestBlocks)) record.bestBlocks = 0;

  player.progress[input.key] = record;

  // XP is paid for improvement only, so replaying a level cannot farm points.
  const gained = input.success && input.stars > previous.stars ? input.xp : 0;
  player.xp += gained;
  player.lastSeenAt = new Date().toISOString();
  void persist();
  return gained;
}

export function leaderboard(limit = 10): Array<Pick<Player, 'id' | 'name' | 'xp'> & { solved: number }> {
  return Object.values(db.players)
    .map((player) => ({
      id: player.id,
      name: player.name,
      xp: player.xp,
      solved: Object.values(player.progress).filter((entry) => entry.stars > 0).length,
    }))
    .sort((a, b) => b.xp - a.xp || b.solved - a.solved)
    .slice(0, limit);
}
