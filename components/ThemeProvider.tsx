'use client';
import { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: 'dark', toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start with the same value on server and client to avoid hydration mismatch.
  // localStorage / data-theme is applied only after mount.
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('ziwei-theme') as Theme | null;
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
        return;
      }
    } catch {
      /* ignore */
    }
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') setTheme(attr);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('ziwei-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme, mounted]);

  const toggle = () => {
    const root = document.documentElement;
    const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next: Theme = current === 'light' ? 'dark' : 'light';
    root.classList.add('theme-transitioning');
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('ziwei-theme', next);
    } catch {
      /* ignore */
    }
    setTheme(next);
    setTimeout(() => root.classList.remove('theme-transitioning'), 420);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);