import type { HistoryPoint, SeaCondition, SeaConditionsResponse, ZoneSummary } from '@/types';
import { evaluateDanger } from '@/lib/danger/evaluate';
import { getZoneById, getZoneList } from '@/lib/weather/zones';

// 地圖/清單/走勢圖的 mock 資料層。與 sea-conditions mock 相同原則:
// 型別 import 自 @/types、評級一律用 evaluateDanger 真引擎;
// 種子化偽隨機(依 zoneId),同一個 30 分鐘窗口內每次 render 結果完全相同,
// 接上真 API(/api/zones、/api/history)後整個檔案可直接刪除。

// mulberry32:小而夠用的種子化 PRNG,避免 Math.random() 造成每次 render 不同
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// 對齊 30 分鐘邊界的「現在」:同一個窗口內 SSR 結果穩定,也貼近 cron 的更新節奏
function anchorNow(): number {
  const HALF_HOUR = 30 * 60 * 1000;
  return Math.floor(Date.now() / HALF_HOUR) * HALF_HOUR;
}

// 讓畫面同時展示三級評級與特例:其餘 zone 由種子自然落在 safe 附近
const DANGER_ZONES = new Set(['fs_02', 'ns_16']); // 強風區
const CAUTION_ZONES = new Set(['ns_01', 'ns_09', 'fs_06', 'fs_07']);
const STALE_ZONE = 'ns_03'; // 快取 2 小時沒更新
const NO_WAVE_ZONE = 'ns_05'; // 浪高模型不涵蓋

interface ZoneWeather {
  windSpeed: number;
  waveHeight: number | null;
  seaTemp: number;
}

// t = 0(現在)往回推的第 n 個 30 分鐘步;風速帶一條緩慢正弦 + 種子雜訊,浪高跟著風走
function weatherAt(zoneId: string, stepsAgo: number): ZoneWeather {
  const rng = mulberry32(hashString(zoneId) ^ (stepsAgo * 2654435761));

  // 平常大多數海區是安全的:base 落在蒲福 2–3 級;注意/危險由指定名單撐出展示分布
  let baseWind = 2 + mulberry32(hashString(zoneId))() * 3.2; // 2–5.2 m/s
  if (DANGER_ZONES.has(zoneId)) baseWind = 14.5 + mulberry32(hashString(zoneId))() * 2;
  if (CAUTION_ZONES.has(zoneId)) baseWind = 8.6 + mulberry32(hashString(zoneId))() * 1.6;

  const swell = Math.sin((stepsAgo / 24) * Math.PI * 2 + hashString(zoneId) % 7) * 1.0;
  const windSpeed = Math.max(0.5, baseWind + swell + (rng() - 0.5) * 1.2);

  const waveHeight =
    zoneId === NO_WAVE_ZONE
      ? null
      : Math.max(0.1, windSpeed * 0.16 + (rng() - 0.5) * 0.4);

  const seaTemp = 26.5 + (hashString(zoneId) % 30) / 10 + (rng() - 0.5) * 0.6;

  return {
    windSpeed: Math.round(windSpeed * 10) / 10,
    waveHeight: waveHeight === null ? null : Math.round(waveHeight * 10) / 10,
    seaTemp: Math.round(seaTemp * 10) / 10,
  };
}

function fetchedAgeSeconds(zoneId: string): number {
  if (zoneId === STALE_ZONE) return 2 * 60 * 60 + 12 * 60;
  return 4 * 60 + Math.floor(mulberry32(hashString(zoneId) ^ 0xa5)( ) * 18 * 60);
}

function toCondition(zoneId: string, weather: ZoneWeather): SeaCondition {
  const zone = getZoneById(zoneId);
  return {
    lat: zone?.centerLat ?? 0,
    lng: zone?.centerLng ?? 0,
    windSpeed: weather.windSpeed,
    waveHeight: weather.waveHeight,
    seaTemp: weather.seaTemp,
    source: { wind: 'openweather', wave: 'openmeteo', marine: 'openmeteo' },
    observedAt: new Date(anchorNow()).toISOString(),
  };
}

export function getMockZoneSummaries(): ZoneSummary[] {
  const now = anchorNow();
  return getZoneList().map((zone) => {
    const weather = weatherAt(zone.zoneId, 0);
    const danger = evaluateDanger(toCondition(zone.zoneId, weather), false);
    const age = fetchedAgeSeconds(zone.zoneId);
    return {
      zoneId: zone.zoneId,
      zoneName: zone.zoneName,
      category: zone.category,
      centerLat: zone.centerLat,
      centerLng: zone.centerLng,
      current: {
        rating: danger.level,
        windSpeed: weather.windSpeed,
        waveHeight: weather.waveHeight,
        seaTemp: weather.seaTemp,
        hasOfficialWarning: false,
        fetched_at: new Date(now - age * 1000).toISOString(),
        staleness_seconds: age,
        is_stale: age > 60 * 60,
      },
    };
  });
}

// 過去 12 小時、每 30 分鐘一點(對齊 cron 節奏),最舊在前
export function getMockHistory(zoneId: string): HistoryPoint[] {
  const now = anchorNow();
  const points: HistoryPoint[] = [];
  for (let stepsAgo = 24; stepsAgo >= 0; stepsAgo--) {
    const weather = weatherAt(zoneId, stepsAgo);
    const danger = evaluateDanger(toCondition(zoneId, weather), false);
    points.push({
      fetchedAt: new Date(now - stepsAgo * 30 * 60 * 1000).toISOString(),
      level: danger.level,
      windSpeed: weather.windSpeed,
      waveHeight: weather.waveHeight,
      seaTemp: weather.seaTemp,
    });
  }
  return points;
}

// 詳情面板用:單一 zone 的完整回應(等同 /api/sea-conditions 的 envelope)
export function getMockZoneResponse(zoneId: string): SeaConditionsResponse {
  const weather = weatherAt(zoneId, 0);
  const condition = toCondition(zoneId, weather);
  const age = fetchedAgeSeconds(zoneId);
  return {
    condition,
    danger: evaluateDanger(condition, false),
    fetched_at: new Date(anchorNow() - age * 1000).toISOString(),
    staleness_seconds: age,
    is_stale: age > 60 * 60,
  };
}
