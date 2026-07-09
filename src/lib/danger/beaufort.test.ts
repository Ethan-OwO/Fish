import { describe, expect, it } from 'vitest';
import { windSpeedToBeaufort } from './beaufort';

describe('windSpeedToBeaufort', () => {
  it('maps calm wind to 0', () => {
    expect(windSpeedToBeaufort(0)).toBe(0);
  });

  it('maps boundary values to the correct scale', () => {
    expect(windSpeedToBeaufort(0.2)).toBe(0);
    expect(windSpeedToBeaufort(0.3)).toBe(1);
    expect(windSpeedToBeaufort(17.1)).toBe(7);
    expect(windSpeedToBeaufort(17.2)).toBe(8);
  });

  it('maps very high wind speed to 12', () => {
    expect(windSpeedToBeaufort(40)).toBe(12);
  });
});
