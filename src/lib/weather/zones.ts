import { ZONE_BOUNDING_BOXES } from './aggregate';

export interface ZoneMeta {
  zoneId: string; // 沿用 ZONE_BOUNDING_BOXES 的 zone 名稱當 key
  zoneName: string;
  centerLat: number;
  centerLng: number;
}

// 由 ZONE_BOUNDING_BOXES 算出各 zone 中心點,供 refresh 與 sea-conditions 共用。
// 中心點 = bounding box 的幾何中心,跟 findZonesForLatLng 用同一份資料,不會走鐘。
export function getZoneList(): ZoneMeta[] {
  return ZONE_BOUNDING_BOXES.map((box) => ({
    zoneId: box.zone,
    zoneName: box.zone,
    centerLat: (box.minLat + box.maxLat) / 2,
    centerLng: (box.minLng + box.maxLng) / 2,
  }));
}
