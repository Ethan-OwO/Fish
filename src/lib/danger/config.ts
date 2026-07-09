// 所有閾值集中在這裡。evaluate.ts 只讀這裡,不寫死數字。
export const THRESHOLDS = {
  beaufort: { caution: 5, danger: 7 }, // 蒲福級
  waveHeight: { caution: 1.0, danger: 2.5 }, // m
  seaTempDeviation: { caution: 2, danger: 4 }, // °C —— Phase 1 保留但未使用
} as const;
