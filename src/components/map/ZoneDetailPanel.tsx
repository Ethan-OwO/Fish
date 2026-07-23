import type { HistoryPoint, SeaConditionsResponse, ZoneSummary } from '@/types';
import { RatingLight } from '@/components/sea-condition/RatingLight';
import { StalenessBadge, type StalenessState } from '@/components/sea-condition/StalenessBadge';
import { FactorList } from '@/components/sea-condition/FactorList';
import { Disclaimer } from '@/components/sea-condition/Disclaimer';
import { Sparkline } from '@/components/charts/Sparkline';

interface ZoneDetailPanelProps {
  zone: ZoneSummary;
  response: SeaConditionsResponse;
  history: HistoryPoint[];
}

// 選中海區的詳情:緊湊評級燈 + 新鮮度 + 12h 走勢 ×3 + 因子清單。
// 走勢圖當前值就是數值卡,不再重複一組 MetricCard(密度優先)。
export function ZoneDetailPanel({ zone, response, history }: ZoneDetailPanelProps) {
  const { condition, danger } = response;
  const waveMissing = condition.waveHeight === null;

  const staleness: StalenessState = response.is_stale
    ? { kind: 'stale', stalenessSeconds: response.staleness_seconds, fetchedAt: response.fetched_at }
    : { kind: 'fresh', stalenessSeconds: response.staleness_seconds };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <h2 className="text-22 font-medium">{zone.zoneName}</h2>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-fg-dim">
          {zone.category === 'offshore' ? '遠海' : '近海'}
        </span>
        <span className="font-mono text-13 text-fg-muted">
          {zone.centerLat.toFixed(2)}, {zone.centerLng.toFixed(2)}
        </span>
        {waveMissing && (
          <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-13 text-fg-muted">
            以 <span className="font-mono">2/3</span> 來源判定
          </span>
        )}
      </div>

      <RatingLight level={danger.level} stale={response.is_stale} compact />
      <StalenessBadge state={staleness} />

      <div className="flex flex-col gap-2">
        <Sparkline
          label="風速(過去 12 小時)"
          unit="m/s"
          colorClass="text-m-wind"
          points={history.map((p) => ({ t: p.fetchedAt, v: p.windSpeed }))}
        />
        <Sparkline
          label="浪高(過去 12 小時)"
          unit="m"
          colorClass="text-m-wave"
          points={history.map((p) => ({ t: p.fetchedAt, v: p.waveHeight }))}
          emptyText="浪高資料不涵蓋此海區"
        />
        <Sparkline
          label="海表溫(過去 12 小時)"
          unit="°C"
          colorClass="text-m-temp"
          points={history.map((p) => ({ t: p.fetchedAt, v: p.seaTemp }))}
        />
      </div>

      <FactorList factors={danger.factors} waveMissing={waveMissing} />
      <Disclaimer />
    </div>
  );
}
