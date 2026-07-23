import { describe, expect, it } from 'vitest';
import { evaluateDanger } from './evaluate';
import type { SeaCondition } from '@/types';

function makeCondition(overrides: Partial<SeaCondition> = {}): SeaCondition {
  return {
    lat: 25.0,
    lng: 121.5,
    windSpeed: 3, // ≈ Beaufort 2, safe
    waveHeight: 0.5, // safe
    seaTemp: 27,
    source: { wind: 'openweather', wave: 'openmeteo', marine: 'openmeteo' },
    observedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('evaluateDanger', () => {
  it('returns safe when wind and wave are both low and no warning', () => {
    const result = evaluateDanger(makeCondition(), false);
    expect(result.level).toBe('safe');
    expect(result.factors.find((f) => f.key === 'wind')?.level).toBe('safe');
    expect(result.factors.find((f) => f.key === 'wave')?.level).toBe('safe');
  });

  it('treats wave height 2.5m as caution, not danger', () => {
    const result = evaluateDanger(makeCondition({ waveHeight: 2.5 }), false);
    const waveFactor = result.factors.find((f) => f.key === 'wave');
    expect(waveFactor?.level).toBe('caution');
    expect(result.level).toBe('caution');
  });

  it('treats wave height 2.6m as danger', () => {
    const result = evaluateDanger(makeCondition({ waveHeight: 2.6 }), false);
    const waveFactor = result.factors.find((f) => f.key === 'wave');
    expect(waveFactor?.level).toBe('danger');
    expect(result.level).toBe('danger');
  });

  it('treats wave height just under 1m as safe, and 1m as caution', () => {
    expect(
      evaluateDanger(makeCondition({ waveHeight: 0.99 }), false).factors.find(
        (f) => f.key === 'wave',
      )?.level,
    ).toBe('safe');
    expect(
      evaluateDanger(makeCondition({ waveHeight: 1.0 }), false).factors.find(
        (f) => f.key === 'wave',
      )?.level,
    ).toBe('caution');
  });

  it('treats Beaufort 7 wind as danger', () => {
    // Beaufort 7 upper bound is 17.1 m/s; use a speed safely within level 7 (>13.8, <=17.1)
    const result = evaluateDanger(makeCondition({ windSpeed: 15 }), false);
    const windFactor = result.factors.find((f) => f.key === 'wind');
    expect(windFactor?.raw).toBe(7);
    expect(windFactor?.level).toBe('danger');
    expect(result.level).toBe('danger');
  });

  it('treats Beaufort 5-6 wind as caution', () => {
    // Beaufort 5 upper bound is 10.7 m/s; use a speed within level 5 (>7.9, <=10.7)
    const result = evaluateDanger(makeCondition({ windSpeed: 9 }), false);
    const windFactor = result.factors.find((f) => f.key === 'wind');
    expect(windFactor?.raw).toBe(5);
    expect(windFactor?.level).toBe('caution');
    expect(result.level).toBe('caution');
  });

  it('treats Beaufort <=4 wind as safe', () => {
    // Beaufort 4 upper bound is 7.9 m/s
    const result = evaluateDanger(makeCondition({ windSpeed: 7 }), false);
    const windFactor = result.factors.find((f) => f.key === 'wind');
    expect(windFactor?.raw).toBe(4);
    expect(windFactor?.level).toBe('safe');
    expect(result.level).toBe('safe');
  });

  it('forces danger when an official warning is active, regardless of other factors', () => {
    const result = evaluateDanger(makeCondition(), true);
    expect(result.level).toBe('danger');
    expect(result.factors.find((f) => f.key === 'officialWarning')?.level).toBe('danger');
  });

  it('overall level is the max severity across all factors', () => {
    // wind safe, wave caution → overall caution
    const result = evaluateDanger(makeCondition({ windSpeed: 3, waveHeight: 1.5 }), false);
    expect(result.level).toBe('caution');
  });

  it('does not produce a seaTemp factor in Phase 1', () => {
    const result = evaluateDanger(makeCondition(), false);
    expect(result.factors.find((f) => f.key === 'seaTemp')).toBeUndefined();
  });

  it('omits the wave factor entirely when waveHeight is null (land coordinate)', () => {
    const result = evaluateDanger(makeCondition({ waveHeight: null }), false);
    expect(result.factors.find((f) => f.key === 'wave')).toBeUndefined();
    // 缺漏量不參與 max:其餘因子 safe → 綜合仍是 safe,絕不因 null 被當成 0 或誤判
    expect(result.level).toBe('safe');
  });

  it('null waveHeight does not suppress severity from other factors', () => {
    const result = evaluateDanger(makeCondition({ waveHeight: null, windSpeed: 15 }), false);
    expect(result.level).toBe('danger');
  });

  it('is a pure function: same input always yields same output', () => {
    const cond = makeCondition({ windSpeed: 9, waveHeight: 1.5 });
    const result1 = evaluateDanger(cond, false);
    const result2 = evaluateDanger(cond, false);
    expect(result1).toEqual(result2);
  });
});
