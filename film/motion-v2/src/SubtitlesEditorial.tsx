import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import timing from '../public/data/og_timing.json';
import { MVFonts, MV_FONT_FAMILIES } from './visual/Fonts';

type SubtitlePalette = {
  ink?: string;
  secondaryInk?: string;
  accent?: string;
  bg?: string;
  darkRatio?: number;
};

type Props = {
  offset?: number;
  ancientOnly?: boolean;
  tone?: 'paper' | 'night';
  palette?: SubtitlePalette;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const lines = timing.lines;

/** Independent editorial subtitle treatment using the original source timing. */
export const SubtitleTrackEditorial: React.FC<Props> = ({
  offset = 0,
  ancientOnly = false,
  tone = 'paper',
  palette,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps + offset;

  const night = tone === 'night';
  const darkR = clamp(palette?.darkRatio ?? (night ? 1 : 0));

  const currentInk = palette?.ink ?? (darkR > 0.5 ? '#f4eadb' : '#3b3025');
  const nextInk = darkR > 0.5 ? '#efe3d2' : (palette?.secondaryInk ?? '#594d40');
  const nextNextInk = darkR > 0.5 ? '#cbbba5' : (palette?.secondaryInk ? `${palette.secondaryInk}bb` : '#6b6054');
  const cinnabar = palette?.accent ?? (darkR > 0.5 ? '#df6849' : '#a8402c');

  const r = Math.round(246 + (31 - 246) * darkR);
  const g = Math.round(239 + (23 - 239) * darkR);
  const b = Math.round(225 + (18 - 225) * darkR);
  const a1 = (0.18 + (0.12 - 0.18) * darkR).toFixed(3);
  const a2 = (0.43 + (0.38 - 0.43) * darkR).toFixed(3);
  const a3 = '0.720';
  const a4 = (0.88 + (0.90 - 0.88) * darkR).toFixed(3);

  const subtitleFade = palette
    ? `linear-gradient(180deg, rgba(${r},${g},${b},0) 0%, rgba(${r},${g},${b},${a1}) 14%, rgba(${r},${g},${b},${a2}) 36%, rgba(${r},${g},${b},${a3}) 66%, rgba(${r},${g},${b},${a4}) 100%)`
    : night
    ? 'linear-gradient(180deg, rgba(31,23,18,0) 0%, rgba(31,23,18,.12) 14%, rgba(31,23,18,.38) 36%, rgba(31,23,18,.72) 66%, rgba(31,23,18,.90) 100%)'
    : 'linear-gradient(180deg, rgba(246,239,225,0) 0%, rgba(246,239,225,.18) 14%, rgba(244,236,220,.43) 36%, rgba(242,233,215,.72) 66%, rgba(241,233,215,.88) 100%)';
  const source = ancientOnly ? lines.filter((line) => line.start < 136.9) : lines;

  let index = -1;
  for (let i = 0; i < source.length && source[i].start <= t; i += 1) index = i;
  if (index < 0) return <MVFonts />;

  const current = source[index];
  const currentSize = Math.min(58, 1530 / Math.max(1, Array.from(current.text).length));
  let timedIndex = 0;
  const currentChars = Array.from(current.text).map((char, i) => {
    if (/\s/.test(char)) return <span key={i} style={{ whiteSpace: 'pre' }}> </span>;
    const charCue = current.chars[timedIndex];
    const nextCue = current.chars[timedIndex + 1];
    timedIndex += 1;
    const progress = charCue
      ? clamp((t - charCue.t) / Math.max(0.05, (nextCue?.t ?? current.end) - charCue.t))
      : 0;
    return (
      <span key={i} style={{ display: 'inline-block', position: 'relative', color: currentInk }}>
        {char}
        <span style={{ position: 'absolute', inset: 0, color: cinnabar, clipPath: `inset(0 ${100 * (1 - progress)}% 0 0)` }}>
          {char}
        </span>
      </span>
    );
  });

  return (
    <>
      <MVFonts />
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 735, bottom: 0,
        pointerEvents: 'none', zIndex: 99,
        background: subtitleFade,
      }} />
      <div style={{
        position: 'absolute', left: 96, top: 778, width: 1728, height: 186,
        display: 'grid', gridTemplateRows: '82px 52px 52px', alignContent: 'start',
        color: currentInk, textAlign: 'center', whiteSpace: 'nowrap', zIndex: 100,
      }}>
        <div style={{
          height: 82, lineHeight: '82px', fontFamily: MV_FONT_FAMILIES.serif,
          fontSize: currentSize, fontWeight: 600, letterSpacing: 0.8,
        }}>{currentChars}</div>
        {[1, 2].map((step) => {
          const line = source[index + step];
          const size = Math.min(step === 1 ? 31 : 27, 1530 / Math.max(1, Array.from(line?.text ?? '').length));
          return (
            <div key={step} style={{
              height: 52, lineHeight: '52px', fontFamily: MV_FONT_FAMILIES.sans,
              fontSize: size, fontWeight: 400, letterSpacing: 0.25,
              color: step === 1 ? nextInk : nextNextInk,
            }}>{line?.text ?? ''}</div>
          );
        })}
      </div>
    </>
  );
};
