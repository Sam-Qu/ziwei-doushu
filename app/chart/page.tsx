'use client';
import { useState } from 'react';
import AuthButton from '@/components/AuthButton';
import BirthForm from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import InsightPanel from '@/components/InsightPanel';
import TimeNav, { type TimeView } from '@/components/TimeNav';
import { generateChart } from '@/lib/ziwei/algorithm';
import type { BirthInfo, ZiweiChart, Palace } from '@/lib/ziwei/types';

/** /chart 备用入口：与主页同一套「填生日 → 看盘 → 看解读」流程 */
export default function ChartPage() {
  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const [view, setView] = useState<TimeView>('mingpan');
  const [liunianYear, setLiunianYear] = useState(2026);

  if (!chart) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ color: '#b8860b', textDecoration: 'none', fontSize: 14 }}>← 回主页</a>
          <AuthButton />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>开始排盘</h1>
        <p style={{ color: '#888', marginBottom: 32, fontSize: 15, lineHeight: 1.7 }}>
          填写生日，马上看命盘和解读。
        </p>
        <BirthForm onSubmit={(info: BirthInfo) => setChart(generateChart(info))} />
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
      <button
        type="button"
        onClick={() => { setChart(null); setSelectedPalace(null); }}
        style={{
          marginBottom: 16, padding: '8px 16px', cursor: 'pointer',
          border: '1px solid #ccc', borderRadius: 999, background: 'transparent', fontSize: 14,
        }}
      >
        ← 重新填写
      </button>

      <TimeNav
        chart={chart}
        view={view}
        liunianYear={liunianYear}
        onViewChange={setView}
        onYearChange={setLiunianYear}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 400px)',
          gap: 20,
          marginTop: 16,
          alignItems: 'stretch',
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#b8860b' }}>你的命盘</div>
          <ChartBoard chart={chart} onPalaceSelect={setSelectedPalace} />
        </div>
        <div style={{ minHeight: 520, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#b8860b' }}>
            AI 解读（可点主题，或点左边宫位）
          </div>
          <div style={{ flex: 1, minHeight: 480, height: 480 }}>
            <InsightPanel chart={chart} selectedPalace={selectedPalace} />
          </div>
        </div>
      </div>
    </main>
  );
}