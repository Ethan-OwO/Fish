# 海況回報 App(seastate-app)

給漁民使用的海況 App。整合中央氣象署(CWA)與國際海象資料(Open-Meteo / OpenWeather),依風速、浪高與官方警特報,將指定海域算出**安全 / 注意 / 危險**三級評級。規劃中的後續階段將加入 GPS 定位、文字回報與地圖,形成漁民互助的即時海況地圖。

## 目前進度

**M1(海況資料整合)、M2(危險判斷後端)、M3(Supabase 快取層)已完成並通過端到端驗證。** 前端第一個畫面(讀取中骨架畫面)已建立。

| 模組 | 狀態 |
|---|---|
| M1 海況資料整合 | ✅ 完成 |
| M2 危險判斷引擎 | ✅ 完成 |
| M3 Supabase 快取層(sea_condition_cache + cron refresh) | ✅ 完成 |
| M4 魚訊回報 | 未開始 |
| M5 魚訊地圖 | 未開始 |
| M6 帳號 / Auth | 未開始 |
| M7 PWA 殼 | 未開始 |

- 風速資料來自 OpenWeather
- 浪高與海表溫資料來自 Open-Meteo Marine
- 官方警特報來自中央氣象署(CWA)
- 綜合以上資料與可調整閾值,判定海域危險等級
- `GET /api/sea-conditions` 讀取 Supabase 快取,由 `POST /api/cron/refresh` 定期(cron-job.org,每 30 分)寫入,快取過期時即時 cold fetch 補值

詳細架構決策與各模組規劃見 [CLAUDE.md](CLAUDE.md)。

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
npx eslint .        # lint
```

## API

```
GET /api/sea-conditions?lat={緯度}&lng={經度}
```

回傳指定座標的海況資料與危險評級:

```json
{
  "condition": { "..." : "..." },
  "danger": { "level": "safe | caution | danger", "factors": ["..."] }
}
```

範例:

```bash
curl "http://localhost:3000/api/sea-conditions?lat=24.0&lng=119.5"
```

> 測試用經緯度請選外海座標(例如 `24.0,119.5`、`22.5,120.0`、`25.3,122.0`),陸地座標的浪高資料會是 `null`。

`POST /api/cron/refresh` 為內部 cron 端點,需要 `Authorization: Bearer <CRON_SECRET>`,細節見 [src/app/api/CLAUDE.md](src/app/api/CLAUDE.md)。

## 注意事項

危險判定閾值皆為保守預設值,非法定標準,App 需顯示免責聲明。
