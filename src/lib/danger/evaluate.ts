import type { DangerFactor, DangerLevel, DangerResult, SeaCondition } from '@/types';
import { THRESHOLDS } from './config';
import { windSpeedToBeaufort } from './beaufort';
import { waveHeightToClass } from './wave';

const LEVEL_RANK: Record<DangerLevel, number> = {
  safe: 0,
  caution: 1,
  danger: 2,
};

function maxLevel(a: DangerLevel, b: DangerLevel): DangerLevel {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b;
}

function evaluateWind(windSpeed: number): DangerFactor {
  const beaufort = windSpeedToBeaufort(windSpeed);
  let level: DangerLevel = 'safe';
  if (beaufort >= THRESHOLDS.beaufort.danger) {
    level = 'danger';
  } else if (beaufort >= THRESHOLDS.beaufort.caution) {
    level = 'caution';
  }
  return {
    key: 'wind',
    level,
    raw: beaufort,
    label: `蒲福風級 ${beaufort} 級(風速約 ${windSpeed.toFixed(1)} m/s)`,
  };
}

// 浪高為 null(陸地座標,Open-Meteo 無模型資料)時不產出 factor:
// 缺漏的量不參與 max 運算,也絕不被當成 0(0 = 無浪,是致命誤讀)。
function evaluateWave(waveHeight: number | null): DangerFactor | null {
  if (waveHeight === null) {
    return null;
  }
  let level: DangerLevel = 'safe';
  if (waveHeight > THRESHOLDS.waveHeight.danger) {
    level = 'danger';
  } else if (waveHeight >= THRESHOLDS.waveHeight.caution) {
    level = 'caution';
  }
  return {
    key: 'wave',
    level,
    raw: waveHeight,
    label: `${waveHeightToClass(waveHeight)}(浪高約 ${waveHeight.toFixed(1)} m)`,
  };
}

function evaluateOfficialWarning(hasOfficialWarning: boolean): DangerFactor {
  return {
    key: 'officialWarning',
    level: hasOfficialWarning ? 'danger' : 'safe',
    raw: hasOfficialWarning ? '有海上警特報' : '無警特報',
    label: hasOfficialWarning ? '中央氣象署已發布海上警特報' : '目前無官方海上警特報',
  };
}

// 彙整正規化海況 + 是否有官方警報,輸出三級評級與各因子明細。
// 邏輯:
//   1. wind、wave 各自照 THRESHOLDS 算出 level
//   2. 綜合 level = 各因子的「最嚴重者」(max)
//   3. hasOfficialWarning === true → 直接 override 為 'danger'
//   4. Phase 1 不產出 seaTemp factor
//   5. waveHeight 為 null → 不產出 wave factor(缺漏量不參與判定)
// 不碰 API、不碰 DB;給定相同輸入必得相同輸出(可單元測試)。
export function evaluateDanger(cond: SeaCondition, hasOfficialWarning: boolean): DangerResult {
  const windFactor = evaluateWind(cond.windSpeed);
  const waveFactor = evaluateWave(cond.waveHeight);
  const warningFactor = evaluateOfficialWarning(hasOfficialWarning);

  const factors: DangerFactor[] = [
    windFactor,
    ...(waveFactor ? [waveFactor] : []),
    warningFactor,
  ];

  let level: DangerLevel = 'safe';
  for (const factor of factors) {
    level = maxLevel(level, factor.level);
  }

  return { level, factors };
}
