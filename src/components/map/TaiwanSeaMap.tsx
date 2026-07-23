import Link from 'next/link';
import type { ZoneSummary } from '@/types';

// 海圖式台灣底圖 + 25 區評級標記。
// 底圖是簡化示意海圖(非精確海岸線)——DESIGN.md 的目標是「甲板上一眼看懂哪區什麼臉色」,
// 不是導航圖;精確 zone 多邊形留給後續接真地圖圖資時處理。
// 標記是 HTML overlay 的 <Link>(?zone= 選取),互動與 tooltip 全靠 CSS,零 Client JS。

const LON0 = 116.2;
const LAT1 = 26.6; // 上緣
const SCALE = 80; // px / 度
const W = Math.round((123.9 - LON0) * SCALE); // 616
const H = Math.round((LAT1 - 20.2) * SCALE); // 512

const x = (lng: number) => (lng - LON0) * SCALE;
const y = (lat: number) => (LAT1 - lat) * SCALE;

// 台灣本島簡化輪廓(lng, lat),順時針
const TAIWAN: [number, number][] = [
  [121.5, 25.3], [121.75, 25.16], [121.93, 25.05], [122.0, 24.98], [121.9, 24.85],
  [121.83, 24.62], [121.8, 24.35], [121.65, 24.05], [121.6, 23.8], [121.52, 23.5],
  [121.42, 23.2], [121.35, 23.0], [121.2, 22.75], [121.05, 22.55], [120.92, 22.3],
  [120.88, 22.05], [120.86, 21.92], [120.75, 21.9], [120.7, 22.0], [120.68, 22.2],
  [120.58, 22.35], [120.42, 22.48], [120.3, 22.55], [120.17, 22.75], [120.08, 23.0],
  [120.08, 23.2], [120.12, 23.45], [120.18, 23.75], [120.3, 24.0], [120.47, 24.2],
  [120.68, 24.55], [120.9, 24.82], [121.05, 24.95], [121.22, 25.05], [121.38, 25.15],
];

// 大陸沿岸(粗略示意),往左上角收邊
const CHINA_COAST: [number, number][] = [
  [116.2, 23.2], [116.7, 23.35], [117.4, 23.7], [118.1, 24.45], [118.65, 24.9],
  [119.3, 25.45], [119.65, 26.1], [120.3, 26.45], [120.7, 26.6], [116.2, 26.6],
];

const ISLANDS: { cx: number; cy: number; r: number }[] = [
  { cx: 119.55, cy: 23.55, r: 8 }, // 澎湖
  { cx: 121.49, cy: 22.66, r: 4 }, // 綠島
  { cx: 121.55, cy: 22.05, r: 5 }, // 蘭嶼
  { cx: 120.37, cy: 22.34, r: 3.5 }, // 小琉球
  { cx: 118.35, cy: 24.43, r: 6 }, // 金門
  { cx: 119.95, cy: 26.15, r: 5 }, // 馬祖
];

const SEA_LABELS: { lng: number; lat: number; label: string }[] = [
  { lng: 118.7, lat: 24.15, label: '台灣海峽' },
  { lng: 121.3, lat: 21.35, label: '巴士海峽' },
  { lng: 122.9, lat: 23.4, label: '太平洋' },
  { lng: 122.4, lat: 26.3, label: '東海' },
  { lng: 117.2, lat: 21.2, label: '南海' },
];

const MARKER_STYLE: Record<'safe' | 'caution' | 'danger' | 'none', { ring: string; dot: string }> = {
  safe: { ring: 'border-safe/70 bg-safe/15', dot: 'bg-safe' },
  caution: { ring: 'border-caution/70 bg-caution/15', dot: 'bg-caution' },
  danger: { ring: 'border-danger/70 bg-danger/15', dot: 'bg-danger' },
  none: { ring: 'border-border bg-surface/60', dot: 'bg-fg-dim' },
};

function polyPath(points: [number, number][]): string {
  return (
    points.map(([lng, lat], i) => `${i === 0 ? 'M' : 'L'}${x(lng).toFixed(1)},${y(lat).toFixed(1)}`).join(' ') +
    ' Z'
  );
}

