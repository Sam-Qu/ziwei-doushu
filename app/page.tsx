'use client';

import { useRef, useState } from 'react';
import BirthForm from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import InsightPanel from '@/components/InsightPanel';
import TimeNav, { type TimeView } from '@/components/TimeNav';
import { generateChart } from '@/lib/ziwei/algorithm';
import type { BirthInfo, Palace, ZiweiChart } from '@/lib/ziwei/types';

export default function HomePage() {
  const formRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const [view, setView] = useState<TimeView>('mingpan');
  const [liunianYear, setLiunianYear] = useState(2026);

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
    <div className="page-shell">
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 topbar-safe"
        style={{ background: 'var(--bg-0)', borderBottom: '1px solid var(--nav-line)' }}
      >
        <div className="text-sm tracking-[0.25em] font-medium" style={{ color: 'var(--ac)' }}>
          紫微命盘
        </div>
      </nav>

      <header className="px-5 pt-10 pb-6 text-center max-w-xl mx-auto">
        <p className="text-xs tracking-[0.35em] mb-4" style={{ color: 'var(--hero-tag)' }}>
          填生日 · 看命盘 · 听解读
        </p>
        <h1
          className="grad-text font-bold leading-none mb-4"
          style={{ fontSize: 'clamp(44px, 12vw, 72px)', letterSpacing: '0.06em' }}
        >
          紫微命盘
        </h1>
        <p
          className="text-base sm:text-lg leading-relaxed mb-8"
          style={{ color: 'var(--hero-second)', fontWeight: 500 }}
        >
          输入你的生日，马上看命盘和解读
        </p>
        {!chart && (
          <button
            type="button"
            onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="px-10 py-4 font-semibold text-lg tracking-widest rounded-full"
            style={{ background: 'var(--cta-bg)', color: 'var(--cta-ink)', boxShadow: 'var(--cta-shadow)' }}
          >
            开始排盘
          </button>
        )}
      </header>

      <main className="px-4 sm:px-6 pb-16 max-w-6xl mx-auto">
        {!chart ? (
          <div ref={formRef} className="max-w-lg mx-auto pt-2">
            <p className="text-center text-sm mb-4" style={{ color: 'var(--hero-muted)' }}>
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
                  border: '1px solid var(--gold-line)',
                  color: 'var(--ac)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                ← 重新填写
              </button>
              <span className="text-sm" style={{ color: 'var(--hero-muted)' }}>
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
                <div className="text-sm font-semibold mb-2" style={{ color: 'var(--ac)' }}>
                  你的命盘
                </div>
                <ChartBoard chart={chart} onPalaceSelect={setSelectedPalace} />
              </div>
              <div className="flex flex-col min-h-[480px]">
                <div className="text-sm font-semibold mb-2" style={{ color: 'var(--ac)' }}>
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

      <footer className="px-4 py-8 text-center" style={{ borderTop: '1px solid var(--nav-line)' }}>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--hero-footer)' }}>
          仅供参考，不构成决策建议。命运掌握在自己手中。
          <br />
          <a href="/terms" style={{ color: 'var(--hero-footer)', textDecoration: 'underline' }}>服务条款</a>
          {' · '}
          <a href="/privacy" style={{ color: 'var(--hero-footer)', textDecoration: 'underline' }}>隐私政策</a>
        </p>
      </footer>
    </div>
  );
}