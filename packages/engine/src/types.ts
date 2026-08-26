/**
 * Core vocabulary shared by the puzzle engine, the API and the UI.
 */

/** 0 = north, 1 = east, 2 = south, 3 = west. */
export type Direction = 0 | 1 | 2 | 3;

export type TileKind =
  /** Deep water. Hopping in ends the run. */
  | 'water'
  /** A lily pad, safe to land on. */
  | 'pad'
  /** Solid obstacle. The frog bumps into it. */
  | 'rock'
  /** The golden lily the frog must reach. */
  | 'goal';

export interface Tile {
  kind: TileKind;
  /** A fly token sitting on this tile. Every fly must be eaten to finish. */
  fly: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface FrogState extends Point {
  dir: Direction;
}

/* ------------------------------------------------------------------ blocks */

export type BlockKind = 'hop' | 'turnLeft' | 'turnRight' | 'repeat' | 'call';

export interface HopBlock {
  id: string;
  kind: 'hop';
}
export interface TurnLeftBlock {
  id: string;
  kind: 'turnLeft';
}
export interface TurnRightBlock {
  id: string;
  kind: 'turnRight';
}
export interface RepeatBlock {
  id: string;
  kind: 'repeat';
  times: number;
  body: Block[];
}
export interface CallBlock {
  id: string;
  kind: 'call';
  /** Id of the routine being invoked. */
  fnId: string;
}

export type Block = HopBlock | TurnLeftBlock | TurnRightBlock | RepeatBlock | CallBlock;

export interface RoutineDef {
  id: string;
  name: string;
  /** Accent colour token so calls are visually tied to their definition. */
  hue: number;
  body: Block[];
}

export interface Program {
  main: Block[];
  routines: RoutineDef[];
}

/* ------------------------------------------------------------------ levels */

export type ConceptTag =
  | 'sequencing'
  | 'orientation'
  | 'obstacles'
  | 'loops'
  | 'nested-loops'
  | 'pathfinding'
  | 'functions'
  | 'composition'
  | 'abstraction';

export interface RoutineRules {
  /** How many routines the player may define. */
  max: number;
  /** Block budget inside a single routine. */
  maxBlocksPerRoutine: number;
  /** Levels that force the lesson home require at least one routine call. */
  requireUse: boolean;
  /** Suggested names offered when a player creates a routine. */
  suggestedNames?: string[];
}

export interface LevelDef {
  id: string;
  /** Owning game, e.g. `hop-quest`. */
  gameId: string;
  index: number;
  title: string;
  /** One line describing the objective, shown under the title. */
  brief: string;
  /** The teaching moment for this level. */
  lesson: string;
  hint: string;
  concepts: ConceptTag[];
  /**
   * Map rows. One character per tile:
   * `~` water, `o` lily pad, `#` rock, `G` golden lily, `*` fly on a pad,
   * `S` the frog's starting pad.
   */
  rows: string[];
  startDir: Direction;
  palette: BlockKind[];
  /** Block count of the intended solution: the three-star target. */
  par: number;
  /** Hard cap on blocks, when the puzzle is about efficiency. */
  maxBlocks?: number;
  routines?: RoutineRules;
  /** Loop counters the player may choose from. */
  repeatRange?: [number, number];
}

export interface GameDef {
  id: string;
  title: string;
  tagline: string;
  /** One short line for the library list. Keep it under about eight words. */
  blurb: string;
  description: string;
  /** Short list of ideas the game covers, for the library card. */
  teaches: string[];
  accent: string;
  levels: LevelDef[];
}

/* --------------------------------------------------------------- execution */

export type FrameEvent =
  | 'start'
  | 'hop'
  | 'turnLeft'
  | 'turnRight'
  | 'blocked'
  | 'sink'
  | 'eat'
  | 'goal';

export interface Frame {
  event: FrameEvent;
  frog: FrogState;
  /** Block responsible for this frame. */
  blockId?: string;
  /** Enclosing block ids, outermost first: powers the step-through highlight. */
  trail: string[];
  /** Keys (`x,y`) of flies still uneaten after this frame. */
  fliesLeft: string[];
  /** Player-facing narration for the step log. */
  note?: string;
}

export type RunStatus =
  | 'success'
  /** Program ran out of blocks before reaching the golden lily. */
  | 'incomplete'
  /** Landed in deep water or hopped off the map. */
  | 'sink'
  /** Bumped into a rock. */
  | 'blocked'
  /** Reached the goal but left flies behind. */
  | 'hungry'
  /** Too many steps: almost always a runaway loop. */
  | 'overflow'
  /** Program broke a level rule (block budget, unused routine, ...). */
  | 'invalid';

export interface RunResult {
  status: RunStatus;
  success: boolean;
  message: string;
  frames: Frame[];
  blocksUsed: number;
  stars: 0 | 1 | 2 | 3;
}
