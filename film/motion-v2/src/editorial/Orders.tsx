import React from 'react';
import { interpolateColors, useVideoConfig } from 'remotion';
import { EASE, ramp } from '../vendor/shotcraft/Polish';
import { EDITORIAL_COLORS, EDITORIAL_TYPE, EditorialStage } from '../visual/EditorialStage';
import { DynamicPainting } from './DynamicPainting';
import { InkPathDraw, InkCallout, InkChatBubble, clamp01 } from './InkSketchPrimitives';

const SEASONS = ['秋', '冬', '春', '夏'] as const;
const SEASON_X = [1080, 1260, 1440, 1620] as const;
const SEASON_START = 120.85;
const FINAL_ROW_STOP = 126.857;

const ORDER_ROWS = [
  { number: '01', top: 267, enters: 119.72, completes: 120.82, final: 1 },
  { number: '02', top: 365, enters: 121.36, completes: 122.46, final: 1 },
  { number: '03', top: 463, enters: 123.02, completes: 124.12, final: 1 },
  { number: '04', top: 561, enters: 124.62, completes: FINAL_ROW_STOP, final: 0.7 },
] as const;

const PROCESS_STEPS = ['接单', '在途', '送达'] as const;
const PROCESS_FONT = EDITORIAL_TYPE.support.fontFamily;
const PROCESS_COLORS = {
  active: EDITORIAL_COLORS.cinnabar,
  done: EDITORIAL_COLORS.ink,
  pending: '#8b8379',
} as const;

function seasonProgress(frame: number, fps: number) {
  return ramp(frame, SEASON_START * fps, (FINAL_ROW_STOP - SEASON_START) * fps, EASE.smooth);
}

function SeasonAxis({ frame, fps, alignMarkers }: { frame: number; fps: number; alignMarkers: boolean }) {
  const progress = seasonProgress(frame, fps);
  const x = SEASON_X[0] + (SEASON_X[3] - SEASON_X[0]) * progress;
  const active = frame >= SEASON_START * fps;
  const seasonSegments = alignMarkers ? SEASONS.length - 1 : SEASONS.length;
  const current = Math.min(SEASONS.length - 1, Math.floor(progress * seasonSegments + (alignMarkers ? 1e-6 : 0)));

  return (
    <>
      {SEASONS.map((season, index) => {
        const past = active && index < current;
        const selected = active && index === current;
        return (
          <div key={season} style={{
            position: 'absolute', left: SEASON_X[index] - 35, top: 105, width: 70, height: 42,
            textAlign: 'center', color: selected ? PROCESS_COLORS.active : past ? EDITORIAL_COLORS.ink : PROCESS_COLORS.pending,
            fontFamily: PROCESS_FONT, fontSize: 30, fontWeight: 400, lineHeight: '42px',
          }}>
            {season}
          </div>
        );
      })}

      <div aria-hidden="true" style={{
        position: 'absolute', left: SEASON_X[0], top: 164,
        width: SEASON_X[3] - SEASON_X[0], height: 1,
        background: EDITORIAL_COLORS.hairline,
      }} />
      {active && <>
        <div aria-hidden="true" style={{
          position: 'absolute', left: SEASON_X[0], top: 163,
          width: Math.max(0, x - SEASON_X[0]), height: 2,
          background: PROCESS_COLORS.active,
        }} />
        <div aria-hidden="true" style={{
          position: 'absolute', left: x - 4, top: 160, width: 8, height: 8,
          borderRadius: '50%', background: PROCESS_COLORS.active,
        }} />
      </>}
    </>
  );
}

