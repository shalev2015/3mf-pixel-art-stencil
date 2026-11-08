'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Theme } from '@/lib/types';
import { loadTheme, saveTheme } from '@/lib/projects/storage';

function applyThemeToDocument(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

/** Light / dark theme state, persisted in localStorage and mirrored on `<html data-theme>`. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = loadTheme();
    if (saved) {
      setTheme(saved);
      applyThemeToDocument(saved);
    }
  }, []);

  const updateTheme = useCallback((next: Theme) => {
    setTheme(next);
    applyThemeToDocument(next);
    saveTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    updateTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, updateTheme]);

  return { theme, updateTheme, toggleTheme };
}
