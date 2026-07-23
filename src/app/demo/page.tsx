import type { Metadata } from 'next';
import { SeaConditionView } from '@/components/sea-condition/SeaConditionView';
import { StateSwitcher } from '@/components/dev/StateSwitcher';
import { getMockView, MOCK_STATE_IDS, type MockStateId } from '@/lib/mock/sea-conditions';

export const metadata: Metadata = {
  title: '狀態展示 — 出海筊',
};

// 開發/驗收用:單一海區檢視的五種資料狀態切換(DESIGN.md 第 10 節狀態矩陣)。
export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const stateId: MockStateId = (MOCK_STATE_IDS as readonly string[]).includes(state ?? '')
    ? (state as MockStateId)
    : 'safe';

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-4">
      <p className="text-13 text-fg-dim">
        開發用頁面:逐一檢視資料狀態矩陣的每種情境,元件與正式頁完全共用。
      </p>
      <StateSwitcher current={stateId} />
      <SeaConditionView state={getMockView(stateId)} />
    </main>
  );
}
