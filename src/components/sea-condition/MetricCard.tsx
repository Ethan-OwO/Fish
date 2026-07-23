import type { DangerLevel } from '@/types';

interface MetricCardProps {
  label: string;
  /** 已格式化的值;null 一律顯示「—」,絕不渲染成 0 */
  value: string | null;
  unit?: string;
  /** 人類可讀分級(直接取自 DangerFactor.label,前端不重新造句) */
  grade?: string;
  gradeLevel?: DangerLevel;
  /** 該量測的綁定色(量測色點,如 bg-m-wave),全站永不變 */
  dotClass?: string;
  /** 中文值(如警特報狀態)不走 mono,避免 CJK fallback 成醜等寬 */
  mono?: boolean;
  /** 值缺漏時的附註,如「浪高資料不涵蓋此座標」 */
  note?: string;
}

const GRADE_COLOR: Record<DangerLevel, string> = {
  safe: 'text-safe',
  caution: 'text-caution',
  danger: 'text-danger',
};

export function MetricCard({
  label,
  value,
  unit,
  grade,
  gradeLevel,
  dotClass,
  mono = true,
  note,
}: MetricCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4">
      <p className="flex items-center gap-1.5 text-13 text-fg-muted">
        {dotClass && <span className={`size-2 shrink-0 rounded-full ${dotClass}`} aria-hidden />}
        {label}
      </p>
      {value === null ? (
        <p className="text-40 text-fg-dim" aria-label={`${label}:無資料`}>
          —
        </p>
      ) : (
        <p className="flex flex-wrap items-baseline gap-x-1">
          <span className={mono ? 'font-mono text-40' : 'text-22 font-medium'}>{value}</span>
          {unit && <span className="text-16 text-fg-muted">{unit}</span>}
        </p>
      )}
      {grade && (
        <p className={`text-16 ${gradeLevel ? GRADE_COLOR[gradeLevel] : 'text-fg-muted'}`}>
          {grade}
        </p>
      )}
      {note && <p className="text-13 text-fg-dim">{note}</p>}
    </div>
  );
}
