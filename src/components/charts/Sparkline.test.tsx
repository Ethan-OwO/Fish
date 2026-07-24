import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Sparkline } from '@/components/charts/Sparkline';

const mk = (vals: (number | null)[]) =>
  vals.map((v, i) => ({ t: new Date(Date.UTC(2026, 6, 24, 8 + i, 0)).toISOString(), v }));

describe('Sparkline', () => {
  it('draws a path with multiple points', () => {
    const html = renderToStaticMarkup(
      <Sparkline label="風速" unit="m/s" colorClass="text-m-wind" points={mk([6.7, 7.4, 8.1, 9.0])} />,
    );
    expect(html).toContain('<path');
    expect(html).toMatch(/M[\d.]+,[\d.]+ L/);
    expect(html).toContain('9.0'); // current value
  });

  it('shows accumulating message for a single point, not emptyText', () => {
    const html = renderToStaticMarkup(
      <Sparkline label="浪高" unit="m" colorClass="text-m-wave" points={mk([3.1])} emptyText="浪高資料不涵蓋此海區" />,
    );
    expect(html).toContain('累積中');
    expect(html).toContain('3.1');
    expect(html).not.toContain('不涵蓋');
  });

  it('shows emptyText when the measurement is genuinely absent', () => {
    const html = renderToStaticMarkup(
      <Sparkline label="浪高" unit="m" colorClass="text-m-wave" points={mk([null, null])} emptyText="浪高資料不涵蓋此海區" />,
    );
    expect(html).toContain('不涵蓋');
  });
});
