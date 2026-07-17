export type ZoneCategory = 'nearshore' | 'offshore';

export interface ZoneMeta {
  zoneId: string;
  zoneName: string;
  centerLat: number;
  centerLng: number;
  category: ZoneCategory;
  // 對應 CWA 海上警特報的海區字串,用於 warningHitsZone 精準比對。
  // 空字串代表尚未有可信的官方海區可對應——refresh 端會將其視為「無警報依據」,
  // 不可靜默視為安全,見 src/lib/weather/CLAUDE.md 的 🔒-2。
  warningArea: string;
}

// 🔒 尚未完成 CWA 海上警特報資料集現場驗證(見 src/lib/weather/CLAUDE.md 執行順序步驟 1)。
// 目前串接的 W-C0033-002/001 經現場驗證為陸上(縣市)警特報資料集,不是海上警特報,
// 因此本表 warningArea 欄位暫時全部留空,直到找到正確的海上警特報 resource_id 並
// dump 出 live locationName 清單校正為止。zoneName/centerLat/centerLng 為規劃階段
// 估值,近海 17 筆名稱已依 CWA 近海漁業區公告驗證,遠海 8 筆名稱與座標仍待驗證。
const ZONES: ZoneMeta[] = [
  // 近海 17 個(nearshore,名稱已驗證)
  { zoneId: 'ns_01', zoneName: '彭佳嶼野柳沿海面', centerLat: 25.55, centerLng: 122.00, category: 'nearshore', warningArea: '' },
  { zoneId: 'ns_02', zoneName: '龍洞北方沿海面', centerLat: 25.70, centerLng: 123.40, category: 'nearshore', warningArea: '' },
  { zoneId: 'ns_03', zoneName: '新竹鹿港沿海', centerLat: 24.35, centerLng: 120.20, category: 'nearshore', warningArea: '' },
  { zoneId: 'ns_04', zoneName: '鹿港東石沿海', centerLat: 23.70, centerLng: 120.00, category: 'nearshore', warningArea: '' },
  { zoneId: 'ns_05', zoneName: '東石安平沿海', centerLat: 23.10, centerLng: 120.00, category: 'nearshore', warningArea: '' },
  { zoneId: 'ns_06', zoneName: '安平高雄沿海', centerLat: 22.70, centerLng: 120.05, category: 'nearshore', warningArea: '' },
  { zoneId: 'ns_07', zoneName: '高雄枋寮沿海', centerLat: 22.40, centerLng: 120.30, category: 'nearshore', warningArea: '' },
  { zoneId: 'ns_08', zoneName: '枋寮南灣沿海', centerLat: 22.00, centerLng: 120.65, category: 'nearshore', warningArea: '' },
  { zoneId: 'ns_09', zoneName: '鵝鑾鼻沿海', centerLat: 21.80, centerLng: 120.90, category: 'nearshore', warningArea: '' },
  { zoneId: 'ns_10', zoneName: '台東花蓮沿海', centerLat: 23.10, centerLng: 121.50, category: 'nearshore', warningArea: '' },
  { zoneId: 'ns_11', zoneName: '花蓮大武沿海', centerLat: 22.50, centerLng: 121.10, category: 'nearshore', warningArea: '' },
  { zoneId: 'ns_12', zoneName: '綠島蘭嶼海面', centerLat: 22.40, centerLng: 121.55, category: 'nearshore', warningArea: '' },
  { zoneId: 'ns_13', zoneName: '花蓮沿海', centerLat: 23.90, centerLng: 121.75, category: 'nearshore', warningArea: '' },
  { zoneId: 'ns_14', zoneName: '宜蘭澳沿海', centerLat: 24.60, centerLng: 121.95, category: 'nearshore', warningArea: '' },
  { zoneId: 'ns_15', zoneName: '澎湖海面', centerLat: 23.50, centerLng: 119.50, category: 'nearshore', warningArea: '' },
  { zoneId: 'ns_16', zoneName: '馬祖海面', centerLat: 26.10, centerLng: 120.00, category: 'nearshore', warningArea: '' },
  { zoneId: 'ns_17', zoneName: '金門海面', centerLat: 24.40, centerLng: 118.35, category: 'nearshore', warningArea: '' },

  // 遠海 8 個(offshore,名稱與座標待驗證,見 🔒-1)
  { zoneId: 'fs_01', zoneName: '台灣北部海面', centerLat: 26.00, centerLng: 121.50, category: 'offshore', warningArea: '' },
  { zoneId: 'fs_02', zoneName: '台灣東北部海面', centerLat: 25.50, centerLng: 122.80, category: 'offshore', warningArea: '' },
  { zoneId: 'fs_03', zoneName: '台灣東南部海面', centerLat: 22.80, centerLng: 122.20, category: 'offshore', warningArea: '' },
  { zoneId: 'fs_04', zoneName: '台灣海峽南部', centerLat: 24.70, centerLng: 119.50, category: 'offshore', warningArea: '' },
  { zoneId: 'fs_05', zoneName: '台灣海峽南部', centerLat: 23.00, centerLng: 119.30, category: 'offshore', warningArea: '' },
  { zoneId: 'fs_06', zoneName: '巴士海峽', centerLat: 21.30, centerLng: 121.20, category: 'offshore', warningArea: '' },
  { zoneId: 'fs_07', zoneName: '廣東海面', centerLat: 22.00, centerLng: 117.00, category: 'offshore', warningArea: '' },
  { zoneId: 'fs_08', zoneName: '東沙島海面', centerLat: 20.70, centerLng: 116.70, category: 'offshore', warningArea: '' },
];

export function getZoneList(): ZoneMeta[] {
  return ZONES;
}

export function getZoneById(zoneId: string): ZoneMeta | undefined {
  return ZONES.find((zone) => zone.zoneId === zoneId);
}
