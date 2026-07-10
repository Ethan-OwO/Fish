# 海況回報 App(seastate-app)

給漁民使用的海況 App。整合中央氣象署(CWA)與國際海象資料(Open-Meteo / OpenWeather),依風速、浪高與官方警特報,將指定海域算出**安全 / 注意 / 危險**三級評級。規劃中的後續階段將加入 GPS 定位、文字回報與地圖,形成漁民互助的即時海況地圖。

## 目前進度

**Phase 1(海況資料整合 + 危險判斷後端)已完成並通過端到端驗證。**

Phase 1 是 stateless 的:沒有資料庫、沒有 Auth、沒有前端頁面,只提供一支公開 API。

- 風速資料來自 OpenWeather
- 浪高與海表溫資料來自 Open-Meteo Marine
- 官方警特報來自中央氣象署(CWA),已串接真實 API 並驗證通過
- 綜合以上資料與可調整閾值,判定海域危險等級

## 技術棧

- Next.js 16(App Router, TypeScript, Tailwind)
- Zod(API 輸入驗證)
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

## 注意事項

危險判定閾值皆為保守預設值,非法定標準,App 需顯示免責聲明。
