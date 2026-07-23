import Link from 'next/link';
import { LogoMark } from '@/components/icons/LogoMark';

const GITHUB_URL = 'https://github.com/Ethan-OwO/Fish';

interface MenuItem {
  label: string;
  description: string;
  href: string;
  external?: boolean;
  soon?: boolean;
}

interface Menu {
  label: string;
  items: MenuItem[];
}

const MENUS: Menu[] = [
  {
    label: '功能',
    items: [
      { label: '海況地圖', description: '25 個海區的即時評級總覽', href: '/map' },
      { label: '海域清單', description: '可排序的密集數據表格', href: '/map#zones' },
      { label: '12 小時走勢', description: '風速、浪高、海表溫變化', href: '/map' },
      { label: '魚訊回報', description: '漁民互助即時回報(開發中)', href: '/about#roadmap', soon: true },
    ],
  },
  {
    label: '資料',
    items: [
      { label: '評級方法', description: '風級、浪高與官方警特報如何變成三色', href: '/#how' },
      { label: '資料來源', description: 'CWA、Open-Meteo、OpenWeather', href: '/#sources' },
      { label: '狀態展示', description: '五種資料狀態的檢視(開發用)', href: '/demo' },
      { label: '原始碼', description: 'GitHub 上的完整專案', href: GITHUB_URL, external: true },
    ],
  },
];

// Hover 下拉全靠 CSS(group-hover + focus-within),零 Client Component;
// 鍵盤使用者 Tab 進選單項目時 focus-within 讓面板保持展開。
function NavDropdown({ menu }: { menu: Menu }) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="flex min-h-11 items-center gap-1 px-3 text-14 text-fg-muted transition-colors group-hover:text-fg group-focus-within:text-fg"
      >
        {menu.label}
        <svg
          viewBox="0 0 10 6"
          className="h-1.5 w-2.5 transition-transform duration-200 group-hover:rotate-180"
          aria-hidden
        >
          <path d="M1 1 L5 5 L9 1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <div className="invisible absolute left-0 top-full z-50 pt-1 opacity-0 transition-all duration-200 translate-y-1 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="w-64 rounded-lg border border-border bg-bg-alt p-1.5 shadow-xl shadow-black/40">
          {menu.items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="block rounded px-3 py-2 transition-colors hover:bg-surface-hi"
            >
              <span className="flex items-center gap-2 text-14 text-fg">
                {item.label}
                {item.soon && (
                  <span className="rounded-full border border-border px-2 py-px text-[11px] uppercase tracking-wide text-fg-dim">
                    soon
                  </span>
                )}
                {item.external && <span className="text-fg-dim">↗</span>}
              </span>
              <span className="mt-0.5 block text-13 text-fg-dim">{item.description}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const underline =
  'relative after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-200 hover:after:scale-x-100';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2.5" aria-label="出海筊 首頁">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-accent text-bg">
            <LogoMark size={26} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-16 font-bold">出海筊</span>
            <span className="text-[11px] tracking-[0.08em] text-fg-muted">PELAGHELM</span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center md:flex" aria-label="主選單">
          {MENUS.map((menu) => (
            <NavDropdown key={menu.label} menu={menu} />
          ))}
          <Link href="/about" className={`flex min-h-11 items-center px-3 text-14 text-fg-muted transition-colors hover:text-fg ${underline}`}>
            關於
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-11 items-center rounded border border-border bg-surface px-4 text-14 text-fg transition-colors hover:bg-surface-hi sm:flex"
          >
            GitHub
          </a>
          <Link
            href="/map"
            className="flex min-h-11 items-center rounded bg-accent px-4 text-14 font-medium text-bg transition-opacity hover:opacity-85"
          >
            開啟海況地圖
          </Link>
        </div>
      </div>

      {/* Mobile:無 hover 的環境給直接連結列,不做漢堡選單(維持零 JS) */}
      <nav
        className="flex items-center gap-1 overflow-x-auto border-t border-border px-2 py-1 md:hidden"
        aria-label="行動版選單"
      >
        {[
          { label: '海況地圖', href: '/map' },
          { label: '海域清單', href: '/map#zones' },
          { label: '評級方法', href: '/#how' },
          { label: '關於', href: '/about' },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex min-h-10 shrink-0 items-center px-3 text-14 text-fg-muted hover:text-fg"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
