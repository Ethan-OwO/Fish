import { createServiceClient } from '@/lib/supabase/server';
import { fromCacheRow, type CacheRow } from '@/lib/supabase/cache';
import type { HistoryRow } from '@/lib/supabase/history';
import { getZoneById, getZoneList } from '@/lib/weather/zones';
import type { HistoryPoint, SeaConditionsResponse, ZoneSummary } from '@/types';

// 前端(Server Component)的真資料存取層,取代原本的 src/lib/mock/。
// ⚠️ 只能在 Server Component / route handler 匯入:createServiceClient() 帶 service role key,
// 一旦被 Client Component 匯入就會流到瀏覽器。

// 直接讀 Supabase 而不是 fetch 自家 /api/zones:同一個 Node 程序內再繞一圈 HTTP
// 只會多一次序列化與冷啟延遲,而且 SSR 期間要自己拼絕對網址。
// 邏輯與 route handler 完全一致(staleness / is_stale 判定共用同一組規則),
// API 仍然保留給外部呼叫者與未來的 client-side 更新使用。

const STALE_THRESHOLD_SECONDS = 60 * 60; // 與 /api/sea-conditions、/api/zones 一致

function stalenessOf(fetchedAt: string, now: number): number {
  return Math.max(0, Math.round((now - new Date(fetchedAt).getTime()) / 1000));
}

/**
 * 25 個海區的當前海況總覽(地圖、清單、landing 統計用)。
 * 讀不到 cache 列的 zone 回 current: null,由 UI 顯示「取不到」——絕不假造數值。
 * 整個 Supabase 查詢失敗時 throw,交給 page 的 error boundary。
 */
export async function getZoneSummaries(): Promise<ZoneSummary[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('sea_condition_cache').select('*');

  if (error) {
    throw new Error(`Failed to read sea_condition_cache: ${error.message}`);
  }

  const rowsByZone = new Map<string, CacheRow>(
    ((data ?? []) as CacheRow[]).map((row) => [row.zone_id, row]),
  );

  const now = Date.now();
  return getZoneList().map((zone) => {
    const row = rowsByZone.get(zone.zoneId);
    if (!row) {
      return {
        zoneId: zone.zoneId,
        zoneName: zone.zoneName,
        category: zone.category,
        centerLat: zone.centerLat,
        centerLng: zone.centerLng,
        current: null,
      };
    }

    const staleness_seconds = stalenessOf(row.fetched_at, now);
    return {
      zoneId: zone.zoneId,
      zoneName: zone.zoneName,
      category: zone.category,
      centerLat: zone.centerLat,
      centerLng: zone.centerLng,
      current: {
        rating: row.rating,
        windSpeed: row.wind_speed_ms,
        waveHeight: row.wave_height_m,
        seaTemp: row.sea_temp_c,
        hasOfficialWarning: row.has_official_warning,
        fetched_at: row.fetched_at,
        staleness_seconds,
        is_stale: staleness_seconds > STALE_THRESHOLD_SECONDS,
      },
    };
  });
}

/**
 * 單一海區的完整回應(詳情面板用),等同 GET /api/sea-conditions 的 envelope。
 * cache 沒有這個 zone 的列時回 null——不觸發 coldFetch,詳情面板改顯示「取不到」。
 */
export async function getZoneResponse(zoneId: string): Promise<SeaConditionsResponse | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('sea_condition_cache')
    .select('*')
    .eq('zone_id', zoneId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read zone ${zoneId}: ${error.message}`);
  }
  if (!data) return null;

  const row = data as CacheRow;
  const { condition, danger } = fromCacheRow(row);
  const staleness_seconds = stalenessOf(row.fetched_at, Date.now());

  return {
    condition,
    danger,
    fetched_at: row.fetched_at,
    staleness_seconds,
    is_stale: staleness_seconds > STALE_THRESHOLD_SECONDS,
  };
}

/**
 * 過去 N 小時(預設 12)的走勢資料,最舊在前。
 *
 * ⚠️ sea_condition_history 的 migration 可能尚未套用(PGRST205 = 表不存在)。
 * 走勢圖是輔助資訊,不該讓整個地圖頁掛掉,因此表不存在 / 查詢失敗一律回空陣列,
 * Sparkline 會自行顯示「無資料」。表建立且 cron 跑過幾輪後,走勢圖自動就有東西。
 */
export async function getZoneHistory(zoneId: string, hours = 12): Promise<HistoryPoint[]> {
  if (!getZoneById(zoneId)) return [];

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('sea_condition_history')
    .select('*')
    .eq('zone_id', zoneId)
    .gte('fetched_at', since.toISOString())
    .order('fetched_at', { ascending: true });

  if (error) {
    // 表尚未建立是已知狀態,不是需要中斷渲染的例外。
    console.warn(`[history] zone=${zoneId} unavailable: ${error.message}`);
    return [];
  }

  return ((data ?? []) as HistoryRow[]).map((row) => ({
    fetchedAt: row.fetched_at,
    level: row.rating,
    windSpeed: row.wind_speed_ms,
    waveHeight: row.wave_height_m,
    seaTemp: row.sea_temp_c,
  }));
}
