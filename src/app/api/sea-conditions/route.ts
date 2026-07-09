import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSeaCondition, getOfficialWarning } from '@/lib/weather/aggregate';
import { evaluateDanger } from '@/lib/danger/evaluate';

const querySchema = z.object({
  lat: z.string().min(1).pipe(z.coerce.number().min(-90).max(90)),
  lng: z.string().min(1).pipe(z.coerce.number().min(-180).max(180)),
});

// GET /api/sea-conditions?lat=..&lng=..   → 公開,無需登入,不可寫入
export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);

  const parsed = querySchema.safeParse({
    lat: searchParams.get('lat'),
    lng: searchParams.get('lng'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid or missing lat/lng query parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { lat, lng } = parsed.data;

  try {
    const [condition, hasOfficialWarning] = await Promise.all([
      getSeaCondition(lat, lng),
      getOfficialWarning(lat, lng),
    ]);

    const danger = evaluateDanger(condition, hasOfficialWarning);

    return NextResponse.json({ condition, danger });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sea conditions', message: (error as Error).message },
      { status: 502 },
    );
  }
}
