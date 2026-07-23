import { StalenessBadge } from './StalenessBadge';
import { Disclaimer } from './Disclaimer';

// 冷啟動載入中:評級燈骨架動畫 + 「取得中」+ 數值卡骨架(DESIGN.md 第 10 節狀態矩陣)
export function SeaConditionSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
      <div className="h-7 w-40 animate-pulse rounded bg-surface" />
      <div className="min-h-[38svh] animate-pulse rounded-lg bg-surface" />
      <StalenessBadge state={{ kind: 'loading' }} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-surface" />
        ))}
      </div>
      <div className="h-36 animate-pulse rounded-lg bg-surface" />
      <Disclaimer />
    </div>
  );
}
