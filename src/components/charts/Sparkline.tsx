interface SparklinePoint {
  t: string; // ISO 時間
  v: number | null;
}

interface SparklineProps {
  label: string;
  unit: string;
  points: SparklinePoint[];
  /** 量測綁定色(text-m-wind / text-m-wave / text-m-temp),線與面積走 currentColor */
  colorClass: string;
  /** 缺資料時的說明(如浪高不涵蓋) */
  emptyText?: string;
}

const W = 240;
const H = 56;
const PAD = 4;

function formatClock(iso: string): string {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

// 12 小時走勢 sparkline:server 端純 SVG,無互動 JS。
// 曲線用量測綁定色;上下緣以 mono 標 max/min,右側標當前值——
// 資訊都在圖上,不依賴 hover(甲板上戴手套沒有 hover)。
export function Sparkline({ label, unit, points, colorClass, emptyText }: SparklineProps) {
  const values = points.map((p) => p.v).filter((v): v is number => v !== null);

  // 一個點畫不出走勢線,但「只有一筆」與「這個量測沒有資料」是兩回事:
  // 剛套用歷史表 / cron 才跑第一輪時會落在前者,此時仍要把當前值誠實秀出來,
  // 不能顯示 emptyText(那句是在講「此海區沒有這個量測」,會誤導)。
  if (values.length === 1) {
    return (
      <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-3">
        <p className="text-13 text-fg-muted">{label}</p>
        <div className={`flex h-14 items-center gap-3 ${colorClass}`}>
          <p>
            <span className="font-mono text-22">{values[0].toFixed(1)}</span>
            <span className="ml-1 text-13 text-fg-muted">{unit}</span>
          </p>
          <p className="text-13 text-fg-dim">累積中,尚不足以畫出走勢</p>
        </div>
      </div>
    );
  }

  if (values.length === 0) {
    return (
      <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-3">
        <p className="text-13 text-fg-muted">{label}</p>
        <p className="flex h-14 items-center text-14 text-fg-dim">{emptyText ?? '無資料'}</p>
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const xStep = (W - PAD * 2) / (points.length - 1);
  const yOf = (v: number) => PAD + (H - PAD * 2) * (1 - (v - min) / span);

  let line = '';
  let area = '';
  points.forEach((p, i) => {
    if (p.v === null) return;
    const x = PAD + i * xStep;
    const y = yOf(p.v);
    line += line ? ` L${x.toFixed(1)},${y.toFixed(1)}` : `M${x.toFixed(1)},${y.toFixed(1)}`;
  });
  if (line) {
    const firstX = PAD;
    const lastX = PAD + (points.length - 1) * xStep;
    area = `${line} L${lastX},${H - PAD} L${firstX},${H - PAD} Z`;
  }

  const current = values[values.length - 1];
  const firstT = points[0]?.t;
  const lastT = points[points.length - 1]?.t;

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-13 text-fg-muted">{label}</p>
        <p className="text-13 text-fg-dim">
          <span className="font-mono">{max.toFixed(1)}</span> 高・
          <span className="font-mono">{min.toFixed(1)}</span> 低
        </p>
      </div>
      <div className={`flex items-center gap-3 ${colorClass}`}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-14 w-0 grow"
          preserveAspectRatio="none"
          role="img"
          aria-label={`${label}過去 12 小時走勢,目前 ${current.toFixed(1)} ${unit}`}
        >
          <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} className="stroke-border" strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
          <path d={area} fill="currentColor" opacity="0.12" />
          <path d={line} fill="none" stroke="currentColor" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          <circle cx={PAD + (points.length - 1) * xStep} cy={yOf(current)} r="2.5" fill="currentColor" />
        </svg>
        <p className="shrink-0 text-right">
          <span className="font-mono text-22">{current.toFixed(1)}</span>
          <span className="ml-1 text-13 text-fg-muted">{unit}</span>
        </p>
      </div>
      <div className="flex justify-between text-[11px] text-fg-dim">
        <span className="font-mono">{firstT ? formatClock(firstT) : ''}</span>
        <span className="font-mono">{lastT ? formatClock(lastT) : ''}</span>
      </div>
    </div>
  );
}
