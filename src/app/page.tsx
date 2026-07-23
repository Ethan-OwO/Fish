import Link from 'next/link';
import { JiaoIcon } from '@/components/icons/JiaoIcon';
import { THRESHOLDS } from '@/lib/danger/config';
import { getMockZoneSummaries } from '@/lib/mock/dashboard';

// Landing:文字為引導的首頁。資訊密度靠即時海況帶與 mono 數據,
// 動畫只做進場 fade-up(motion-safe),不做行銷式大圖。
export default function Home() {
  const zones = getMockZoneSummaries();
  const counts = { safe: 0, caution: 0, danger: 0 };
  for (const z of zones) {
    if (z.current) counts[z.current.rating] += 1;
  }

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-14 pt-14 lg:grid-cols-[7fr_5fr] lg:gap-16 lg:pt-20">
        <h1 className="motion-safe:animate-fade-up text-40 font-bold leading-tight sm:text-64">
          出海前,
          <br />
          先問<span className="text-accent">海</span>。
        </h1>
        <div className="flex flex-col justify-center gap-5">
          <p
            className="motion-safe:animate-fade-up text-18 leading-relaxed text-fg-muted"
            style={{ animationDelay: '120ms' }}
          >
            出海筊整合中央氣象署與國際海象資料,把風速、浪高與官方警特報,算成一眼能懂的三級評級。
            打開 App,<span className="text-fg">2 秒內知道今天能不能出海</span>——其餘數據,都是這個判斷的佐證。
          </p>
          <div
            className="motion-safe:animate-fade-up flex flex-wrap gap-3"
            style={{ animationDelay: '240ms' }}
          >
            <Link
              href="/map"
              className="flex min-h-11 items-center rounded bg-accent px-5 text-16 font-medium text-bg transition-opacity hover:opacity-85"
            >
              開啟海況地圖 →
            </Link>
            <Link
              href="#how"
              className="flex min-h-11 items-center rounded border border-border bg-surface px-5 text-16 transition-colors hover:bg-surface-hi"
            >
              評級怎麼算
            </Link>
          </div>
        </div>
      </section>

      {/* 即時海況帶:資訊密度的第一眼 */}
      <section className="border-y border-border bg-bg-alt">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <p className="text-13 text-fg-dim">目前 25 區:</p>
          <p className="flex items-center gap-1.5 text-14">
            <span className="size-2 rounded-full bg-safe" aria-hidden />
            安全 <span className="font-mono">{counts.safe}</span>
          </p>
          <p className="flex items-center gap-1.5 text-14">
            <span className="size-2 rounded-full bg-caution" aria-hidden />
            注意 <span className="font-mono">{counts.caution}</span>
          </p>
          <p className="flex items-center gap-1.5 text-14">
            <span className="size-2 rounded-full bg-danger" aria-hidden />
            危險 <span className="font-mono">{counts.danger}</span>
          </p>
          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-4 overflow-x-auto sm:flex-none">
            {zones
              .filter((z) => z.current && z.current.rating !== 'safe')
              .slice(0, 3)
              .map((z) => (
                <Link
                  key={z.zoneId}
                  href={`/map?zone=${z.zoneId}`}
                  className="flex shrink-0 items-center gap-1.5 text-14 text-fg-muted transition-colors hover:text-fg"
                >
                  <span
                    className={`size-2 rounded-full ${z.current!.rating === 'danger' ? 'bg-danger' : 'bg-caution'}`}
                    aria-hidden
                  />
                  {z.zoneName}
                  <span className="font-mono text-13">{z.current!.windSpeed.toFixed(1)}</span>
                  <span className="text-13 text-fg-dim">m/s</span>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* 數據列 */}
      <section className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border my-12 lg:grid-cols-4">
        {[
          { n: '25', unit: '個', label: '監測海區(17 近海 + 8 遠海)' },
          { n: '3', unit: '個', label: '整合資料來源' },
          { n: '30', unit: '分鐘', label: '自動更新頻率' },
          { n: '12', unit: '小時', label: '走勢紀錄回看' },
        ].map((s) => (
          <div key={s.label} className="flex flex-col gap-1 bg-bg-alt p-5">
            <p>
              <span className="font-mono text-40 text-accent">{s.n}</span>
              <span className="ml-1 text-16 text-fg-muted">{s.unit}</span>
            </p>
            <p className="text-14 text-fg-muted">{s.label}</p>
          </div>
        ))}
      </section>

      {/* 評級方法 */}
      <section id="how" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-12">
        <h2 className="text-28 font-bold">三級評級,像擲筊一樣直接</h2>
        <p className="mt-2 max-w-2xl text-16 text-fg-muted">
          每個海區取風、浪、警特報三個因子中<span className="text-fg">最嚴重的那一個</span>作為結論。
          資料過期就退掉顏色——絕不用舊資料撐出一個綠色的「安全」。
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {(
            [
              {
                level: 'safe' as const,
                title: '安全',
                term: '聖筊',
                desc: `蒲福風級 ${THRESHOLDS.beaufort.caution} 級以下、浪高 ${THRESHOLDS.waveHeight.caution} m 以下,無官方警特報。`,
                box: 'border-safe bg-safe-bg text-safe',
              },
              {
                level: 'caution' as const,
                title: '注意',
                term: '笑筊',
                desc: `蒲福風級 ${THRESHOLDS.beaufort.caution}–${THRESHOLDS.beaufort.danger - 1} 級,或浪高 ${THRESHOLDS.waveHeight.caution}–${THRESHOLDS.waveHeight.danger} m。可出海,請隨時警戒。`,
                box: 'border-caution bg-caution-bg text-caution',
              },
              {
                level: 'danger' as const,
                title: '危險',
                term: '陰筊',
                desc: `蒲福風級 ${THRESHOLDS.beaufort.danger} 級以上、浪高超過 ${THRESHOLDS.waveHeight.danger} m,或中央氣象署發布海上警特報——一票否決。`,
                box: 'border-danger bg-danger-bg text-danger',
              },
            ]
          ).map((r) => (
            <div key={r.level} className={`flex flex-col gap-2 rounded-lg border p-5 ${r.box}`}>
              <JiaoIcon level={r.level} size={54} />
              <p className="text-22 font-bold">
                {r.title} <span className="text-14 font-normal opacity-80">{r.term}</span>
              </p>
              <p className="text-14 leading-relaxed text-fg-muted">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 運作方式 */}
      <section className="border-y border-border bg-bg-alt">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 md:grid-cols-3">
          {[
            {
              n: '01',
              title: '每 30 分鐘抓取',
              desc: '伺服器定時聚合三個資料來源,寫入快取——你打開頁面時不用等任何外部 API。',
            },
            {
              n: '02',
              title: '危險判斷引擎',
              desc: '純函式評級:風級與浪高各自對照閾值,取最嚴重者;官方警特報直接否決為危險。',
            },
            {
              n: '03',
              title: '地圖與走勢',
              desc: '25 區評級一張圖看完;點進任一海區,看 12 小時的風、浪、海溫變化。',
            },
          ].map((s) => (
            <div key={s.n} className="flex flex-col gap-2">
              <p className="font-mono text-16 text-accent">{s.n}</p>
              <p className="text-18 font-medium">{s.title}</p>
              <p className="text-14 leading-relaxed text-fg-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 資料來源 */}
      <section id="sources" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-12">
        <h2 className="text-28 font-bold">資料來源</h2>
        <p className="mt-2 max-w-2xl text-16 text-fg-muted">
          一個物理量綁定一個來源與一個顏色,全站永不變——你建立的是肌肉記憶。
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            {
              name: '中央氣象署',
              role: '海上警特報',
              dot: 'bg-m-warning',
              desc: '官方發布的警報是一票否決的依據,不參與加權、不打折。',
            },
            {
              name: 'Open-Meteo Marine',
              role: '浪高・海表溫',
              dot: 'bg-m-wave',
              desc: '海象模型逐時資料。模型不涵蓋的座標誠實顯示「—」,絕不假裝無浪。',
            },
            {
              name: 'OpenWeather',
              role: '風速',
              dot: 'bg-m-wind',
              desc: '即時風速,轉換為漁民熟悉的蒲福風級後參與評級。',
            },
          ].map((s) => (
            <div key={s.name} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-5">
              <p className="flex items-center gap-2 text-13 text-fg-muted">
                <span className={`size-2 rounded-full ${s.dot}`} aria-hidden />
                {s.role}
              </p>
              <p className="text-18 font-medium">{s.name}</p>
              <p className="text-14 leading-relaxed text-fg-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 情境圖 placeholder */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-12">
        <div className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-bg-alt p-8 text-center">
          <p className="text-14 text-fg-dim">[ 圖片placeholder ]</p>
          <p className="max-w-md text-13 text-fg-dim">
            建議放:清晨漁港或甲板視角的照片(橫幅,至少 1600×600),或 App 在手機上的實拍情境照。
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-bg-alt">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-4 px-4 py-14">
          <h2 className="text-28 font-bold sm:text-40">現在的海,是什麼臉色?</h2>
          <Link
            href="/map"
            className="flex min-h-12 items-center rounded bg-accent px-6 text-16 font-medium text-bg transition-opacity hover:opacity-85"
          >
            開啟海況地圖 →
          </Link>
        </div>
      </section>
    </main>
  );
}
