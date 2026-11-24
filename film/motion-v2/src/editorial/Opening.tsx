import type { CSSProperties } from 'react';
import { useVideoConfig } from 'remotion';
import { Artwork, EditorialStage, EDITORIAL_COLORS, EDITORIAL_TYPE, BrushRule } from '../visual/EditorialStage';
import { InkReveal } from '../visual/InkReveal';
import { MVFonts } from '../visual/Fonts';
import { EASE, ramp } from '../vendor/shotcraft/Polish';
import { InkPathDraw, InkChatBubble } from './InkSketchPrimitives';

const WIDTH = 1920;
const HEIGHT = 1080;
const SCROLL_SRC_W = 2172;
const SCROLL_SRC_H = 724;
const SCROLL_PARTS = { left: 155, sheetEnd: 2018, right: 2172 } as const;
const TORN_EDGE = [0, 9, -5, 8, -7, 5, -3, 7, -4, 6, -6, 4, -2, 5, -4, 3, -2];

export type OpeningProps = { time: number; enhancedMotion?: boolean };
type TimelineProps = { reveal: number; returnToMiddle: number; opacity?: number };

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function scrollRevealClip(progress: number) {
  const roughness = 0.12 + 0.1 * (1 - progress);
  const points = ['0% 0%', '100% 0%'];
  TORN_EDGE.forEach((offset, index) => {
    const y = ((index + 1) / (TORN_EDGE.length + 1)) * 100;
    const x = Math.max(98.8, Math.min(100, 100 + offset * roughness / 100));
    points.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
  });
  points.push('100% 100%', '0% 100%');
  return `polygon(${points.join(',')})`;
}

function UnfurlScroll({ progress }: { progress: number }) {
  const reveal = clamp01(progress);
  if (reveal <= 0.001) return null;

  // Preserve the 2172×724 source ratio. Reveal only the paper body; each roller
  // remains a crop from its original source coordinates and tracks the paper edge.
  const displayWidth = 1500;
  const displayHeight = displayWidth * SCROLL_SRC_H / SCROLL_SRC_W;
  const ratio = displayWidth / SCROLL_SRC_W;
  const leftRoll = SCROLL_PARTS.left * ratio;
  const sheetWidth = (SCROLL_PARTS.sheetEnd - SCROLL_PARTS.left) * ratio;
  const rightRoll = (SCROLL_PARTS.right - SCROLL_PARTS.sheetEnd) * ratio;
  const visibleSheet = sheetWidth * reveal;
  const left = 300;
  const top = 172;
  const rightEdge = left + leftRoll + visibleSheet;
  const source = 'scroll_cutout_v2.png';
  const imageStyle: CSSProperties = {
    display: 'block',
    objectFit: 'fill',
  };

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left, top, width: leftRoll, height: displayHeight, overflow: 'hidden' }}>
        <Artwork src={source} left={0} top={0} width={displayWidth} height={displayHeight} objectFit="fill" style={imageStyle} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: left + leftRoll,
          top,
          width: visibleSheet,
          height: displayHeight,
          overflow: 'hidden',
          clipPath: scrollRevealClip(reveal),
        }}
      >
        <Artwork src={source} left={-leftRoll} top={0} width={displayWidth} height={displayHeight} objectFit="fill" style={imageStyle} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: rightEdge,
          top,
          width: rightRoll,
          height: displayHeight,
          overflow: 'hidden',
          transform: `rotate(${((1 - reveal) * -1.1).toFixed(3)}deg)`,
          transformOrigin: '50% 50%',
        }}
      >
        <Artwork
          src={source}
          left={-(leftRoll + sheetWidth)}
          top={0}
          width={displayWidth}
          height={displayHeight}
          objectFit="fill"
          style={imageStyle}
        />
      </div>
    </div>
  );
}

