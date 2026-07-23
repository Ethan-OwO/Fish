import type { SeaCondition, SeaConditionsResponse } from '@/types';
import { evaluateDanger } from '@/lib/danger/evaluate';
import { getZoneById } from '@/lib/weather/zones';

// M4 海況檢視頁的 mock 資料。型別一律 import 自 @/types,不自訂 shape;
// danger 一律用真引擎 evaluateDanger 算出,不手捏 factors,確保 UI 看到的
// label/level 與真資料完全同構。接上真 API 後整個目錄可直接刪除。

export const MOCK_STATE_IDS = [
  'safe',
  'caution',
  'danger',
  'stale',
  'nowave',
  'loading',
  'failed',
] as const;

export type MockStateId = (typeof MOCK_STATE_IDS)[number];

export const MOCK_STATE_LABELS: Record<MockStateId, string> = {
  safe: '安全',
  caution: '注意',
  danger: '危險',
  stale: '資料過期',
  nowave: '無浪高',
  loading: '載入中',
  failed: '全來源失敗',
};

export type MockView =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | {
      kind: 'data';
      zoneName: string;
      response: SeaConditionsResponse;
    };

function makeCondition(overrides: Partial<SeaCondition>): SeaCondition {
  const zone = getZoneById('ns_09'); // 鵝鑾鼻沿海
  return {
    lat: zone?.centerLat ?? 21.8,
    lng: zone?.centerLng ?? 120.9,
    windSpeed: 3.2,
    waveHeight: 0.5,
    seaTemp: 27.4,
    source: { wind: 'openweather', wave: 'openmeteo', marine: 'openmeteo' },
    observedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

function makeResponse(
  condition: SeaCondition,
  ageSeconds: number,
  hasOfficialWarning = false,
): SeaConditionsResponse {
  const fetchedAt = new Date(Date.now() - ageSeconds * 1000);
  return {
    condition,
    danger: evaluateDanger(condition, hasOfficialWarning),
    fetched_at: fetchedAt.toISOString(),
    staleness_seconds: ageSeconds,
    is_stale: ageSeconds > 60 * 60, // 與 route.ts 的判定一致
  };
}

export function getMockView(state: MockStateId): MockView {
  const zoneName = getZoneById('ns_09')?.zoneName ?? '鵝鑾鼻沿海';

  switch (state) {
    case 'loading':
      return { kind: 'loading' };
    case 'failed':
      return { kind: 'failed' };
    case 'safe':
      // 蒲福 2 級、小浪 → safe
      return {
        kind: 'data',
        zoneName,
        response: makeResponse(makeCondition({ windSpeed: 3.2, waveHeight: 0.5 }), 10 * 60),
      };
    case 'caution':
      // 蒲福 5 級、大浪 1.5m → caution
      return {
        kind: 'data',
        zoneName,
        response: makeResponse(makeCondition({ windSpeed: 9.0, waveHeight: 1.5 }), 12 * 60),
      };
    case 'danger':
      // 蒲福 7 級、浪高 3.2m → danger
      return {
        kind: 'data',
        zoneName,
        response: makeResponse(makeCondition({ windSpeed: 15.0, waveHeight: 3.2 }), 8 * 60),
      };
    case 'stale':
      // caution 等級的資料,但已是 2 小時前 → is_stale
      return {
        kind: 'data',
        zoneName,
        response: makeResponse(makeCondition({ windSpeed: 9.0, waveHeight: 1.5 }), 2 * 60 * 60),
      };
    case 'nowave':
      // 浪高 null(座標不在浪高模型涵蓋範圍)→ 顯示「—」,絕不渲染 0
      return {
        kind: 'data',
        zoneName,
        response: makeResponse(makeCondition({ windSpeed: 4.0, waveHeight: null }), 15 * 60),
      };
  }
}
