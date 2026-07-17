import type { SeaCondition } from '@/types';
import type { ZoneMeta } from './zones';

// (A) CWA 海象數值 —— Phase 1 先固定 mock,之後有正式資料源再取代。
//     介面先定好,之後只改內部實作。
export async function fetchCwaMarine(
  _lat: number,
  _lng: number,
): Promise<Partial<SeaCondition>> {
  // Phase 1: 先寫死的假回傳值
  return {
    waveHeight: 1.2,
    seaTemp: 27.5,
    observedAt: new Date().toISOString(),
  };
}

export interface CwaWarning {
  zone: string; // 海域分區名,如「臺灣海峽」「巴士海峽」
  type: string; // 警報類型,如「海上強風」「長浪」
}

// (B) CWA 警特報 —— Phase 1 直接串接,讀 process.env.CWA_API_KEY。
//     回傳目前生效中的海上警特報數組(含適用海域分區)。
export async function fetchCwaWarnings(): Promise<CwaWarning[]> {
  const apiKey = process.env.CWA_API_KEY;
  if (!apiKey) {
    throw new Error('CWA_API_KEY is not set');
  }

  const url = new URL(
    'https://opendata.cwa.gov.tw/api/v1/rest/datastore/W-C0033-002',
  );
  url.searchParams.set('Authorization', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`CWA warnings request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  const records = data?.records?.location ?? [];

  const warnings: CwaWarning[] = [];
  for (const record of records) {
    const zone = record?.locationName;
    const hazards = record?.hazardConditions?.hazards ?? [];
    for (const hazard of hazards) {
      const type = hazard?.info?.phenomena;
      if (zone && type) {
        warnings.push({ zone, type });
      }
    }
  }

  return warnings;
}

// refresh 端的比對主路徑:已知 zone(含 warningArea)→ 檢核 warnings 中是否有精準相符的海區字串。
// 不用 lat/lng 反查,單純字串比對,pure function 方便測試。
export function warningHitsZone(warnings: CwaWarning[], zone: ZoneMeta): boolean {
  if (!zone.warningArea) {
    return false;
  }
  return warnings.some((warning) => warning.zone === zone.warningArea);
}
