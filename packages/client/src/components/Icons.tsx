import type { SVGProps } from 'react';

/** One consistent line-icon set: 24px grid, 1.8 stroke, round caps. */
const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false' as const,
  ...props,
});

export const IconHop = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 20V5" />
    <path d="m6 11 6-6 6 6" />
  </svg>
);

export const IconTurnLeft = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M9 6 4 11l5 5" />
    <path d="M4 11h9a6 6 0 0 1 6 6v3" />
  </svg>
);

export const IconTurnRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m15 6 5 5-5 5" />
    <path d="M20 11h-9a6 6 0 0 0-6 6v3" />
  </svg>
);

export const IconLoop = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 9a5 5 0 0 1 5-5h9" />
    <path d="m15 1 3 3-3 3" />
    <path d="M20 15a5 5 0 0 1-5 5H6" />
    <path d="m9 23-3-3 3-3" />
  </svg>
);

export const IconRoutine = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 7h6" />
    <path d="M4 12h10" />
    <path d="M4 17h6" />
    <circle cx="18" cy="7" r="2.4" />
    <circle cx="18" cy="17" r="2.4" />
  </svg>
);

export const IconPlay = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M7 4.5 19 12 7 19.5z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconPause = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="7" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" stroke="none" />
    <rect x="13.4" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconStep = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 5.5 15 12l-9 6.5z" fill="currentColor" stroke="none" />
    <path d="M18 5v14" />
  </svg>
);

export const IconStepBack = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M18 5.5 9 12l9 6.5z" fill="currentColor" stroke="none" />
    <path d="M6 5v14" />
  </svg>
);

export const IconRestart = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20 12a8 8 0 1 1-2.6-5.9" />
    <path d="M20 4v5h-5" />
  </svg>
);

export const IconTrash = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 7h16" />
    <path d="M9 7V5h6v2" />
    <path d="M6 7l1 13h10l1-13" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const IconStar = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m12 3.6 2.6 5.6 6 .8-4.4 4.2 1.1 6.1-5.3-2.9-5.3 2.9 1.1-6.1L3.4 10l6-.8z" />
  </svg>
);

export const IconLock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="5" y="10" width="14" height="10" rx="2.4" />
    <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
  </svg>
);

export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);

export const IconBulb = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M9 18h6" />
    <path d="M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6V16h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" />
  </svg>
);

export const IconCode = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m8.5 8-4.5 4 4.5 4" />
    <path d="m15.5 8 4.5 4-4.5 4" />
    <path d="m13.5 4-3 16" />
  </svg>
);

export const IconBlocks = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4" width="17" height="5" rx="1.8" />
    <rect x="3.5" y="15" width="17" height="5" rx="1.8" />
    <path d="M8 9v6" />
  </svg>
);

export const IconSound = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 9.5h3l4-3.5v12l-4-3.5H5z" />
    <path d="M16 9.2a4 4 0 0 1 0 5.6" />
    <path d="M18.6 6.6a7.6 7.6 0 0 1 0 10.8" />
  </svg>
);

export const IconMuted = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 9.5h3l4-3.5v12l-4-3.5H5z" />
    <path d="m16.5 9.5 5 5M21.5 9.5l-5 5" />
  </svg>
);

export const IconBack = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M15 5 8 12l7 7" />
  </svg>
);

export const IconArrowRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 12h15" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconFly = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <ellipse cx="12" cy="14" rx="3" ry="4" />
    <path d="M9 10C6 6.5 3.5 7 3.5 9.5S6.5 12 9 11" />
    <path d="M15 10c3-3.5 5.5-3 5.5-.5S18 12 15 11" />
  </svg>
);

export const IconTarget = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.4" />
  </svg>
);

export const IconSun = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </svg>
);

export const IconMoon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2Z" />
  </svg>
);