function Lantern({
  x,
  y,
  width,
  visibility,
  flame,
  spread,
  motionTime,
}: {
  x: number;
  y: number;
  width: number;
  visibility: number;
  flame: number;
  spread: number;
  motionTime?: number;
}) {
  const height = width * 1157 / 1360;
  // Source inspection: lamp_cutout_v2 is 1360×1157; the wick is at 88% x, 17% y.
  const wickX = x + width * 0.88;
  const wickY = y + height * 0.17;
  const lightRadius = 150 + 470 * clamp01(spread);
  const lightPulse = motionTime === undefined ? 1 : 0.96 + 0.04 * Math.sin(motionTime * 5.3);
  const lightOpacity = 0.12 * clamp01(spread) * clamp01(visibility) * lightPulse;
  const flameScale = 0.98 + 0.025 * Math.sin(spread * 4.2);
  const flameTransform = motionTime === undefined
    ? `scale(${flameScale.toFixed(3)})`
    : `rotate(${(2 * Math.sin(motionTime * 5)).toFixed(3)}deg) scaleY(${(1 + 0.04 * Math.sin(motionTime * 7)).toFixed(3)}) scale(${flameScale.toFixed(3)})`;

  return (
    <>
      {lightOpacity > 0 && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: lightOpacity,
            background: `radial-gradient(ellipse ${lightRadius}px ${lightRadius * 0.62}px at ${wickX}px ${wickY}px, rgba(225,174,102,0.7) 0%, rgba(225,174,102,0.26) 43%, transparent 100%)`,
          }}
        />
      )}
      <Artwork
        src="lamp_cutout_v2.png"
        left={x}
        top={y}
        width={width}
        height={height}
        objectFit="contain"
        opacity={clamp01(visibility)}
        style={{ filter: 'saturate(0.92)' }}
      />
      {flame > 0.001 && (
        <svg
          width={38}
          height={54}
          viewBox="0 0 76 108"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: wickX - 19,
            top: wickY - 51,
            opacity: clamp01(flame),
            pointerEvents: 'none',
            transform: flameTransform,
            transformOrigin: '50% 100%',
          }}
        >
          <path d="M38 104 C14 88 27 61 38 8 C46 45 67 60 57 86 C53 99 45 104 38 104Z" fill="#A64A31" />
          <path d="M39 94 C27 82 35 61 42 39 C55 65 55 82 47 92 C45 95 42 96 39 94Z" fill="#D38A49" />
          <path d="M40 82 C36 75 41 65 44 57 C50 70 49 79 44 83Z" fill="#FFF1D2" />
        </svg>
      )}
    </>
  );
}

function Timeline({ reveal, returnToMiddle, opacity = 1 }: TimelineProps) {
  const startX = 360;
  const endX = 1560;
  const y = 686;
  const travel = clamp01(reveal);
  const returnProgress = clamp01(returnToMiddle);
  const markerX = startX + (endX - startX) * (travel + (0.5 - travel) * returnProgress);

  if (travel <= 0.001) return null;

  return (
    <>
      <BrushRule
        x={startX}
        y={y - 10}
        width={endX - startX}
        progress={travel}
        thickness={6}
        color={EDITORIAL_COLORS.cinnabar}
        opacity={0.92 * opacity}
        seed={77}
      />
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity }}>
        <circle cx={startX} cy={y} r={5} fill={EDITORIAL_COLORS.cinnabar} opacity="0.7" />
        <circle cx={endX} cy={y} r={5} fill={EDITORIAL_COLORS.cinnabar} opacity="0.7" />
        <circle cx={markerX} cy={y} r={8} fill={EDITORIAL_COLORS.paper} stroke={EDITORIAL_COLORS.cinnabar} strokeWidth={3} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: startX - 70,
          top: y + 9,
          width: 140,
          textAlign: 'center',
          opacity,
          color: EDITORIAL_COLORS.secondaryInk,
          ...EDITORIAL_TYPE.support,
          fontSize: 30,
          lineHeight: 1.15,
        }}
      >
        千年前
      </div>
      <div
        style={{
          position: 'absolute',
          left: endX - 70,
          top: y + 9,
          width: 140,
          textAlign: 'center',
          opacity,
          color: EDITORIAL_COLORS.secondaryInk,
          ...EDITORIAL_TYPE.support,
          fontSize: 30,
          lineHeight: 1.15,
        }}
      >
        当下
      </div>
    </>
  );
}

