import type { DangerLevel } from '@/types';
import { JiaoIcon } from '@/components/icons/JiaoIcon';

interface RatingLightProps {
  /** null = 全來源失敗:退掉顏色,只顯示「目前取不到資料」 */
  level: DangerLevel | null;
  /** is_stale:降低飽和,顏色仍在但明顯「不新鮮」 */
  stale?: boolean;
  /** 側欄/面板用的緊湊版:降低高度與字級,仍維持三通道編碼 */
  compact?: boolean;
}

// 嚴重度三通道編碼(DESIGN.md 第 4 節):色 + 邊框(1px 實線 / 2px 實線 / 3px 雙線)
// + 燈質(定光 Iso / 明暗光 Oc 呼吸 / 閃光 Fl(2) 雙閃)。
// 動畫一律走 motion-safe:,prefers-reduced-motion 下只剩邊框與文字,仍獨立成立。
const LEVEL_STYLE: Record<DangerLevel, { box: string; title: string; conclusion: string }> = {
  safe: {
    box: 'bg-safe-bg text-safe border border-safe',
    title: '安全',
    conclusion: '目前適合出海作業',
  },
  caution: {
    box: 'bg-caution-bg text-caution border-2 border-caution motion-safe:animate-light-oc',
    title: '注意',
    conclusion: '可出海,請隨時警戒海況',
  },
  danger: {
    box: 'bg-danger-bg text-danger border-[3px] border-double border-danger motion-safe:animate-light-fl2',
    title: '危險',
    conclusion: '目前不建議出海',
  },
};

export function RatingLight({ level, stale = false, compact = false }: RatingLightProps) {
  const sizing = compact
    ? 'min-h-40 gap-2 px-4 py-5'
    : 'min-h-[38svh] gap-3 px-4 py-8';

  if (level === null) {
    return (
      <section
        role="status"
        className={`flex flex-col items-center justify-center rounded-lg border border-border bg-surface text-center ${sizing}`}
      >
        <p className={`font-bold text-fg-muted ${compact ? 'text-22' : 'text-28'}`}>目前取不到資料</p>
        <p className={`text-fg-dim ${compact ? 'text-14' : 'text-16'}`}>資料暫時取不到,請稍後再試</p>
      </section>
    );
  }

  const s = LEVEL_STYLE[level];
  return (
    <section
      role="status"
      aria-label={`海況評級:${s.title}`}
      className={`flex flex-col items-center justify-center rounded-lg text-center ${sizing} ${s.box} ${
        stale ? 'saturate-50' : ''
      }`}
    >
      <JiaoIcon level={level} size={compact ? 48 : 72} />
      <p className={`font-bold ${compact ? 'text-28' : 'text-40'}`}>{s.title}</p>
      <p className={compact ? 'text-16' : 'text-18'}>{s.conclusion}</p>
    </section>
  );
}
