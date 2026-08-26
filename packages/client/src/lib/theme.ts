/**
 * Theme preference. The value lives on `<html data-theme>` so CSS can switch
 * without React re-rendering anything, and an inline script in index.html
 * applies the saved choice before first paint to avoid a flash of the wrong
 * theme. Anything here has to agree with that script.
 */
import { useSyncExternalStore } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'logiq.theme';

const listeners = new Set<() => void>();

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function read(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* private mode, or storage disabled */
  }
  return systemTheme();
}

let current: Theme = typeof document === 'undefined' ? 'dark' : read();

export function setTheme(next: Theme): void {
  current = next;
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* the theme still applies for this session */
  }
  listeners.forEach((notify) => notify());
}

export const toggleTheme = () => setTheme(current === 'dark' ? 'light' : 'dark');

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => 'dark' as Theme,
  );
}

/** Called once at start-up to reconcile React with what the inline script did. */
export function initTheme(): void {
  setTheme(read());
}
