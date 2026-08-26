/**
 * Content regression suite. Every puzzle is checked twice: a breadth-first
 * search proves a route exists at all, and the intended solution is executed to
 * prove that par is genuinely reachable. The Case Cipher bank is checked for
 * the mistakes that would cost a player money. Run with `npm run verify`.
 */
import { PROMPTS, QUIZZES, TOKENS, drawPrompt, gradeCipher, winningSubmission } from '../cipher/index';
import { run } from '../interpreter';
import { games } from '../levels/index';
import type { Block, BlockKind, LevelDef, Program, RoutineDef } from '../types';
import { solve } from './solver';

let counter = 0;
const uid = () => `v${(counter += 1)}`;
const b = (kind: Exclude<BlockKind, 'repeat' | 'call'>): Block => ({ id: uid(), kind });
const hop = () => b('hop');
const tl = () => b('turnLeft');
const tr = () => b('turnRight');
const hops = (n: number) => Array.from({ length: n }, hop);
const repeat = (times: number, body: Block[]): Block => ({ id: uid(), kind: 'repeat', times, body });
const call = (routine: RoutineDef): Block => ({ id: uid(), kind: 'call', fnId: routine.id });
const routine = (name: string, body: Block[]): RoutineDef => ({ id: uid(), name, hue: 0, body });

const plain = (main: Block[]): Program => ({ main, routines: [] });

const fp = {
  nameThatMove: (() => {
    const corner = routine('corner', [hop(), hop(), tr()]);
    return { main: [call(corner), call(corner), call(corner)], routines: [corner] };
  })(),
  grandRing: (() => {
    const side = routine('side', [...hops(5), tr()]);
    return { main: [call(side), call(side), call(side)], routines: [side] };
  })(),
  tightBudget: (() => {
    const step = routine('step', [hop(), tl(), hop(), tr()]);
    return { main: Array.from({ length: 6 }, () => call(step)), routines: [step] };
  })(),
  twoMotifs: (() => {
    const dash = routine('dash', hops(3));
    const climb = routine('climb', [tl(), hop(), tr(), hop()]);
    return {
      main: [call(dash), call(climb), call(climb), call(climb), tl(), hop(), hop()],
      routines: [dash, climb],
    };
  })(),
  outAndBack: (() => {
    const raid = routine('raidArm', [hop(), hop(), tl(), tl(), hop(), hop(), tr()]);
    return { main: [call(raid), call(raid), hop(), hop()], routines: [raid] };
  })(),
  nested: (() => {
    const step = routine('step', [hop(), tl(), hop(), tr()]);
    const double = routine('doubleStep', [call(step), call(step)]);
    return { main: Array.from({ length: 4 }, () => call(double)), routines: [step, double] };
  })(),
  serpentine: (() => {
    const lane = routine('lane', hops(4));
    const right = routine('turnRightAround', [tr(), hop(), tr()]);
    const left = routine('turnLeftAround', [tl(), hop(), tl()]);
    return {
      main: [
        call(lane), call(right), call(lane), call(left), call(lane),
        call(right), call(lane), call(left), call(lane),
      ],
      routines: [lane, right, left],
    };
  })(),
  comb: (() => {
    const three = routine('three', hops(3));
    const prong = routine('prong', [tl(), call(three), tl(), tl(), call(three), tl()]);
    return {
      main: [hop(), call(prong), hop(), hop(), call(prong), hop(), hop(), call(prong), hop()],
      routines: [three, prong],
    };
  })(),
  lockedGates: (() => {
    const gate = routine('gate', [hop(), hop(), tr(), hop(), hop(), tl()]);
    return { main: [call(gate), call(gate), call(gate), hop(), hop()], routines: [gate] };
  })(),
  grandTour: (() => {
    const four = routine('four', hops(4));
    const eight = routine('eight', [call(four), call(four)]);
    const side = routine('side', [call(eight), tr()]);
    return {
      main: [call(side), call(side), call(side), call(four), tr(), call(four)],
      routines: [four, eight, side],
    };
  })(),
};

const SOLUTIONS: Record<string, Program> = {
  'hop-quest/first-hop': plain(hops(3)),
  'hop-quest/around-the-bend': plain([...hops(3), tr(), ...hops(2)]),
  'hop-quest/the-long-way-round': plain([...hops(2), tl(), ...hops(2), tr(), ...hops(2)]),
  'hop-quest/mind-the-rock': plain([...hops(2), tr(), hop(), tl(), ...hops(2), tl(), hop()]),
  'hop-quest/the-fly-stop': plain([
    ...hops(3), tl(), hop(), tr(), tr(), hop(), tl(), hop(), tr(), hop(),
  ]),
  'hop-quest/repeat-after-me': plain([repeat(7, [hop()])]),
  'hop-quest/square-dance': plain([repeat(3, [...hops(4), tr()])]),
  'hop-quest/the-staircase': plain([repeat(4, [hop(), tl(), hop(), tr()])]),
  'hop-quest/the-narrow-pass': plain([
    ...hops(3), tr(), ...hops(2), tl(), ...hops(2), tr(), ...hops(2), tl(), hop(),
  ]),
  'hop-quest/circuit-of-flies': plain([repeat(3, [repeat(4, [hop()]), tr()])]),
  'function-pond/name-that-move': fp.nameThatMove,
  'function-pond/the-grand-ring': fp.grandRing,
  'function-pond/tight-budget': fp.tightBudget,
  'function-pond/two-motifs': fp.twoMotifs,
  'function-pond/out-and-back': fp.outAndBack,
  'function-pond/routines-all-the-way-down': fp.nested,
  'function-pond/the-serpentine': fp.serpentine,
  'function-pond/the-comb': fp.comb,
  'function-pond/the-locked-gates': fp.lockedGates,
  'function-pond/the-grand-tour': fp.grandTour,
};

