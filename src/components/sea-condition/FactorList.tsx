import type { DangerFactor } from '@/types';

interface FactorListProps {
  factors: DangerFactor[];
  /** 浪高缺漏(null)時 factor 已被引擎移除,這裡補一列附註 */
  waveMissing?: boolean;
}

const DOT_COLOR: Record<DangerFactor['level'], string> = {
  safe: 'bg-safe',
  caution: 'bg-caution',
  danger: 'bg-danger',
};

// 右側 mono 原始值:mono 只包數字與單位,中文(如警特報狀態)留 sans(DESIGN.md 第 3 節 CJK 陷阱)
function RawValue({ factor }: { factor: DangerFactor }) {
  if (factor.key === 'wind' && typeof factor.raw === 'number') {
    return (
      <span className="text-16">
        <span className="font-mono">{factor.raw}</span>
        <span className="text-fg-muted"> 級</span>
      </span>
    );
  }
  if (factor.key === 'wave' && typeof factor.raw === 'number') {
    return (
      <span className="text-16">
        <span className="font-mono">{factor.raw.toFixed(1)}</span>
        <span className="text-fg-muted"> m</span>
      </span>
    );
  }
  return <span className="text-14 text-fg-muted">{String(factor.raw)}</span>;
}

export function FactorList({ factors, waveMissing = false }: FactorListProps) {
  return (
    <ul className="rounded-lg border border-border bg-surface">
      {factors.map((factor) => (
        <li
          key={factor.key}
          className="flex min-h-11 items-center gap-3 border-b border-border px-4 py-1.5 last:border-b-0"
        >
          <span className={`size-2 shrink-0 rounded-full ${DOT_COLOR[factor.level]}`} aria-hidden />
          <span className="flex-1 text-16">{factor.label}</span>
          <RawValue factor={factor} />
        </li>
      ))}
      {waveMissing && (
        <li className="flex min-h-11 items-center gap-3 px-4 py-1.5">
          <span className="size-2 shrink-0 rounded-full bg-fg-dim" aria-hidden />
          <span className="flex-1 text-14 text-fg-dim">浪高資料不涵蓋此座標,請選外海座標</span>
        </li>
      )}
    </ul>
  );
}
