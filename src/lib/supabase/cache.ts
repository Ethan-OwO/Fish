import type { DangerResult, SeaCondition } from '@/types';

// 對應 sea_condition_cache 資料表的欄位型別,refresh route 與 sea-conditions route 共用。
export interface CacheRow {
  zone_id: string;
  zone_name: string;
  center_lat: number;
  center_lng: number;
  rating: 'safe' | 'caution' | 'danger';
  wind_speed_ms: number;
  wave_height_m: number;
  sea_temp_c: number;
  has_official_warning: boolean;
  sources: Record<string, unknown>;
  fetched_at: string;
  next_refresh_at: string | null;
}

// 把 aggregate.ts 算出的海況本體 + 危險判定結果,轉成可 upsert 進快取表的一列。
// 🐟 本體欄位確保跟 aggregate.ts 的實際輸出一一對應,不自行捏造欄位。
export function toCacheRow(params: {
  zoneId: string;
  zoneName: string;
  centerLat: number;
  centerLng: number;
  condition: SeaCondition;
  danger: DangerResult;
  fetchedAt: Date;
  nextRefreshAt: Date | null;
}): CacheRow {
  const { zoneId, zoneName, centerLat, centerLng, condition, danger, fetchedAt, nextRefreshAt } = params;

  const officialWarningFactor = danger.factors.find((f) => f.key === 'officialWarning');

  return {
    zone_id: zoneId,
    zone_name: zoneName,
    center_lat: centerLat,
    center_lng: centerLng,
    rating: danger.level,
    wind_speed_ms: condition.windSpeed,
    wave_height_m: condition.waveHeight,
    sea_temp_c: condition.seaTemp,
    has_official_warning: officialWarningFactor?.level === 'danger',
    sources: {
      wind: condition.source.wind,
      wave: condition.source.wave,
      marine: condition.source.marine,
      observedAt: condition.observedAt,
      factors: danger.factors,
    },
    fetched_at: fetchedAt.toISOString(),
    next_refresh_at: nextRefreshAt ? nextRefreshAt.toISOString() : null,
  };
}

// 把快取列還原成 API 回應形狀(condition + danger),讓 sea-conditions route
// 讀 cache 時不需要重新呼叫上游或重算 evaluateDanger。
export function fromCacheRow(row: CacheRow): { condition: SeaCondition; danger: DangerResult } {
  const factors = Array.isArray(row.sources?.factors)
    ? (row.sources.factors as DangerResult['factors'])
    : [];

  return {
    condition: {
      lat: row.center_lat,
      lng: row.center_lng,
      windSpeed: row.wind_speed_ms,
      waveHeight: row.wave_height_m,
      seaTemp: row.sea_temp_c,
      source: {
        wind: 'openweather',
        wave: 'openmeteo',
        marine: (row.sources?.marine as SeaCondition['source']['marine']) ?? 'openmeteo',
      },
      observedAt: (row.sources?.observedAt as string) ?? row.fetched_at,
    },
    danger: {
      level: row.rating,
      factors,
    },
  };
}
