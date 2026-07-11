import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { toCacheRow, type CacheRow } from '@/lib/supabase/cache';
import { getZoneList, type ZoneMeta } from '@/lib/weather/zones';
import { getSeaCondition, getOfficialWarning } from '@/lib/weather/aggregate';
import { evaluateDanger } from '@/lib/danger/evaluate';

// 🐟 CWA 頻率上限:官方未公開數字化配額(見 scripts/probe-upstream.ts)。
// Open-Meteo 免費層級為 10,000 次/日(官方 pricing 頁),4 個 zone 以 30 分鐘一輪
// 只會用到 192 次/日,遠低於上限,故採用 roadmap 原定的 30 分鐘。
const REFRESH_INTERVAL_MINUTES = 30;

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

async function refreshZone(zone: ZoneMeta): Promise<CacheRow> {
  const [condition, hasOfficialWarning] = await Promise.all([
    getSeaCondition(zone.centerLat, zone.centerLng),
    getOfficialWarning(zone.centerLat, zone.centerLng),
  ]);

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

  // continue-on-error:單一 zone 失敗不中斷,收集失敗清單一起回傳。
  for (const zone of dueZones) {
    try {
      const row = await refreshZone(zone);
      const { error: upsertError } = await supabase.from('sea_condition_cache').upsert(row);
      if (upsertError) {
        failed.push({ zoneId: zone.zoneId, error: upsertError.message });
        continue;
      }
      refreshed.push({ zoneId: zone.zoneId });
    } catch (error) {
      failed.push({ zoneId: zone.zoneId, error: (error as Error).message });
    }
  }

  return NextResponse.json({
    refreshed: refreshed.map((r) => r.zoneId),
    skipped,
    failed,
  });
}
