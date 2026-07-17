import type { SeaCondition } from '@/types';
import { fetchOpenWeatherWind } from './openweather';
import { fetchOpenMeteoMarine } from './openmeteo';
import { fetchCwaWarnings, warningHitsZone } from './cwa';
import { getZoneById, getZoneList } from './zones';

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

// M5 起 25 個 zone 只定義中心點(見 zones.ts),不再維護 bounding box。
// 點→區以「最近中心點」估算,不求精確多邊形——精度改良留給後續 M5 地圖細節。
export function findZonesForLatLng(lat: number, lng: number): string[] {
  const zones = getZoneList();
  if (zones.length === 0) {
    return [];
  }

  let nearest = zones[0];
  let nearestDistSq = Infinity;
  for (const zone of zones) {
    const dLat = lat - zone.centerLat;
    const dLng = lng - zone.centerLng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearest = zone;
    }
  }

  return [nearest.zoneId];
}

// 查該經緯度所在海域是否有生效中的官方海上警特報。
// 需要 lat/lng → 海域分區的估算(粗略即可,見 findZonesForLatLng),
// 再用 warningHitsZone 比對 fetchCwaWarnings() 回來的數據。
export async function getOfficialWarning(lat: number, lng: number): Promise<boolean> {
  const [zoneId] = findZonesForLatLng(lat, lng);
  const zone = zoneId ? getZoneById(zoneId) : undefined;
  if (!zone) {
    return false;
  }

  const warnings = await fetchCwaWarnings();
  return warningHitsZone(warnings, zone);
}
