// 常駐、不可關閉,置於評級區塊正下方(DESIGN.md 第 4 節)
export function Disclaimer() {
  return (
    <p className="border-t border-border pt-3 text-13 text-fg-muted">
      本評級為參考值,非官方法定標準,出海前請以中央氣象署發布為準。
    </p>
  );
}
