export type ConcurrencyResult<R> =
  | { status: 'fulfilled'; value: R }
  | { status: 'rejected'; reason: unknown };

// 以最多 limit 個並行執行 fn,回傳依 items 順序排列的結果。
// 單一 item 失敗不會中斷其他 item(continue-on-error),呼叫端自行判斷 fulfilled/rejected。
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<ConcurrencyResult<R>[]> {
  const results: ConcurrencyResult<R>[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      try {
        const value = await fn(items[index]);
        results[index] = { status: 'fulfilled', value };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}