function IntroPeople({ frame, fps, convergence }: { frame: number; fps: number; convergence: number }) {
  const dufu = ramp(frame, 8.05 * fps, 0.95 * fps, EASE.out);
  const liubang = ramp(frame, 10.75 * fps, 0.95 * fps, EASE.out);
  const meet = clamp01(convergence);
  const dufuLeft = 530 + 36 * meet;
  const liubangLeft = 1160 - 36 * meet;

  return (
    <>
      {dufu > 0.001 && (
        <>
          <Artwork
            src="dufu_reference_v2.png"
            left={dufuLeft}
            top={188}
            width={304}
            height={442}
            objectFit="contain"
            opacity={dufu}
            style={{ filter: 'saturate(0.92)', transform: `translateY(${(12 * (1 - dufu)).toFixed(2)}px)` }}
          />
          <div
            style={{
              position: 'absolute',
              left: dufuLeft + 152,
              top: 632,
              width: 120,
              transform: 'translateX(-50%)',
              opacity: dufu,
              textAlign: 'center',
              color: EDITORIAL_COLORS.ink,
              fontFamily: EDITORIAL_TYPE.heading.fontFamily,
              fontSize: 30,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '0.04em',
            }}
          >
            杜甫
          </div>
        </>
      )}
      {liubang > 0.001 && (
        <>
          <Artwork
            src="liubang_reference_v2.png"
            left={liubangLeft}
            top={190}
            width={358}
            height={442}
            objectFit="contain"
            opacity={liubang}
            style={{ filter: 'saturate(0.92)', transform: `translateY(${(12 * (1 - liubang)).toFixed(2)}px)` }}
          />
          <div
            style={{
              position: 'absolute',
              left: liubangLeft + 179,
              top: 632,
              width: 120,
              transform: 'translateX(-50%)',
              opacity: liubang,
              textAlign: 'center',
              color: EDITORIAL_COLORS.ink,
              fontFamily: EDITORIAL_TYPE.heading.fontFamily,
              fontSize: 30,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '0.04em',
            }}
          >
            刘邦
          </div>
        </>
      )}
    </>
  );
}

function Intro({ time, frame, fps, motionTime }: { time: number; frame: number; fps: number; motionTime?: number }) {
  const scroll = ramp(frame, 3.5 * fps, 3.9 * fps, EASE.swift);
  const lampSettle = ramp(frame, 3.5 * fps, (7.4 - 3.5) * fps, EASE.smooth);
  const converge = ramp(frame, 21.6 * fps, 6.33 * fps, EASE.smooth);
  const lineProgress = ramp(frame, 14.99 * fps, (21.6 - 14.99) * fps, EASE.smooth);
  const returnMarker = ramp(frame, 21.6 * fps, 6.33 * fps, EASE.smooth);
  const closing = ramp(frame, 27.93 * fps, 2.07 * fps, EASE.smooth);
  const ignition = ramp(frame, 0.28 * fps, 0.54 * fps, EASE.out);
  const lightSpread = ramp(frame, 0.28 * fps, 3.22 * fps, EASE.smooth);

  const lampX = 650 * (1 - lampSettle) + 45 * lampSettle + 735 * closing;
  const lampY = 250 * (1 - lampSettle) + 430 * lampSettle - 80 * closing;
  const lampWidth = 500 * (1 - lampSettle) + 245 * lampSettle + 105 * closing;
  const flame = Math.max(ignition, closing);
  const spread = Math.max(lightSpread, closing);
  const lampVisibility = time < 27.93 ? 1 : 1 - 0.04 * closing;

  return (
    <>
      <UnfurlScroll progress={scroll} />
      <IntroPeople frame={frame} fps={fps} convergence={converge} />
      <Timeline reveal={lineProgress} returnToMiddle={returnMarker} opacity={1 - 0.5 * closing} />
      <Lantern x={lampX} y={lampY} width={lampWidth} visibility={lampVisibility} flame={flame} spread={spread} motionTime={motionTime} />
    </>
  );
}

const REPRISE_SCENES = [
  { src: 'changan_ink_v2.png', start: 74.3 },
  { src: 'hut_ink_v2.png', start: 76.5 },
  { src: 'shelter_ink_v2.png', start: 78.7 },
  { src: 'cradle_ink_v2.png', start: 80.9 },
] as const;