/** Rules exist to teach; reachability should be judged without them. */
const unconstrained = (level: LevelDef): LevelDef => ({
  ...level,
  maxBlocks: undefined,
  routines: undefined,
  palette: ['hop', 'turnLeft', 'turnRight'],
});

let failures = 0;
const report = (ok: boolean, label: string, detail = '') => {
  if (!ok) failures += 1;
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`  ${mark}  ${label}${detail ? ` — ${detail}` : ''}`);
};

for (const game of games) {
  console.log(`\n${game.title}`);
  for (const level of game.levels) {
    const search = solve(level);
    if (!search) {
      report(false, level.title, 'no route exists — the map is broken');
      continue;
    }
    const searched = run(unconstrained(level), plain(search.blocks));
    if (!searched.success) {
      report(false, level.title, `shortest route failed: ${searched.status}`);
      continue;
    }

    const intended = SOLUTIONS[`${game.id}/${level.id}`];
    if (!intended) {
      // Maze levels have no hand-authored answer: the search is the answer, and
      // par only has to be reachable by walking the shortest route.
      report(
        level.par >= search.cost,
        level.title,
        `search-solved, par ${level.par} vs shortest ${search.cost}`,
      );
      continue;
    }
    const result = run(level, intended);
    if (!result.success) {
      report(false, level.title, `intended solution ${result.status}: ${result.message}`);
      continue;
    }
    if (result.blocksUsed !== level.par) {
      report(false, level.title, `par is ${level.par} but the solution uses ${result.blocksUsed}`);
      continue;
    }
    report(true, level.title, `par ${level.par}, shortest primitive route ${search.cost}`);
  }
}

/** Collapses a whole rule into one line, naming the offenders when it breaks. */
const checkAll = <T>(label: string, items: T[], rule: (item: T) => boolean, name: (item: T) => string) => {
  const bad = items.filter((item) => !rule(item)).map(name);
  report(bad.length === 0, label, bad.length ? bad.join(', ') : `${items.length} checked`);
};

console.log('\nCase Cipher');

const idCounts = new Map<string, number>();
for (const prompt of PROMPTS) idCounts.set(prompt.id, (idCounts.get(prompt.id) ?? 0) + 1);
checkAll(
  'ids are unique',
  [...idCounts.entries()],
  ([, count]) => count === 1,
  ([id]) => id,
);

checkAll(
  'tokens carry no stray whitespace',
  TOKENS,
  (token) => token.answer.length > 0 && token.answer.trim() === token.answer,
  (token) => token.id,
);

checkAll(
  'questions offer at least two options',
  QUIZZES,
  (quiz) => quiz.options.length >= 2,
  (quiz) => quiz.id,
);

checkAll(
  'answer index is inside the options',
  QUIZZES,
  (quiz) => quiz.correct >= 0 && quiz.correct < quiz.options.length,
  (quiz) => quiz.id,
);

checkAll(
  'options are distinct',
  QUIZZES,
  (quiz) => new Set(quiz.options).size === quiz.options.length,
  (quiz) => quiz.id,
);

// The most expensive failure: a prompt the player cannot possibly be paid for.
checkAll(
  'the right answer actually pays',
  PROMPTS,
  (prompt) => gradeCipher(prompt, winningSubmission(prompt), { streak: 0, elapsedMs: 0 }).delta > 0,
  (prompt) => prompt.id,
);

checkAll(
  'a wrong answer actually costs',
  PROMPTS,
  (prompt) => gradeCipher(prompt, '\u0000', { streak: 0, elapsedMs: 0 }).delta < 0,
  (prompt) => prompt.id,
);

// drawPrompt narrows by tier before it picks, so an empty tier would silently
// fall back to the whole bank and flatten the difficulty curve.
checkAll(
  'every tier has tokens and questions',
  [1, 2, 3] as const,
  (tier) => TOKENS.some((t) => t.tier === tier) && QUIZZES.some((q) => q.tier === tier),
  (tier) => `tier ${tier}`,
);

// A question is meant to interrupt on a fixed cadence, never twice in a row.
const drawn = Array.from({ length: 40 }, (_, round) => drawPrompt({ round, cracked: 6 }).kind);
report(
  drawn.every((kind, index) => kind === 'token' || drawn[index - 1] !== 'quiz'),
  'questions never arrive back to back',
  `${drawn.filter((kind) => kind === 'quiz').length} of 40 rounds`,
);

console.log(
  failures === 0 ? '\nAll content verified.\n' : `\n${failures} check(s) failed.\n`,
);
process.exit(failures === 0 ? 0 : 1);