export function TaiwanSeaMap({
  zones,
  selectedZoneId,
}: {
  zones: ZoneSummary[];
  selectedZoneId: string;
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border bg-bg" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden>
        {/* 經緯網格,海圖感 */}
        {[117, 118, 119, 120, 121, 122, 123].map((lng) => (
          <line key={`v${lng}`} x1={x(lng)} y1={0} x2={x(lng)} y2={H} className="stroke-border" strokeWidth="0.6" opacity="0.5" />
        ))}
        {[21, 22, 23, 24, 25, 26].map((lat) => (
          <line key={`h${lat}`} x1={0} y1={y(lat)} x2={W} y2={y(lat)} className="stroke-border" strokeWidth="0.6" opacity="0.5" />
        ))}
        {[117, 119, 121, 123].map((lng) => (
          <text key={`vt${lng}`} x={x(lng) + 3} y={H - 5} className="fill-fg-dim font-mono" fontSize="10">
            {lng}°E
          </text>
        ))}
        {[21, 23, 25].map((lat) => (
          <text key={`ht${lat}`} x={4} y={y(lat) - 3} className="fill-fg-dim font-mono" fontSize="10">
            {lat}°N
          </text>
        ))}

        {/* 陸地:壓暗、不搶海面 */}
        <path d={polyPath(CHINA_COAST)} className="fill-bg-alt stroke-border" strokeWidth="1" />
        <path d={polyPath(TAIWAN)} className="fill-bg-alt stroke-border" strokeWidth="1.2" />
        {ISLANDS.map((isl, i) => (
          <circle key={i} cx={x(isl.cx)} cy={y(isl.cy)} r={isl.r} className="fill-bg-alt stroke-border" strokeWidth="1" />
        ))}

        {SEA_LABELS.map((s) => (
          <text key={s.label} x={x(s.lng)} y={y(s.lat)} className="fill-fg-dim" fontSize="12" opacity="0.8">
            {s.label}
          </text>
        ))}
      </svg>

      {/* 25 區標記:HTML overlay,hover 顯示名稱與數值,點擊選取 */}
      {zones.map((zone) => {
        const rating = zone.current?.rating ?? 'none';
        const style = MARKER_STYLE[rating];
        const selected = zone.zoneId === selectedZoneId;
        const stale = zone.current?.is_stale ?? false;
        return (
          <Link
            key={zone.zoneId}
            href={`/map?zone=${zone.zoneId}`}
            scroll={false}
            aria-label={`${zone.zoneName}:${zone.current ? rating : '無資料'}`}
            aria-current={selected ? 'true' : undefined}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${(x(zone.centerLng) / W) * 100}%`,
              top: `${(y(zone.centerLat) / H) * 100}%`,
            }}
          >
            <span
              className={`flex size-6 items-center justify-center border transition-transform duration-150 group-hover:scale-125 ${
                zone.category === 'offshore' ? 'rounded-md' : 'rounded-full'
              } ${style.ring} ${stale ? 'border-dashed saturate-50' : ''} ${
                selected ? 'scale-125 ring-2 ring-accent' : ''
              }`}
            >
              <span className={`size-2 rounded-full ${style.dot}`} />
            </span>
            <span className="pointer-events-none invisible absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-bg-alt px-2 py-1 text-13 opacity-0 shadow-lg shadow-black/40 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100">
              {zone.zoneName}
              {zone.current && (
                <span className="ml-1.5 text-fg-muted">
                  <span className="font-mono">{zone.current.windSpeed.toFixed(1)}</span> m/s
                  {zone.current.waveHeight !== null && (
                    <>
                      {' ・ '}
                      <span className="font-mono">{zone.current.waveHeight.toFixed(1)}</span> m
                    </>
                  )}
                </span>
              )}
            </span>
          </Link>
        );
      })}

      {/* 圖例 */}
      <div className="absolute bottom-2 right-2 flex flex-col gap-1 rounded border border-border bg-bg/85 px-2.5 py-2 text-[11px] text-fg-muted backdrop-blur">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-safe" /> 安全
          <span className="size-2 rounded-full bg-caution" /> 注意
          <span className="size-2 rounded-full bg-danger" /> 危險
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border border-fg-dim" /> 近海
          <span className="size-2.5 rounded-sm border border-fg-dim" /> 遠海
        </span>
      </div>
    </div>
  );
}
