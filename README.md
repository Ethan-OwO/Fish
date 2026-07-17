# 海況回報 App(seastate-app)

給漁民使用的海況 App。整合中央氣象署(CWA)與國際海象資料(Open-Meteo / OpenWeather),依風速、浪高與官方警特報,將指定海域算出**安全 / 注意 / 危險**三級評級。規劃中的後續階段將加入 GPS 定位、文字回報與地圖,形成漁民互助的即時海況地圖。

## 目前進度

**M1(海況資料整合)、M2(危險判斷後端)、M3(Supabase 快取層)已完成並通過端到端驗證。海況分區已從 4 個粗略區域擴充為 25 個(17 近海 + 8 遠海)。**

- 風速資料來自 OpenWeather
- 浪高與海表溫資料來自 Open-Meteo Marine
- 官方警特報來自中央氣象署(CWA)
- `/api/sea-conditions` 讀 Supabase 快取,由 `POST /api/cron/refresh`(cron-job.org 每 30 分觸發)並行寫入 25 個 zone
- 綜合以上資料與可調整閾值,判定海域危險等級

目前沒有前端頁面、沒有 Auth,只有兩支 API。詳細進度與各模組規劃見 [CLAUDE.md](CLAUDE.md)。

## 技術棧

- Next.js 16(App Router, TypeScript, Tailwind)
- Zod(API 輸入驗證)
- Supabase(PostgreSQL + PostGIS)
- Vitest(單元測試)
- Node 22

## 開發 / 測試

```bash
npm install
npm run dev        # 啟動開發伺服器(localhost:3000)
npm run test       # 跑 Vitest 單元測試
npx tsc --noEmit   # type check
npx eslint .       # lint
```

需要 `.env.local`(見專案內 CLAUDE.md 的 API Key 狀態表),包含 `OPENWEATHER_API_KEY`、`CWA_API_KEY`、`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`CRON_SECRET`。

## API

```
GET /api/sea-conditions?lat={緯度}&lng={經度}
```

回傳指定座標所屬海域(25 分區之一)的海況資料與危險評級:

```json
{
  "condition": { "...": "..." },
  "danger": { "level": "safe | caution | danger", "factors": ["..."] },
  "fetched_at": "ISO 時間字串",
  "staleness_seconds": 0,
  "is_stale": false
}
```

```
POST /api/cron/refresh
Authorization: Bearer <CRON_SECRET>
```

並行刷新 25 個 zone 的快取,回傳 `{ refreshed, skipped, failed }`。由 cron-job.org 每 30 分鐘觸發,非公開端點。

範例:

```bash
curl "http://localhost:3000/api/sea-conditions?lat=24.0&lng=119.5"
```

> 測試用經緯度請選外海座標(例如 `24.0,119.5`、`22.5,120.0`、`25.3,122.0`),陸地座標的浪高資料會是 `null`。

## 注意事項

- 危險判定閾值皆為保守預設值,非法定標準,App 需顯示免責聲明。
- 25 個 zone 的 `warningArea`(對應 CWA 海上警特報海區字串)目前尚未完成現場資料集驗證,詳見 [src/lib/weather/CLAUDE.md](src/lib/weather/CLAUDE.md)。
