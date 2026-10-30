'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import AuthButton from '@/components/AuthButton';
import BirthForm from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import InsightPanel from '@/components/InsightPanel';
import TimeNav, { type TimeView } from '@/components/TimeNav';
import { useTheme, type Theme } from '@/components/ThemeProvider';
import { generateChart } from '@/lib/ziwei/algorithm';
import type { BirthInfo, Palace, ZiweiChart } from '@/lib/ziwei/types';

function useColors(theme: Theme) {
  const d = theme === 'dark';
  return {
    bgBase: d ? '#020810' : '#f5efe0',
    goldSolid: d ? '#d4a843' : '#8b6410',
    goldLine: d ? 'rgba(212,168,67,0.4)' : 'rgba(140,100,20,0.4)',
    tagText: d ? 'rgba(212,168,67,0.7)' : 'rgba(120,80,10,0.7)',
    textSecond: d ? '#b8c6df' : '#3a3f4a',
    textMuted: d ? '#9db0d0' : '#5a6275',
    navBorder: d ? 'rgba(255,255,255,0.08)' : 'rgba(160,120,30,0.15)',
    ctaBg: d
      ? 'linear-gradient(135deg,#b8892a,#f0d070,#b8892a)'
      : 'linear-gradient(135deg,#6a4206,#9a6810,#6a4206)',
    ctaText: d ? '#08080a' : '#f8f3e8',
    footerText: d ? 'rgba(255,255,255,0.28)' : '#a08850',
  };
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? '切换亮色' : '切换暗色'}
      className="text-xs px-3 py-1.5 rounded-full border"
      style={{
        borderColor: isDark ? 'rgba(212,168,67,0.3)' : 'rgba(140,100,20,0.35)',
        color: isDark ? 'rgba(212,180,100,0.9)' : 'rgba(110,72,8,0.85)',
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,252,242,0.85)',
      }}
    >
      {isDark ? '暗色' : '亮色'}
    </button>
  );
}

export default function HomePage() {
  const { theme } = useTheme();
  const c = useColors(theme);
  const formRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const [view, setView] = useState<TimeView>('mingpan');
  const [liunianYear, setLiunianYear] = useState(2026);

  useLayoutEffect(() => {
    document.documentElement.style.background = c.bgBase;
    document.body.style.background = c.bgBase;
    return () => {
      document.documentElement.style.background = '';
      document.body.style.background = '';
    };
  }, [c.bgBase]);

  const handleSubmit = (info: BirthInfo) => {
    setSelectedPalace(null);
    setView('mingpan');
    setChart(generateChart(info));
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const reset = () => {
    setChart(null);
    setSelectedPalace(null);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div style={{ background: c.bgBase, minHeight: '100svh', transition: 'background 0.35s ease' }}>
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3"
        style={{ background: c.bgBase, borderBottom: `1px solid ${c.navBorder}` }}
      >
        <div className="text-sm tracking-[0.25em] font-medium" style={{ color: c.goldSolid }}>
          紫微命盘
        </div>
        <div className="flex items-center gap-2">
          <AuthButton />
          <ThemeToggle />
        </div>
      </nav>

      <header className="px-5 pt-10 pb-6 text-center max-w-xl mx-auto">
        <p className="text-xs tracking-[0.35em] mb-4" style={{ color: c.tagText }}>
          填生日 · 看命盘 · 听解读
        </p>
        <h1
          className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold leading-none mb-4`}
          style={{ fontSize: 'clamp(44px, 12vw, 72px)', letterSpacing: '0.06em' }}
        >
          紫微命盘
        </h1>
        <p
          className="text-base sm:text-lg leading-relaxed mb-8"
          style={{ color: c.textSecond, fontWeight: 500 }}
        >
          输入你的生日，马上看命盘和解读
        </p>
        {!chart && (
          <button
            type="button"
            onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="px-10 py-4 font-semibold text-lg tracking-widest rounded-full"
            style={{ background: c.ctaBg, color: c.ctaText, boxShadow: '0 8px 28px rgba(184,146,42,0.28)' }}
          >
            开始排盘
          </button>
        )}
      </header>

      <main className="px-4 sm:px-6 pb-16 max-w-6xl mx-auto">
        {!chart ? (
          <div ref={formRef} className="max-w-lg mx-auto pt-2">
            <p className="text-center text-sm mb-4" style={{ color: c.textMuted }}>
              ① 填写生日　② 点开始排盘　③ 看结果
            </p>
            <BirthForm onSubmit={handleSubmit} />
          </div>
        ) : (
          <div ref={resultRef}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2 rounded-full text-sm"
                style={{
                  border: `1px solid ${c.goldLine}`,
                  color: c.goldSolid,
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                ← 重新填写
              </button>
              <span className="text-sm" style={{ color: c.textMuted }}>
                下面左边是命盘，右边是解读
              </span>
            </div>

            <TimeNav
              chart={chart}
              view={view}
              liunianYear={liunianYear}
              onViewChange={setView}
              onYearChange={setLiunianYear}
            />

            <div
              className="mt-4 grid gap-5 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)]"
            >
              <div>
                <div className="text-sm font-semibold mb-2" style={{ color: c.goldSolid }}>
                  你的命盘
                </div>
                <ChartBoard chart={chart} onPalaceSelect={setSelectedPalace} />
              </div>
              <div className="flex flex-col min-h-[480px]">
                <div className="text-sm font-semibold mb-2" style={{ color: c.goldSolid }}>
                  AI 解读（可点主题，或点左边宫位）
                </div>
                <div className="flex-1 min-h-[480px] h-[480px]">
                  <InsightPanel chart={chart} selectedPalace={selectedPalace} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="px-4 py-8 text-center" style={{ borderTop: `1px solid ${c.navBorder}` }}>
        <p className="text-xs leading-relaxed" style={{ color: c.footerText }}>
          仅供参考，不构成决策建议。命运掌握在自己手中。
          <br />
          <a href="/terms" style={{ color: c.footerText, textDecoration: 'underline' }}>服务条款</a>
          {' · '}
          <a href="/privacy" style={{ color: c.footerText, textDecoration: 'underline' }}>隐私政策</a>
        </p>
      </footer>
    </div>
  );
}