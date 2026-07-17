import { describe, expect, it } from 'vitest';
import { warningHitsZone } from './cwa';
import type { ZoneMeta } from './zones';

function makeZone(overrides: Partial<ZoneMeta> = {}): ZoneMeta {
  return {
    zoneId: 'fs_06',
    zoneName: '巴士海峽',
    centerLat: 21.3,
    centerLng: 121.2,
    category: 'offshore',
    warningArea: '巴士海峽',
    ...overrides,
  };
}

describe('warningHitsZone', () => {
  it('returns true when a warning zone string exactly matches warningArea', () => {
    const zone = makeZone({ warningArea: '巴士海峽' });
    const result = warningHitsZone([{ zone: '巴士海峽', type: '海上強風特報' }], zone);
    expect(result).toBe(true);
  });

  it('returns false when no warning matches warningArea', () => {
    const zone = makeZone({ warningArea: '巴士海峽' });
    const result = warningHitsZone([{ zone: '臺灣海峽南部', type: '海上強風特報' }], zone);
    expect(result).toBe(false);
  });

  it('returns false when zone.warningArea is empty (unverified zone, no warning basis)', () => {
    const zone = makeZone({ warningArea: '' });
    const result = warningHitsZone([{ zone: '巴士海峽', type: '海上強風特報' }], zone);
    expect(result).toBe(false);
  });

  it('does not partial-match substrings', () => {
    const zone = makeZone({ warningArea: '臺灣海峽南部' });
    const result = warningHitsZone([{ zone: '臺灣海峽', type: '海上強風特報' }], zone);
    expect(result).toBe(false);
  });

  it('returns false for an empty warnings list', () => {
    const zone = makeZone();
    expect(warningHitsZone([], zone)).toBe(false);
  });
});
