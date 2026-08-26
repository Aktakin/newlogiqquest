import { IconMoon, IconSun } from './Icons';
import { toggleTheme, useTheme } from '../lib/theme';
import './themetoggle.css';

/** Shows the theme you would switch to, which is what a toggle should offer. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useTheme();
  const goingLight = theme === 'dark';

  return (
    <button
      type="button"
      className={`themetoggle ${className}`.trim()}
      onClick={toggleTheme}
      title={goingLight ? 'Switch to light' : 'Switch to dark'}
      aria-label={goingLight ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <span className="themetoggle__icon">
        {goingLight ? <IconSun width={17} height={17} /> : <IconMoon width={17} height={17} />}
      </span>
    </button>
  );
}
