import type { SVGProps } from 'react';
import type { DangerLevel } from '@/types';

interface JiaoIconProps extends SVGProps<SVGSVGElement> {
  level: DangerLevel;
  size?: number;
}

// 擲筊 glyph 幾何,抽自 assets/icons.html,造型原封不動。
const JIAO_D = 'M4,-20 C-10,-16 -11,16 3,20 C10,17 11,8 8.5,0 C11,-8 10.5,-16 4,-20 Z';

// 原始素材以深灰/淺灰兩色分陰陽面;這裡改成 currentColor 由父層控色,
// 陰(深)面 = 全不透明,陽(淺)面 = 0.35 透明度,保留一淺一深的辨識。
const FACE_UP: Record<DangerLevel, { leftDark: boolean; rightDark: boolean }> = {
  safe: { leftDark: false, rightDark: true }, // 聖筊 · 一淺一深
  caution: { leftDark: false, rightDark: false }, // 笑筊 · 兩者皆淺
  danger: { leftDark: true, rightDark: true }, // 陰筊 · 兩者皆深
};

function JiaoBlock({ cx, cy, rot, mirror, dark }: {
  cx: number;
  cy: number;
  rot: number;
  mirror: boolean;
  dark: boolean;
}) {
  const m = mirror ? -1 : 1;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${m * 0.82} 0.82)`}>
      <path d={JIAO_D} fill="currentColor" fillOpacity={dark ? 1 : 0.35} />
    </g>
  );
}

export function JiaoIcon({ level, size = 60, ...props }: JiaoIconProps) {
  const { leftDark, rightDark } = FACE_UP[level];
  return (
    <svg
      width={size}
      height={(size * 48) / 66}
      viewBox="0 0 66 48"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <JiaoBlock cx={23} cy={21} rot={-10} mirror={false} dark={leftDark} />
      <JiaoBlock cx={43} cy={27} rot={10} mirror={true} dark={rightDark} />
    </svg>
  );
}
