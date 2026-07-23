import type { DangerLevel } from '@/types';
import type { CacheRow } from './cache';

// 對應 sea_condition_history 資料表的欄位型別。
// append-only:refresh 每輪寫一列,是「過去 12 小時走勢」圖的資料來源。
export interface HistoryRow {
  zone_id: string;
  rating: DangerLevel;
  wind_speed_ms: number;
  wave_height_m: number | null;
  sea_temp_c: number;
  has_official_warning: boolean;
  fetched_at: string;
}

// 歷史保留時數:走勢圖最多看 12h,留 48h 給除錯餘裕,超過由 refresh 順手刪。
export const HISTORY_RETENTION_HOURS = 48;

export function toHistoryRow(row: CacheRow): HistoryRow {
  return {
    zone_id: row.zone_id,
    rating: row.rating,
    wind_speed_ms: row.wind_speed_ms,
    wave_height_m: row.wave_height_m,
    sea_temp_c: row.sea_temp_c,
    has_official_warning: row.has_official_warning,
    fetched_at: row.fetched_at,
  };
}
