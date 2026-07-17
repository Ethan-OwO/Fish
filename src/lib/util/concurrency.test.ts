import { describe, expect, it } from 'vitest';
import { mapWithConcurrency } from './concurrency';

describe('mapWithConcurrency', () => {
  it('runs at most `limit` items in parallel, preserves order, and isolates a single failure', async () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    const limit = 6;

    let active = 0;
    let maxActive = 0;

    const results = await mapWithConcurrency(items, limit, async (item) => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;

      if (item === 10) {
        throw new Error(`boom-${item}`);
      }
      return item * 2;
    });

    expect(maxActive).toBeLessThanOrEqual(limit);
    expect(results).toHaveLength(20);

    results.forEach((result, index) => {
      if (index === 10) {
        expect(result.status).toBe('rejected');
        if (result.status === 'rejected') {
          expect((result.reason as Error).message).toBe('boom-10');
        }
      } else {
        expect(result.status).toBe('fulfilled');
        if (result.status === 'fulfilled') {
          expect(result.value).toBe(index * 2);
        }
      }
    });
  });

  it('returns an empty array for an empty input', async () => {
    const results = await mapWithConcurrency([], 6, async (x) => x);
    expect(results).toEqual([]);
  });

  it('handles limit larger than items length', async () => {
    const results = await mapWithConcurrency([1, 2, 3], 10, async (x) => x + 1);
    expect(results).toEqual([
      { status: 'fulfilled', value: 2 },
      { status: 'fulfilled', value: 3 },
      { status: 'fulfilled', value: 4 },
    ]);
  });
});
