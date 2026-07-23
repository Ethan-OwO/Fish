import Link from 'next/link';
import type { DangerLevel, ZoneSummary } from '@/types';

export type ZoneSortKey = 'rating' | 'wind' | 'wave' | 'temp' | 'updated';
export type SortDir = 'asc' | 'desc';

const RATING_TEXT: Record<DangerLevel, { label: string; cls: string; dot: string }> = {
  safe: { label: '安全', cls: 'text-safe', dot: 'bg-safe' },
  caution: { label: '注意', cls: 'text-caution', dot: 'bg-caution' },
  danger: { label: '危險', cls: 'text-danger', dot: 'bg-danger' },
};

const SEVERITY: Record<DangerLevel, number> = { safe: 0, caution: 1, danger: 2 };

export function sortZones(zones: ZoneSummary[], key: ZoneSortKey, dir: SortDir): ZoneSummary[] {
  const sign = dir === 'asc' ? 1 : -1;
  const val = (z: ZoneSummary): number => {
    if (!z.current) return -Infinity; // 無資料永遠沉底(不論方向)
    switch (key) {
      case 'rating':
        return SEVERITY[z.current.rating];
      case 'wind':
        return z.current.windSpeed;
      case 'wave':
        return z.current.waveHeight ?? -1; // null 排在所有實際浪高之後
      case 'temp':
        return z.current.seaTemp;
      case 'updated':
        return -z.current.staleness_seconds; // 越新鮮值越大
    }
  };
  return [...zones].sort((a, b) => {
    const av = val(a);
    const bv = val(b);
    if (av === -Infinity && bv === -Infinity) return 0;
    if (av === -Infinity) return 1;
    if (bv === -Infinity) return -1;
    return (av - bv) * sign || a.zoneId.localeCompare(b.zoneId);
  });
}

function ageText(seconds: number): string {
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)} 時前`;
  return `${Math.max(1, Math.round(seconds / 60))} 分前`;
}

interface ZoneTableProps {
  zones: ZoneSummary[]; // 已排序
  sortKey: ZoneSortKey;
  dir: SortDir;
  selectedZoneId: string;
}

// 海域清單:密集數據表(桌面列高 36px)。sticky header、zebra、數值右對齊 mono、
// 表頭點擊 = query string 排序(同鍵再點反向),零 Client JS。
export function ZoneTable({ zones, sortKey, dir, selectedZoneId }: ZoneTableProps) {
  const headers: { key: ZoneSortKey | null; label: string; numeric?: boolean }[] = [
    { key: null, label: '海區' },
    { key: 'rating', label: '評級' },
    { key: 'wind', label: '風速 m/s', numeric: true },
    { key: 'wave', label: '浪高 m', numeric: true },
    { key: 'temp', label: '海表溫 °C', numeric: true },
    { key: 'updated', label: '更新' },
  ];

  const sortHref = (key: ZoneSortKey) => {
    const nextDir: SortDir = sortKey === key && dir === 'desc' ? 'asc' : 'desc';
    return `/map?zone=${selectedZoneId}&sort=${key}&dir=${nextDir}#zones`;
  };
  const arrow = (key: ZoneSortKey) => (sortKey === key ? (dir === 'desc' ? ' ↓' : ' ↑') : '');

  return (
    <div className="max-h-[520px] overflow-auto rounded-lg border border-border">
      <table className="w-full min-w-[560px] border-collapse text-14">
        <thead className="sticky top-0 z-10 bg-surface">
          <tr>
            {headers.map((h) => (
              <th
                key={h.label}
                className={`whitespace-nowrap border-b border-border px-3 py-2 text-13 font-medium text-fg-muted ${
                  h.numeric ? 'text-right' : 'text-left'
                }`}
              >
                {h.key ? (
                  <Link href={sortHref(h.key)} className="transition-colors hover:text-fg">
                    {h.label}
                    <span className="font-mono">{arrow(h.key)}</span>
                  </Link>
                ) : (
                  h.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {zones.map((zone) => {
            const c = zone.current;
            const selected = zone.zoneId === selectedZoneId;
            return (
              <tr
                key={zone.zoneId}
                className={`h-9 odd:bg-bg-alt ${selected ? 'bg-surface-hi odd:bg-surface-hi' : ''}`}
              >
                <td className="whitespace-nowrap px-3">
                  <Link
                    href={`/map?zone=${zone.zoneId}`}
                    scroll={false}
                    className={`transition-colors hover:text-accent ${selected ? 'text-accent' : ''}`}
                  >
                    {zone.zoneName}
                  </Link>
                  <span className="ml-1.5 font-mono text-[11px] uppercase text-fg-dim">{zone.zoneId}</span>
                </td>
                <td className="whitespace-nowrap px-3">
                  {c ? (
                    <span className={`inline-flex items-center gap-1.5 ${RATING_TEXT[c.rating].cls}`}>
                      <span className={`size-2 rounded-full ${RATING_TEXT[c.rating].dot}`} aria-hidden />
                      {RATING_TEXT[c.rating].label}
                    </span>
                  ) : (
                    <span className="text-fg-dim">—</span>
                  )}
                </td>
                <td className="px-3 text-right font-mono">{c ? c.windSpeed.toFixed(1) : '—'}</td>
                <td className="px-3 text-right font-mono">
                  {c ? (c.waveHeight === null ? <span className="text-fg-dim">—</span> : c.waveHeight.toFixed(1)) : '—'}
                </td>
                <td className="px-3 text-right font-mono">{c ? c.seaTemp.toFixed(1) : '—'}</td>
                <td className={`whitespace-nowrap px-3 text-13 ${c?.is_stale ? 'text-caution' : 'text-fg-dim'}`}>
                  {c ? ageText(c.staleness_seconds) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
