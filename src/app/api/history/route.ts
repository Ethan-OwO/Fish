import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import type { HistoryRow } from '@/lib/supabase/history';
import { HISTORY_RETENTION_HOURS } from '@/lib/supabase/history';
import { getZoneById } from '@/lib/weather/zones';
import type { HistoryPoint } from '@/types';

// 與 sea-conditions route 相同的理由:不用 z.coerce(null → 0 的坑 + pipe 型別不相容)。
const querySchema = z.object({
  zoneId: z.string().min(1),
  hours: z
    .string()
    .min(1)
    .transform(Number)
    .pipe(z.number().int().min(1).max(HISTORY_RETENTION_HOURS))
    .optional(),
});

// GET /api/history?zoneId=ns_09&hours=12   → 公開,免登入。
// 回傳該 zone 過去 N 小時(預設 12)的歷史海況,供走勢圖使用。
// 資料由 cron/refresh 每輪 append(30 分一筆),不足 N 小時就回有多少算多少。
export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);

  const parsed = querySchema.safeParse({
    zoneId: searchParams.get('zoneId'),
    hours: searchParams.get('hours') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid or missing zoneId/hours query parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { zoneId } = parsed.data;
  const hours = parsed.data.hours ?? 12;

  if (!getZoneById(zoneId)) {
    return NextResponse.json({ error: 'Unknown zone id' }, { status: 404 });
  }

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('sea_condition_history')
    .select('*')
    .eq('zone_id', zoneId)
    .gte('fetched_at', since.toISOString())
    .order('fetched_at', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to read history', message: error.message },
      { status: 502 },
    );
  }

  const points: HistoryPoint[] = ((data ?? []) as HistoryRow[]).map((row) => ({
    fetchedAt: row.fetched_at,
    level: row.rating,
    windSpeed: row.wind_speed_ms,
    waveHeight: row.wave_height_m,
    seaTemp: row.sea_temp_c,
  }));

  return NextResponse.json({ zone_id: zoneId, hours, points });
}
