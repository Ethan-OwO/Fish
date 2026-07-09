// 風速(m/s)→ 蒲福風級。用官方(中央氣象署)風速對照級數表查表,
// 不用連續公式(公式在級距邊界會有 rounding 誤差)。
// 每個元素代表該級數的風速上限(m/s),超過則進下一級。
const BEAUFORT_UPPER_BOUNDS_MPS = [
  0.2, // 0 級
  1.5, // 1 級
  3.3, // 2 級
  5.4, // 3 級
  7.9, // 4 級
  10.7, // 5 級
  13.8, // 6 級
  17.1, // 7 級
  20.7, // 8 級
  24.4, // 9 級
  28.4, // 10 級
  32.6, // 11 級
  // 12 級為 32.6 以上
];

export function windSpeedToBeaufort(mps: number): number {
  for (let scale = 0; scale < BEAUFORT_UPPER_BOUNDS_MPS.length; scale++) {
    if (mps <= BEAUFORT_UPPER_BOUNDS_MPS[scale]) {
      return scale;
    }
  }
  return 12;
}

// 蒲福級 → 概略風速(反查用),V = 0.836 * B^(3/2)
export function beaufortToWindSpeed(scale: number): number {
  return 0.836 * Math.pow(scale, 1.5);
}
