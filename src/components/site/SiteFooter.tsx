import Link from 'next/link';
import { LogoMark } from '@/components/icons/LogoMark';

const GITHUB_URL = 'https://github.com/Ethan-OwO/Fish';

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: '產品',
    links: [
      { label: '海況地圖', href: '/map' },
      { label: '海域清單', href: '/map#zones' },
      { label: '狀態展示', href: '/demo' },
    ],
  },
  {
    title: '資料來源',
    links: [
      { label: '中央氣象署開放資料', href: 'https://opendata.cwa.gov.tw/', external: true },
      { label: 'Open-Meteo Marine', href: 'https://open-meteo.com/', external: true },
      { label: 'OpenWeather', href: 'https://openweathermap.org/', external: true },
    ],
  },
  {
    title: '專案',
    links: [
      { label: 'GitHub', href: GITHUB_URL, external: true },
      { label: '關於與聯絡', href: '/about' },
      { label: 'Roadmap', href: '/about#roadmap' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-bg-alt">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-[9px] bg-surface text-accent">
              <LogoMark size={26} />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-16 font-bold">出海筊</span>
              <span className="text-[11px] tracking-[0.08em] text-fg-muted">PELAGHELM</span>
            </span>
          </span>
          <p className="text-13 leading-relaxed text-fg-muted">
            出海前,先問海。
            <br />
            整合官方與國際海象資料的三級海況評級。
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="mb-3 text-13 font-medium uppercase tracking-wide text-fg-dim">{col.title}</p>
            <ul className="flex flex-col gap-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-14 text-fg-muted transition-colors hover:text-fg"
                    >
                      {link.label} <span className="text-fg-dim">↗</span>
                    </a>
                  ) : (
                    <Link href={link.href} className="text-14 text-fg-muted transition-colors hover:text-fg">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4">
          <p className="text-13 text-fg-dim">
            © <span className="font-mono">2026</span> 出海筊 PELAGHELM
          </p>
          <p className="text-13 text-fg-dim">本評級為參考值,非官方法定標準,出海前請以中央氣象署發布為準。</p>
        </div>
      </div>
    </footer>
  );
}
