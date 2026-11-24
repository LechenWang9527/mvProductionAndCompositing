import React from 'react';
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { EASE, bezier, ramp, softShadow } from '../vendor/shotcraft/Polish';
import { LOOKS, Stage, TextReveal, alpha } from '../vendor/shotcraft/Look';

/** Song-time boundaries for the Dufu sequence. The component's local frame 0
 * is song time 30s when placed in a Sequence. Pass absolute `globalTime` only
 * when rendering it directly in the full composition. */
export const DUFU_V2_CUES = {
  start: 30,
  end: 74.3,
  moving: [30, 33.065],
  rent: [33.065, 36.904],
  thatch: [36.904, 40.993],
  manyHomes: [40.993, 43.015],
  home: [43.015, 45.636],
  lock: [45.636, 48.25],
  badge: [48.25, 51.93],
  bill: [51.93, 60.053],
  birthAndPetition: [60.053, 64.27],
  midnightMeal: [64.27, 67.41],
  recap: [67.41, 74.3],
} as const;

type Props = { globalTime?: number };
type PhaseKey = 'moving' | 'rent' | 'thatch' | 'manyHomes' | 'home' | 'lock' | 'badge' | 'bill' | 'birthAndPetition' | 'midnightMeal' | 'recap';
type Phase = { key: PhaseKey; from: number; to: number };
type PhaseContext = { frame: number; fps: number; t: number; origin: number; textStart: (localSeconds: number) => number };

const W = 1920;
const H = 1080;
const SAFE_Y = 760;
const INK = '#30251a';
const RED = '#a8402c';
const BASE_EASE = bezier(0.24, 0.92, 0.24, 1);
const TURN_EASE = bezier(0.42, 0, 0.24, 1);
const SEAM = 0.18;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const r = (n: number) => Number.isFinite(n) ? Number(n.toFixed(2)) : 0;

const PHASES: Phase[] = [
  { key: 'moving', from: 0, to: 3.065 },
  { key: 'rent', from: 3.065, to: 6.904 },
  { key: 'thatch', from: 6.904, to: 10.993 },
  { key: 'manyHomes', from: 10.993, to: 13.015 },
  { key: 'home', from: 13.015, to: 15.636 },
  { key: 'lock', from: 15.636, to: 18.25 },
  { key: 'badge', from: 18.25, to: 21.93 },
  { key: 'bill', from: 21.93, to: 30.053 },
  { key: 'birthAndPetition', from: 30.053, to: 34.27 },
  { key: 'midnightMeal', from: 34.27, to: 37.41 },
  { key: 'recap', from: 37.41, to: 44.3 },
];

const cue = (ctx: PhaseContext, at: number, duration: number, ease = EASE.out) =>
  ramp(ctx.frame, (at + ctx.origin) * ctx.fps, duration * ctx.fps, ease);

const phaseOpacity = (t: number, phase: Phase, isFirst: boolean) => {
  const fadeIn = isFirst
    ? EASE.out(clamp01(t / SEAM))
    : EASE.out(clamp01((t - (phase.from - SEAM)) / SEAM));
  const fadeOut = 1 - EASE.out(clamp01((t - (phase.to - SEAM)) / SEAM));
  return Math.min(fadeIn, fadeOut);
};

const fit = (width: number, height: number) => {
  const scale = Math.min(width / W, height / H);
  return { scale, width: width / scale, height: height / scale };
};

const paperPanel: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(248,242,228,.97), rgba(231,221,200,.97))',
  border: '1px solid rgba(83,62,36,.30)',
  boxShadow: softShadow(9, { color: '#2a1d10', strength: 0.95 }),
};

const AssetImage: React.FC<{
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fitMode?: 'cover' | 'contain';
  objectPosition?: string;
  filter?: string;
  opacity?: number;
  style?: React.CSSProperties;
}> = ({ src, left, top, width, height, fitMode = 'contain', objectPosition = '50% 50%', filter, opacity = 1, style }) => (
  <div style={{ position: 'absolute', left, top, width, height, overflow: 'hidden', opacity, ...style }}>
    <Img src={staticFile(`assets/${src}`)} style={{ display: 'block', width: '100%', height: '100%', objectFit: fitMode, objectPosition, filter }} />
  </div>
);

