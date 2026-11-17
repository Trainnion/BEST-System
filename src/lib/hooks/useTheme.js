'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * BEST - Dual Theme Engine (Dark & Light)
 *
 * Persists user theme preference ('dark' | 'light') in localStorage ('best:theme')
 * or respects system preference via matchMedia('(prefers-color-scheme: light)').
 *
 * Applies:
 *   - document.documentElement.classList.add('dark' | 'light')
 *   - document.documentElement.setAttribute('data-theme', 'dark' | 'light')
 *   - syncs across tabs via storage event and local CustomEvent.
 */

export const THEME_KEY = 'best:theme';
export const THEME_EVENT = 'best:theme-change';

export const THEME_DARK = 'dark';
export const THEME_LIGHT = 'light';

function readStoredTheme() {
  if (typeof window === 'undefined') return null;
  try {
    const query = new URLSearchParams(window.location.search).get('theme');
    if (query === THEME_DARK || query === THEME_LIGHT) return query;
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === THEME_DARK || stored === THEME_LIGHT) return stored;
  } catch {
    // Private mode / storage blocked
  }
  return null;
}

function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return THEME_DARK;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? THEME_LIGHT : THEME_DARK;
}

export function resolveCurrentTheme() {
  const stored = readStoredTheme();
  if (stored) return stored;
  return getSystemTheme();
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return theme;
  const target = theme === THEME_LIGHT ? THEME_LIGHT : THEME_DARK;
  const root = document.documentElement;

  if (target === THEME_LIGHT) {
    root.classList.remove(THEME_DARK);
    root.classList.add(THEME_LIGHT);
    root.setAttribute('data-theme', THEME_LIGHT);
  } else {
    root.classList.remove(THEME_LIGHT);
    root.classList.add(THEME_DARK);
    root.setAttribute('data-theme', THEME_DARK);
  }

  try {
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme: target } }));
  } catch {
    // CustomEvent unavailable
  }

  return target;
}

export default function useTheme() {
  const [theme, setThemeState] = useState(THEME_DARK);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initial = resolveCurrentTheme();
    setThemeState(initial);
    applyTheme(initial);

    const onThemeChange = (event) => {
      if (event?.detail?.theme) {
        setThemeState(event.detail.theme);
      }
    };

    const onStorage = (event) => {
      if (event.key === THEME_KEY && (event.newValue === THEME_DARK || event.newValue === THEME_LIGHT)) {
        setThemeState(event.newValue);
        applyTheme(event.newValue);
      }
    };

    window.addEventListener(THEME_EVENT, onThemeChange);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener(THEME_EVENT, onThemeChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setTheme = useCallback((newTheme) => {
    const valid = newTheme === THEME_LIGHT ? THEME_LIGHT : THEME_DARK;
    try {
      window.localStorage.setItem(THEME_KEY, valid);
    } catch {
      // Storage unavailable
    }
    setThemeState(valid);
    applyTheme(valid);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === THEME_DARK ? THEME_LIGHT : THEME_DARK);
  }, [theme, setTheme]);

  return {
    theme,
    isDark: theme === THEME_DARK,
    isLight: theme === THEME_LIGHT,
    mounted,
    setTheme,
    toggleTheme,
  };
}
