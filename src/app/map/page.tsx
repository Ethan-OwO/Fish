import type { Metadata } from 'next';
import { TaiwanSeaMap } from '@/components/map/TaiwanSeaMap';
import { ZoneTable, sortZones, type SortDir, type ZoneSortKey } from '@/components/map/ZoneTable';
import { ZoneDetailPanel } from '@/components/map/ZoneDetailPanel';
import { getMockHistory, getMockZoneResponse, getMockZoneSummaries } from '@/lib/mock/dashboard';

export const metadata: Metadata = {
  title: '海況地圖 — 出海筊',
  description: '25 個海區的即時三級評級、風速浪高與 12 小時走勢。',
};

const SORT_KEYS: ZoneSortKey[] = ['rating', 'wind', 'wave', 'temp', 'updated'];

// 海況地圖:desktop = 地圖+清單為主、右側 380px 詳情面板;mobile = 地圖 → 詳情 → 清單堆疊。
// 選區、排序全走 query string,整頁維持 Server Component。
export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ zone?: string; sort?: string; dir?: string }>;
}) {
  const params = await searchParams;
  const zones = getMockZoneSummaries();

  const requested = zones.find((z) => z.zoneId === params.zone);
  // 預設選最嚴重的海區——打開地圖第一眼就看到今天最需要知道的事
  const selected =
    requested ??
    zones.find((z) => z.current?.rating === 'danger') ??
    zones.find((z) => z.current?.rating === 'caution') ??
    zones[0];

  const sortKey: ZoneSortKey = SORT_KEYS.includes(params.sort as ZoneSortKey)
    ? (params.sort as ZoneSortKey)
    : 'rating';
  const dir: SortDir = params.dir === 'asc' ? 'asc' : 'desc';
  const sorted = sortZones(zones, sortKey, dir);

  const counts = { safe: 0, caution: 0, danger: 0 };
  for (const z of zones) {
    if (z.current) counts[z.current.rating] += 1;
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-22 font-medium">海況地圖</h1>
        <p className="flex items-center gap-3 text-14 text-fg-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-safe" aria-hidden /> <span className="font-mono">{counts.safe}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-caution" aria-hidden /> <span className="font-mono">{counts.caution}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-danger" aria-hidden /> <span className="font-mono">{counts.danger}</span>
          </span>
        </p>
        <span
          className="ml-auto rounded-full border border-caution/60 px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-caution"
          title="尚未部署,目前顯示種子化示範資料;接上 /api/zones 後移除"
        >
          示範資料
        </span>
      </div>

      {/* mobile 堆疊順序:地圖 → 詳情 → 清單;desktop 詳情固定右欄跨兩列 */}
      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <TaiwanSeaMap zones={zones} selectedZoneId={selected.zoneId} />
        </div>

        <aside
          aria-label="海區詳情"
          className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1"
        >
          <ZoneDetailPanel
            zone={selected}
            response={getMockZoneResponse(selected.zoneId)}
            history={getMockHistory(selected.zoneId)}
          />
        </aside>

        <section id="zones" className="min-w-0 scroll-mt-20 lg:col-start-1 lg:row-start-2">
          <h2 className="mb-2 text-18 font-medium">
            海域清單 <span className="text-13 font-normal text-fg-dim">點表頭排序・點海區名稱選取</span>
          </h2>
          <ZoneTable zones={sorted} sortKey={sortKey} dir={dir} selectedZoneId={selected.zoneId} />
        </section>
      </div>
    </main>
  );
}
