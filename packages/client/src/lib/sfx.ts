/**
 * Tiny synthesised sound set — no audio files to load, and nothing that gets
 * annoying on the twentieth attempt. Muted by default preference is respected
 * through the toggle in the top bar.
 */
type Cue = 'hop' | 'turn' | 'eat' | 'win' | 'fail' | 'click';

const RECIPES: Record<Cue, { freq: number; to: number; type: OscillatorType; length: number; gain: number }> = {
  click: { freq: 420, to: 520, type: 'sine', length: 0.06, gain: 0.05 },
  hop: { freq: 320, to: 640, type: 'sine', length: 0.12, gain: 0.07 },
  turn: { freq: 260, to: 300, type: 'triangle', length: 0.09, gain: 0.05 },
  eat: { freq: 700, to: 1180, type: 'square', length: 0.09, gain: 0.035 },
  win: { freq: 520, to: 1040, type: 'sine', length: 0.5, gain: 0.09 },
  fail: { freq: 300, to: 90, type: 'sawtooth', length: 0.34, gain: 0.06 },
};

let context: AudioContext | null = null;
let enabled = localStorage.getItem('logiq.sound') !== 'off';

export const isSoundOn = () => enabled;

export function setSoundOn(next: boolean): void {
  enabled = next;
  localStorage.setItem('logiq.sound', next ? 'on' : 'off');
}

export function play(cue: Cue): void {
  if (!enabled) return;
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume();

    const recipe = RECIPES[cue];
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = recipe.type;
    oscillator.frequency.setValueAtTime(recipe.freq, now);
    oscillator.frequency.exponentialRampToValueAtTime(recipe.to, now + recipe.length);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(recipe.gain, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + recipe.length);

    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + recipe.length + 0.02);
  } catch {
    /* audio is a nicety; never let it break a run */
  }
}
