// 新鮮度是一級 UI 概念(DESIGN.md 第 4 節),置於評級燈正下方,不是角落小字。
// 文案講漁民的話:說發生什麼、怎麼辦,不出現系統詞彙。

export type StalenessState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'fresh'; stalenessSeconds: number }
  | { kind: 'stale'; stalenessSeconds: number; fetchedAt: string };

function formatClock(iso: string): string {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

function humanizeAge(seconds: number): { value: number; unit: string } {
  if (seconds >= 3600) {
    return { value: Math.floor(seconds / 3600), unit: '小時' };
  }
  return { value: Math.max(1, Math.round(seconds / 60)), unit: '分鐘' };
}

export function StalenessBadge({ state }: { state: StalenessState }) {
  if (state.kind === 'loading') {
    return <p className="text-13 text-fg-dim">取得中…</p>;
  }

  if (state.kind === 'failed') {
    return (
      <p className="text-13 text-fg-dim">
        上次成功:<span className="font-mono">—</span>
      </p>
    );
  }

  const age = humanizeAge(state.stalenessSeconds);

  if (state.kind === 'fresh') {
    return (
      <p className="text-13 text-fg-dim">
        <span className="font-mono">{age.value}</span> {age.unit}前更新
      </p>
    );
  }

  return (
    <p className="inline-flex min-h-6 flex-wrap items-center gap-1 rounded-full border border-caution px-3 py-1 text-13 text-caution">
      資料是 <span className="font-mono">{age.value}</span> {age.unit}前的(
      <span className="font-mono">{formatClock(state.fetchedAt)}</span>
      ),海上狀況可能已改變
    </p>
  );
}
