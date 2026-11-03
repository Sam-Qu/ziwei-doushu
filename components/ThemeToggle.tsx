'use client';

import { useTheme } from '@/components/ThemeProvider';

/** Moon while the page is dark, sun while it is light. CSS picks the icon from data-theme. */
export default function ThemeToggle() {
  const { toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="切换深色或浅色"
      title="切换深色或浅色"
      className="theme-toggle"
    >
      <SunIcon />
      <MoonIcon />
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="theme-icon-sun"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3.25" />
      <path
        strokeLinecap="round"
        d="M12 3.5v1.75M12 18.75V20.5M4.8 4.8l1.25 1.25M17.95 17.95l1.25 1.25M3.5 12h1.75M18.75 12h1.75M4.8 19.2l1.25-1.25M17.95 6.05l1.25-1.25"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="theme-icon-moon"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 14.6A7.2 7.2 0 0 1 9.4 4 6.4 6.4 0 1 0 20 14.6z"
      />
    </svg>
  );
}
