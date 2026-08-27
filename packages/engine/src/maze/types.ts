/** Maze Runner — hop the frog from start lily to the golden flower. */

export type MazeFacing = 0 | 1 | 2 | 3; // N E S W

export interface MazeLevelDef {
  id: number;
  /** Open cells on each side (walls sit between them). */
  cells: number;
  title: string;
  blurb: string;
  /**
   * From level 2 up: start is a three-way fork — two long decoy mazes and
   * one true path to the lily. Level 1 stays a gentle single pond.
   */
  branching: boolean;
}

export interface MazeCoord {
  x: number;
  y: number;
}

export interface MazeState {
  levelId: number;
  seed: number;
  /** Odd-sized grid: true = walkable path, false = wall/water. */
  grid: boolean[][];
  size: number;
  start: MazeCoord;
  goal: MazeCoord;
  frog: MazeCoord;
  facing: MazeFacing;
  moves: number;
  visited: string[];
  won: boolean;
  /** Shortest hop count for this maze (BFS). */
  optimal: number;
  branching: boolean;
}

export const MAZE_LEVELS: MazeLevelDef[] = [
  { id: 1, cells: 5, branching: false, title: 'Puddle Path', blurb: 'Warm up. One quiet route to the lily.' },
  { id: 2, cells: 9, branching: true, title: 'Three Reeds', blurb: 'Three ways out. Two are long traps — think first.' },
  { id: 3, cells: 10, branching: true, title: 'Forked Creek', blurb: 'Study the junction before the first hop.' },
  { id: 4, cells: 11, branching: true, title: 'Siren Bend', blurb: 'The pretty corridor is often the wrong one.' },
  { id: 5, cells: 12, branching: true, title: 'Moss Gate', blurb: 'Two mazes waste time. One leads home.' },
  { id: 6, cells: 12, branching: true, title: 'Echo Pool', blurb: 'If it feels endless, you chose a decoy.' },
  { id: 7, cells: 13, branching: true, title: 'Willow Snare', blurb: 'Pause at the start. Trace with your eyes.' },
  { id: 8, cells: 14, branching: true, title: 'Fog Triad', blurb: 'Three mouths. Only one feeds the flower.' },
  { id: 9, cells: 14, branching: true, title: 'Stone Choices', blurb: 'A long journey with no lily is still a loss.' },
  { id: 10, cells: 15, branching: true, title: 'Night Fork', blurb: 'Commit only when you see the pattern.' },
  { id: 11, cells: 15, branching: true, title: 'Cascade Lies', blurb: 'Decoys get longer. Patience pays.' },
  { id: 12, cells: 16, branching: true, title: 'Hidden Cove', blurb: 'The short glance beats the long wander.' },
  { id: 13, cells: 16, branching: true, title: 'Reed Labyrinth', blurb: 'Map the three arms before you move.' },
  { id: 14, cells: 17, branching: true, title: 'Deep Choices', blurb: 'Wrong arms swallow dozens of hops.' },
  { id: 15, cells: 17, branching: true, title: 'Mirror Arms', blurb: 'They look alike. They are not equal.' },
  { id: 16, cells: 18, branching: true, title: 'Tide Split', blurb: 'Pick the arm that can reach the far bank.' },
  { id: 17, cells: 18, branching: true, title: 'Coral Trap', blurb: 'Beauty is bait. The lily is the truth.' },
  { id: 18, cells: 19, branching: true, title: 'Abyss Gate', blurb: 'Two oceans of dead ends. One exit.' },
  { id: 19, cells: 20, branching: true, title: 'Final Fork', blurb: 'Almost there — still three lies at the start.' },
  { id: 20, cells: 21, branching: true, title: 'Deep Water', blurb: 'The master pond. Think, then hop.' },
];

export const MAZE_DIRS: ReadonlyArray<{ dx: number; dy: number }> = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
];
