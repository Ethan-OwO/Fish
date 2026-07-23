-- M4:海況歷史表。cron/refresh 每輪對每個刷新的 zone append 一列,
-- 供前端「過去 12 小時走勢」圖表使用;保留 48 小時,由 refresh 順手清舊。
-- 與 sea_condition_cache 相同:RLS 開啟、刻意不建 anon policy,只由 service role 存取。

create table if not exists sea_condition_history (
  id bigint generated always as identity primary key,
  zone_id text not null,
  rating text not null check (rating in ('safe', 'caution', 'danger')),
  wind_speed_ms double precision not null,
  wave_height_m double precision, -- 陸地座標無浪高模型資料時為 null,絕不存 0
  sea_temp_c double precision not null,
  has_official_warning boolean not null default false,
  fetched_at timestamptz not null
);

create index if not exists idx_sea_condition_history_zone_time
  on sea_condition_history (zone_id, fetched_at desc);

alter table sea_condition_history enable row level security;
