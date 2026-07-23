import type { SVGProps } from 'react';

interface LogoMarkProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

// 品牌 glyph(燈塔 + 魚 + 波浪),抽自 assets/SeaState Brand Logo Lockup.html,
// 造型原封不動;顏色走 currentColor 由父層控制,尺寸走 size prop。
export function LogoMark({ size = 24, ...props }: LogoMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M8 3.8 8 12 13 12 Z" fill="currentColor" />
      <path d="M8 3.8 8 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M2.5 13 H13.5 L11.8 16.4 A1.9 1.9 0 0 1 10.2 17.4 H5.8 A1.9 1.9 0 0 1 4.2 16.4 Z"
        fill="currentColor"
      />
      <path d="M14.9 15 C16.4 12.6 19.9 12.6 21.4 15 C19.9 17.4 16.4 17.4 14.9 15 Z" fill="currentColor" />
      <path d="M21.4 15 23 13.5 23 16.5 Z" fill="currentColor" />
      <path
        d="M2 20 C2.7 20.6 3.3 20.9 4.5 20.9 C7 20.9 7 19.1 9.5 19.1 C12 19.1 12 20.9 14.5 20.9 C17 20.9 17 19.1 19.5 19.1 C20.7 19.1 21.3 19.4 22 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
