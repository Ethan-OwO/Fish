import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { toCacheRow, type CacheRow } from '@/lib/supabase/cache';
import { toHistoryRow, HISTORY_RETENTION_HOURS } from '@/lib/supabase/history';
import { getZoneList, type ZoneMeta } from '@/lib/weather/zones';
import { getSeaCondition } from '@/lib/weather/aggregate';
import { fetchCwaWarnings, warningHitsZone, type CwaWarning } from '@/lib/weather/cwa';
import { evaluateDanger } from '@/lib/danger/evaluate';
import { mapWithConcurrency } from '@/lib/util/concurrency';

// 🐟 CWA 頻率上限:官方未公開數字化配額(見 scripts/probe-upstream.ts)。
// Open-Meteo 免費層級為 10,000 次/日(官方 pricing 頁),OpenWeather 走 /data/2.5/weather
// 免費層級(60 次/分、1,000,000 次/月,無獨立每日上限,見 scripts/probe-upstream.ts)。
// 25 個 zone 以 30 分鐘一輪為 1,200 次/日,遠低於兩者上限,故沿用 roadmap 原定的 30 分鐘。
const REFRESH_INTERVAL_MINUTES = 30;

// Vercel Hobby 方案 Node 函式時間上限,25 zone 並行刷新需要比 4 zone 時代更長的餘裕。
// 🔒 部署到 Vercel 後應確認 Hobby 方案實際可設上限是否確實支援 60 秒。
export const maxDuration = 60;

// 同一輪 refresh 只打一次 CWA 警特報 API,25 個 zone 共用同一份結果,避免重複外呼。
const CONCURRENCY_LIMIT = 6;

function authorize(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const header = req.headers.get('authorization') ?? '';
  const expectedHeader = `Bearer ${expected}`;

  // constant-time 比較,避免用字串長度差異做 timing attack。
  const a = Buffer.from(header);
  const b = Buffer.from(expectedHeader);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

function isDue(row: CacheRow | undefined, now: Date, force: boolean): boolean {
  if (force) return true;
  if (!row) return true;
  if (!row.next_refresh_at) return true;
  return new Date(row.next_refresh_at).getTime() <= now.getTime();
}

interface RefreshResult {
  zoneId: string;
}

interface RefreshFailure {
  zoneId: string;
  error: string;
}

async function refreshZone(zone: ZoneMeta, warnings: CwaWarning[]): Promise<CacheRow> {
  const condition = await getSeaCondition(zone.centerLat, zone.centerLng);
  const hasOfficialWarning = warningHitsZone(warnings, zone);

  const danger = evaluateDanger(condition, hasOfficialWarning);
  const fetchedAt = new Date();
  const nextRefreshAt = new Date(fetchedAt.getTime() + REFRESH_INTERVAL_MINUTES * 60 * 1000);

  return toCacheRow({
    zoneId: zone.zoneId,
    zoneName: zone.zoneName,
    centerLat: zone.centerLat,
    centerLng: zone.centerLng,
    condition,
    danger,
    fetchedAt,
    nextRefreshAt,
  });
}

// POST /api/cron/refresh   → 需 Authorization: Bearer <CRON_SECRET>,由 cron-job.org 每 30 分觸發。
export async function POST(req: Request): Promise<Response> {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === '1';

  const supabase = createServiceClient();
  const zones = getZoneList();

  const { data: existingRows, error: readError } = await supabase
    .from('sea_condition_cache')
    .select('zone_id, next_refresh_at');

  if (readError) {
    return NextResponse.json({ error: 'Failed to read cache', message: readError.message }, { status: 502 });
  }

  const existingByZone = new Map<string, { next_refresh_at: string | null }>(
    (existingRows ?? []).map((row) => [row.zone_id, row]),
  );

  const now = new Date();
  const dueZones = zones.filter((zone) => {
    const existing = existingByZone.get(zone.zoneId);
    return isDue(existing as CacheRow | undefined, now, force);
  });
  const skipped = zones
    .filter((zone) => !dueZones.includes(zone))
    .map((zone) => zone.zoneId);

  const refreshed: RefreshResult[] = [];
  const failed: RefreshFailure[] = [];
  const refreshedRows: CacheRow[] = [];

  if (dueZones.length > 0) {
    // 整輪只打一次 CWA 警特報 API,25 個 due zone 共用同一份結果(warningHitsZone 逐一比對)。
    // CWA 這次呼叫失敗不應讓整輪 25 個 zone 全部失敗——退化為「這輪視為無警報依據」,
    // 風/浪資料仍照常刷新,不中斷其他上游正常的部分。
    let warnings: CwaWarning[] = [];
    try {
      warnings = await fetchCwaWarnings();
    } catch {
      warnings = [];
    }

    // continue-on-error:單一 zone 失敗不中斷,最多 CONCURRENCY_LIMIT 個並行。
    const results = await mapWithConcurrency(dueZones, CONCURRENCY_LIMIT, async (zone) => {
      const row = await refreshZone(zone, warnings);
      const { error: upsertError } = await supabase.from('sea_condition_cache').upsert(row);
      if (upsertError) {
        throw new Error(upsertError.message);
      }
      return row;
    });

    results.forEach((result, index) => {
      const zoneId = dueZones[index].zoneId;
      if (result.status === 'fulfilled') {
        refreshed.push({ zoneId });
        refreshedRows.push(result.value);
      } else {
        failed.push({ zoneId, error: (result.reason as Error).message });
      }
    });
  }

  // 歷史 append(供 12h 走勢圖)+ 清掉保留期外的舊列。
  // 歷史寫入失敗不影響 refresh 本體結果:cache 已更新,只在回應多帶 historyError。
  let historyError: string | undefined;
  if (refreshedRows.length > 0) {
    const { error: insertError } = await supabase
      .from('sea_condition_history')
      .insert(refreshedRows.map(toHistoryRow));
    if (insertError) {
      historyError = insertError.message;
    } else {
      const cutoff = new Date(now.getTime() - HISTORY_RETENTION_HOURS * 60 * 60 * 1000);
      const { error: pruneError } = await supabase
        .from('sea_condition_history')
        .delete()
        .lt('fetched_at', cutoff.toISOString());
      if (pruneError) {
        historyError = pruneError.message;
      }
    }
  }

  // 孤兒數清:刪掉不在現行 zone 數字表裡的舊列(例如 M3 時代的 4 個中文 zone_id)。
  const currentZoneIds = zones.map((zone) => zone.zoneId);
  const { error: cleanupError } = await supabase
    .from('sea_condition_cache')
    .delete()
    .not('zone_id', 'in', `(${currentZoneIds.map((id) => `"${id}"`).join(',')})`);

  if (cleanupError) {
    return NextResponse.json(
      {
        refreshed: refreshed.map((r) => r.zoneId),
        skipped,
        failed,
        cleanupError: cleanupError.message,
        ...(historyError ? { historyError } : {}),
      },
      { status: 200 },
    );
  }

  return NextResponse.json({
    refreshed: refreshed.map((r) => r.zoneId),
    skipped,
    failed,
    ...(historyError ? { historyError } : {}),
  });
}
