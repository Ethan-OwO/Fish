import { describe, expect, it } from 'vitest';
import { findZonesForLatLng } from './aggregate';
import { getZoneList } from './zones';

describe('findZonesForLatLng', () => {
  it('returns exactly one zone id for any coordinate', () => {
    const result = findZonesForLatLng(24.0, 119.5);
    expect(result).toHaveLength(1);
  });

  it('returns the nearest zone by center-point distance', () => {
    const zones = getZoneList();
    const target = zones.find((z) => z.zoneId === 'fs_06')!; // 巴士海峽,21.3,121.2

    const result = findZonesForLatLng(target.centerLat, target.centerLng);
    expect(result).toEqual(['fs_06']);
  });

  it('resolves every zone center point back to its own zone id', () => {
    for (const zone of getZoneList()) {
      const result = findZonesForLatLng(zone.centerLat, zone.centerLng);
      expect(result).toEqual([zone.zoneId]);
    }
  });
});
