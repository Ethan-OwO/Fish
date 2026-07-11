import type { SeaCondition } from '@/types';
import { fetchOpenWeatherWind } from './openweather';
import { fetchOpenMeteoMarine } from './openmeteo';
import { fetchCwaWarnings } from './cwa';

// Phase 1:風走 OpenWeather,浪高與海表溫走 Open-Meteo Marine(免申請金鑰)。
// 把不同來源本體正規化成統一的 SeaCondition。
export async function getSeaCondition(lat: number, lng: number): Promise<SeaCondition> {
  const [wind, marine] = await Promise.all([
    fetchOpenWeatherWind(lat, lng),
    fetchOpenMeteoMarine(lat, lng),
  ]);

  return {
    lat,
    lng,
    windSpeed: wind.windSpeed,
    waveHeight: marine.waveHeight,
    seaTemp: marine.seaTemp,
    source: {
      wind: 'openweather',
      wave: 'openmeteo',
      marine: 'openmeteo',
    },
    observedAt: marine.observedAt,
  };
}

// Phase 1 用粗略的經緯度範圍(bounding box)對照幾個主要海域分區,
// 不求精確 —— 之後 M3/M4 需要時再換成正式的經緯度 → 分區對照表。
// M3 起 zones.ts 會讀這份清單算 zone 中心點,cron/refresh 與 sea-conditions 共用同一份分區。
export const ZONE_BOUNDING_BOXES: Array<{ zone: string; minLat: number; maxLat: number; minLng: number; maxLng: number }> = [
  { zone: '臺灣海峽', minLat: 22.0, maxLat: 26.0, minLng: 118.0, maxLng: 120.5 },
  { zone: '巴士海峽', minLat: 20.0, maxLat: 22.5, minLng: 120.0, maxLng: 122.5 },
  { zone: '臺灣東北部海面', minLat: 24.5, maxLat: 26.5, minLng: 121.5, maxLng: 123.5 },
  { zone: '臺灣東南部海面', minLat: 21.5, maxLat: 24.0, minLng: 121.0, maxLng: 123.0 },
];

export function findZonesForLatLng(lat: number, lng: number): string[] {
  return ZONE_BOUNDING_BOXES.filter(
    (box) => lat >= box.minLat && lat <= box.maxLat && lng >= box.minLng && lng <= box.maxLng,
  ).map((box) => box.zone);
}

// 查該經緯度所在海域是否有生效中的官方海上警特報。
// 需要 lat/lng → 海域分區的估算(粗略即可),
// 再比對 fetchCwaWarnings() 回來的數據。
export async function getOfficialWarning(lat: number, lng: number): Promise<boolean> {
  const zones = findZonesForLatLng(lat, lng);
  if (zones.length === 0) {
    return false;
  }

  const warnings = await fetchCwaWarnings();
  return warnings.some((warning) => zones.includes(warning.zone));
}
