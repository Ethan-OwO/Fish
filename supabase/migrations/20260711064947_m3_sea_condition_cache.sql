-- M3: Supabase 進場,海況快取表。
-- 覆蓋 roadmap M3 全部範圍的資料層:cron 每 30 分寫入,/api/sea-conditions 改讀這張表。
-- 本表只由 server 端以 service role 存取(見 lib/supabase/server.ts),不開放 anon 直接讀寫。

create extension if not exists postgis;

create table if not exists sea_condition_cache (
  zone_id text primary key,
  zone_name text not null,
  center_lat double precision not null,
  center_lng double precision not null,

  -- 綜合判定結果(對應 DangerResult)
  rating text not null check (rating in ('safe', 'caution', 'danger')),

  -- 正規化海況數值(對應 SeaCondition,evaluate.ts 判定用的欄位)
  wind_speed_ms double precision not null,
  wave_height_m double precision not null,
  sea_temp_c double precision not null,
  has_official_warning boolean not null default false,

  -- 各來源成功/失敗 + 原始附註,完整落地,不遺失細節
  sources jsonb not null default '{}'::jsonb,

  fetched_at timestamptz not null default now(),
  next_refresh_at timestamptz
);

alter table sea_condition_cache enable row level security;
-- 刻意不建任何 anon policy:本表只由 server 端(service role)存取,
-- anon key 讀不到、寫不到。前台一律透過 /api/sea-conditions 取得資料。
