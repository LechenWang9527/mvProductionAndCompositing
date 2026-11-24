import React, { type CSSProperties, type ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { InkReveal } from '../visual/InkReveal';
import { EASE } from '../vendor/shotcraft/Polish';

export type TransitionType = 'inkBleed' | 'scrollSlide' | 'mistDissolve' | 'beatCut';

export type AudioSample = {
  t: number;
  bass: number;
  mid: number;
  high: number;
  rms: number;
  beatPhase: number;
  beatPulse: number;
  onsetPulse: number;
};

export type DufuPalette = {
  name: string;
  bg: string;
  paper: string;
  ink: string;
  secondaryInk: string;
  accent: string;
  glow: string;
  vignette: string;
  rain: string;
  vignetteStrength: number;
  darkRatio: number;
};

export type OverlapShot = {
  id?: string;
  start: number;
  end: number;
  transition?: TransitionType;
  transitionDuration?: number;
  render: (props: { time: number; progress: number; isActive: boolean }) => ReactNode;
};

export type MotivatedTransitionProps = {
  outgoing: ReactNode;
  incoming: ReactNode;
  progress: number;
  type?: TransitionType;
  width?: number;
  height?: number;
  style?: CSSProperties;
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Executes one of 4 motivated ink transitions between outgoing and incoming layers:
 * 1. inkBleed: dynamic organic turbulence mask expansion
 * 2. scrollSlide: hand-scroll parallax push with paper edge shadow
 * 3. mistDissolve: atmospheric paper-mist defocus dissolve
 * 4. beatCut: instant cut on beat with a restrained 1-frame rice paper flash
 */
export function MotivatedTransition({
  outgoing,
  incoming,
  progress,
  type = 'inkBleed',
  width = 1920,
  height = 1080,
  style,
}: MotivatedTransitionProps) {
  const pRaw = clamp01(progress);
  const p = EASE.smooth(pRaw);

  const containerStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width,
    height,
    overflow: 'hidden',
    ...style,
  };

  if (pRaw <= 0) {
    return <div style={containerStyle}>{outgoing}</div>;
  }
  if (pRaw >= 1) {
    return <div style={containerStyle}>{incoming}</div>;
  }

  if (type === 'inkBleed') {
    return (
      <div style={containerStyle}>
        <AbsoluteFill>{outgoing}</AbsoluteFill>
        <AbsoluteFill>
          <InkReveal progress={p}>{incoming}</InkReveal>
        </AbsoluteFill>
      </div>
    );
  }

  if (type === 'scrollSlide') {
    return (
      <div style={containerStyle}>
        {/* Outgoing shot drags left with gentle parallax */}
        <AbsoluteFill
          style={{
            transform: `translateX(${-p * 36}%)`,
            opacity: 1 - p * 0.22,
          }}
        >
          {outgoing}
        </AbsoluteFill>

        {/* Incoming shot rolls in from the right with thick Xuan paper shadow */}
        <AbsoluteFill
          style={{
            transform: `translateX(${(1 - p) * 100}%)`,
            boxShadow: '-20px 0 45px rgba(25, 22, 18, 0.45)',
          }}
        >
          {incoming}
        </AbsoluteFill>
      </div>
    );
  }

  if (type === 'mistDissolve') {
    const mistPeak = Math.sin(p * Math.PI);
    return (
      <div style={containerStyle}>
        <AbsoluteFill
          style={{
            opacity: 1 - p,
            filter: p > 0.02 ? `blur(${(p * 12).toFixed(1)}px)` : undefined,
          }}
        >
          {outgoing}
        </AbsoluteFill>

        {/* Xuan paper mist atmospheric veil */}
        <AbsoluteFill
          style={{
            pointerEvents: 'none',
            opacity: mistPeak * 0.48,
            background:
              'radial-gradient(ellipse 70% 65% at 50% 50%, rgba(248, 246, 240, 0.88) 0%, rgba(248, 246, 240, 0.45) 55%, transparent 100%)',
            mixBlendMode: 'screen',
          }}
        />

        <AbsoluteFill
          style={{
            opacity: p,
            filter: p < 0.98 ? `blur(${((1 - p) * 10).toFixed(1)}px)` : undefined,
          }}
        >
          {incoming}
        </AbsoluteFill>
      </div>
    );
  }

  // beatCut: snap cut right at midpoint with 1-frame restrained rice paper flash
  const isIncoming = pRaw >= 0.5;
  const flashDist = Math.abs(pRaw - 0.5);
  const flashActive = flashDist < 0.08;
  const flashAlpha = flashActive ? (1 - flashDist / 0.08) * 0.28 : 0;

  return (
    <div style={containerStyle}>
      <AbsoluteFill>{isIncoming ? incoming : outgoing}</AbsoluteFill>
      {flashAlpha > 0.01 && (
        <AbsoluteFill
          style={{
            pointerEvents: 'none',
            backgroundColor: '#f8f6f0',
            opacity: flashAlpha,
            mixBlendMode: 'screen',
          }}
        />
      )}
    </div>
  );
}

export type OverlapStageProps = {
  shots: OverlapShot[];
  time: number;
  width?: number;
  height?: number;
  defaultTransition?: TransitionType;
  defaultDuration?: number;
  style?: CSSProperties;
};

/**
 * OverlapStage coordinates up to 2 concurrent shots across cut boundaries,
 * running smooth motivated transitions in [cut - dur, cut] or explicitly overlapping intervals.
 */
export function OverlapStage({
  shots,
  time,
  width = 1920,
  height = 1080,
  defaultTransition = 'inkBleed',
  defaultDuration = 0.6,
  style,
}: OverlapStageProps) {
  if (!shots || shots.length === 0) return null;

  // Find active shot or transition boundary
  for (let i = 0; i < shots.length; i++) {
    const curr = shots[i];
    const next = shots[i + 1];

    if (!next) {
      if (time >= curr.start && time <= curr.end) {
        return (
          <div style={{ position: 'absolute', inset: 0, width, height, overflow: 'hidden', ...style }}>
            {curr.render({ time, progress: 1, isActive: true })}
          </div>
        );
      }
      continue;
    }

    const dur = next.transitionDuration ?? defaultDuration;
    // Overlap window: either explicit overlap (next.start < curr.end) or pre-cut transition [next.start - dur, next.start]
    const windowEnd = Math.max(curr.end, next.start);
    const windowStart = next.start < curr.end ? next.start : windowEnd - dur;

    if (time >= windowStart && time <= windowEnd) {
      const windowDur = Math.max(0.05, windowEnd - windowStart);
      const rawProgress = clamp01((time - windowStart) / windowDur);
      const transitionType = next.transition ?? defaultTransition;

      return (
        <MotivatedTransition
          key={`${curr.id ?? i}->${next.id ?? i + 1}`}
          outgoing={curr.render({ time, progress: 1 - rawProgress, isActive: false })}
          incoming={next.render({ time, progress: rawProgress, isActive: true })}
          progress={rawProgress}
          type={transitionType}
          width={width}
          height={height}
          style={style}
        />
      );
    }

    if (time >= curr.start && time < windowStart) {
      return (
        <div style={{ position: 'absolute', inset: 0, width, height, overflow: 'hidden', ...style }}>
          {curr.render({ time, progress: 1, isActive: true })}
        </div>
      );
    }
  }

  // Fallback to closest shot if time is out of declared boundaries
  const fallbackShot = shots.find((s) => time >= s.start && time <= s.end) ?? shots[0];
  return (
    <div style={{ position: 'absolute', inset: 0, width, height, overflow: 'hidden', ...style }}>
      {fallbackShot.render({ time, progress: 1, isActive: true })}
    </div>
  );
}
