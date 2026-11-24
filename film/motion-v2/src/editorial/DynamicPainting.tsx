import React, { useId, useMemo, type CSSProperties, type ReactNode } from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useVideoConfig } from 'remotion';
import { InkReveal } from '../visual/InkReveal';
import { EASE, Grain, Vignette } from '../vendor/shotcraft/Polish';
import { Sheen } from '../vendor/shotcraft/Look';
import clips from '../../public/data/editorial_clips.json';
import type { AudioSample, DufuPalette } from './transitions';

export type CameraPreset = 'still' | 'in' | 'out' | 'left' | 'right' | 'panUp' | 'panDown';
export type VfxPreset = 'none' | 'dust' | 'rainWind' | 'inkBloom' | 'windowWarmth' | 'metalPendulum';

export type DynamicPaintingProps = {
  name: string;
  time: number;
  start: number;
  end: number;
  camera?: CameraPreset;
  opacity?: number;
  style?: CSSProperties;
  children?: ReactNode;
  reveal?: boolean;
  vfxPreset?: VfxPreset;
  audioSample?: AudioSample;
  palette?: DufuPalette;
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const hash = (n: number) => {
  const x = Math.sin(n * 91.345 + 47.853) * 43758.5453;
  return x - Math.floor(x);
};

const DEFAULT_PALETTE: DufuPalette = {
  name: 'default',
  bg: '#f8f6f0',
  paper: '#f8f6f0',
  ink: '#211d19',
  secondaryInk: '#615950',
  accent: '#9a3028',
  glow: '#e8b87a',
  vignette: '#211d19',
  rain: 'rgba(33, 29, 25, 0.45)',
  vignetteStrength: 0.28,
  darkRatio: 0,
};

/** Deterministic floating ink/candlelight dust particles + M30 东方意境 28° 斜向丁达尔暖光束 */
function DustOverlay({
  time,
  color,
  count = 42,
}: {
  time: number;
  color: string;
  count?: number;
}) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const z = hash(i * 19.3 + 7);
      const baseSize = 2 + z * z * 8;
      const seedX = hash(i * 31.7 + 13);
      const seedY = hash(i * 47.1 + 29);
      // 粒子速度放慢到原来的 1/3 (speed = 5 + z * 8)
      const speed = 5 + z * 8;
      return { id: i, z, baseSize, seedX, seedY, speed };
    });
  }, [count]);

  // 丁达尔暖光束极慢呼吸 (绝不闪烁)
  const rayBreath = 0.18 + 0.03 * Math.sin(time * 0.5);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* 两道柔和的 28° 斜向丁达尔暖光束 (Volumetric Light Rays) */}
      <div
        style={{
          position: 'absolute',
          top: -300,
          left: 200,
          width: 280,
          height: 1800,
          transform: 'rotate(-28deg)',
          transformOrigin: 'top left',
          background: `linear-gradient(180deg, rgba(240, 215, 175, ${rayBreath * 1.2}) 0%, rgba(240, 215, 175, ${rayBreath * 0.6}) 40%, transparent 85%)`,
          filter: 'blur(32px)',
          mixBlendMode: 'screen',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -240,
          left: 780,
          width: 360,
          height: 1900,
          transform: 'rotate(-28deg)',
          transformOrigin: 'top left',
          background: `linear-gradient(180deg, rgba(240, 215, 175, ${rayBreath}) 0%, rgba(240, 215, 175, ${rayBreath * 0.4}) 45%, transparent 90%)`,
          filter: 'blur(40px)',
          mixBlendMode: 'screen',
        }}
      />

      {/* 慢速漂浮光尘微粒 */}
      {particles.map((p) => {
        const x = (((p.seedX * 2020 + time * p.speed) % 2020) + 2020) % 2020 - 50;
        const driftY = Math.sin(time * 0.4 + p.id * 1.5) * 16;
        const y = (((p.seedY * 1180 - time * p.speed * 0.3 + driftY) % 1180) + 1180) % 1180 - 50;
        const twinkle = 0.6 + 0.4 * Math.sin(time * 1.2 + p.id * 2.1);
        const alpha = twinkle * (0.18 + p.z * 0.55);

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: p.baseSize,
              height: p.baseSize,
              borderRadius: '50%',
              backgroundColor: color,
              opacity: alpha,
              filter: p.z > 0.6 ? `blur(${((p.z - 0.6) * 4).toFixed(1)}px)` : undefined,
              mixBlendMode: 'screen',
            }}
          />
        );
      })}
    </div>
  );
}

