// 只抓風速,server 端呼叫,讀 process.env.OPENWEATHER_API_KEY。
export async function fetchOpenWeatherWind(
  lat: number,
  lng: number,
): Promise<{ windSpeed: number; observedAt: string }> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENWEATHER_API_KEY is not set');
  }

  const url = new URL('https://api.openweathermap.org/data/2.5/weather');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('appid', apiKey);
  url.searchParams.set('units', 'metric');

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`OpenWeather request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  return {
    windSpeed: data.wind.speed as number,
    observedAt: new Date((data.dt as number) * 1000).toISOString(),
  };
}
