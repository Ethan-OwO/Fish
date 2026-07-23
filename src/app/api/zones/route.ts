import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { CacheRow } from '@/lib/supabase/cache';
import { getZoneList } from '@/lib/weather/zones';
import type { ZoneSummary } from '@/types';

// GET /api/zones   → 公開,免登入。25 個海區的當前海況總覽,一次回傳,
// 供海況地圖與海域清單使用(逐區打 /api/sea-conditions 會放大 25 倍請求量)。
// 只讀 cache,不觸發 coldFetch:個別 zone 缺列時 condition 為 null,由前端顯示「取不到」。
export async function GET(): Promise<Response> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.from('sea_condition_cache').select('*');
  if (error) {
    return NextResponse.json(
      { error: 'Failed to read zone cache', message: error.message },
      { status: 502 },
    );
  }

  const rowsByZone = new Map<string, CacheRow>(
    ((data ?? []) as CacheRow[]).map((row) => [row.zone_id, row]),
  );

  const now = Date.now();
  const zones: ZoneSummary[] = getZoneList().map((zone) => {
    const row = rowsByZone.get(zone.zoneId);
    if (!row) {
      return {
        zoneId: zone.zoneId,
        zoneName: zone.zoneName,
        category: zone.category,
        centerLat: zone.centerLat,
        centerLng: zone.centerLng,
        current: null,
      };
    }

    const staleness_seconds = Math.max(
      0,
      Math.round((now - new Date(row.fetched_at).getTime()) / 1000),
    );
    return {
      zoneId: zone.zoneId,
      zoneName: zone.zoneName,
      category: zone.category,
      centerLat: zone.centerLat,
      centerLng: zone.centerLng,
      current: {
        rating: row.rating,
        windSpeed: row.wind_speed_ms,
        waveHeight: row.wave_height_m,
        seaTemp: row.sea_temp_c,
        hasOfficialWarning: row.has_official_warning,
        fetched_at: row.fetched_at,
        staleness_seconds,
        is_stale: staleness_seconds > 60 * 60, // 與 /api/sea-conditions 的判定一致
      },
    };
  });

  return NextResponse.json({ zones });
}