function Reprise({ frame, fps, motionTime }: { frame: number; fps: number; motionTime?: number }) {
  const time = frame / fps;
  const reveal = ramp(frame, 74.3 * fps, 9 * fps, EASE.smooth);
  const convergence = ramp(frame, 83.3 * fps, 4.63 * fps, EASE.smooth);
  const sceneFade = ramp(frame, 82.5 * fps, 2.6 * fps, EASE.smooth);
  const axisEntry = ramp(frame, 85.1 * fps, 0.6 * fps, EASE.out);
  const peopleEntry = ramp(frame, 85.1 * fps, 0.6 * fps, EASE.out);
  const lampAppear = ramp(frame, 85.1 * fps, 1.2 * fps, EASE.out);
  const lampLight = ramp(frame, 85.8 * fps, 2.1 * fps, EASE.smooth);
  const lineOpacity = (1 - 0.65 * ramp(frame, 87.2 * fps, 2.8 * fps, EASE.smooth)) * axisEntry;
  const dufuLeft = 442 + 34 * clamp01(convergence);
  const liubangLeft = 1170 - 34 * clamp01(convergence);

  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: WIDTH,
          height: HEIGHT,
          opacity: 1 - sceneFade,
          pointerEvents: 'none',
          maskImage: 'linear-gradient(to bottom, #000 0%, #000 68%, rgba(0,0,0,0.82) 78%, transparent 96%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 68%, rgba(0,0,0,0.82) 78%, transparent 96%)',
        }}
      >
        {REPRISE_SCENES.map((scene, index) => {
          const sceneReveal = ramp(frame, scene.start * fps, 0.85 * fps, EASE.smooth);
          return (
            <div key={scene.src} style={{ position: 'absolute', inset: 0, width: WIDTH, height: HEIGHT, zIndex: index + 1 }}>
              <InkReveal progress={sceneReveal}>
                <Artwork src={scene.src} left={0} top={0} width={WIDTH} height={HEIGHT} objectFit="cover" />
              </InkReveal>
            </div>
          );
        })}
      </div>

      {/* 74.5s ~ 82.8s 回忆叠现期：知己对话浮现（82.5s 后随 1 - sceneFade 淡出） */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 1 - sceneFade,
          pointerEvents: 'none',
        }}
      >
        <InkChatBubble
          x={100}
          y={110}
          width={360}
          dark
          speaker="过来人 · 杜甫"
          text="你熬的夜、咽下的话，一千年前我都走过。"
          progress={clamp01((time - 74.6) / 0.85)}
        />
        <InkChatBubble
          x={1360}
          y={110}
          width={380}
          dark
          speaker="同行一程"
          text="不是来教你，只是想陪你走过这段夜路。"
          progress={clamp01((time - 78.2) / 0.85)}
        />
      </div>

      <Timeline reveal={reveal} returnToMiddle={convergence} opacity={lineOpacity} />

      <Artwork
        src="dufu_reference_v2.png"
        left={dufuLeft}
        top={198}
        width={292}
        height={424}
        objectFit="contain"
        opacity={peopleEntry}
        style={{ filter: `saturate(0.92) brightness(${(0.78 + 0.22 * lampLight).toFixed(3)})` }}
      />
      <Artwork
        src="liubang_reference_v2.png"
        left={liubangLeft}
        top={198}
        width={344}
        height={424}
        objectFit="contain"
        opacity={peopleEntry}
        style={{ filter: `saturate(0.92) brightness(${(0.78 + 0.22 * lampLight).toFixed(3)})` }}
      />

      {lampAppear > 0 && (
        <Lantern
          x={760}
          y={380}
          width={360}
          visibility={lampAppear}
          flame={lampLight}
          spread={lampLight}
          motionTime={motionTime}
        />
      )}

      {/* 85.1s ~ 90.0s 杜甫与刘邦同框亮灯交棒：暖金交棒弧线与接棒气泡 */}
      {time >= 85.1 && (
        <>
          <InkPathDraw
            d="M 620 420 Q 940 310 1260 420"
            progress={clamp01((time - 85.4) / 1.1)}
            color="#e8b87a"
            width={2.8}
            dashed
          />
          <InkChatBubble
            x={1320}
            y={140}
            width={380}
            speaker="接棒 · 刘邦"
            text="杜兄且歇，下半程，看我老刘的。"
            progress={clamp01((time - 85.6) / 0.8)}
            anchorFrom={[1310, 260]}
          />
        </>
      )}
    </>
  );
}

/** Global-time opening and reprise. Returns null outside the two requested ranges. */
export function Opening({ time, enhancedMotion = false }: OpeningProps) {
  const { fps } = useVideoConfig();
  const valid = Number.isFinite(time) && ((time >= 0 && time < 30) || (time >= 74.3 && time < 90));
  if (!valid) return null;

  const reprise = time >= 74.3;
  const frame = time * fps;
  const motionTime = enhancedMotion ? time : undefined;

  return (
    <>
      <MVFonts />
      <EditorialStage cornerInkSrc={false}>
        {reprise
          ? <Reprise frame={frame} fps={fps} motionTime={motionTime} />
          : <Intro time={time} frame={frame} fps={fps} motionTime={motionTime} />}
      </EditorialStage>
    </>
  );
}