/** Rain effect for 茅屋秋风: 恒定静谧斜向雨丝 + 2 层缓慢横向流淌的水墨烟云薄雾带 (Drifting Ink Mist) */
function RainWindOverlay({
  time,
  high = 0,
  bass = 0,
  rainColor = 'rgba(33, 29, 25, 0.42)',
}: {
  time: number;
  high?: number;
  bass?: number;
  rainColor?: string;
}) {
  // 90 deterministic rain streaks across 3 depth tiers
  const streaks = useMemo(() => {
    return Array.from({ length: 90 }, (_, i) => {
      const tier = i % 3; // 0: far, 1: mid, 2: near
      const seedX = hash(i * 17.3 + 9);
      const seedY = hash(i * 29.5 + 41);
      const length = tier === 0 ? 35 : tier === 1 ? 55 : 85;
      const width = tier === 0 ? 0.9 : tier === 1 ? 1.5 : 2.4;
      const speed = tier === 0 ? 680 : tier === 1 ? 920 : 1250;
      const alpha = tier === 0 ? 0.22 : tier === 1 ? 0.45 : 0.75;
      return { id: i, tier, seedX, seedY, length, width, speed, alpha };
    });
  }, []);

  // 2 层缓慢横向流淌的水墨烟云薄雾带 (Drifting Ink Mist)
  const mist1Offset = (((time * 24) % 2400) + 2400) % 2400 - 400;
  const mist2Offset = (((-time * 16) % 2400) + 2400) % 2400 - 400;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* 1. 恒定安静雨丝 (无瞬移、无动态湍流扰动) */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0, display: 'block' }}
        aria-hidden="true"
      >
        <g>
          {streaks.map((s) => {
            const x = (((s.seedX * 2200 - time * s.speed * 0.38) % 2200) + 2200) % 2200 - 150;
            const y = (((s.seedY * 1300 + time * s.speed) % 1300) + 1300) % 1300 - 150;
            const dx = -s.length * 0.36; // -20 degree slant
            const dy = s.length * 0.93;

            return (
              <line
                key={s.id}
                x1={x}
                y1={y}
                x2={x + dx}
                y2={y + dy}
                stroke={rainColor}
                strokeWidth={s.width}
                strokeLinecap="round"
                opacity={s.alpha}
              />
            );
          })}
        </g>
      </svg>

      {/* 2. 水墨烟云薄雾带 1 (Drifting Ink Mist 1: 柔和横向流动) */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: mist1Offset,
          width: 1600,
          height: 380,
          background: 'radial-gradient(ellipse 65% 50% at 50% 50%, rgba(33, 29, 25, 0.14) 0%, rgba(33, 29, 25, 0.06) 50%, transparent 80%)',
          filter: 'blur(36px)',
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
      />

      {/* 3. 水墨烟云薄雾带 2 (Drifting Ink Mist 2: 偏低层慢速流动) */}
      <div
        style={{
          position: 'absolute',
          top: '55%',
          left: mist2Offset,
          width: 1800,
          height: 420,
          background: 'radial-gradient(ellipse 70% 45% at 50% 50%, rgba(45, 38, 32, 0.12) 0%, rgba(33, 29, 25, 0.04) 55%, transparent 85%)',
          filter: 'blur(42px)',
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

/** Ink bloom effect (C1 水墨晕开): 阻尼渐进宣纸水墨晕开，0 抽搐 0 抖动 */
function InkBloomOverlay({
  progress,
  beatPulse = 0,
  inkColor = '#211d19',
}: {
  progress: number;
  beatPulse?: number;
  inkColor?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const filterId = `inkBloomFilter-${uid}`;
  const p = clamp01(progress);

  // 参考 C1 水墨晕开：宣纸四角与画面多团淡墨安静缓慢晕开
  const blooms = useMemo(() => [
    { cx: 960, cy: 540, maxR: 520, delay: 0 },
    { cx: 320, cy: 260, maxR: 420, delay: 0.1 },
    { cx: 1600, cy: 300, maxR: 440, delay: 0.18 },
    { cx: 280, cy: 820, maxR: 380, delay: 0.28 },
    { cx: 1640, cy: 800, maxR: 400, delay: 0.36 },
  ], []);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'multiply' }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="17" result="inkTurb" />
            <feDisplacementMap in="SourceGraphic" in2="inkTurb" scale={26} xChannelSelector="R" yChannelSelector="G" result="blot" />
            <feGaussianBlur in="blot" stdDeviation="8" />
          </filter>
        </defs>
        <g filter={`url(#${filterId})`}>
          {blooms.map((b, idx) => {
            const bloomP = clamp01((p - b.delay) / (1 - b.delay));
            if (bloomP <= 0) return null;
            // 采用 1 - Math.exp(-progress * 2.2) 阻尼渐开，绝不抖动
            const dampedP = 1 - Math.exp(-bloomP * 2.2);
            const r = b.maxR * dampedP;
            const alpha = 0.13 * (1 - bloomP * 0.35);
            return (
              <circle
                key={idx}
                cx={b.cx}
                cy={b.cy}
                r={r}
                fill={inkColor}
                opacity={alpha}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}

/** Window warmth effect (D1 雨窗 + M30 东方意境): 静谧细雨 + 屋檐暖光 + 柔和光斑 */
function WindowWarmthOverlay({
  time,
  start,
  end,
  bass = 0,
  glowColor = '#e8944f',
}: {
  time: number;
  start: number;
  end: number;
  bass?: number;
  glowColor?: string;
}) {
  const progress = clamp01((time - start) / Math.max(0.1, end - start));
  const breath = 1 + 0.04 * Math.sin(time * 1.2);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* Exterior subtle rain streaks (静谧恒速) */}
      <RainWindOverlay time={time} high={0} bass={0} rainColor="rgba(45, 40, 34, 0.22)" />

      {/* Eaves warm breathing lamp glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 48% 44% at 62% 46%, ${glowColor} 0%, rgba(232, 148, 79, 0.16) 48%, transparent 75%)`,
          opacity: 0.28 * breath,
          mixBlendMode: 'screen',
        }}
      />

      {/* Subtle sweeping light across the window */}
      <Sheen progress={progress} color="#fff2db" strength={0.28} width={0.25} angle={15} />
    </div>
  );
}

/** Metal badge / lock highlight effect: soft radial badge spotlight + metallic sheen sweep */
function MetalPendulumOverlay({
  time,
  beatPulse = 0,
}: {
  time: number;
  beatPulse?: number;
}) {
  const sheenP = (time * 0.45) % 1;
  const breath = 1 + 0.08 * beatPulse;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Soft radial spotlight highlighting the chest badge area */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 42% 40% at 50% 50%, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.03) 50%, transparent 75%)',
          opacity: 0.8 * breath,
          mixBlendMode: 'screen',
        }}
      />
      {/* Metallic diagonal sheen sweeping with beat */}
      <Sheen progress={sheenP} color="#ffffff" strength={0.42} width={0.28} angle={24} />
    </div>
  );
}

