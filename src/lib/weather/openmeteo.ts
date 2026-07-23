// Open-Meteo Marine API,免申請金鑰。抓浪高 + 海表溫。
// 端點形如 https://marine-api.open-meteo.com/v1/marine?latitude=..&longitude=..
//        &hourly=wave_height,sea_surface_temperature
// 回傳是逐小時陣列,這裡取最接近當下的一筆。
// 注意:陸地座標的 wave_height 整段是 null(資料源沒有模型資料),原樣傳遞,不轉成 0。
export async function fetchOpenMeteoMarine(
  lat: number,
  lng: number,
): Promise<{ waveHeight: number | null; seaTemp: number; observedAt: string }> {
  const url = new URL('https://marine-api.open-meteo.com/v1/marine');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set('hourly', 'wave_height,sea_surface_temperature');
  url.searchParams.set('timezone', 'auto');

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Open-Meteo Marine request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  const times: string[] = data.hourly.time;
  const waveHeights: (number | null)[] = data.hourly.wave_height;
  const seaTemps: number[] = data.hourly.sea_surface_temperature;

  const index = closestHourIndex(times);

  return {
    waveHeight: waveHeights[index] ?? null,
    seaTemp: seaTemps[index],
    observedAt: new Date(times[index]).toISOString(),
  };
}

function closestHourIndex(times: string[]): number {
  const now = Date.now();
  let bestIndex = 0;
  let bestDiff = Infinity;

  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]).getTime() - now);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  }

  return bestIndex;
}