const PersonCutout: React.FC<{ left: number; top: number; width: number; height: number; opacity?: number; style?: React.CSSProperties }> = ({ left, top, width, height, opacity = 1, style }) => (
  <>
    <div style={{ position: 'absolute', left: left + width * 0.18, top: top + height - 18, width: width * 0.66, height: 23, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(49,34,18,.24), transparent 72%)', opacity }} />
    <AssetImage
      src="dufu_reference_v2.png" left={left} top={top} width={width} height={height}
      filter="grayscale(1) sepia(.35) drop-shadow(0 8px 12px rgba(39,25,12,.18))"
      opacity={opacity} style={style}
    />
  </>
);

const PhaseTitle: React.FC<{ title: string; ctx: PhaseContext; at: number; left?: number; width?: number }> = ({ title, ctx, at, left = 110, width = 760 }) => {
  const p = cue(ctx, at, 0.42, BASE_EASE);
  return (
    <div style={{ position: 'absolute', left, top: 70, width, opacity: p, transform: `translateY(${r((1 - p) * 12)}px)` }}>
      <div style={{ color: INK, fontFamily: '"Songti SC", "Noto Serif SC", serif', fontSize: 36, fontWeight: 700, letterSpacing: '0.04em' }}>{title}</div>
    </div>
  );
};

function MovingResidence({ ctx }: { ctx: PhaseContext }) {
  const cues = [0.22, 1.06, 2.02];
  const count = cues.filter((s) => ctx.t >= s).length;
  const records = [
    { title: '住处档案 01', verb: '迁入记录' },
    { title: '住处档案 02', verb: '再次搬迁' },
    { title: '住处档案 03', verb: '新住处' },
  ];
  return (
    <>
      <PhaseTitle title="搬迁" ctx={ctx} at={0.08} />
      <PersonCutout left={84} top={172} width={380} height={520} opacity={cue(ctx, 0.1, 0.52, BASE_EASE)} />
      <div style={{ position: 'absolute', left: 432, top: 330, width: 250, height: 2, background: 'linear-gradient(90deg, transparent, rgba(168,64,44,.58))' }} />
      <div style={{ position: 'absolute', left: 670, top: 322, width: 14, height: 14, borderRadius: '50%', background: RED, boxShadow: '0 0 0 7px rgba(168,64,44,.12)' }} />
      {records.map((record, i) => {
        const p = cue(ctx, cues[i], 0.42, BASE_EASE);
        if (p <= 0.001) return null;
        const age = Math.max(0, count - 1 - i);
        const pushedAway = i === 0 && count >= 3 ? cue(ctx, 2.55, 0.42, EASE.exit) : 0;
        if (pushedAway >= 0.999) return null;
        let press = 0;
        for (let j = i + 1; j < cues.length; j++) {
          const delta = ctx.frame - (cues[j] + ctx.origin) * ctx.fps;
          if (delta < 0) continue;
          const springBack = spring({ frame: delta, fps: ctx.fps, config: { damping: 17, stiffness: 185, mass: 0.9 } });
          press = Math.max(press, 9 * (1 - springBack) * Math.exp(-delta / 7));
        }
        const x = 704 - age * 136 - pushedAway * 210;
        const y = 188 + age * 45 + press;
        const settled = p > 0.99;
        const current = i === count - 1;
        const cardOpacity = p * (1 - pushedAway);
        return (
          <div key={record.title} style={{
            position: 'absolute', left: x, top: y + (1 - p) * -210, width: 1050, height: 326,
            boxSizing: 'border-box', padding: '30px 38px', clipPath: 'polygon(0.6% 0,99.6% 0.5%,100% 99.4%,0 100%)',
            ...paperPanel, zIndex: i + 1, opacity: cardOpacity,
            transform: `rotate(${r((i % 2 ? -1 : 1) * (1 - p) * 1.4)}deg) scale(${r(0.985 + p * 0.015)})`, transformOrigin: '50% 100%',
            boxShadow: settled ? softShadow(3, { color: '#2a1d10', strength: 0.75 }) : softShadow(18, { color: '#2a1d10', strength: 1.05 }),
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid rgba(83,62,36,.22)', paddingBottom: 19 }}>
              <div style={{ width: 4, height: 35, background: current ? RED : '#887353' }} />
              <div style={{ color: INK, fontSize: 30, fontWeight: 700 }}>{record.title}</div>
              <div style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 18, color: current ? '#315d4e' : '#77664f', background: current ? 'rgba(90,127,102,.12)' : 'rgba(90,70,42,.08)', fontSize: 21, fontWeight: 650 }}>
                {current ? '当前住处' : '已迁出'}
              </div>
            </div>
            <div style={{ marginTop: 34, color: '#6f5e46', fontSize: 23, letterSpacing: '0.08em' }}>{record.verb}</div>
            <div style={{ marginTop: 20, width: 550, height: 2, background: 'linear-gradient(90deg, rgba(168,64,44,.55), rgba(168,64,44,0))' }} />
            <div style={{ marginTop: 19, color: '#88775e', fontSize: 22 }}>迁入 → 搬离 → 再迁入</div>
          </div>
        );
      })}
    </>
  );
}

function RentArchive({ ctx }: { ctx: PhaseContext }) {
  const opened = cue(ctx, 3.25, 0.68, BASE_EASE);
  const oldOut = cue(ctx, 4.58, 0.42, TURN_EASE);
  const newIn = cue(ctx, 4.96, 0.54, BASE_EASE);
  return (
    <>
      <PersonCutout left={54} top={190} width={340} height={500} opacity={0.96} />
      <AssetImage src="changan_ink_v2.png" left={390} top={74} width={1450} height={624} fitMode="cover" objectPosition="50% 42%" style={{ clipPath: 'polygon(0.3% 1%,99.8% 0,100% 99.7%,0 100%)', boxShadow: softShadow(7, { color: '#2a1d10', strength: 0.7 }) }} />
      <PhaseTitle title="长安" ctx={ctx} at={3.08} left={450} width={900} />
      <div style={{
        position: 'absolute', left: 870, top: 344 + (1 - opened) * 35, width: 770, height: 304,
        boxSizing: 'border-box', padding: '23px 28px', opacity: opened, transform: `scale(${r(0.97 + opened * 0.03)})`, transformOrigin: 'left top',
        ...paperPanel,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 15, borderBottom: '1px solid rgba(83,62,36,.25)' }}>
          <span style={{ color: INK, fontSize: 30, fontWeight: 720 }}>租住记录</span>
          <span style={{ color: '#88775e', fontSize: 21 }}>档案更新</span>
        </div>
        <div style={{ position: 'absolute', left: 28, right: 28, top: 88, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#87765e', fontSize: 20 }}>
          <span>项目</span><span>记录状态</span>
        </div>
        <div style={{ position: 'absolute', left: 28, right: 28, top: 123, height: 65, padding: '0 17px', display: 'flex', alignItems: 'center', gap: 16, boxSizing: 'border-box', opacity: 1 - oldOut, background: 'rgba(107,91,65,.06)', border: '1px solid rgba(83,62,36,.12)', borderRadius: 10 }}>
          <span style={{ color: INK, fontSize: 25, fontWeight: 620, flex: 1 }}>原租金条目</span>
          <span style={{ color: '#88775e', fontSize: 22 }}>旧记录</span>
          <span style={{ color: '#88775e', fontSize: 24, textDecoration: oldOut > 0.45 ? 'line-through' : 'none' }}>原额</span>
          <span style={{ color: RED, fontSize: 24, opacity: oldOut }}>撤换</span>
        </div>
        <div style={{ position: 'absolute', left: 28, right: 28, top: 205, height: 65, padding: '0 17px', display: 'flex', alignItems: 'center', gap: 16, boxSizing: 'border-box', opacity: newIn, background: 'rgba(168,64,44,.07)', border: `1px solid ${alpha(RED, 0.25)}`, borderRadius: 10, transform: `translateY(${r((1 - newIn) * 12)}px)` }}>
          <span style={{ color: INK, fontSize: 25, fontWeight: 700, flex: 1 }}>调整后租金</span>
          <div style={{ width: 220, height: 8, borderRadius: 8, background: 'rgba(93,75,48,.15)', overflow: 'hidden' }}><div style={{ width: `${r(72 * newIn)}%`, height: '100%', background: RED }} /></div>
          <span style={{ color: RED, fontSize: 22, fontWeight: 720 }}>↑ 较前上调</span>
        </div>
      </div>
    </>
  );
}

function ThatchWind({ ctx }: { ctx: PhaseContext }) {
  const box = { left: 118, top: 86, width: 1684, height: 648 };
  const windIn = cue(ctx, 7.76, 0.5, BASE_EASE);
  const windOut = 1 - cue(ctx, 10.55, 0.42, BASE_EASE);
  const wind = windIn * windOut;
  const time = Math.max(0, ctx.t - 7.76);
  const baseFrequencyX = 0.011 + 0.0016 * Math.sin(time * 0.78);
  const baseFrequencyY = 0.024 + 0.0022 * Math.sin(time * 0.72 + 0.7);
  const displacement = r(wind * (8 + 3.2 * Math.sin(time * 1.05) ** 2));
  return (
    <>
      <AssetImage src="hut_ink_v2.png" {...box} fitMode="cover" objectPosition="50% 0%" />
      <PhaseTitle title="茅屋" ctx={ctx} at={6.95} />
      <svg
        viewBox="0 0 1684 648"
        width={box.width}
        height={box.height}
        aria-hidden="true"
        style={{ position: 'absolute', left: box.left, top: box.top, overflow: 'visible', pointerEvents: 'none' }}
      >
        <defs>
          <filter id="dufu-roof-gust" x="-3%" y="-3%" width="106%" height="106%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`${baseFrequencyX.toFixed(5)} ${baseFrequencyY.toFixed(5)}`}
              numOctaves="2"
              seed="11"
              result="windNoise"
            />
            <feDisplacementMap in="SourceGraphic" in2="windNoise" scale={displacement} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="dufu-roof-mask-feather" filterUnits="userSpaceOnUse" x="105" y="5" width="1480" height="480">
            <feGaussianBlur stdDeviation="11" />
          </filter>
          <mask id="dufu-roof-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1684" height="648">
            <rect x="0" y="0" width="1684" height="648" fill="black" />
            <path
              d="M150 398 C202 356 245 284 319 244 C400 199 500 177 571 135 C636 97 694 75 760 61 C827 48 902 49 966 66 C1037 49 1102 70 1164 90 C1266 123 1348 178 1418 245 C1468 300 1504 350 1542 401 C1535 425 1516 438 1483 426 C1425 404 1374 371 1313 343 C1247 312 1184 282 1117 270 C1043 257 981 266 911 259 C838 252 766 263 698 286 C625 310 565 339 488 367 C396 401 314 437 235 433 C195 431 167 419 150 398 Z"
              fill="white"
              filter="url(#dufu-roof-mask-feather)"
            />
          </mask>
        </defs>
        <image
          href={staticFile('assets/hut_ink_v2.png')}
          x="0"
          y="0"
          width="1684"
          height="648"
          preserveAspectRatio="xMidYMin slice"
          filter="url(#dufu-roof-gust)"
          mask="url(#dufu-roof-mask)"
          opacity={wind}
        />
      </svg>
    </>
  );
}

const HOME_LIGHTS = [
  { x: 12, y: 10, row: 0 }, { x: 29, y: 13, row: 0 }, { x: 48, y: 10, row: 0 }, { x: 68, y: 15, row: 0 }, { x: 87, y: 12, row: 0 },
  { x: 19, y: 34, row: 1 }, { x: 39, y: 31, row: 1 }, { x: 60, y: 35, row: 1 }, { x: 80, y: 33, row: 1 },
  { x: 10, y: 56, row: 2 }, { x: 31, y: 53, row: 2 }, { x: 51, y: 57, row: 2 }, { x: 72, y: 53, row: 2 }, { x: 91, y: 56, row: 2 },
];

function ManyHomes({ ctx }: { ctx: PhaseContext }) {
  const box = { left: 95, top: 76, width: 1730, height: 660 };
  const rowStarts = [11.12, 11.48, 11.84];
  return (
    <>
      <AssetImage src="many_homes_v2.png" {...box} fitMode="cover" objectPosition="50% 55%" />
      <PhaseTitle title="安身之所" ctx={ctx} at={11.04} />
      {HOME_LIGHTS.map((light, i) => {
        const orderInRow = HOME_LIGHTS.slice(0, i).filter((item) => item.row === light.row).length;
        const start = rowStarts[light.row] + orderInRow * 0.09;
        const on = cue(ctx, start, 0.28, BASE_EASE);
        return <div key={i} style={{
          position: 'absolute', left: box.left + box.width * light.x / 100 - 38,
          top: box.top + box.height * light.y / 100 - 24, width: 76, height: 48,
          borderRadius: '50%', opacity: on * 0.86,
          background: 'radial-gradient(ellipse, rgba(244,190,94,.65) 0%, rgba(236,166,72,.22) 35%, transparent 74%)',
          filter: 'blur(2px)', mixBlendMode: 'screen',
        }} />;
      })}
      {[0, 1, 2].map((row) => {
        const p = cue(ctx, rowStarts[row], 0.56, EASE.out);
        return <div key={row} style={{ position: 'absolute', left: 95, right: 95, top: 76 + 24 + row * 145, height: 80, opacity: p * 0.11, background: 'linear-gradient(90deg,transparent,rgba(220,155,62,.55),transparent)', clipPath: 'inset(0 0 0 0)', mixBlendMode: 'screen' }} />;
      })}
    </>
  );
}

function OneHome({ ctx }: { ctx: PhaseContext }) {
  const reveal = cue(ctx, 13.08, 0.78, BASE_EASE);
  const light = cue(ctx, 14.28, 0.46, EASE.out);
  const box = { left: 228, top: 80, width: 1464, height: 644 };
  return (
    <>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: SAFE_Y, background: 'linear-gradient(110deg,#e5d6bc,#f4ead4 45%,#ddd0b8)', opacity: 0.48 }} />
      <AssetImage src="shelter_ink_v2.png" {...box} fitMode="contain" opacity={reveal} />
      <PhaseTitle title="家" ctx={ctx} at={13.04} />
      {/* Local window illumination; the house itself is the supplied illustration. */}
      <div style={{ position: 'absolute', left: 1188, top: 354, width: 184, height: 110, borderRadius: 34, opacity: light * 0.42, background: 'radial-gradient(ellipse, rgba(255,215,128,.9), rgba(255,196,95,.25) 48%, transparent 76%)', filter: 'blur(15px)', mixBlendMode: 'screen' }} />
      <div style={{ position: 'absolute', left: 1250, top: 382, width: 72, height: 52, background: 'rgba(255,214,128,.34)', opacity: light * 0.54, boxShadow: `0 0 28px ${alpha('#f4bc55', 0.52 * light)}`, clipPath: 'polygon(7% 2%,95% 0,100% 98%,0 100%)' }} />
    </>
  );
}

function KeyAndLock({ ctx }: { ctx: PhaseContext }) {
  const focus = cue(ctx, 15.78, 0.54, BASE_EASE);
  const turn = cue(ctx, 16.75, 0.58, TURN_EASE);
  const box = { left: 138, top: 70, width: 1644, height: 665 };
  return (
    <>
      <AssetImage src="key_lock_v2.png" {...box} fitMode="cover" objectPosition="50% 46%" />
      <PhaseTitle title="门锁" ctx={ctx} at={15.68} />
      {/* Spotlight targets the real keyhole in the supplied hand/key/lock image. */}
      <div style={{ position: 'absolute', left: 1380, top: 296, width: 146, height: 146, borderRadius: '50%', border: `2px solid ${alpha(RED, 0.68 * focus)}`, boxShadow: `0 0 0 11px ${alpha(RED, 0.09 * focus)}, 0 0 34px ${alpha('#e6a346', 0.42 * focus)}`, opacity: focus, transform: `rotate(${r(22 * turn)}deg) scale(${r(0.84 + 0.16 * focus)})`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 1368, top: 284, width: 170, height: 170, borderRadius: '50%', background: `radial-gradient(circle, ${alpha('#ffe2a5', 0.26 * turn)} 0%, transparent 72%)`, opacity: turn, pointerEvents: 'none' }} />
    </>
  );
}

function WorkerBadge({ ctx }: { ctx: PhaseContext }) {
  const enter = cue(ctx, 18.34, 0.72, BASE_EASE);
  const settle = cue(ctx, 19.22, 0.35, EASE.out);
  const swing = ctx.t < 19.22 ? 0 : Math.sin((ctx.t - 19.22) * Math.PI * 1.35) * (1 - cue(ctx, 19.22, 1.3, EASE.out));
  const box = { left: 310, top: 54, width: 1300, height: 690 };
  const badgeClip = 'polygon(43% 64%,58% 64%,60% 87%,41% 87%)';
  return (
    <>
      <AssetImage src="worker_badge_v2.png" {...box} fitMode="contain" opacity={enter} />
      <PhaseTitle title="工牌" ctx={ctx} at={18.30} />
      {/* Only the chest badge crop receives a restrained swing; the person stays still. */}
      <div style={{ position: 'absolute', ...box, clipPath: badgeClip, opacity: enter * (0.92 + 0.08 * settle), transform: `rotate(${r(swing * 1.6)}deg)`, transformOrigin: '50% 64%' }}>
        <Img src={staticFile('assets/worker_badge_v2.png')} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
      </div>
      <div style={{ position: 'absolute', left: 1315, top: 440, padding: '10px 16px', borderLeft: `3px solid ${RED}`, color: INK, fontSize: 23, background: 'rgba(244,235,215,.82)', opacity: settle }}>工牌随身</div>
    </>
  );
}

const BILL_LINES = [
  { label: '记录 01', amount: '6800', at: 22.38 },
  { label: '记录 02', amount: '2400', at: 23.25 },
  { label: '记录 03', amount: '1200', at: 24.14 },
];

function BillRows({ ctx, compact = false }: { ctx: PhaseContext; compact?: boolean }) {
  const rowW = compact ? 242 : 850;
  const rowH = compact ? 36 : 62;
  const startY = compact ? 56 : 165;
  const step = compact ? 41 : 74;
  return (
    <>
      {BILL_LINES.map((line, i) => {
        const p = cue(ctx, line.at, 0.38, BASE_EASE);
        if (p <= 0.001) return null;
        return (
          <div key={line.label} style={{
            position: 'absolute', left: compact ? 16 : 42, top: startY + i * step, width: rowW, height: rowH,
            display: 'flex', alignItems: 'center', gap: compact ? 6 : 18, padding: compact ? '0 9px' : '0 20px', boxSizing: 'border-box',
            opacity: p, transform: `translateX(${r((1 - p) * -28)}px)`,
            borderBottom: `1px solid ${compact ? 'rgba(83,62,36,.20)' : 'rgba(83,62,36,.22)'}`,
            color: INK,
          }}>
            <span style={{ flex: 1, fontSize: compact ? 13 : 24, color: '#66583f' }}>{line.label}</span>
            <span style={{ fontFamily: 'ui-monospace, "SFMono-Regular", Consolas, monospace', fontSize: compact ? 17 : 35, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              <TextReveal text={line.amount} start={ctx.textStart(line.at)} each={compact ? 0.3 : 2.2} gap={compact ? 0.2 : 0.7} variant="rise" ease={BASE_EASE} />
            </span>
          </div>
        );
      })}
    </>
  );
}

function BillScene({ ctx }: { ctx: PhaseContext }) {
  const total = cue(ctx, 25.12, 0.62, BASE_EASE);
  const paid = cue(ctx, 26.92, 0.52, TURN_EASE);
  const zero = cue(ctx, 28.26, 0.56, BASE_EASE);
  return (
    <>
      <div style={{ position: 'absolute', left: 255, top: 78, width: 1410, height: 650, boxSizing: 'border-box', padding: '34px 44px', ...paperPanel }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid rgba(83,62,36,.28)', paddingBottom: 18 }}>
          <div>
            <div style={{ color: INK, fontFamily: '"Songti SC", "Noto Serif SC", serif', fontSize: 39, fontWeight: 740 }}>支出账单</div>
            <div style={{ marginTop: 7, color: '#806e53', fontSize: 21 }}>金额示意</div>
          </div>
          <div style={{ color: '#8b795e', fontSize: 20, letterSpacing: '0.08em' }}>账页记录</div>
        </div>
        <div style={{ position: 'absolute', left: 44, right: 44, top: 127, height: 28, display: 'flex', alignItems: 'center', color: '#8b795e', fontSize: 20 }}>
          <span style={{ flex: 1 }}>记录项目</span><span>金额</span>
        </div>
        <BillRows ctx={ctx} />
        <div style={{ position: 'absolute', left: 44, right: 44, top: 407, height: 74, borderTop: '2px solid rgba(83,62,36,.28)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: total, transform: `translateY(${r((1 - total) * 16)}px)` }}>
          <span style={{ color: INK, fontSize: 28, fontWeight: 700 }}>合计</span>
          <span style={{ color: INK, fontFamily: 'ui-monospace, "SFMono-Regular", Consolas, monospace', fontSize: 43, fontWeight: 760 }}>10400</span>
        </div>
        <div style={{ position: 'absolute', left: 44, right: 44, top: 492, height: 62, display: 'flex', alignItems: 'center', gap: 18, opacity: paid }}>
          <span style={{ color: '#716049', fontSize: 23 }}>付款状态</span>
          <div style={{ width: 220, height: 1, background: 'rgba(83,62,36,.35)' }} />
          <span style={{ color: '#315d4e', fontSize: 28, fontWeight: 730, border: '1px solid rgba(49,93,78,.42)', padding: '7px 18px', transform: `rotate(${r((1 - paid) * -4)}deg)` }}>已付款</span>
        </div>
        <div style={{ position: 'absolute', right: 48, bottom: 21, display: 'flex', alignItems: 'baseline', gap: 17, opacity: zero, transform: `translateY(${r((1 - zero) * 16)}px)` }}>
          <span style={{ color: '#716049', fontSize: 22 }}>自己</span>
          <span style={{ color: RED, fontFamily: 'ui-monospace, "SFMono-Regular", Consolas, monospace', fontSize: 46, fontWeight: 780 }}>0</span>
        </div>
      </div>
    </>
  );
}

function BirthAndPetition({ ctx }: { ctx: PhaseContext }) {
  const birth = cue(ctx, 30.12, 0.64, BASE_EASE);
  const petition = cue(ctx, 31.617, 0.72, BASE_EASE);
  const link = cue(ctx, 31.42, 0.9, TURN_EASE);
  return (
    <>
      <div style={{ position: 'absolute', left: 87, top: 105, width: 814, height: 536, ...paperPanel, opacity: birth }}>
        <AssetImage src="cradle_ink_v2.png" left={16} top={14} width={782} height={420} fitMode="contain" />
        <div style={{ position: 'absolute', left: 30, right: 30, bottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(83,62,36,.22)', paddingTop: 15 }}>
          <span style={{ color: INK, fontSize: 27, fontWeight: 700 }}>孩子出生</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 1019, top: 105, width: 814, height: 536, ...paperPanel, opacity: petition, transform: `translateY(${r((1 - petition) * 24)}px)` }}>
        <AssetImage src="dufu_petition_v2.png" left={16} top={14} width={782} height={420} fitMode="contain" />
        <div style={{ position: 'absolute', left: 30, right: 30, bottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(83,62,36,.22)', paddingTop: 15 }}>
          <span style={{ color: INK, fontSize: 27, fontWeight: 700 }}>长安求助</span><span style={{ color: '#8b6642', fontSize: 22, opacity: petition }}>递交中</span>
        </div>
      </div>
      <svg width={W} height={SAFE_Y} viewBox={`0 0 ${W} ${SAFE_Y}`} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
        <path d="M300 682 H1610" fill="none" stroke="rgba(105,82,47,.24)" strokeWidth="4" strokeLinecap="round" />
        <path d={`M300 682 H${r(300 + 1310 * link)}`} fill="none" stroke={RED} strokeWidth="3" strokeLinecap="round" />
        <circle cx={r(300 + 1310 * link)} cy="682" r="8" fill="#f2d196" stroke={RED} strokeWidth="2" />
      </svg>
    </>
  );
}

function MidnightMeal({ ctx }: { ctx: PhaseContext }) {
  const mealIn = cue(ctx, 34.36, 0.56, BASE_EASE);
  const move = cue(ctx, 34.55, 2.18, TURN_EASE);
  const steamStart = 34.62;
  return (
    <>
      <PhaseTitle title="深夜" ctx={ctx} at={34.31} />
      <AssetImage src="noodle_ink_v2.png" left={800} top={88} width={980} height={528} fitMode="contain" opacity={mealIn} />
      <svg width={W} height={SAFE_Y} viewBox={`0 0 ${W} ${SAFE_Y}`} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
        {[0, 1, 2].map((i) => {
          const lift = cue(ctx, steamStart + i * 0.27, 1.15, EASE.out);
          return <path key={i} d={`M${r(1280 + i * 36)} ${r(240 - lift * 52)} C${r(1240 + i * 35)} ${r(210 - lift * 52)} ${r(1320 + i * 34)} ${r(184 - lift * 52)} ${r(1280 + i * 34)} ${r(154 - lift * 52)}`} fill="none" stroke={alpha('#a85630', 0.44 * lift)} strokeWidth={3.2 - i * 0.35} strokeLinecap="round" />;
        })}
      </svg>
      <div style={{ position: 'absolute', left: 176, top: 605, width: 1568, height: 72 }}>
        <div style={{ position: 'absolute', left: 70, right: 70, top: 24, height: 3, borderRadius: 3, background: 'rgba(83,62,36,.23)' }} />
        <div style={{ position: 'absolute', left: 70, top: 23, width: `${r(1418 * move)}px`, height: 5, borderRadius: 4, background: RED }} />
        {[
          { x: 70, label: '深夜' }, { x: 780, label: '凌晨 1' }, { x: 1488, label: '02:00' },
        ].map((tick, i) => (
          <div key={tick.label} style={{ position: 'absolute', left: tick.x, top: 9, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, color: i === 2 && move > 0.94 ? RED : '#7a694f', fontSize: 22, fontWeight: i === 2 && move > 0.94 ? 760 : 560 }}>
            <span style={{ width: i === 1 ? 10 : 13, height: i === 1 ? 10 : 13, borderRadius: '50%', background: i === 2 && move > 0.94 ? RED : '#e6d6b9', border: `2px solid ${i === 2 && move > 0.94 ? RED : '#927752'}`, transform: i === 2 ? `translateX(${r(-1418 * (1 - move))}px)` : undefined }} />
            <span>{tick.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

const RECAP_CARDS = [
  { label: '搬家', src: 'dufu_reference_v2.png', filter: 'grayscale(1) sepia(.35)', fitMode: 'contain' as const },
  { label: '租住', src: 'changan_ink_v2.png', filter: undefined, fitMode: 'cover' as const },
  { label: '屋漏', src: 'hut_ink_v2.png', filter: undefined, fitMode: 'cover' as const },
  { label: '付账', src: '', filter: undefined, fitMode: 'contain' as const },
  { label: '深夜', src: 'noodle_ink_v2.png', filter: undefined, fitMode: 'cover' as const },
];

function BillThumbnail({ ctx }: { ctx: PhaseContext }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#f7f0e2,#e7ddc8)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 10, top: 8, color: INK, fontSize: 15, fontWeight: 730 }}>支出账单</div>
      <BillRows ctx={ctx} compact />
      <div style={{ position: 'absolute', left: 16, top: 191, right: 16, paddingTop: 5, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(83,62,36,.3)', color: INK, fontSize: 16, fontWeight: 730 }}><span>合计</span><span>10400</span></div>
      <div style={{ position: 'absolute', right: 16, bottom: 5, color: RED, fontSize: 15, fontWeight: 750 }}>自己 0</div>
    </div>
  );
}

function Recap({ ctx }: { ctx: PhaseContext }) {
  const cues = [37.56, 38.58, 39.60, 40.62, 41.64];
  const axis = cue(ctx, 37.52, 0.45, BASE_EASE);
  return (
    <>
      <div style={{ position: 'absolute', left: 120, top: 646, width: 1680, height: 3, background: 'rgba(83,62,36,.25)', opacity: axis }} />
      <div style={{ position: 'absolute', left: 120, top: 645, width: `${r(1680 * cue(ctx, 37.52, 5.62, TURN_EASE))}px`, height: 5, background: RED, borderRadius: 5, opacity: axis }} />
      {RECAP_CARDS.map((card, i) => {
        const enter = cue(ctx, cues[i], 0.52, EASE.out);
        let press = 0;
        for (let j = i + 1; j < cues.length; j++) {
          const delta = ctx.frame - (cues[j] + ctx.origin) * ctx.fps;
          if (delta <= 0) continue;
          const returnT = spring({ frame: delta, fps: ctx.fps, config: { damping: 20, stiffness: 190 } });
          press = Math.max(press, (1 - returnT) * Math.exp(-delta / 8) * 7);
        }
        const left = 118 + i * 340;
        const top = 174 + press;
        return (
          <div key={card.label} style={{
            position: 'absolute', left, top: top + (1 - enter) * 34, width: 300, height: 438,
            boxSizing: 'border-box', padding: 12, clipPath: 'polygon(0.5% 0,99.8% .5%,100% 99.5%,0 100%)',
            ...paperPanel, opacity: enter, zIndex: i + 1,
            transform: `rotate(${r((i % 2 ? -1 : 1) * (1 - enter) * 1.3)}deg) scale(${r(0.97 + 0.03 * enter)})`, transformOrigin: '50% 100%',
          }}>
            <div style={{ position: 'relative', width: '100%', height: 320, overflow: 'hidden', background: '#e8ddc8', border: '1px solid rgba(83,62,36,.18)' }}>
              {card.src ? (
                <Img src={staticFile(`assets/${card.src}`)} style={{ width: '100%', height: '100%', display: 'block', objectFit: card.fitMode, objectPosition: '50% 40%', filter: card.filter }} />
              ) : <BillThumbnail ctx={ctx} />}
            </div>
            <div style={{ position: 'absolute', left: 19, bottom: 25, display: 'flex', alignItems: 'center', gap: 10, color: INK }}>
              <span style={{ width: 4, height: 26, background: RED }} /><span style={{ fontFamily: '"Songti SC", "Noto Serif SC", serif', fontSize: 27, fontWeight: 720 }}>{card.label}</span>
            </div>
            <div style={{ position: 'absolute', left: 148, bottom: -20, width: 1, height: 21, background: 'rgba(168,64,44,.52)' }} />
            <div style={{ position: 'absolute', left: 143, bottom: -27, width: 11, height: 11, borderRadius: '50%', background: RED, boxShadow: '0 0 0 5px rgba(168,64,44,.1)' }} />
          </div>
        );
      })}
    </>
  );
}

function renderPhase(key: PhaseKey, ctx: PhaseContext): React.ReactNode {
  switch (key) {
    case 'moving': return <MovingResidence ctx={ctx} />;
    case 'rent': return <RentArchive ctx={ctx} />;
    case 'thatch': return <ThatchWind ctx={ctx} />;
    case 'manyHomes': return <ManyHomes ctx={ctx} />;
    case 'home': return <OneHome ctx={ctx} />;
    case 'lock': return <KeyAndLock ctx={ctx} />;
    case 'badge': return <WorkerBadge ctx={ctx} />;
    case 'bill': return <BillScene ctx={ctx} />;
    case 'birthAndPetition': return <BirthAndPetition ctx={ctx} />;
    case 'midnightMeal': return <MidnightMeal ctx={ctx} />;
    case 'recap': return <Recap ctx={ctx} />;
  }
}

/** Dufu's linked life-process sequence, song-time 30.000–74.300s.
 * All transitions and statuses derive solely from the current frame/time. */
export const DufuProcess: React.FC<Props> = ({ globalTime }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = globalTime === undefined ? frame / fps : globalTime - DUFU_V2_CUES.start;
  const origin = globalTime === undefined ? 0 : DUFU_V2_CUES.start;
  const frameFit = fit(width, height);
  const ctx: PhaseContext = {
    frame,
    fps,
    t,
    origin,
    textStart: (localSeconds: number) => (localSeconds + origin) * fps,
  };
  const active = PHASES.map((phase, i) => ({
    phase,
    alpha: phaseOpacity(t, phase, i === 0),
  })).filter(({ phase, alpha: opacity }) => opacity > 0.001 && t >= phase.from - (phase.from === 0 ? 0 : SEAM) && t <= phase.to);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#e8ddc8', fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif' }}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: frameFit.width, height: frameFit.height, transform: `translate(-50%,-50%) scale(${frameFit.scale})`, transformOrigin: 'center center', overflow: 'hidden' }}>
        <Stage look={LOOKS.paper} keyLight={{ x: 0.48, y: 0.06 }} fill={{ x: 0.84, y: 0.9 }} intensity={0.43} grain={0.026} vignette={0.11} />
        <div style={{ position: 'absolute', left: 78, top: 46, width: 1764, height: 704, clipPath: 'polygon(.2% .3%,99.8% 0,100% 99.7%,0 100%)', background: 'linear-gradient(180deg,rgba(246,239,222,.28),rgba(215,200,170,.14))', boxShadow: softShadow(8, { color: '#2a1d10', strength: 0.32 }) }} />
        {active.map(({ phase, alpha: opacity }) => (
          <div key={phase.key} style={{ position: 'absolute', inset: 0, opacity, overflow: 'hidden' }}>
            {renderPhase(phase.key, ctx)}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
