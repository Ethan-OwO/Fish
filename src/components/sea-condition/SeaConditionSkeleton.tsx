const FILTER_LABELS = ["全部", "安全", "注意", "危險", "資料過舊"];

const CARD_WIDTHS = [
  { name: 132, foot: 150 },
  { name: 108, foot: 138 },
  { name: 152, foot: 162 },
  { name: 96, foot: 128 },
  { name: 124, foot: 152 },
  { name: 140, foot: 144 },
  { name: 104, foot: 134 },
];

function Shimmer({
  width,
  height,
  rounded = "rounded",
  className = "",
}: {
  width: number | string;
  height: number;
  rounded?: string;
  className?: string;
}) {
  return (
    <span
      className={`skeleton-shimmer block flex-none ${rounded} ${className}`}
      style={{ width, height }}
    />
  );
}

function WaveMark() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    </svg>
  );
}

function BrandHeader() {
  return (
    <header className="flex h-[52px] flex-none items-center justify-between border-b border-hairline bg-surface px-4 lg:px-[18px]">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-white lg:h-[30px] lg:w-[30px]">
          <WaveMark />
        </div>
        <div className="flex flex-col leading-[1.1]">
          <span className="text-[15px] font-semibold">海況安全網</span>
          <span className="hidden text-[10px] tracking-[0.06em] text-text-muted lg:block">
            SEASTATE
          </span>
        </div>
      </div>
      <nav className="hidden items-center gap-5 text-[13px] text-text-secondary lg:flex">
        <span className="font-medium text-text-primary">海況地圖</span>
        <span>漁港</span>
        <span>資料來源</span>
      </nav>
      <div className="flex flex-col gap-1 lg:hidden" aria-hidden="true">
        <span className="h-0.5 w-[18px] rounded-full bg-text-muted" />
        <span className="h-0.5 w-[18px] rounded-full bg-text-muted" />
        <span className="h-0.5 w-[18px] rounded-full bg-text-muted" />
      </div>
    </header>
  );
}

function SidebarHeaderSkeleton() {
  return (
    <div className="flex-none border-b border-hairline px-4 pb-3 pt-4 lg:px-[18px]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="m-0 whitespace-nowrap text-lg font-semibold text-text-primary">
          今日海況
        </h2>
        <Shimmer width={112} height={13} />
      </div>
      <Shimmer width={200} height={12} />
    </div>
  );
}

