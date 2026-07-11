// 一次性探路腳本:確認三個上游資料源的真實限制,決定 REFRESH_INTERVAL_MINUTES。
// 用法:npx tsx scripts/probe-upstream.ts
//
// 🐟 CWA 頻率上限:官方開放資料平台(opendata.cwa.gov.tw)截至目前查證,
//    dev-manual、FAQ、會員說明頁、官方 API PDF 手冊皆未載明數字化的 req/min 或 req/day 上限,
//    僅要求「合理使用」。因此本專案不對 CWA 設定發送節流上限,只靠 REFRESH_INTERVAL_MINUTES
//    自然限制頻率。若之後 CWA 公告明確配額,再回來改這裡。
export async function probeCwaRateLimit(): Promise<{ limitPerWindow: number | null; windowSeconds: number | null; note: string }> {
  return {
    limitPerWindow: null,
    windowSeconds: null,
    note: 'CWA 開放資料平台未公開數字化配額(官方文件與 FAQ 皆未載明),視為無明確上限,以 REFRESH_INTERVAL_MINUTES 自然節流。',
  };
}

// 🐟 Open-Meteo 共享出口 IP 問題:Open-Meteo 官方 pricing 頁面載明免費層級為
//    10,000 次/日、600 次/分、5,000 次/時、300,000 次/月(https://open-meteo.com/en/pricing)。
//    限流是以「IP」計算,不是以 API key 計算 —— 官方維護者在
//    https://github.com/open-meteo/open-meteo/discussions/853 證實這點,代表 Vercel
//    等 serverless 平台的共享出口 IP 有可能因其他租戶用量而連帶被擋
//    (回傳 "Daily API request limit exceeded")。這件事沒有辦法只靠讀文件精確量化,
//    必須實際部署到目標環境(Vercel)後呼叫這支函式驗證。本機執行只能證明「未被擋」,
//    無法排除「部署後才被擋」的可能。
export async function probeOpenMeteoOnHost(): Promise<{ blocked: boolean; note: string }> {
  try {
    const url = new URL('https://marine-api.open-meteo.com/v1/marine');
    url.searchParams.set('latitude', '24.0');
    url.searchParams.set('longitude', '119.5');
    url.searchParams.set('hourly', 'wave_height');
    url.searchParams.set('timezone', 'auto');

    const res = await fetch(url.toString());
    const text = await res.text();

    if (!res.ok || /daily api request limit exceeded/i.test(text)) {
      return { blocked: true, note: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }
    return { blocked: false, note: `HTTP ${res.status},未見限流訊息(執行環境:${describeRuntimeHost()})` };
  } catch (error) {
    return { blocked: true, note: `請求失敗:${(error as Error).message}` };
  }
}

function describeRuntimeHost(): string {
  // 沒有可靠方式在執行期判斷「是否為 Vercel 部署環境」以外的通用探測,
  // 這裡只給出粗略提示,實際判讀仍需由執行者自行確認是本機或已部署環境。
  return process.env.VERCEL ? 'Vercel 部署環境' : '非 Vercel(本機或其他)環境';
}

// OpenWeather 免費層級 official docs:60 次/分、1,000,000 次/月
// (https://openweathermap.org/price),/data/2.5/weather 端點即目前 openweather.ts 實際使用的端點。
export async function probeOpenWeatherEndpoint(): Promise<{ endpoint: '/data/2.5' | 'onecall'; dailyCap: number | null; note: string }> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return { endpoint: '/data/2.5', dailyCap: null, note: 'OPENWEATHER_API_KEY 未設定,無法實測,依程式碼可知 openweather.ts 呼叫 /data/2.5/weather(免費層級)。' };
  }

  const url = new URL('https://api.openweathermap.org/data/2.5/weather');
  url.searchParams.set('lat', '24.0');
  url.searchParams.set('lon', '119.5');
  url.searchParams.set('appid', apiKey);

  const res = await fetch(url.toString());
  return {
    endpoint: '/data/2.5',
    dailyCap: null, // OpenWeather 免費層級以「每分鐘」+「每月」計費,無獨立的「每日」上限
    note: `HTTP ${res.status},/data/2.5/weather 免費層級官方上限為 60 次/分、1,000,000 次/月(非按日計)。`,
  };
}

async function main() {
  const [cwa, openMeteo, openWeather] = await Promise.all([
    probeCwaRateLimit(),
    probeOpenMeteoOnHost(),
    probeOpenWeatherEndpoint(),
  ]);

  console.log(JSON.stringify({ cwa, openMeteo, openWeather }, null, 2));
}

if (require.main === module) {
  main();
}
