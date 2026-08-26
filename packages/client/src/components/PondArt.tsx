/**
 * Every pond object is drawn as vector art so the board scales cleanly and
 * reads the same on a classroom projector as it does on a laptop. Gradients are
 * declared once in <PondDefs /> and referenced by id from each sprite.
 */

/** Small deterministic hash so a tile's random-looking tilt never changes. */
export function tileSeed(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function PondDefs() {
  return (
    <svg width="0" height="0" aria-hidden focusable="false" style={{ position: 'absolute' }}>
      <defs>
        <radialGradient id="pad-fill" cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#5fc98a" />
          <stop offset="52%" stopColor="#37a468" />
          <stop offset="100%" stopColor="#1c6f47" />
        </radialGradient>
        <radialGradient id="pad-fill-goal" cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#6fd39a" />
          <stop offset="60%" stopColor="#31955f" />
          <stop offset="100%" stopColor="#186040" />
        </radialGradient>
        <linearGradient id="rock-fill" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#7b8b98" />
          <stop offset="45%" stopColor="#54646f" />
          <stop offset="100%" stopColor="#2d3a44" />
        </linearGradient>
        <radialGradient id="petal-fill" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff4d0" />
          <stop offset="55%" stopColor="#f8d276" />
          <stop offset="100%" stopColor="#e0a52f" />
        </radialGradient>
        <radialGradient id="pollen-fill" cx="42%" cy="34%" r="70%">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="100%" stopColor="#d98f21" />
        </radialGradient>
        <linearGradient id="frog-body" x1="26%" y1="8%" x2="74%" y2="100%">
          <stop offset="0%" stopColor="#8ee88f" />
          <stop offset="46%" stopColor="#49bf6a" />
          <stop offset="100%" stopColor="#237a45" />
        </linearGradient>
        <linearGradient id="frog-limb" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#57c374" />
          <stop offset="100%" stopColor="#1f6d3e" />
        </linearGradient>
        <radialGradient id="frog-belly" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="rgba(226, 255, 226, 0.85)" />
          <stop offset="100%" stopColor="rgba(226, 255, 226, 0)" />
        </radialGradient>
      </defs>
    </svg>
  );
}

interface SpriteProps {
  seed?: number;
}

export function LilyPad({ seed = 0.5 }: SpriteProps) {
  const rotation = seed * 360;
  return (
    <svg viewBox="0 0 100 100" className="sprite sprite--pad" aria-hidden focusable="false">
      <g transform={`rotate(${rotation} 50 50)`}>
        <path
          d="M50 50 L86.3 38.9 A38 38 0 1 0 86.3 61.1 Z"
          fill="url(#pad-fill)"
          stroke="rgba(9, 32, 22, 0.5)"
          strokeWidth="1.5"
        />
        <path
          d="M50 50 L86.3 38.9 A38 38 0 1 0 86.3 61.1 Z"
          fill="none"
          stroke="rgba(190, 255, 214, 0.22)"
          strokeWidth="1"
          transform="scale(0.86) translate(8 8)"
        />
        <g stroke="rgba(12, 48, 32, 0.28)" strokeWidth="1.4" strokeLinecap="round">
          <line x1="50" y1="50" x2="50" y2="14" />
          <line x1="50" y1="50" x2="22" y2="30" />
          <line x1="50" y1="50" x2="20" y2="66" />
          <line x1="50" y1="50" x2="48" y2="87" />
          <line x1="50" y1="50" x2="78" y2="74" />
        </g>
      </g>
    </svg>
  );
}

export function Rock({ seed = 0.5 }: SpriteProps) {
  const rotation = seed * 90 - 45;
  return (
    <svg viewBox="0 0 100 100" className="sprite sprite--rock" aria-hidden focusable="false">
      <g transform={`rotate(${rotation} 50 50)`}>
        <ellipse cx="50" cy="78" rx="34" ry="9" fill="rgba(3, 10, 16, 0.45)" />
        <path
          d="M22 68 L16 44 L34 22 L62 16 L84 34 L80 62 L60 78 L34 78 Z"
          fill="url(#rock-fill)"
          stroke="rgba(6, 16, 22, 0.6)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M34 22 L62 16 L58 38 L30 44 Z"
          fill="rgba(255, 255, 255, 0.14)"
        />
        <path d="M58 38 L84 34 L80 62 L62 60 Z" fill="rgba(0, 0, 0, 0.16)" />
      </g>
    </svg>
  );
}

export function GoldenLily() {
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg viewBox="0 0 100 100" className="sprite sprite--goal" aria-hidden focusable="false">
      <path
        d="M50 50 L86.3 38.9 A38 38 0 1 0 86.3 61.1 Z"
        fill="url(#pad-fill-goal)"
        stroke="rgba(9, 32, 22, 0.5)"
        strokeWidth="1.5"
        transform="rotate(200 50 50)"
      />
      <g className="goal-bloom">
        {petals.map((angle) => (
          <ellipse
            key={angle}
            cx="50"
            cy="33"
            rx="7.5"
            ry="16"
            fill="url(#petal-fill)"
            stroke="rgba(120, 72, 8, 0.28)"
            strokeWidth="0.8"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
        {petals.map((angle) => (
          <ellipse
            key={`inner-${angle}`}
            cx="50"
            cy="40"
            rx="5"
            ry="10"
            fill="url(#petal-fill)"
            opacity="0.95"
            transform={`rotate(${angle + 22} 50 50)`}
          />
        ))}
        <circle cx="50" cy="50" r="8" fill="url(#pollen-fill)" />
        <circle cx="47" cy="47" r="2.4" fill="rgba(255, 250, 220, 0.85)" />
      </g>
    </svg>
  );
}

export function Fly() {
  return (
    <svg viewBox="0 0 100 100" className="sprite sprite--fly" aria-hidden focusable="false">
      <g className="fly-bob">
        <ellipse cx="38" cy="46" rx="15" ry="9" fill="rgba(210, 240, 255, 0.5)" transform="rotate(-24 38 46)" />
        <ellipse cx="62" cy="46" rx="15" ry="9" fill="rgba(210, 240, 255, 0.5)" transform="rotate(24 62 46)" />
        <ellipse cx="50" cy="54" rx="10" ry="13" fill="#2b3444" />
        <ellipse cx="50" cy="44" rx="7" ry="6" fill="#3d4a5e" />
        <circle cx="46" cy="42" r="2.4" fill="#f5b8b8" />
        <circle cx="54" cy="42" r="2.4" fill="#f5b8b8" />
        <ellipse cx="50" cy="56" rx="6" ry="3" fill="rgba(255, 255, 255, 0.14)" />
      </g>
    </svg>
  );
}

/** Drawn facing north; the board rotates the wrapper to point it elsewhere. */
export function Frog() {
  return (
    <svg viewBox="0 0 100 100" className="sprite sprite--frog" aria-hidden focusable="false">
      <ellipse cx="27" cy="34" rx="9" ry="13" fill="url(#frog-limb)" transform="rotate(-28 27 34)" />
      <ellipse cx="73" cy="34" rx="9" ry="13" fill="url(#frog-limb)" transform="rotate(28 73 34)" />
      <ellipse cx="24" cy="70" rx="11" ry="16" fill="url(#frog-limb)" transform="rotate(-34 24 70)" />
      <ellipse cx="76" cy="70" rx="11" ry="16" fill="url(#frog-limb)" transform="rotate(34 76 70)" />

      <ellipse cx="50" cy="58" rx="25" ry="28" fill="url(#frog-body)" />
      <ellipse cx="50" cy="62" rx="15" ry="18" fill="url(#frog-belly)" />
      <ellipse cx="36" cy="52" rx="4.5" ry="7" fill="rgba(19, 74, 44, 0.45)" transform="rotate(-18 36 52)" />
      <ellipse cx="64" cy="52" rx="4.5" ry="7" fill="rgba(19, 74, 44, 0.45)" transform="rotate(18 64 52)" />
      <ellipse cx="50" cy="74" rx="6" ry="4" fill="rgba(19, 74, 44, 0.35)" />

      <ellipse cx="50" cy="35" rx="21" ry="18" fill="url(#frog-body)" />
      <ellipse cx="38" cy="26" rx="10" ry="9.5" fill="#7ddc8a" />
      <ellipse cx="62" cy="26" rx="10" ry="9.5" fill="#7ddc8a" />
      <circle cx="38" cy="25" r="6.4" fill="#fdfff6" />
      <circle cx="62" cy="25" r="6.4" fill="#fdfff6" />
      <circle cx="38" cy="23" r="3.6" fill="#101c18" />
      <circle cx="62" cy="23" r="3.6" fill="#101c18" />
      <circle cx="36.4" cy="21.4" r="1.3" fill="rgba(255, 255, 255, 0.9)" />
      <circle cx="60.4" cy="21.4" r="1.3" fill="rgba(255, 255, 255, 0.9)" />
      <path
        d="M42 41 Q50 46 58 41"
        fill="none"
        stroke="rgba(16, 62, 38, 0.55)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="45" cy="36" r="1.2" fill="rgba(16, 62, 38, 0.45)" />
      <circle cx="55" cy="36" r="1.2" fill="rgba(16, 62, 38, 0.45)" />
    </svg>
  );
}

export function Splash() {
  return (
    <svg viewBox="0 0 100 100" className="sprite sprite--splash" aria-hidden focusable="false">
      <circle cx="50" cy="50" r="18" fill="none" stroke="rgba(180, 226, 255, 0.85)" strokeWidth="3" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(180, 226, 255, 0.45)" strokeWidth="2" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(180, 226, 255, 0.2)" strokeWidth="1.5" />
    </svg>
  );
}
