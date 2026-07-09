export type WaveClass = '小浪' | '中浪' | '大浪' | '巨浪' | '狂浪';

export function waveHeightToClass(meters: number): WaveClass {
  if (meters < 0.5) return '小浪';
  if (meters < 1.0) return '中浪';
  if (meters < 2.5) return '大浪';
  if (meters < 4.0) return '巨浪';
  return '狂浪';
}
