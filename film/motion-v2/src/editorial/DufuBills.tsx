import React, { useId, useMemo, type CSSProperties } from 'react';
import { AbsoluteFill } from 'remotion';
import { BrushRule } from '../visual/EditorialStage';
import { MV_FONT_FAMILIES } from '../visual/Fonts';
import { EASE, Grain, Vignette } from '../vendor/shotcraft/Polish';
import type { AudioSample, DufuPalette } from './transitions';
import { InkSketchIcon, InkChatBubble } from './InkSketchPrimitives';

export type DufuBillsProps = {
  time: number;
  start?: number; // 51.93s
  end?: number;   // 60.053s
  audioSample?: AudioSample;
  palette?: DufuPalette;
  style?: CSSProperties;
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * 严格对齐 og_timing.json 第 20 句歌词：“房贷 学费 爸妈的体检单”
 */
const BILL_ITEMS = [
  {
    index: '一',
    title: '房贷',
    subtitle: '长安租屋·月供重压',
    amount: 6800,
    startTime: 52.05,
    duration: 1.1,
    accentKey: 'accent' as const,
    iconName: 'homeGrid' as const,
  },
  {
    index: '二',
    title: '学费',
    subtitle: '稚子开蒙·束脩笔墨',
    amount: 2400,
    startTime: 53.4,
    duration: 1.0,
    accentKey: 'ink' as const,
    iconName: 'abacus' as const,
  },
  {
    index: '三',
    title: '爸妈体检单',
    subtitle: '高堂安康·医药问诊',
    amount: 1200,
    startTime: 54.7,
    duration: 0.9,
    accentKey: 'secondaryInk' as const,
    iconName: 'ecgBadge' as const,
  },
];

const TOTAL_AMOUNT = 10400;

/**
 * Ancient code-drawn Cinnabar White-Character Seal (朱砂白文方印)
 */
function CinnabarSeal({
  time,
  stampTime = 56.45,
  text = '已付',
  color = '#9b2d23',
  borderColor = '#751e16',
  textColor = '#f8f6f0',
}: {
  time: number;
  stampTime?: number;
  text?: string;
  color?: string;
  borderColor?: string;
  textColor?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const filterId = `sealRough-${uid}`;

  const progress = clamp01((time - stampTime) / 0.32);
  if (progress <= 0) return null;

  // Elastic overshoot on stamping
  const scale = 1 + 0.38 * (1 - EASE.overshoot(progress));
  const opacity = clamp01(progress * 2.5);

  return (
    <div
      style={{
        position: 'absolute',
        left: 1020,
        top: 540,
        transform: `scale(${scale}) rotate(-5deg)`,
        transformOrigin: 'center center',
        opacity,
        pointerEvents: 'none',
      }}
    >
      <svg width={104} height={104} viewBox="0 0 104 104" aria-hidden="true">
        <defs>
          <filter id={filterId} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" seed="88" result="sealNoise" />
            <feDisplacementMap in="SourceGraphic" in2="sealNoise" scale={2.4} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        <g filter={`url(#${filterId})`}>
          {/* Cinnabar red stamp base with slight edge bleed */}
          <rect
            x={5}
            y={5}
            width={94}
            height={94}
            rx={5}
            fill={color}
            stroke={borderColor}
            strokeWidth={3}
          />

          {/* Inner hairline frame */}
          <rect
            x={10}
            y={10}
            width={84}
            height={84}
            fill="none"
            stroke={textColor}
            strokeWidth={1.5}
            opacity={0.88}
          />

          {/* White characters in relief */}
          <text
            x={52}
            y={66}
            textAnchor="middle"
            fill={textColor}
            fontFamily={MV_FONT_FAMILIES.serif}
            fontSize={42}
            fontWeight={700}
            letterSpacing={6}
          >
            {text}
          </text>
        </g>
      </svg>
    </div>
  );
}

/**
 * <DufuBills>: Ancient Chinese Red-Grid Ledger (朱丝栏账簿)
 * Covers 51.93s ~ 60.053s:
 * - Xuan paper with red vertical columns (朱丝竖栏) + calligraphy dividers
 * - 3 staggered ledger entries: 房贷 (6,800) / 学费 (2,400) / 爸妈体检单 (1,200)
 * - Rolling numbers & proportion bar growth (F1 图表生长)
 * - 10,400 total settlement drop with EASE.overshoot + Cinnabar "已付" white-character seal
 * - 57.24s vignette spotlight convergence onto "自己 0" (giant cinnabar 0 with beatPulse tremor)
 * - Fully reactive to passed-in palette (paper, ink, secondaryInk, accent, vignette, vignetteStrength)
 */
export function DufuBills({
  time,
  start = 51.93,
  end = 60.053,
  audioSample,
  palette,
  style,
}: DufuBillsProps) {
  const serif = MV_FONT_FAMILIES.serif;
  const sans = MV_FONT_FAMILIES.sans;

  const paperColor = palette?.paper ?? '#f8f6f0';
  const inkColor = palette?.ink ?? '#211d19';
  const secondaryInkColor = palette?.secondaryInk ?? '#615950';
  const cinnabarColor = palette?.accent ?? '#9a3028';
  const vignetteColor = palette?.vignette ?? '#1c1814';
  const baseVignetteStrength = palette?.vignetteStrength ?? 0.28;
  const beatPulse = audioSample?.beatPulse ?? 0;

  // Staggered entry progress
  const introP = clamp01((time - start) / 0.55);

  // 10,400 total settlement
  const totalDropP = clamp01((time - 55.95) / 0.45);
  const totalDropEased = EASE.overshoot(totalDropP);

  // 57.24s convergence onto "自己 0"
  const selfP = clamp01((time - 57.24) / 0.72);
  const selfEased = EASE.out(selfP);

  // 53.0s 提前启动账目总览气泡 (时长 0.8s，留足 6 秒从容静止阅读)
  const cartBubbleP = clamp01((time - 53.0) / 0.8);

  // 56.0s 提前启动独白犹豫气泡 (时长 0.8s，留足 4 秒从容静止阅读)
  const monologueP = clamp01((time - 56.0) / 0.8);

  // Spotlight contraction at 57.24s
  const vignetteStrength = baseVignetteStrength + 0.44 * selfEased;
  const vignetteInner = 0.48 - 0.28 * selfEased;

  // Giant 0 固定 scale(1)，彻底去除抽搐抖动
  const zeroPulse = 1;

  // Red grid lines (朱丝竖栏)
  const redGridCols = useMemo(() => {
    const cols: number[] = [];
    for (let x = 440; x <= 1520; x += 120) {
      cols.push(x);
    }
    return cols;
  }, []);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: paperColor,
        overflow: 'hidden',
        color: inkColor,
        ...style,
      }}
    >
      {/* 1. Ancient Red Grid Lines (朱丝栏) */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        {/* Top & bottom framing red borders */}
        <line x1={420} y1={90} x2={1540} y2={90} stroke={cinnabarColor} strokeWidth={1.8} opacity={0.35 * introP} />
        <line x1={420} y1={98} x2={1540} y2={98} stroke={cinnabarColor} strokeWidth={0.8} opacity={0.25 * introP} />
        <line x1={420} y1={760} x2={1540} y2={760} stroke={cinnabarColor} strokeWidth={1.8} opacity={0.35 * introP} />
        <line x1={420} y1={752} x2={1540} y2={752} stroke={cinnabarColor} strokeWidth={0.8} opacity={0.25 * introP} />

        {/* Vertical red columns */}
        {redGridCols.map((x) => (
          <line
            key={x}
            x1={x}
            y1={98}
            x2={x}
            y2={752}
            stroke={cinnabarColor}
            strokeWidth={0.8}
            opacity={0.18 * introP}
          />
        ))}
      </svg>

      {/* 2. Header & Book Meta */}
      <div
        style={{
          position: 'absolute',
          left: 450,
          top: 112,
          display: 'flex',
          alignItems: 'baseline',
          gap: 16,
          opacity: introP,
        }}
      >
        <span style={{ fontFamily: serif, fontSize: 32, fontWeight: 600, color: inkColor, letterSpacing: 2 }}>
          支出细目
        </span>
        <span style={{ fontFamily: serif, fontSize: 22, color: secondaryInkColor, letterSpacing: 1 }}>
          草堂岁用实录
        </span>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 460,
          top: 104,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          opacity: introP * 0.9,
        }}
      >
        <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
          <InkSketchIcon
            name="shoppingCart"
            x={22}
            y={22}
            size={44}
            progress={introP}
            color={inkColor}
            accentColor={cinnabarColor}
            pulse={beatPulse}
          />
        </div>
        <span
          style={{
            fontFamily: sans,
            fontSize: 20,
            color: secondaryInkColor,
            letterSpacing: 1.5,
          }}
        >
          示意金额 · 单位（文）
        </span>
      </div>

      {/* Primary brush rule under header */}
      <BrushRule
        x={450}
        y={156}
        width={1020}
        progress={introP}
        thickness={2.2}
        color={inkColor}
        opacity={0.65}
      />

      {/* 3. Three Staggered Ledger Rows (F1 图表生长) */}
      <div style={{ position: 'absolute', left: 450, top: 182, width: 1020 }}>
        {BILL_ITEMS.map((item) => {
          const rawP = clamp01((time - item.startTime) / item.duration);
          const easedP = EASE.out(rawP);
          const currentVal = Math.round(item.amount * easedP);
          const ratio = item.amount / TOTAL_AMOUNT;
          const maxBarWidth = 260;
          const barWidth = maxBarWidth * ratio * easedP;
          const rowOpacity = clamp01((time - item.startTime) / 0.35);
          const rowY = 16 * (1 - rowOpacity);

          const barColor =
            item.accentKey === 'accent'
              ? cinnabarColor
              : item.accentKey === 'ink'
              ? inkColor
              : secondaryInkColor;

          return (
            <div
              key={item.index}
              style={{
                position: 'relative',
                height: 112,
                borderBottom: `1px solid ${secondaryInkColor}24`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: rowOpacity,
                transform: `translateY(${rowY}px)`,
              }}
            >
              {/* Left Column: Number index & description & hand-drawn icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: 350 }}>
                <span style={{ fontFamily: serif, fontSize: 26, color: secondaryInkColor, width: 28, flexShrink: 0 }}>
                  {item.index}
                </span>
                <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                  <InkSketchIcon
                    name={item.iconName}
                    x={0}
                    y={0}
                    size={44}
                    progress={rawP}
                    color={barColor}
                    accentColor={cinnabarColor}
                    pulse={beatPulse}
                  />
                </div>
                <div>
                  <div style={{ fontFamily: serif, fontSize: 28, color: inkColor, letterSpacing: 2 }}>
                    {item.title}
                  </div>
                  <div style={{ fontFamily: serif, fontSize: 18, color: secondaryInkColor, marginTop: 4 }}>
                    {item.subtitle}
                  </div>
                </div>
              </div>

              {/* Middle: Synchronous Proportion Bar Growth */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: 340 }}>
                <div
                  style={{
                    width: maxBarWidth,
                    height: 12,
                    backgroundColor: `${secondaryInkColor}18`,
                    borderRadius: 6,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: barWidth,
                      height: '100%',
                      backgroundColor: barColor,
                      borderRadius: 6,
                      transition: 'width 0.05s ease-out',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: sans,
                    fontSize: 18,
                    color: secondaryInkColor,
                    fontVariantNumeric: 'tabular-nums',
                    width: 48,
                  }}
                >
                  {Math.round(ratio * 100 * easedP)}%
                </span>
              </div>

              {/* Right: Rolling Numbers */}
              <div
                style={{
                  fontFamily: serif,
                  fontSize: 56,
                  fontWeight: 600,
                  color: inkColor,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: 2,
                  textAlign: 'right',
                  width: 260,
                }}
              >
                {currentVal.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Total Row: 10,400 with EASE.overshoot settlement */}
      <div
        style={{
          position: 'absolute',
          left: 450,
          top: 546,
          width: 1020,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          opacity: totalDropP,
          transform: `translateY(${(-24 * (1 - totalDropEased)).toFixed(1)}px)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
          <span style={{ fontFamily: serif, fontSize: 32, fontWeight: 600, color: inkColor, letterSpacing: 3 }}>
            合计
          </span>
          <span style={{ fontFamily: serif, fontSize: 22, color: secondaryInkColor }}>
            壹万零肆佰整
          </span>
        </div>

        <div
          style={{
            fontFamily: serif,
            fontSize: 74,
            fontWeight: 700,
            color: inkColor,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: 3,
          }}
        >
          {TOTAL_AMOUNT.toLocaleString()}
        </div>
      </div>

      {/* Cinnabar "已付" Stamp */}
      <CinnabarSeal
        time={time}
        stampTime={56.45}
        text="已付"
        color={cinnabarColor}
        textColor={paperColor}
      />

      {/* 5. 57.24s Convergence: "自己 0" with beatPulse tremor */}
      <div
        style={{
          position: 'absolute',
          left: 450,
          top: 642,
          width: 1020,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: selfEased,
          transform: `translateY(${18 * (1 - selfEased)}px)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
          <span
            style={{
              fontFamily: serif,
              fontSize: 34,
              fontWeight: 600,
              color: secondaryInkColor,
              letterSpacing: 2,
            }}
          >
            结存 · 自己
          </span>
          <span style={{ fontFamily: serif, fontSize: 20, color: secondaryInkColor, opacity: 0.85 }}>
            囊空如洗 · 独登高台
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 16,
            transform: 'scale(1)',
            transformOrigin: 'right center',
            filter: 'drop-shadow(0 0 18px rgba(154, 48, 40, 0.35))',
          }}
        >
          <span style={{ fontFamily: serif, fontSize: 28, color: cinnabarColor, letterSpacing: 2 }}>
            文
          </span>
          <span
            style={{
              fontFamily: serif,
              fontSize: 88,
              fontWeight: 700,
              color: cinnabarColor,
              letterSpacing: 4,
              lineHeight: 1,
            }}
          >
            0
          </span>
        </div>
      </div>

      {/* 6. 53.0s 账目总览批注笺 (精简文案 + 宽度 320 + 提前定格) */}
      {cartBubbleP > 0.001 && (
        <InkChatBubble
          x={60}
          y={240}
          width={320}
          speaker="账目总览"
          text="房贷、学费、体检单，俸禄尽入此单。"
          progress={cartBubbleP}
          mode="typewriter"
          accentColor={cinnabarColor}
          anchorFrom={[450, 290]}
        />
      )}

      {/* 7. 56.0s 底部“结存·自己 0 文”左侧留白安全区独白框 (精简文案 + 宽度 320 + 提前定格) */}
      {monologueP > 0.001 && (
        <InkChatBubble
          x={60}
          y={500}
          width={320}
          speaker="心中盘算"
          mode="hesitate"
          hesitateText="添件冬衣？"
          text="先紧着家里用吧。"
          progress={monologueP}
          accentColor={cinnabarColor}
          anchorFrom={[450, 665]}
        />
      )}

      {/* 6. Dynamic Vignette spotlight focusing inward during "自己 0" */}
      <Vignette
        strength={vignetteStrength}
        inner={vignetteInner}
        color={vignetteColor}
        cx={0.52}
        cy={0.56}
      />

      {/* Xuan paper grain texture */}
      <Grain opacity={0.06} blend="multiply" />
    </AbsoluteFill>
  );
}
