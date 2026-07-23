import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { fromCacheRow, toCacheRow, type CacheRow } from '@/lib/supabase/cache';
import { findZonesForLatLng, getSeaCondition, getOfficialWarning } from '@/lib/weather/aggregate';
import { getZoneList, type ZoneMeta } from '@/lib/weather/zones';
import { evaluateDanger } from '@/lib/danger/evaluate';

// 不用 z.coerce:coerce 對 null 會靜默轉 0(見 api/CLAUDE.md 關鍵規則 #1),
// 且其 unknown input 型別與 .pipe() 不相容。transform(Number) 後空字串已被
// min(1) 擋掉、非數字變 NaN 會被 z.number() 拒絕,行為等價且型別乾淨。
const querySchema = z.object({
  lat: z.string().min(1).transform(Number).pipe(z.number().min(-90).max(90)),
  lng: z.string().min(1).transform(Number).pipe(z.number().min(-180).max(180)),
});

async function readZone(zoneId: string): Promise<CacheRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('sea_condition_cache')
    .select('*')
    .eq('zone_id', zoneId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read cache: ${error.message}`);
  }
  return (data as CacheRow | null) ?? null;
}

// 冷啟動回填:cache 完全查無此 zone 時,同步呼叫 aggregate() 取一次 + upsert,
// 讓使用者這次請求仍能拿到資料,不會因為 cron 還沒跑過就整段開天窗。
async function coldFetch(zone: ZoneMeta): Promise<CacheRow> {
  const [condition, hasOfficialWarning] = await Promise.all([
    getSeaCondition(zone.centerLat, zone.centerLng),
    getOfficialWarning(zone.centerLat, zone.centerLng),
  ]);

  const danger = evaluateDanger(condition, hasOfficialWarning);
  const fetchedAt = new Date();

  const row = toCacheRow({
    zoneId: zone.zoneId,
    zoneName: zone.zoneName,
    centerLat: zone.centerLat,
    centerLng: zone.centerLng,
    condition,
    danger,
    fetchedAt,
    nextRefreshAt: null, // 冷啟動不知道下一輪排程,交給下一次 cron 決定
  });

  const supabase = createServiceClient();
  const { error } = await supabase.from('sea_condition_cache').upsert(row);
  if (error) {
    throw new Error(`Failed to write cache: ${error.message}`);
  }

  return row;
}

// GET /api/sea-conditions?lat=..&lng=..   → 公開,無需登入,不可寫入
// M3 起:優先讀 DB cache,cache 全無此 zone 時才即時 coldFetch 回填。
// 更新責任在 refresh route(cron),這裡永遠不主動觸發排程性更新。
export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);

  const parsed = querySchema.safeParse({
    lat: searchParams.get('lat'),
    lng: searchParams.get('lng'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid or missing lat/lng query parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { lat, lng } = parsed.data;

  const zoneIds = findZonesForLatLng(lat, lng);
  if (zoneIds.length === 0) {
    return NextResponse.json(
      { error: 'No known sea zone covers this coordinate' },
      { status: 404 },
    );
  }

  const zoneId = zoneIds[0];
  const zoneMeta = getZoneList().find((z) => z.zoneId === zoneId);
  if (!zoneMeta) {
    return NextResponse.json(
      { error: 'Zone metadata not found for matched zone' },
      { status: 500 },
    );
  }

  try {
    let row = await readZone(zoneId);
    if (!row) {
      row = await coldFetch(zoneMeta);
    }

    const { condition, danger } = fromCacheRow(row);
    const fetchedAt = new Date(row.fetched_at);
    const staleness_seconds = Math.max(0, Math.round((Date.now() - fetchedAt.getTime()) / 1000));
    // 30 分鐘 refresh 週期,超過兩個週期沒更新視為 stale,提示前端顯示警語。
    const is_stale = staleness_seconds > 60 * 60;

    return NextResponse.json({
      condition,
      danger,
      fetched_at: row.fetched_at,
      staleness_seconds,
      is_stale,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sea conditions', message: (error as Error).message },
      { status: 502 },
    );
  }
}
