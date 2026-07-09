export type DangerLevel = 'safe' | 'caution' | 'danger';

export interface SeaCondition {
  lat: number;
  lng: number;
  windSpeed: number; // m/s   ← OpenWeather
  waveHeight: number; // m     ← Open-Meteo Marine
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