/**
 * <DynamicPainting>: Three-layer sandwich dynamic frame
 * Bottom: asset with EASE.smooth camera move (0 shake, 0 tremor)
 * Mid: deterministic vfxPreset (dust, rainWind, inkBloom, windowWarmth, metalPendulum)
 * Top: dynamic Vignette + Xuan paper grain
 */
export function DynamicPainting({
  name,
  time,
  start,
  end,
  camera = 'still',
  opacity = 1,
  style,
  children,
  reveal = false,
  vfxPreset = 'none',
  audioSample,
  palette = DEFAULT_PALETTE,
}: DynamicPaintingProps) {
  const { fps } = useVideoConfig();

  const pRaw = clamp01((time - start) / Math.max(0.1, end - start));
  const p = EASE.smooth(pRaw);

  // Bottom layer camera kinematics
  let scale = 1;
  let camX = 0;
  let camY = 0;

  if (camera === 'in') {
    scale = 1.025 + 0.045 * p;
  } else if (camera === 'out') {
    scale = 1.07 - 0.045 * p;
  } else if (camera === 'left') {
    scale = 1.045;
    camX = 26 - 52 * p;
  } else if (camera === 'right') {
    scale = 1.045;
    camX = -26 + 52 * p;
  } else if (camera === 'panUp') {
    scale = 1.045;
    camY = 18 - 36 * p;
  } else if (camera === 'panDown') {
    scale = 1.045;
    camY = -18 + 36 * p;
  }

  // Audio energy modulation (reserved for overlays)
  const bass = audioSample?.bass ?? 0;
  const high = audioSample?.high ?? 0;
  const beatPulse = audioSample?.beatPulse ?? 0;

  // 彻底砍掉镜头抖动与抽搐：底图 transform 仅保留平稳丝滑的 translate + scale (0 抖动、0 旋转抽搐)
  const transform = `translate(${camX}px, ${camY}px) scale(${scale})`;

  const darkRatio = palette.darkRatio ?? 0;
  const moodFilter =
    darkRatio > 0.01
      ? `brightness(${(1 - 0.18 * darkRatio).toFixed(3)}) contrast(${(1 + 0.08 * darkRatio).toFixed(3)})`
      : undefined;

  const entryProgress = reveal ? clamp01((time - start) / 0.65) : 1;
  const clip = (clips as Record<string, { src: string | null; sourceStartFrame: number }>)[name];

  const content = (
    <AbsoluteFill style={{ opacity, overflow: 'hidden', ...style }}>
      {/* 1. Bottom layer: Artwork / Video with camera motion, breath & mood grade */}
      <AbsoluteFill
        style={{
          transform,
          transformOrigin: '50% 46%',
          willChange: 'transform',
          filter: moodFilter,
        }}
      >
        {clip?.src ? (
          <Sequence from={Math.round(start * fps)} layout="none">
            <OffthreadVideo
              src={staticFile(clip.src)}
              muted
              startFrom={clip.sourceStartFrame}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Sequence>
        ) : (
          <Img
            src={staticFile(`assets/${name}`)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </AbsoluteFill>

      {/* 2. Mid layer: VFX Preset */}
      {vfxPreset === 'dust' && (
        <DustOverlay time={time} color={palette.glow ?? '#e8b87a'} />
      )}
      {vfxPreset === 'rainWind' && (
        <RainWindOverlay time={time} high={high} bass={bass} rainColor={palette.rain ?? 'rgba(33, 29, 25, 0.42)'} />
      )}
      {vfxPreset === 'inkBloom' && (
        <InkBloomOverlay progress={pRaw} beatPulse={beatPulse} inkColor={palette.ink ?? '#211d19'} />
      )}
      {vfxPreset === 'windowWarmth' && (
        <WindowWarmthOverlay time={time} start={start} end={end} bass={bass} glowColor={palette.glow ?? '#e8944f'} />
      )}
      {vfxPreset === 'metalPendulum' && (
        <MetalPendulumOverlay time={time} beatPulse={beatPulse} />
      )}

      {/* Children elements (subtitles, overlays, labels) */}
      {children}

      {/* 3. Top layer: Dynamic Vignette & Xuan paper texture */}
      <Vignette
        strength={palette.vignetteStrength ?? 0.3}
        color={palette.vignette ?? '#211d19'}
        inner={0.46}
      />
      <Grain opacity={0.055} blend="multiply" />
    </AbsoluteFill>
  );

  if (reveal && entryProgress < 1) {
    return <InkReveal progress={entryProgress}>{content}</InkReveal>;
  }

  return content;
}
