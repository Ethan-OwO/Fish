import Link from 'next/link';
import { MOCK_STATE_IDS, MOCK_STATE_LABELS, type MockStateId } from '@/lib/mock/sea-conditions';

// 開發檢視用:query string 切換五種資料狀態(接上真 API 後移除)。
// 純 <Link>,不需要 Client Component。
export function StateSwitcher({ current }: { current: MockStateId }) {
  return (
    <nav aria-label="Mock 狀態切換" className="flex flex-wrap gap-2">
      {MOCK_STATE_IDS.map((id) => {
        const active = id === current;
        return (
          <Link
            key={id}
            href={id === 'safe' ? '/demo' : `/demo?state=${id}`}
            className={`inline-flex min-h-11 items-center rounded px-4 text-14 ${
              active
                ? 'bg-surface-hi text-accent border border-accent'
                : 'bg-surface text-fg-muted border border-border'
            }`}
          >
            {MOCK_STATE_LABELS[id]}
          </Link>
        );
      })}
    </nav>
  );
}
