import type { SeaConditionsResponse } from '@/types';
import { RatingLight } from './RatingLight';
import { MetricCard } from './MetricCard';
import { StalenessBadge, type StalenessState } from './StalenessBadge';
import { FactorList } from './FactorList';
import { Disclaimer } from './Disclaimer';
import { SeaConditionSkeleton } from './SeaConditionSkeleton';

// 五種資料狀態的真值表實作(DESIGN.md 第 10 節),不靠 if-else 隨手拼:
// 新鮮+完整 / 新鮮+部分來源缺 / is_stale / 冷啟動載入中 / 全部失敗。
export type SeaConditionViewState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'data'; zoneName: string; response: SeaConditionsResponse };

function LocationRow({
  zoneName,
  lat,
  lng,
  partialSources,
}: {
  zoneName: string;
  lat?: number;
  lng?: number;
  partialSources?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h1 className="text-22 font-medium">{zoneName}</h1>
      {lat !== undefined && lng !== undefined && (
        <span className="font-mono text-13 text-fg-muted">
          {lat.toFixed(2)}, {lng.toFixed(2)}
        </span>
      )}
      {partialSources && (
        <span className="inline-flex min-h-6 items-center rounded-full border border-border px-3 py-0.5 text-13 text-fg-muted">
          以 <span className="font-mono">2/3</span> 來源判定
        </span>
      )}
    </div>
  );
}

export function SeaConditionView({ state }: { state: SeaConditionViewState }) {
  if (state.kind === 'loading') {
    return <SeaConditionSkeleton />;
  }

  if (state.kind === 'failed') {
    return (
      <div className="flex flex-col gap-3">
        <LocationRow zoneName="—" />
        <RatingLight level={null} />
        <StalenessBadge state={{ kind: 'failed' }} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-2">
          <MetricCard label="風速" value={null} dotClass="bg-m-wind" />
          <MetricCard label="浪高" value={null} dotClass="bg-m-wave" />
          <MetricCard label="海表溫" value={null} dotClass="bg-m-temp" />
          <MetricCard label="官方警特報" value={null} dotClass="bg-m-warning" />
        </div>
        <Disclaimer />
      </div>
    );
  }

  const { zoneName, response } = state;
  const { condition, danger } = response;

  const windFactor = danger.factors.find((f) => f.key === 'wind');
  const waveFactor = danger.factors.find((f) => f.key === 'wave');
  const warningFactor = danger.factors.find((f) => f.key === 'officialWarning');
  const waveMissing = condition.waveHeight === null;

  const staleness: StalenessState = response.is_stale
    ? {
        kind: 'stale',
        stalenessSeconds: response.staleness_seconds,
        fetchedAt: response.fetched_at,
      }
    : { kind: 'fresh', stalenessSeconds: response.staleness_seconds };

  // 人類可讀分級直接取自 DangerFactor.label 的分級前綴(引擎已造好句,前端不重造)
  const grade = (label?: string) => label?.split('(')[0];

  return (
    <div className="flex flex-col gap-3">
      <LocationRow
        zoneName={zoneName}
        lat={condition.lat}
        lng={condition.lng}
        partialSources={waveMissing}
      />
      <RatingLight level={danger.level} stale={response.is_stale} />
      <StalenessBadge state={staleness} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-2">
        <MetricCard
          label="風速"
          value={condition.windSpeed.toFixed(1)}
          unit="m/s"
          grade={grade(windFactor?.label)}
          gradeLevel={windFactor?.level}
          dotClass="bg-m-wind"
        />
        <MetricCard
          label="浪高"
          value={condition.waveHeight === null ? null : condition.waveHeight.toFixed(1)}
          unit="m"
          grade={grade(waveFactor?.label)}
          gradeLevel={waveFactor?.level}
          dotClass="bg-m-wave"
          note={waveMissing ? '浪高資料不涵蓋此座標' : undefined}
        />
        <MetricCard label="海表溫" value={condition.seaTemp.toFixed(1)} unit="°C" dotClass="bg-m-temp" />
        <MetricCard
          label="官方警特報"
          value={warningFactor ? String(warningFactor.raw) : null}
          mono={false}
          gradeLevel={warningFactor?.level === 'danger' ? 'danger' : undefined}
          dotClass="bg-m-warning"
        />
      </div>
      <FactorList factors={danger.factors} waveMissing={waveMissing} />
      <Disclaimer />
    </div>
  );
}
