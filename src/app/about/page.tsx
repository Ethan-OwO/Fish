import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '關於與聯絡 — 出海筊',
  description: '出海筊 PELAGHELM 的專案故事、技術架構、開發路線圖與聯絡方式。',
};

const GITHUB_URL = 'https://github.com/Ethan-OwO/Fish';
const CONTACT_EMAIL = 'liu.ethan0720@gmail.com';

const STACK = [
  'Next.js 16',
  'TypeScript',
  'Tailwind CSS v4',
  'Supabase(PostgreSQL + PostGIS)',
  'Zod',
  'Vitest',
  'CWA 開放資料',
  'Open-Meteo Marine',
  'OpenWeather',
];

const ROADMAP: { tag: string; title: string; desc: string; done?: boolean }[] = [
  { tag: 'M1–M3', title: '資料整合・評級引擎・快取層', desc: '三來源聚合、純函式危險判斷、Supabase 快取 + cron 定時刷新。', done: true },
  { tag: 'M3.5', title: '25 海區細分', desc: '4 個粗略區域細分為 17 近海 + 8 遠海,並行刷新。', done: true },
  { tag: 'M4', title: '海況檢視・地圖・12h 走勢', desc: '本站現在的樣子:評級燈、海圖總覽、歷史走勢後端與圖表。', done: true },
  { tag: 'M5', title: '魚訊回報與即時地圖', desc: '漁民 GPS 定位 + 文字回報,PostGIS 距離查詢 + Supabase Realtime,形成互助海況圖。' },
  { tag: 'M6', title: '帳號系統', desc: 'Supabase Auth,只有「送出回報」需要登入——核心海況檢視永遠不設登入牆。' },
  { tag: 'M7', title: 'PWA', desc: '可安裝、離線快取最後一次海況(強制標為過期),正式部署。' },
];

export default function AboutPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-14">
        <h1 className="motion-safe:animate-fade-up max-w-3xl text-40 font-bold leading-tight">
          做給漁民的海況判讀,
          <br />
          不是做給工程師的儀表板。
        </h1>
        <p
          className="motion-safe:animate-fade-up mt-5 max-w-2xl text-18 leading-relaxed text-fg-muted"
          style={{ animationDelay: '120ms' }}
        >
          出海筊(PELAGHELM)從一個問題開始:站在清晨的漁港,查風要開一個
          App、查浪要開另一個、警特報又在第三個地方——而你只想知道
          <span className="text-fg">「今天能不能出海」</span>。
          我們把這三件事收斂成一個評級、一張地圖、一條走勢,用擲筊的直覺呈現:聖筊安全、笑筊注意、陰筊危險。
        </p>
      </section>

      {/* 原則 */}
      <section className="border-y border-border bg-bg-alt">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
          {[
            { title: '誠實優先', desc: '資料過期就退色、缺漏就顯示「—」。絕不用舊資料撐出綠色的安全,也絕不把 null 畫成 0。' },
            { title: '兩秒可判讀', desc: '評級燈是首屏主體,色彩、邊框、燈質三通道同時編碼——強光下、色覺不同的人,都讀得出來。' },
            { title: '不設登入牆', desc: '看海況永遠免登入。未來只有「送出回報」需要帳號,而且只擋那一條路徑。' },
          ].map((p) => (
            <div key={p.title} className="flex flex-col gap-2">
              <p className="text-18 font-medium text-accent">{p.title}</p>
              <p className="text-14 leading-relaxed text-fg-muted">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 技術 */}
      <section id="engine" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-12">
        <h2 className="text-28 font-bold">怎麼做的</h2>
        <p className="mt-2 max-w-2xl text-16 leading-relaxed text-fg-muted">
          伺服器每 30 分鐘聚合三個資料來源寫入快取,危險判斷是一個可完整單元測試的純函式;
          前端頁面全部是 Server Component——這個站目前沒有任何一行 Client JS 狀態管理。
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {STACK.map((s) => (
            <span key={s} className="rounded-full border border-border bg-surface px-3 py-1.5 text-14 text-fg-muted">
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="border-t border-border bg-bg-alt">
        <div className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-12">
          <h2 className="text-28 font-bold">Roadmap</h2>
          <ol className="mt-6 flex flex-col">
            {ROADMAP.map((m, i) => (
              <li key={m.tag} className="relative flex gap-4 pb-6 last:pb-0">
                <div className="flex flex-col items-center">
                  <span
                    className={`mt-1 size-2.5 shrink-0 rounded-full ${m.done ? 'bg-safe' : 'border border-fg-dim'}`}
                    aria-hidden
                  />
                  {i < ROADMAP.length - 1 && <span className="w-px flex-1 bg-border" aria-hidden />}
                </div>
                <div className="flex flex-col gap-1 pb-1">
                  <p className="flex items-center gap-2">
                    <span className="font-mono text-13 text-accent">{m.tag}</span>
                    <span className="text-16 font-medium">{m.title}</span>
                    {m.done && <span className="text-13 text-safe">已完成</span>}
                  </p>
                  <p className="text-14 leading-relaxed text-fg-muted">{m.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 聯絡 */}
      <section id="contact" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-12">
        <h2 className="text-28 font-bold">聯絡</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-[auto_1fr]">
          <div className="flex size-28 items-center justify-center rounded-lg border border-dashed border-border bg-bg-alt text-center">
            <p className="px-2 text-[11px] leading-relaxed text-fg-dim">[ 頭像placeholder ]<br />方形照片<br />≥ 320×320</p>
          </div>
          <div className="flex flex-col justify-center gap-2">
            <p className="text-18 font-medium">
              麻糬 <span className="text-14 font-normal text-fg-muted">開發者・出海筊 PELAGHELM</span>
            </p>
            <p className="flex flex-wrap gap-x-5 gap-y-1.5 text-14">
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent transition-opacity hover:opacity-80">
                <span className="font-mono">{CONTACT_EMAIL}</span>
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent transition-opacity hover:opacity-80"
              >
                <span className="font-mono">github.com/Ethan-OwO/Fish</span> ↗
              </a>
            </p>
            <p className="text-14 leading-relaxed text-fg-muted">
              歡迎 issue、PR,或直接寫信聊海況資料與漁業應用。
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10">
          <p className="text-22 font-medium">說完了,去看海吧。</p>
          <Link
            href="/map"
            className="flex min-h-11 items-center rounded bg-accent px-5 text-16 font-medium text-bg transition-opacity hover:opacity-85"
          >
            開啟海況地圖 →
          </Link>
        </div>
      </section>
    </main>
  );
}
