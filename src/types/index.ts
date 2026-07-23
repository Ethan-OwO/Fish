export type DangerLevel = 'safe' | 'caution' | 'danger';

export interface SeaCondition {
  lat: number;
  lng: number;
  windSpeed: number; // m/s   ← OpenWeather
  waveHeight: number | null; // m ← Open-Meteo Marine;陸地座標無浪高模型資料,回 null(不是 0)
  seaTemp: number; // °C    ← Open-Meteo(本體保留,Phase 1 不評估)
  source: {
    // 記錄各欄位實際來自哪個來源,方便除錯
    wind: 'openweather';
    wave: 'openmeteo';
    marine: 'cwa-mock' | 'openmeteo';
  };
  observedAt: string; // ISO
}

// Phase 1 只產出 wind / wave / officialWarning 三種 factor;
// 'seaTemp' 先留在 union 裡以後使用。
export interface DangerFactor {
  key: 'wind' | 'wave' | 'seaTemp' | 'officialWarning';
  level: DangerLevel;
  raw: number | string; // 原始值,如蒲福 7 級 / 浪高 3.2m
  label: string; // 給漁民看的易懂說明
}

export interface DangerResult {
  level: DangerLevel; // 綜合結論
  factors: DangerFactor[];
}

// GET /api/zones 回傳的單一海區總覽(地圖與海域清單用)。
// current 為 null = cache 尚無此 zone(未曾 refresh),前端顯示「取不到」。
export interface ZoneSummary {
  zoneId: string;
  zoneName: string;
  category: 'nearshore' | 'offshore';
  centerLat: number;
  centerLng: number;
  current: {
    rating: DangerLevel;
    windSpeed: number;
    waveHeight: number | null;
    seaTemp: number;
    hasOfficialWarning: boolean;
    fetched_at: string;
    staleness_seconds: number;
    is_stale: boolean;
  } | null;
}

// GET /api/history 回傳的單筆歷史點(12h 走勢圖用)。
export interface HistoryPoint {
  fetchedAt: string; // ISO
  level: DangerLevel;
  windSpeed: number;
  waveHeight: number | null;
  seaTemp: number;
}

// GET /api/sea-conditions 的回應 envelope(route.ts 實際輸出的形狀)。
// 前端與 mock 一律 import 這個,不自訂 shape。
export interface SeaConditionsResponse {
  condition: SeaCondition;
  danger: DangerResult;
  fetched_at: string; // ISO
  staleness_seconds: number;
  is_stale: boolean; // 超過 60 分鐘未更新
}