function OrderRow({ row, frame, fps }: {
  row: (typeof ORDER_ROWS)[number];
  frame: number;
  fps: number;
}) {
  const entry = ramp(frame, row.enters * fps, 0.26 * fps, EASE.out);
  if (entry <= 0.001) return null;

  const progressStart = row.enters + 0.18;
  const phase = ramp(frame, progressStart * fps, (row.completes - progressStart) * fps, EASE.smooth);
  const complete = row.final === 1 && frame >= row.completes * fps;
  const currentStep = complete
    ? -1
    : row.final < 1
      ? phase * row.final < 0.34 ? 0 : 1
      : phase < 0.34 ? 0 : phase < 0.68 ? 1 : 2;

  return (
    <div style={{
      position: 'absolute', left: 1020, top: row.top, width: 680, height: 76,
      display: 'flex', alignItems: 'center', opacity: entry,
      transform: `translateY(${10 * (1 - entry)}px)`, pointerEvents: 'none',
    }}>
      <div style={{
        width: 158, flex: 'none', color: EDITORIAL_COLORS.ink,
        fontFamily: EDITORIAL_TYPE.body.fontFamily, fontSize: 32, fontWeight: 400,
        lineHeight: '42px', whiteSpace: 'nowrap',
      }}>
        第 {row.number} 单
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 13, whiteSpace: 'nowrap' }}>
        {PROCESS_STEPS.map((step, index) => {
          const color = complete || index < currentStep
            ? PROCESS_COLORS.done
            : index === currentStep ? PROCESS_COLORS.active : PROCESS_COLORS.pending;
          return (
            <React.Fragment key={step}>
              {index > 0 && <span style={{ color: '#a69e94', fontFamily: PROCESS_FONT, fontSize: 22, lineHeight: '36px' }}>→</span>}
              <span style={{ color, fontFamily: PROCESS_FONT, fontSize: 28, fontWeight: 400, lineHeight: '38px' }}>{step}</span>
            </React.Fragment>
          );
        })}
      </div>

      <div aria-hidden="true" style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 1,
        background: 'rgba(33,29,25,0.15)',
      }} />
    </div>
  );
}

/** Orders and season changes appear as text on the full-frame courier artwork. */
export function Orders({ time, alignMarkers = false }: { time: number; alignMarkers?: boolean }) {
  const { fps } = useVideoConfig();
  if (!Number.isFinite(time) || time < 119.45 || time >= 127.6) return null;

  const frame = time * fps;
  const temperature = seasonProgress(frame, fps);
  const temperatureColor = interpolateColors(
    temperature,
    [0, 1 / 3, 2 / 3, 1],
    ['#c99579', '#9eb4c3', '#ddbca0', '#d9cf9c'],
  );

  return (
    <EditorialStage cornerInkSrc={false}>
      <DynamicPainting name="courier_shift_ink_v3.png" time={time} start={119.45} end={127.6} camera="still" vfxPreset="rainWind" />
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundColor: temperatureColor, opacity: 0.07, mixBlendMode: 'soft-light',
      }} />
      <SeasonAxis frame={frame} fps={fps} alignMarkers={alignMarkers} />
      {ORDER_ROWS.map((row) => <OrderRow key={row.number} row={row} frame={frame} fps={fps} />)}

      {/* 顺着雨夜街道延伸透视画一道暖金前路弧线 */}
      <InkPathDraw
        d="M 520 820 Q 640 660 780 540"
        progress={clamp01((time - 119.6) / 0.9)}
        color="#f0b764"
        width={2.8}
        dashed
      />

      {/* 从小店暖灯 (140, 350) 拉出 */}
      <InkCallout
        from={[140, 350]}
        to={[80, 120]}
        label="街头暖灯 · 风雨夜归"
        sublabel="每一程奔波皆有回响"
        icon="warmSoup"
        dark
        progress={clamp01((time - 119.7) / 0.7)}
      />

      {/* 在左中/左下安全区 x={80} y={560} width={400} 提前浮现 */}
      <InkChatBubble
        dark
        speaker="老天记账 · 刘邦"
        text="你熬过的每个秋冬春夏，老天都攒着呢。没到终局，千万别下场。"
        progress={clamp01((time - 120.2) / 0.85)}
        anchorFrom={[420, 520]}
        x={80}
        y={560}
        width={400}
      />
    </EditorialStage>
  );
}
