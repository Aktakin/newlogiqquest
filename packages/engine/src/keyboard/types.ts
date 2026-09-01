/** One physical key on the layout. Width is in standard-key units. */
export interface KeySpec {
  id: string;
  label: string;
  width: number;
  kind: 'letter' | 'number' | 'modifier' | 'space' | 'symbol';
}

export interface KeyboardRow {
  keys: KeySpec[];
}

export interface KeyboardLevel {
  id: number;
  title: string;
  blurb: string;
  /** Key ids the player must place. All other keys stay visible as anchors. */
  hidden: string[];
}

export interface KeyboardPuzzle {
  level: KeyboardLevel;
  /** Shuffled keys the player drags from the bank. */
  bank: KeySpec[];
  /** Correct key id for each slot that must be filled. */
  slots: string[];
}

export interface KeyboardGrade {
  correct: boolean;
  placed: number;
  total: number;
  wrong: string[];
}
