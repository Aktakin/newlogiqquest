# LOGIQ

A puzzle platform that teaches programming logic — order, state, repetition and
abstraction — without asking anyone to memorise syntax first. Three activities
ship today:

| Activity | Teaches | Length |
| --- | --- | --- |
| **Hop Quest** | Sequencing, direction as state, obstacles, loops, nested loops | 12 levels |
| **Function Pond** | Functions, reuse, decomposition, composition, abstraction | 10 levels |
| **Case Cipher** | Naming conventions, exact case, JavaScript fundamentals | Endless run |

Every solution is also shown as real TypeScript, highlighted line by line as the
program runs, so the step from blocks to a text editor stops being a leap.

## Running it

```bash
npm install
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:4000

`npm run dev` starts the Vite dev server and the API together. The client proxies
`/api` to the server, and falls back to local storage if the API is unavailable,
so the puzzles remain playable offline.

## Layout

```
packages/
  engine/   Rules, levels, interpreter, scoring, code generation (shared)
  server/   Express API: level data, solution validation, progress, leaderboard
  client/   React + Vite front end
```

The engine is the single source of truth. The browser runs it to animate an
attempt instantly; the server runs the identical code to decide whether stars
are actually awarded, so the two can never disagree.

### Engine

- `types.ts` — the vocabulary: tiles, blocks, levels, execution frames.
- `grid.ts` — turns a level's character map into a board.
- `interpreter.ts` — validates a program against the level rules, then executes
  it into a list of frames. Deterministic and side-effect free.
- `codegen.ts` — renders a block script as TypeScript, with each line tagged
  by the block that produced it.
- `levels/` — the curriculum.
- `cipher/` — Case Cipher: the prompt bank, the countdown and the payout rules.

A level map is written as characters: `~` deep water, `o` lily pad, `#` rock,
`G` the golden lily, `*` a fly, `S` the frog's starting pad.

### Case Cipher

Two kinds of round, drawn from `cipher/bank.ts` and addressed by id:

- **Token** — reproduce a real identifier exactly (`API_KEY`,
  `douglasCollegeYouthCamp`, `XMLHttpRequest`). Uppercase and lowercase are
  tinted differently for the first five successful cracks, then the hints and
  the live correctness marks both switch off. There is no submit key: the
  attempt commits itself on the last character, so every keystroke before that
  is the only chance to take one back.
- **Question** — every fourth round, a multiple-choice JavaScript question
  interrupts the crack as a pop-up: true/false, a value to pick, or two
  snippets where only one is right. These pay roughly three times a token, and
  cost more when missed. A two-way question carries a heavier penalty, because
  otherwise guessing would be free money.

Each round has a countdown sized to the prompt; running out of time is graded
as a miss. Payouts scale with tier, length, streak and speed, and the whole
price is computed by `gradeCipher` — the client calls it for instant feedback
and the server calls it again to decide what actually lands in the wallet, so
the answer key never has to be sent to the browser.

## Level authoring

Two tools keep the puzzles honest.

```bash
# Solve every level twice — by breadth-first search, and with the intended
# solution — and check that par is actually reachable.
npm run verify --workspace @logiq/engine

# Carve maze candidates and report the optimal block count for each.
npm run maze --workspace @logiq/engine -- <cells> <count> <minPar> <maxPar>
```

`npm run verify` is the regression suite for game content. It catches the
failure mode that matters most here: a level where the clever solution is
*worse* than brute force, which teaches exactly the wrong lesson. It also
checks the Case Cipher bank — unique ids, answer indexes that point at a real
option, and every prompt priced so the right answer pays and a wrong one costs.
Run it after touching anything in `levels/` or `cipher/`.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/games` | Game summaries for the library |
| `GET` | `/api/games/:gameId` | A game with all of its levels |
| `POST` | `/api/players` | Create a profile |
| `GET` | `/api/players/:playerId` | Profile and progress |
| `POST` | `/api/players/:playerId/attempts` | Validate a program, award stars and XP |
| `POST` | `/api/players/:playerId/cipher` | Re-grade a Case Cipher round and settle the wallet |
| `GET` | `/api/leaderboard` | Top players by XP |

Progress is stored as JSON at `packages/server/data/db.json`. Swapping in a real
database means replacing `packages/server/src/store.ts` — nothing else touches
persistence.

## Design notes

- **One idea per level.** Each puzzle introduces a single concept and the next
  one builds on it. Nothing is introduced twice.
- **Three stars means optimal.** Par is the intended solution's block count,
  verified by search. The middle band is deliberately generous.
- **Failure is specific.** "Splash", "Bump" and "One fly short" are different
  outcomes with different coaching, because "wrong" teaches nothing.
- **Debugging is a first-class control.** Pause, step forward, step back. Seeing
  a program stop at the wrong instruction is the lesson.
- **Stakes are shown before the risk is taken.** Case Cipher prints what a round
  pays and what it costs before you answer, using the same function that grades
  it, so the numbers on screen are never marketing.