function FilterPillsSkeleton({ scrollable = false }: { scrollable?: boolean }) {
  return (
    <div
      className={`flex flex-none gap-2 border-b border-hairline px-4 py-3 lg:px-[18px] ${
        scrollable ? "overflow-x-auto" : "flex-wrap"
      }`}
    >
      {FILTER_LABELS.map((label) => (
        <span
          key={label}
          className="inline-flex flex-none items-center whitespace-nowrap rounded-full border border-hairline bg-panel px-3.5 py-1.5 text-[13px] font-medium leading-none text-text-muted opacity-60"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function SeaAreaCardSkeleton({ nameWidth, footWidth }: { nameWidth: number; footWidth: number }) {
  return (
    <div className="rounded-card border border-hairline bg-surface px-3.5 py-3">
      <div className="mb-[11px] flex items-center justify-between gap-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Shimmer width={10} height={10} rounded="rounded-full" />
          <Shimmer width={nameWidth} height={16} />
        </div>
        <Shimmer width={64} height={23} rounded="rounded-md" />
      </div>
      <div className="mb-3 flex gap-6">
        <div className="flex flex-col gap-1.5">
          <Shimmer width={20} height={9} rounded="rounded-sm" />
          <Shimmer width={34} height={17} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Shimmer width={20} height={9} rounded="rounded-sm" />
          <Shimmer width={30} height={17} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Shimmer width={32} height={9} rounded="rounded-sm" />
          <Shimmer width={26} height={17} />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Shimmer width={13} height={13} rounded="rounded-sm" />
        <Shimmer width={footWidth} height={11} />
      </div>
    </div>
  );
}

function CenterLoader({ compact = false }: { compact?: boolean }) {
  const size = compact ? 24 : 30;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5">
      <span
        className="animate-spin rounded-full border-[3px] border-ink/[.14] border-t-text-muted"
        style={{ width: size, height: size }}
      />
      <span className="text-[13px] font-medium text-text-secondary lg:text-[14px]">
        載入海況中…
      </span>
      <span className="hidden font-mono text-[11px] text-text-muted lg:block">
        正在抓取資料
      </span>
    </div>
  );
}

function FloatingSearchSkeleton() {
  return (
    <div className="absolute left-4 top-4 z-[2] flex w-[460px] max-w-[calc(100%-32px)] gap-2">
      <div className="flex h-[42px] flex-1 items-center gap-2.5 rounded-md border border-hairline bg-surface px-3">
        <Shimmer width={16} height={16} rounded="rounded" />
        <Shimmer width={150} height={12} />
      </div>
      <div className="flex h-[42px] w-[132px] items-center gap-2 rounded-md border border-hairline bg-surface px-3.5 opacity-60">
        <Shimmer width={16} height={16} rounded="rounded" />
        <Shimmer width={56} height={12} />
      </div>
    </div>
  );
}

function ZoomControlSkeleton() {
  return (
    <div className="absolute right-4 top-[74px] z-[2] flex flex-col overflow-hidden rounded-md border border-hairline bg-surface text-hairline-strong">
      <span className="flex h-[34px] w-[34px] items-center justify-center text-lg">+</span>
      <span className="h-px bg-hairline" />
      <span className="flex h-[34px] w-[34px] items-center justify-center text-lg">−</span>
    </div>
  );
}

function DisclaimerFooter() {
  return (
    <div className="flex flex-none items-start justify-between gap-4 border-t border-hairline bg-panel px-4 py-2.5 text-[11px] leading-[1.5] text-text-muted lg:px-4 lg:text-[12px]">
      <span>本資訊整合自公開氣象與海象來源,僅供參考,出海前請以官方發布為準。</span>
      <span className="hidden whitespace-nowrap border-b border-hairline-strong pb-px font-medium text-action lg:inline">
        詳情
      </span>
    </div>
  );
}

/**
 * 海況安全網首次載入畫面:靜態外殼(品牌列、標題、篩選列、免責聲明)正常顯示,
 * 資料位置以低對比灰塊 + shimmer 佔位,版型與資料到位後的畫面完全對齊。
 */
export default function SeaConditionSkeleton() {
  return (
    <div className="flex h-dvh min-h-[560px] flex-col bg-surface text-text-primary" role="status" aria-live="polite" aria-label="海況資料載入中">
      <BrandHeader />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Sidebar — desktop only */}
        <aside className="hidden lg:flex lg:h-full lg:w-96 lg:flex-none lg:flex-col lg:border-r lg:border-hairline lg:bg-surface">
          <SidebarHeaderSkeleton />
          <FilterPillsSkeleton />
          <div className="grid flex-1 content-start gap-2.5 overflow-y-auto px-[18px] py-3">
            {CARD_WIDTHS.map((c, i) => (
              <SeaAreaCardSkeleton key={i} nameWidth={c.name} footWidth={c.foot} />
            ))}
          </div>
        </aside>

        {/* Map — desktop only */}
        <main className="relative hidden min-w-0 flex-1 bg-map lg:block">
          <FloatingSearchSkeleton />
          <ZoomControlSkeleton />
          <CenterLoader />
        </main>

        {/* Mobile layout */}
        <div className="flex min-h-0 flex-1 flex-col lg:hidden">
          <SidebarHeaderSkeleton />
          <FilterPillsSkeleton scrollable />
          <div className="relative h-[148px] flex-none border-b border-hairline bg-map">
            <CenterLoader compact />
          </div>
          <div className="grid flex-1 content-start gap-2.5 overflow-y-auto bg-panel px-4 py-3">
            {CARD_WIDTHS.slice(0, 4).map((c, i) => (
              <SeaAreaCardSkeleton key={i} nameWidth={c.name} footWidth={c.foot} />
            ))}
          </div>
        </div>
      </div>

      <DisclaimerFooter />
    </div>
  );
}
