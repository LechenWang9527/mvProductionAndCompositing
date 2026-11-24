import React, { useId, useMemo, type CSSProperties } from 'react';
import { MV_FONT_FAMILIES } from '../visual/Fonts';

export type SketchIconName =
  | 'cart'          // 搬家独轮车与包袱
  | 'abacus'        // 算盘与铜钱
  | 'roofCrack'     // 断裂椽木与掀飞茅草 + 12° 角弧
  | 'homeGrid'      // 层叠古建屋脊线框网格
  | 'warmSoup'      // 亮灯窗格 + 一碗热气热汤
  | 'keyHole'       // 古铜锁孔与钥匙齿
  | 'ecgBadge'      // 心电脉冲折线 ───/\╱\───
  | 'shoppingCart'  // 购物车推车与清单打勾 ✓
  | 'footprint'     // 初生婴儿脚印与长命锁
  | 'flatbread';    // 唐代胡饼与木箸

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * 1. InkPathDraw:
 * 全画幅 1920x1080 SVG 叠加层（pointerEvents: 'none'），内置 feTurbulence + feDisplacementMap 手绘毛边；
 * 先画一层 grooveColor 暗墨底痕，再画一层 color 主线，pathLength={1} 实现顺滑生长。
 */
export function InkPathDraw({
  d,
  progress,
  color = '#c84b31',
  grooveColor = 'rgba(28,22,16,0.35)',
  width = 2.4,
  dashed = false,
  showTip = false,
  widthCanvas = 1920,
  heightCanvas = 1080,
  style,
}: {
  d: string;
  progress: number;
  color?: string;
  grooveColor?: string;
  width?: number;
  dashed?: boolean;
  showTip?: boolean;
  widthCanvas?: number;
  heightCanvas?: number;
  style?: CSSProperties;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const filterId = `inkPathWobble-${uid}`;
  const tipFilterId = `inkPathTip-${uid}`;

  const p = clamp01(progress);
  if (p <= 0.001) return null;

  const dashArray = dashed ? '0.04 0.02' : '1 1';
  const dashOffset = Math.max(0, 1 - p);

  return (
    <svg
      width={widthCanvas}
      height={heightCanvas}
      viewBox={`0 0 ${widthCanvas} ${heightCanvas}`}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        ...style,
      }}
      aria-hidden="true"
    >
      <defs>
        <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves={2} seed={19} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={2.4} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {showTip && (
          <filter id={tipFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={3} />
          </filter>
        )}
      </defs>

      <g filter={`url(#${filterId})`}>
        {/* 底层暗墨槽 (Groove shadow) */}
        <path
          d={d}
          fill="none"
          stroke={grooveColor}
          strokeWidth={width * 1.55}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          opacity={0.88}
        />

        {/* 表层主色线 (Main stroke) */}
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
        />

        {/* 笔尖微弱光晕 */}
        {showTip && p > 0.02 && p < 0.99 && (
          <path
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={width * 2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            opacity={0.35 * (1 - p)}
            filter={`url(#${tipFilterId})`}
          />
        )}
      </g>
    </svg>
  );
}

/**
 * 2. InkSketchIcon:
 * 纯手绘多段 SVG 路径简笔画（10 款经典意象，每款 3~5 段有辨识度的路径），
 * 随 progress 分段一笔笔勾勒成型，随 pulse 呼吸缩放。
 */
export function InkSketchIcon({
  name,
  x,
  y,
  size = 64,
  progress,
  color = '#282018',
  accentColor = '#c84b31',
  pulse = 0,
  label,
}: {
  name: SketchIconName;
  x: number;
  y: number;
  size?: number;
  progress: number;
  color?: string;
  accentColor?: string;
  pulse?: number;
  label?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const filterId = `iconWobble-${uid}`;

  const p = clamp01(progress);
  if (p <= 0.001) return null;

  // 取消 pulse 导致的缩放抽搐，固定 scale(1)
  const scale = 1;

  // 分段生长辅助函数
  const segP = (start: number, end: number) => {
    if (p <= start) return 0;
    if (p >= end) return 1;
    return (p - start) / (end - start);
  };

  const p1 = segP(0.0, 0.40);
  const p2 = segP(0.18, 0.65);
  const p3 = segP(0.40, 0.85);
  const p4 = segP(0.60, 1.0);

  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size + (label ? 22 : 0),
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id={filterId} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={2} seed={31} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={1.8} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        <g filter={`url(#${filterId})`}>
          {name === 'cart' && (
            // 搬家独轮车与包袱
            <>
              {/* 1. 车轮与轮轴 */}
              <circle
                cx={38}
                cy={68}
                r={16}
                fill="none"
                stroke={color}
                strokeWidth={2.4}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p1}
              />
              <circle cx={38} cy={68} r={3} fill={color} opacity={p1} />
              {/* 2. 车架大梁与把手 */}
              <path
                d="M 12 50 L 40 60 L 82 58 M 24 74 L 38 60 L 52 48"
                fill="none"
                stroke={color}
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p2}
              />
              {/* 3. 载货挡板与底托 */}
              <path
                d="M 32 48 L 74 48 L 78 58"
                fill="none"
                stroke={secondaryInkOf(color)}
                strokeWidth={2.0}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p3}
              />
              {/* 4. 堆叠沉甸的包袱与绳扎 */}
              <path
                d="M 38 48 C 34 32 50 24 62 26 C 72 28 76 38 72 48 Z"
                fill="none"
                stroke={accentColor}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p4}
              />
              <path
                d="M 44 26 L 66 48 M 60 25 L 42 48"
                fill="none"
                stroke={accentColor}
                strokeWidth={1.4}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p4}
              />
            </>
          )}

          {name === 'abacus' && (
            // 算盘与铜钱
            <>
              {/* 1. 算盘外框与中隔梁 */}
              <rect
                x={14}
                y={22}
                width={52}
                height={56}
                rx={3}
                fill="none"
                stroke={color}
                strokeWidth={2.4}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p1}
              />
              <line
                x1={14}
                y1={40}
                x2={66}
                y2={40}
                stroke={color}
                strokeWidth={2.2}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p1}
              />
              {/* 2. 四档算盘档竿 */}
              <path
                d="M 24 22 L 24 78 M 35 22 L 35 78 M 45 22 L 45 78 M 56 22 L 56 78"
                fill="none"
                stroke={secondaryInkOf(color)}
                strokeWidth={1.5}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p2}
              />
              {/* 3. 上下一二档算珠 */}
              <path
                d="M 21 34 h 6 M 32 34 h 6 M 42 34 h 6 M 53 34 h 6 M 21 54 h 6 M 32 60 h 6 M 42 54 h 6 M 53 66 h 6"
                fill="none"
                stroke={color}
                strokeWidth={3.2}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p3}
              />
              {/* 4. 右侧开元通宝铜钱 (外圆内方) */}
              <circle
                cx={78}
                cy={62}
                r={15}
                fill="none"
                stroke={accentColor}
                strokeWidth={2.2}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p4}
              />
              <rect
                x={74}
                y={58}
                width={8}
                height={8}
                fill="none"
                stroke={accentColor}
                strokeWidth={1.8}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p4}
              />
            </>
          )}

          {name === 'roofCrack' && (
            // 断裂椽木与掀飞茅草 + 12° 角弧
            <>
              {/* 1. 12° 断裂倾折椽木 */}
              <path
                d="M 12 64 L 46 48 L 48 56 M 46 48 L 86 36"
                fill="none"
                stroke={color}
                strokeWidth={3.0}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p1}
              />
              {/* 2. 椽头断裂毛刺与木栓 */}
              <path
                d="M 44 44 L 47 52 L 51 46"
                fill="none"
                stroke={color}
                strokeWidth={2.0}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p2}
              />
              {/* 3. 被狂风卷起的四道茅草 */}
              <path
                d="M 40 42 C 48 24 64 20 74 16 M 52 38 C 62 26 76 24 88 18 M 34 50 C 44 32 58 30 70 24"
                fill="none"
                stroke={accentColor}
                strokeWidth={1.8}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p3}
              />
              {/* 4. 12° 倾角圆弧与测绘微字 */}
              <path
                d="M 28 60 A 24 24 0 0 1 36 51"
                fill="none"
                stroke={accentColor}
                strokeWidth={1.5}
                strokeDasharray="2 2"
                pathLength={1}
                strokeDashoffset={1 - p4}
              />
              <text
                x={26}
                y={46}
                fill={accentColor}
                fontSize={10}
                fontFamily={MV_FONT_FAMILIES.sans}
                opacity={p4}
              >
                12°
              </text>
            </>
          )}

          {name === 'homeGrid' && (
            // 层叠古建屋脊线框网格
            <>
              {/* 1. 上层飞檐屋脊 */}
              <path
                d="M 24 34 Q 50 24 76 34 M 20 38 Q 50 28 80 38"
                fill="none"
                stroke={accentColor}
                strokeWidth={2.4}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p1}
              />
              {/* 2. 下层双重屋檐 */}
              <path
                d="M 14 54 Q 50 44 86 54 M 10 58 Q 50 48 90 58"
                fill="none"
                stroke={color}
                strokeWidth={2.4}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p2}
              />
              {/* 3. 斗拱立柱网格 */}
              <path
                d="M 28 58 L 28 82 M 50 58 L 50 82 M 72 58 L 72 82 M 20 82 L 80 82"
                fill="none"
                stroke={secondaryInkOf(color)}
                strokeWidth={1.8}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p3}
              />
              {/* 4. 正中微光窗格 */}
              <rect
                x={42}
                y={62}
                width={16}
                height={16}
                fill="none"
                stroke={accentColor}
                strokeWidth={1.5}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p4}
              />
              <path
                d="M 50 62 L 50 78 M 42 70 L 58 70"
                stroke={accentColor}
                strokeWidth={1.0}
                opacity={p4}
              />
            </>
          )}

          {name === 'warmSoup' && (
            // 亮灯窗格 + 一碗热气热汤
            <>
              {/* 1. 暖宣纸窗格底框 */}
              <rect
                x={18}
                y={16}
                width={36}
                height={36}
                rx={2}
                fill="none"
                stroke={secondaryInkOf(color)}
                strokeWidth={1.6}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p1}
              />
              <path
                d="M 36 16 L 36 52 M 18 34 L 54 34"
                stroke={secondaryInkOf(color)}
                strokeWidth={1.2}
                opacity={p1}
              />
              {/* 2. 粗陶热汤圆碗 */}
              <path
                d="M 28 62 C 30 78 70 78 72 62 Z"
                fill="none"
                stroke={color}
                strokeWidth={2.6}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p2}
              />
              <path
                d="M 42 77 L 58 77"
                stroke={color}
                strokeWidth={2.4}
                strokeLinecap="round"
                opacity={p2}
              />
              {/* 3. 汤面水波与木箸 */}
              <path
                d="M 28 62 L 72 62"
                stroke={accentColor}
                strokeWidth={1.8}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p3}
              />
              <line
                x1={24}
                y1={52}
                x2={78}
                y2={60}
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
                opacity={p3}
              />
              {/* 4. 袅袅升腾的三缕热气 */}
              <path
                d="M 40 56 C 36 44 44 38 40 26 M 50 54 C 54 42 46 36 50 22 M 60 56 C 64 44 56 38 60 26"
                fill="none"
                stroke={accentColor}
                strokeWidth={1.8}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p4}
              />
            </>
          )}

          {name === 'keyHole' && (
            // 古铜锁孔与钥匙齿
            <>
              {/* 1. 广锁/横梁锁体 */}
              <path
                d="M 16 38 L 76 38 L 70 68 L 22 68 Z"
                fill="none"
                stroke={color}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p1}
              />
              {/* 2. 锁梁圆环扣 */}
              <path
                d="M 26 38 C 26 22 66 22 66 38"
                fill="none"
                stroke={color}
                strokeWidth={2.2}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p2}
              />
              {/* 3. 古代一字/凹字锁孔 */}
              <path
                d="M 42 48 L 50 48 L 50 60 L 42 60 Z"
                fill="none"
                stroke={accentColor}
                strokeWidth={1.8}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p3}
              />
              {/* 4. 右侧相伴的长铜钥匙与锁齿 */}
              <path
                d="M 76 26 A 6 6 0 1 1 84 32 L 86 68 L 82 72 M 86 52 L 92 52 M 86 60 L 92 60"
                fill="none"
                stroke={accentColor}
                strokeWidth={2.0}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p4}
              />
            </>
          )}

          {name === 'ecgBadge' && (
            // 心电脉冲折线 ───/\╱\───
            <>
              {/* 1. 背景微圆角保护框 */}
              <rect
                x={8}
                y={24}
                width={84}
                height={52}
                rx={6}
                fill="none"
                stroke={secondaryInkOf(color)}
                strokeWidth={1.4}
                strokeDasharray="3 3"
                pathLength={1}
                strokeDashoffset={1 - p1}
              />
              {/* 2. 心电折线跳动 */}
              <path
                d="M 12 50 L 32 50 L 38 50 L 42 34 L 48 68 L 54 22 L 60 62 L 64 48 L 70 50 L 88 50"
                fill="none"
                stroke={accentColor}
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p2}
              />
              {/* 3. 脉冲峰顶光标与基准线 */}
              <circle
                cx={54}
                cy={22}
                r={3}
                fill={accentColor}
                opacity={p3}
              />
              {/* 4. 左下微型红十字护佑印 */}
              <path
                d="M 20 34 h 6 M 23 31 v 6"
                stroke={accentColor}
                strokeWidth={2.0}
                strokeLinecap="round"
                opacity={p4}
              />
            </>
          )}

          {name === 'shoppingCart' && (
            // 购物车推车与清单打勾 ✓
            <>
              {/* 1. 车身网兜框架 */}
              <path
                d="M 24 28 L 74 28 L 66 56 L 34 56 Z"
                fill="none"
                stroke={color}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p1}
              />
              {/* 2. 推手支架与双轮 */}
              <path
                d="M 24 28 L 16 18 M 34 56 L 38 68 L 64 68 L 68 56"
                fill="none"
                stroke={color}
                strokeWidth={2.2}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p2}
              />
              <circle cx={40} cy={74} r={5} fill="none" stroke={color} strokeWidth={2.0} opacity={p2} />
              <circle cx={62} cy={74} r={5} fill="none" stroke={color} strokeWidth={2.0} opacity={p2} />
              {/* 3. 车篮内网格横竖线 */}
              <path
                d="M 28 38 L 70 38 M 31 48 L 67 48 M 44 28 L 42 56 M 56 28 L 54 56"
                fill="none"
                stroke={secondaryInkOf(color)}
                strokeWidth={1.4}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p3}
              />
              {/* 4. 清单对勾标记 ✓ */}
              <path
                d="M 68 20 L 75 28 L 88 12"
                fill="none"
                stroke={accentColor}
                strokeWidth={3.0}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p4}
              />
            </>
          )}

          {name === 'footprint' && (
            // 初生婴儿脚印与长命锁
            <>
              {/* 1. 婴儿肉嘟嘟的小脚板 */}
              <path
                d="M 34 46 C 26 54 28 72 40 76 C 50 78 54 66 50 54 C 47 46 41 42 34 46 Z"
                fill="none"
                stroke={accentColor}
                strokeWidth={2.4}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p1}
              />
              {/* 2. 五枚圆润小脚趾 */}
              <circle cx={28} cy={34} r={3.2} fill={accentColor} opacity={p2} />
              <circle cx={36} cy={30} r={2.8} fill={accentColor} opacity={p2} />
              <circle cx={44} cy={29} r={2.5} fill={accentColor} opacity={p2} />
              <circle cx={51} cy={32} r={2.2} fill={accentColor} opacity={p2} />
              <circle cx={57} cy={36} r={2.0} fill={accentColor} opacity={p2} />
              {/* 3. 如意长命锁祥云轮廓 */}
              <path
                d="M 62 58 C 62 50 72 50 76 54 C 80 50 90 50 90 58 C 90 68 76 74 76 74 C 76 74 62 68 62 58 Z"
                fill="none"
                stroke={color}
                strokeWidth={2.0}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p3}
              />
              {/* 4. 挂锁红绳与小吊坠 */}
              <path
                d="M 66 52 C 68 40 84 40 86 52 M 76 74 L 76 82"
                fill="none"
                stroke={accentColor}
                strokeWidth={1.6}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p4}
              />
              <circle cx={76} cy={84} r={2} fill={accentColor} opacity={p4} />
            </>
          )}

          {name === 'flatbread' && (
            // 唐代胡饼与木箸
            <>
              {/* 1. 圆形烤胡饼盘 */}
              <circle
                cx={48}
                cy={52}
                r={26}
                fill="none"
                stroke={color}
                strokeWidth={2.4}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p1}
              />
              {/* 2. 饼皮微焦圈纹 */}
              <circle
                cx={48}
                cy={52}
                r={16}
                fill="none"
                stroke={secondaryInkOf(color)}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                pathLength={1}
                strokeDashoffset={1 - p2}
              />
              {/* 3. 散落表面的点点胡麻(芝麻)粒 */}
              <path
                d="M 44 46 h 2 M 52 44 h 2 M 40 54 h 2 M 54 56 h 2 M 48 50 h 2"
                stroke={accentColor}
                strokeWidth={2.2}
                strokeLinecap="round"
                opacity={p3}
              />
              {/* 4. 斜搁在饼旁的一双长竹筷 */}
              <path
                d="M 22 24 L 76 78 M 28 18 L 82 72"
                fill="none"
                stroke={accentColor}
                strokeWidth={2.2}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p4}
              />
            </>
          )}
        </g>
      </svg>

      {/* 底部可选说明小字 */}
      {label && (
        <span
          style={{
            fontFamily: MV_FONT_FAMILIES.serif,
            fontSize: 13,
            color,
            letterSpacing: 2,
            marginTop: 4,
            opacity: clamp01((p - 0.5) / 0.5),
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

function secondaryInkOf(color: string): string {
  if (color.startsWith('#')) {
    return `${color}88`;
  }
  return 'rgba(70, 58, 48, 0.65)';
}

/**
 * 3. InkCallout:
 * 原画真实锚点 from 处画随 pulse 呼吸的同心靶点，折线经 elbow 延伸至 to；
 * 前 45% progress 画线，后 55% 展开末端宣纸签卡片（左侧 3px 朱砂/暖金边线，主/副标题，可选 icon）。
 */
export function InkCallout({
  from,
  elbow,
  to,
  progress,
  label,
  sublabel,
  color = '#c84b31',
  align = 'left',
  pulse = 0,
  dark = false,
  icon,
}: {
  from: [number, number];
  elbow?: [number, number];
  to: [number, number];
  progress: number;
  label: string;
  sublabel?: string;
  color?: string;
  align?: 'left' | 'right';
  pulse?: number;
  dark?: boolean;
  icon?: SketchIconName;
}) {
  const p = clamp01(progress);
  if (p <= 0.001) return null;

  const [fx, fy] = from;
  const [tx, ty] = to;

  // 若未指定 elbow，默认取两点间的直角转折点
  const [ex, ey] = elbow ?? [tx, fy];

  // 折线路径
  const pathD = `M ${fx} ${fy} L ${ex} ${ey} L ${tx} ${ty}`;

  // 45% 前画线，45% 后展开卡片
  const lineP = clamp01(p / 0.45);
  const cardP = clamp01((p - 0.45) / 0.55);

  const textColor = dark ? '#f5ead8' : '#211d19';
  const subtextColor = dark ? '#c4b5a0' : '#6b5e52';
  const cardBg = dark ? 'rgba(28, 22, 17, 0.90)' : 'rgba(248, 244, 236, 0.92)';
  const borderColor = dark ? 'rgba(255, 230, 190, 0.18)' : 'rgba(60, 45, 30, 0.16)';

  // 卡片弹入位移
  const cardTranslateX = (align === 'right' ? 12 : -12) * (1 - cardP);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true">
      {/* 1. 真实锚点：中心实心点 + 随 progress 缓慢扩散后安静定格的极细水波纹圆环 (0 抽搐) */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0 }}
      >
        <g>
          {/* 水波纹圆环：随 progress 缓慢扩散后安静定格 */}
          <circle
            cx={fx}
            cy={fy}
            r={5 + 5 * lineP}
            fill="none"
            stroke={color}
            strokeWidth={1.2}
            opacity={0.35 + 0.45 * lineP}
          />
          {/* 中心稳固圆点 */}
          <circle cx={fx} cy={fy} r={2.5} fill={color} />
        </g>
      </svg>

      {/* 2. 折线引线生长 */}
      <InkPathDraw
        d={pathD}
        progress={lineP}
        color={color}
        width={2.0}
        showTip={false}
      />

      {/* 3. 终点宣纸签卡片 */}
      {cardP > 0.01 && (
        <div
          style={{
            position: 'absolute',
            left: align === 'right' ? undefined : tx,
            right: align === 'right' ? 1920 - tx : undefined,
            top: ty - 22,
            opacity: cardP,
            transform: `translateX(${cardTranslateX}px)`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            backgroundColor: cardBg,
            border: `1px solid ${borderColor}`,
            borderLeft: align === 'left' ? `3px solid ${color}` : undefined,
            borderRight: align === 'right' ? `3px solid ${color}` : undefined,
            borderRadius: 3,
            padding: '8px 16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.16)',
            backdropFilter: 'blur(3px)',
          }}
        >
          {/* 可选配图简笔画图标 */}
          {icon && (
            <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
              <InkSketchIcon
                name={icon}
                x={20}
                y={20}
                size={40}
                progress={cardP}
                color={textColor}
                accentColor={color}
                pulse={pulse}
              />
            </div>
          )}

          <div>
            <div
              style={{
                fontFamily: MV_FONT_FAMILIES.serif,
                fontSize: 18,
                fontWeight: 600,
                color: textColor,
                letterSpacing: 1.5,
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </div>
            {sublabel && (
              <div
                style={{
                  fontFamily: MV_FONT_FAMILIES.serif,
                  fontSize: 13,
                  color: subtextColor,
                  letterSpacing: 1,
                  marginTop: 2,
                  whiteSpace: 'nowrap',
                }}
              >
                {sublabel}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 4. InkChatBubble:
 * 古籍朱丝批注笺 / 宣纸半透题跋气泡。
 * 调小字号与卡片体量（16.5px / 360px），柔焦墨迹温和浮现并提前定格（留足 60% 静止阅读时间，0 闪烁光标）。
 */
export function InkChatBubble({
  x,
  y,
  width = 360,
  speaker,
  text,
  hesitateText,
  progress,
  mode = 'typewriter',
  align = 'left',
  dark = false,
  accentColor = '#c84b31',
  anchorFrom,
}: {
  x: number;
  y: number;
  width?: number;
  speaker?: string;
  text: string;
  hesitateText?: string;
  progress: number;
  mode?: 'typewriter' | 'hesitate' | 'stamp';
  align?: 'left' | 'right';
  dark?: boolean;
  accentColor?: string;
  anchorFrom?: [number, number];
}) {
  const p = clamp01(progress);
  if (p <= 0.001) return null;

  const actualWidth = Math.max(width, 415);

  const bg = dark ? 'rgba(24, 19, 15, 0.88)' : 'rgba(248, 244, 234, 0.92)';
  const textColor = dark ? '#f5ead8' : '#211d19';
  const borderColor = dark ? 'rgba(255, 230, 190, 0.22)' : 'rgba(60, 45, 30, 0.18)';
  const innerRuleColor = dark ? 'rgba(255, 220, 180, 0.14)' : 'rgba(154, 48, 40, 0.18)';

  const finalChars = useMemo(() => Array.from(text), [text]);
  const hesitateChars = useMemo(() => Array.from(hesitateText ?? ''), [hesitateText]);

  // 犹豫划线进度：在 p = 0.08 ~ 0.18 之间平稳画上朱砂删除线
  const strikeProgress = clamp01((p - 0.08) / 0.10);

  // 弹窗展开过渡
  const cardScale = mode === 'stamp' ? 1 + 0.12 * (1 - p) : 1;
  const cardOpacity = clamp01(p * 4.0);

  // 引线计算：从 anchorFrom 连接到卡片最近侧边缘
  const anchorD = useMemo(() => {
    if (!anchorFrom) return null;
    const [ax, ay] = anchorFrom;
    const targetX = ax < x ? x : ax > x + actualWidth ? x + actualWidth : x + actualWidth / 2;
    const targetY = ay < y ? y : y + 30;
    return `M ${ax} ${ay} Q ${(ax + targetX) / 2} ${ay - 14} ${targetX} ${targetY}`;
  }, [anchorFrom, x, y, actualWidth]);

  return (
    <>
      {/* 1. 若有真实锚点，先画手绘引线 */}
      {anchorD && (
        <InkPathDraw
          d={anchorD}
          progress={clamp01(p * 2.5)}
          color={accentColor}
          width={1.5}
          dashed
        />
      )}

      {/* 2. 主对话框容器 (精致小巧体量，自适应宽度) */}
      <div
        style={{
          position: 'absolute',
          left: align === 'right' ? x - actualWidth : x,
          top: y,
          width: actualWidth,
          opacity: cardOpacity,
          transform: `scale(${cardScale})`,
          transformOrigin: align === 'right' ? 'top right' : 'top left',
          backgroundColor: bg,
          border: `1px solid ${borderColor}`,
          borderRadius: 4,
          padding: '10px 14px 11px 14px',
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.22)',
          backdropFilter: 'blur(5px)',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        {/* 四角微装饰 (Ancient corner brackets) */}
        <div style={{ position: 'absolute', left: 4, top: 4, width: 6, height: 6, borderLeft: `1.5px solid ${accentColor}`, borderTop: `1.5px solid ${accentColor}` }} />
        <div style={{ position: 'absolute', right: 4, top: 4, width: 6, height: 6, borderRight: `1.5px solid ${accentColor}`, borderTop: `1.5px solid ${accentColor}` }} />
        <div style={{ position: 'absolute', left: 4, bottom: 4, width: 6, height: 6, borderLeft: `1.5px solid ${accentColor}`, borderBottom: `1.5px solid ${accentColor}` }} />
        <div style={{ position: 'absolute', right: 4, bottom: 4, width: 6, height: 6, borderRight: `1.5px solid ${accentColor}`, borderBottom: `1.5px solid ${accentColor}` }} />

        {/* 顶部说话者朱砂方印标签 (12px 精致印签) */}
        {speaker && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span
              style={{
                fontFamily: MV_FONT_FAMILIES.serif,
                fontSize: 12,
                fontWeight: 600,
                color: '#fff',
                backgroundColor: accentColor,
                padding: '1px 6px',
                borderRadius: 2,
                letterSpacing: 1.2,
              }}
            >
              {speaker}
            </span>
            <div
              style={{
                flex: 1,
                height: 1,
                backgroundColor: innerRuleColor,
              }}
            />
          </div>
        )}

        {/* 犹豫暂缓文字 (14.5px，p: 0 ~ 0.18 显示并画上朱砂删除线，无闪烁光标) */}
        {mode === 'hesitate' && hesitateText && (
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              fontFamily: MV_FONT_FAMILIES.serif,
              fontSize: 14.5,
              color: dark ? '#a89886' : '#8a7d70',
              lineHeight: 1.45,
              letterSpacing: 1.2,
              marginBottom: 4,
            }}
          >
            {hesitateChars.map((char, i) => {
              const hesP = clamp01(p / 0.08);
              const hesOffset = hesP * (hesitateChars.length + 1) - i;
              const hesOpacity = clamp01(hesOffset / 1.5);
              if (hesOpacity <= 0) return null;
              return (
                <span key={i} style={{ opacity: hesOpacity }}>
                  {char}
                </span>
              );
            })}
            {/* 犹豫朱砂横线划掉 */}
            {strikeProgress > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '52%',
                  width: `${strikeProgress * 100}%`,
                  height: 1.8,
                  backgroundColor: accentColor,
                  borderRadius: 1,
                }}
              />
            )}
          </div>
        )}

        {/* 正文文字区 (16.5px，柔焦墨迹浮现，0~0.40 浮现完毕，0.40~1.0 稳稳当当完全定格，无机械闪烁光标) */}
        <div
          style={{
            fontFamily: MV_FONT_FAMILIES.serif,
            fontSize: 16.5,
            color: textColor,
            lineHeight: 1.45,
            letterSpacing: 0.8,
            minHeight: 24,
            display: 'block',
            lineBreak: 'strict',
            wordBreak: 'keep-all',
          }}
        >
          {finalChars.map((char, i) => {
            let charP = 1;
            if (mode === 'typewriter') {
              // 0 ~ 0.40 内温和浮现完毕，后 60% 时间整句稳稳定格
              const textP = clamp01(p / 0.40);
              const charOffset = textP * (finalChars.length + 1) - i;
              charP = clamp01(charOffset / 1.5);
            } else if (mode === 'hesitate') {
              // 0 ~ 0.18 犹豫并划线；0.18 ~ 0.42 浮现完最终 text；0.42 ~ 1.0 完全静止定格
              if (p < 0.18) {
                charP = 0;
              } else {
                const finalP = clamp01((p - 0.18) / 0.24);
                const charOffset = finalP * (finalChars.length + 1) - i;
                charP = clamp01(charOffset / 1.5);
              }
            } else {
              charP = 1;
            }

            if (charP <= 0) return null;
            return (
              <span key={i} style={{ opacity: charP }}>
                {char}
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
}
