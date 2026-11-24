// Method references adapted for this Remotion scene:
// - ref_drawai/lib/motion/mgstyles/upstream/demos/06-collage/index.html:
//   piece(), rimmed(), cutQuad(), tornStrip(), shadow(). The piece transform
//   is retained without its 6/12 fps jitter; the torn-strip edge is fixed.
// - ref_drawai/lib/motion/shotcraft/upstream/demos/_fixtures/Polish.tsx:
//   bezier() and softShadow(), used directly for deterministic easing/shadows.
// - ref_drawai/lib/motion/shotcraft/upstream/demos/data/timeline-travel/TimelineTravel.tsx:
//   camXAt() and popFrameOf() are adapted for the gentler 16.62–20.4 s travel.
// - ref_mv/src/engine/draw.js: masked() content∩mask logic is implemented as
//   a CSS clip on the scroll body; it does not distort the source image.
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  interpolateColors,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { bezier, EASE, Grain, ramp, softShadow } from '../vendor/shotcraft/Polish';
import { LOOKS, Stage, TextReveal } from '../vendor/shotcraft/Look';

/**
 * Absolute song-time cues. Root can mount this composition across the original
 * #1/#2/#3 boundaries without resetting the sequence.
 */
export const INTRO_V2_CUES = Object.freeze({
  duration: 21.6,
  lampIgnition: [0.28, 0.82] as const,
  lightSpread: [0.28, 3.5] as const,
  scrollUnfurl: [3.5, 7.4] as const,
  timelineReveal: [7.4, 8.55] as const,
  dufuEntry: [8.05, 9.0] as const,
  liubangEntry: [10.75, 11.7] as const,
  recordsLink: [14.99, 16.62] as const,
  timeTravel: [16.62, 20.4] as const,
  eventNodes: [17.22, 18.45, 19.94] as const,
  archiveHandoff: [20.4, 21.6] as const,
});

const W = 1920;
const H = 1080;
const SAFE_Y = 760;
const PAPER = '#e7ddc8';
const INK = '#30251a';
const RED = '#a8402c';
const BEZIER_PAPER = bezier(0.4, 0, 0.2, 1);
const BEZIER_ROLL = bezier(0.45, 0.05, 0.25, 1);
const CLAMP = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

const sec = (s: number, fps: number) => s * fps;
const pBetween = (frame: number, start: number, end: number, fps: number, ease = EASE.smooth) =>
  ramp(frame, sec(start, fps), sec(end, fps) - sec(start, fps), ease);

// Stable, slightly irregular paper edge, adapted from 06-collage's cutQuad().
// Variations are fixed in source (no frame-time jitter or random edge changes).
const QUAD = 'polygon(0.25% 0.5%, 99.7% 0%, 100% 99.6%, 0% 100%)';
const TORN_EDGE = [0, 9, -5, 8, -7, 5, -3, 7, -4, 6, -6, 4, -2, 5, -4, 3, -2];
function scrollRevealClip(progress: number) {
  // The container itself grows with progress. Keep its clip at the leading
  // edge and use a few fixed offsets as a restrained torn-strip contour.
  const roughness = 0.12 + 0.1 * (1 - progress);
  const points = ['0% 0%', '100% 0%'];
  TORN_EDGE.forEach((offset, i) => {
    const y = ((i + 1) / (TORN_EDGE.length + 1)) * 100;
    const x = Math.max(98.8, Math.min(100, 100 + offset * roughness / 100));
    points.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
  });
  points.push('100% 100%', '0% 100%');
  return `polygon(${points.join(',')})`;
}

function PaperDesk({ light }: { light: number }) {
  const top = interpolateColors(light, [0, 1], ['#493724', '#eee4cf']);
  const middle = interpolateColors(light, [0, 1], ['#665039', '#dfd2b4']);
  const bottom = interpolateColors(light, [0, 1], ['#403020', '#c9b896']);
  return (
    <>
      {/* Continue the desk paper through the full frame; scene objects still stay above SAFE_Y. */}
      <AbsoluteFill style={{ height: H, background: `linear-gradient(180deg, ${top} 0%, ${middle} 57%, ${bottom} 100%)` }} />
      <div style={{
        position: 'absolute', left: 82, top: 60, width: 1756, height: 690,
        clipPath: QUAD, background: `linear-gradient(180deg, ${top} 0%, ${middle} 62%, ${bottom} 100%)`,
        boxShadow: softShadow(8, { color: '#2a1d10', strength: 1.1 }),
      }} />
      <div style={{
        position: 'absolute', left: 100, top: 64, width: 1718, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(255,246,224,.35) 10%, rgba(255,246,224,.22) 90%, transparent)',
      }} />
    </>
  );
}

function ScrollUnfurl({ frame, fps }: { frame: number; fps: number }) {
  const reveal = pBetween(frame, ...INTRO_V2_CUES.scrollUnfurl, fps, BEZIER_ROLL);
  if (reveal <= 0.001) return null;
  // The approved source is 2172×724: roller / paper / roller are separate
  // source regions. Scale all three by one shared ratio; only the paper clip
  // grows, the left roller stays pinned and the right roller tracks its edge.
  const ratio = 1500 / 2172;
  const leftRoll = 155 * ratio;
  const sheetW = (2018 - 155) * ratio;
  const rightRoll = (2172 - 2018) * ratio;
  const sheetVisible = sheetW * reveal;
  const scrollLeft = 310;
  const edgeX = scrollLeft + leftRoll + sheetVisible;
  const fullImage = staticFile('assets/scroll_cutout_v2.png');
  const imageStyle: React.CSSProperties = {
    position: 'absolute', top: 0, width: 1500, height: 500,
    objectFit: 'fill', filter: 'grayscale(1) sepia(.35)',
  };
  return (
    <>
      {/* Fixed left roller, clipped directly from its real source coordinates. */}
      <div style={{ position: 'absolute', left: scrollLeft, top: 190, width: leftRoll, height: 500, overflow: 'hidden', filter: 'drop-shadow(0 8px 12px rgba(45,30,15,.28))' }}>
        <Img
          src={fullImage}
          style={{ ...imageStyle, left: 0, display: 'block' }}
        />
      </div>
      {/* The paper body is revealed through a torn-strip mask, not squeezed. */}
      <div style={{
        position: 'absolute', left: scrollLeft + leftRoll, top: 190, width: sheetVisible, height: 500,
        overflow: 'hidden', clipPath: scrollRevealClip(reveal),
      }}>
        <Img src={fullImage} style={{ ...imageStyle, left: -leftRoll, display: 'block' }} />
      </div>
      <div style={{
          position: 'absolute', left: edgeX, top: 190, width: rightRoll, height: 500, overflow: 'hidden',
          transform: `rotate(${((1 - reveal) * -1.1).toFixed(3)}deg)`, transformOrigin: '50% 50%',
          filter: 'drop-shadow(7px 4px 12px rgba(42,26,13,.3))',
        }}>
          <Img src={fullImage} style={{ ...imageStyle, left: -(leftRoll + sheetW), display: 'block' }} />
      </div>
    </>
  );
}

const PEOPLE = [
  { id: 'dufu', name: '杜甫', src: 'assets/dufu_reference_v2.png', left: 548, width: 289, nameLeft: 848, start: 8.05 },
  { id: 'liubang', name: '刘邦', src: 'assets/liubang_reference_v2.png', left: 1093, width: 340, nameLeft: 983, start: 10.75 },
] as const;

function Person({ person, frame, fps, archive }: { person: typeof PEOPLE[number]; frame: number; fps: number; archive: number }) {
  const enter = pBetween(frame, person.start, person.start + 0.95, fps, EASE.out);
  const y = 130 + 16 * (1 - enter) + archive * 42;
  const labelStart = (person.start + 0.18) * fps;
  return (
    <>
      <div style={{
        position: 'absolute', left: person.left + person.width * 0.15, top: 534 + archive * 42, width: person.width * 0.7, height: 27,
        borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(53,36,20,.24), transparent 72%)',
        opacity: enter,
      }} />
      <div style={{
        position: 'absolute', left: person.left, top: y, width: person.width, height: 420,
        // The 06-collage piece() transform becomes a uniform whole-cutout
        // settle. There are no split-face parts or x/y distortion.
        opacity: enter, transform: `translateY(${((1 - enter) * 10).toFixed(2)}px) scale(${(0.985 + 0.015 * enter).toFixed(4)})`,
        transformOrigin: '50% 100%',
      }}>
        <Img src={staticFile(person.src)} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: 'grayscale(1) sepia(.35) drop-shadow(0 8px 12px rgba(39,25,12,.18))' }} />
      </div>
      <div style={{
        position: 'absolute', left: person.nameLeft, top: 315, width: 102, height: 48,
        display: 'grid', placeItems: 'center', opacity: enter,
        clipPath: 'polygon(2% 0,98% 1%,100% 97%,0 100%)',
        background: 'rgba(244,235,215,.9)', border: '1px solid rgba(83,62,36,.35)',
        boxShadow: softShadow(3, { color: '#2a1d10', strength: 0.75 }),
      }}>
        <TextReveal text={person.name} start={labelStart} each={2} variant="rise" ease={EASE.out} style={{ fontFamily: '"Songti SC", "Noto Serif SC", serif', fontSize: 29, fontWeight: 650, color: INK, letterSpacing: '0.08em' }} />
      </div>
    </>
  );
}

function RecordLink({ frame, fps }: { frame: number; fps: number }) {
  const progress = pBetween(frame, ...INTRO_V2_CUES.recordsLink, fps, EASE.smooth);
  if (progress <= 0.001) return null;
  const x0 = 837, y0 = 490, x1 = 1093, y1 = 490;
  const cx = (x0 + x1) / 2, cy = 424;
  const point = (p: number) => ({
    x: (1 - p) * (1 - p) * x0 + 2 * (1 - p) * p * cx + p * p * x1,
    y: (1 - p) * (1 - p) * y0 + 2 * (1 - p) * p * cy + p * p * y1,
  });
  const end = point(progress);
  return (
    <svg width={W} height={SAFE_Y} viewBox={`0 0 ${W} ${SAFE_Y}`} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
      <path d={`M${x0} ${y0} Q${cx} ${cy} ${end.x} ${end.y}`} fill="none" stroke="rgba(168,64,44,.22)" strokeWidth="10" strokeLinecap="round" />
      <path d={`M${x0} ${y0} Q${cx} ${cy} ${end.x} ${end.y}`} fill="none" stroke={RED} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={x0} cy={y0} r="6" fill={RED} />
      {progress > 0.985 && <circle cx={x1} cy={y1} r="6" fill={RED} />}
      <circle cx={end.x} cy={end.y} r="5" fill="#f1cf90" stroke={RED} strokeWidth="2" />
    </svg>
  );
}

const AXIS = { x0: 365, x1: 1790, y: 590, travelEnd: 820 };
const NODES = [
  { x: 1010, title: '过去', tag: '记录 01' },
  { x: 1360, title: '千年', tag: '记录 02' },
  { x: 1710, title: '今天', tag: '今日' },
] as const;

function camXAt(frame: number, fps: number) {
  // Adapted from TimelineTravel.tsx: camera progress is eased in segments so
  // nodes cross a gate in sequence; the original's long sprint/overshoot is removed.
  const start = sec(INTRO_V2_CUES.timeTravel[0], fps);
  const end = sec(INTRO_V2_CUES.timeTravel[1], fps);
  const u = interpolate(frame, [start, end], [0, 1], CLAMP);
  const eased = interpolate(u, [0, 0.15, 0.88, 1], [0, 0.055, 0.9, 1], {
    easing: Easing.inOut(Easing.quad), ...CLAMP,
  });
  return eased * AXIS.travelEnd;
}

function popFrameOf(nodeX: number, fps: number) {
  const start = sec(INTRO_V2_CUES.timeTravel[0], fps);
  const end = sec(INTRO_V2_CUES.timeTravel[1], fps);
  const threshold = nodeX - 960;
  // Same threshold crossing strategy as TimelineTravel.tsx's popFrameOf().
  for (let f = Math.floor(start); f <= Math.ceil(end); f++) {
    if (camXAt(f, fps) >= threshold) return f - 4;
  }
  return end;
}

function EventCard({ node, frame, fps, cameraX, show }: {
  node: typeof NODES[number]; frame: number; fps: number; cameraX: number; show: number;
}) {
  const popAt = popFrameOf(node.x, fps);
  const settle = ramp(frame, popAt, 15, EASE.out);
  if (settle <= 0.001 || show <= 0.001) return null;
  const cardWidth = 206;
  const left = node.x - cameraX - cardWidth / 2;
  return (
    <div style={{
      position: 'absolute', left, top: 612 + (1 - settle) * 18, width: cardWidth, height: 90,
      padding: '11px 17px', boxSizing: 'border-box', clipPath: QUAD,
      background: 'linear-gradient(180deg,#f5ecd8 0%,#e6d9bd 100%)',
      border: '1px solid rgba(80,58,32,.32)',
      boxShadow: softShadow(6 + (1 - settle) * 5, { color: '#2a1d10', strength: 1 }),
      opacity: settle * show,
      zIndex: 20,
      transform: `scale(${(0.975 + 0.025 * settle).toFixed(4)})`, transformOrigin: '50% 100%',
    }}>
      <div style={{ position: 'absolute', left: 15, top: 14, width: 4, height: 50, background: RED, opacity: 0.82 }} />
      <div style={{ marginLeft: 15, color: '#806b4d', fontFamily: 'ui-monospace,monospace', fontSize: 17, letterSpacing: '0.08em' }}>{node.tag}</div>
      <div style={{ margin: '4px 0 0 15px', color: INK, fontFamily: '"Songti SC","Noto Serif SC",serif', fontSize: 27, fontWeight: 650 }}>
        <TextReveal text={node.title} start={popAt + 2} each={1.5} variant="blur" ease={EASE.out} />
      </div>
      <div style={{ position: 'absolute', left: cardWidth / 2, top: -20, width: 1, height: 20, background: 'rgba(168,64,44,.65)' }} />
      <div style={{ position: 'absolute', left: cardWidth / 2 - 5, top: -26, width: 11, height: 11, borderRadius: '50%', background: RED, boxShadow: '0 0 0 5px rgba(168,64,44,.12)' }} />
    </div>
  );
}

function TimeTravel({ frame, fps }: { frame: number; fps: number }) {
  const reveal = pBetween(frame, ...INTRO_V2_CUES.timelineReveal, fps, EASE.out);
  if (reveal <= 0.001) return null;
  const travel = pBetween(frame, ...INTRO_V2_CUES.timeTravel, fps, EASE.smooth);
  const handoff = pBetween(frame, ...INTRO_V2_CUES.archiveHandoff, fps, EASE.smooth);
  const cameraX = camXAt(frame, fps);
  const endFrame = sec(INTRO_V2_CUES.timeTravel[1], fps);
  const stop = ramp(frame, endFrame - 9, 9, BEZIER_PAPER);
  const axisOpacity = reveal * (1 - 0.08 * travel - 0.34 * handoff);
  return (
    <>
      <svg width={W} height={SAFE_Y} viewBox={`0 0 ${W} ${SAFE_Y}`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: axisOpacity }}>
        <g transform={`translate(${-cameraX.toFixed(2)} 0)`}>
          <path d={`M${AXIS.x0} ${AXIS.y + 5} H${AXIS.x1}`} stroke="rgba(48,37,26,.22)" strokeWidth="8" strokeLinecap="round" />
          <path d={`M${AXIS.x0} ${AXIS.y} H${AXIS.x1}`} stroke="#765d3b" strokeWidth="3" strokeLinecap="round" />
          <path d={`M${AXIS.x0} ${AXIS.y - 3} H${AXIS.x1}`} stroke="rgba(255,246,224,.72)" strokeWidth="1.5" />
          {Array.from({ length: 27 }, (_, i) => {
            const x = AXIS.x0 + (AXIS.x1 - AXIS.x0) * i / 26;
            const major = i % 5 === 0;
            return <line key={i} x1={x} y1={AXIS.y - (major ? 15 : 7)} x2={x} y2={AXIS.y + (major ? 15 : 7)} stroke={major ? '#6f5331' : 'rgba(111,83,49,.58)'} strokeWidth={major ? 2.3 : 1.2} />;
          })}
          {NODES.map((node, i) => {
            const lit = i === 0 ? Math.max(0.22, travel) : 0.16;
            return (
              <g key={node.tag}>
                <circle cx={node.x} cy={AXIS.y} r={22 + lit * 5} fill={`rgba(168,64,44,${0.08 + lit * 0.13})`} />
                <circle cx={node.x} cy={AXIS.y} r="10" fill={lit > 0.3 ? RED : PAPER} stroke={RED} strokeWidth="3" />
                {frame < sec(INTRO_V2_CUES.timeTravel[0], fps) && (
                  <text x={node.x} y={AXIS.y - 28} textAnchor="middle" fill="#6c5c45" fontSize="21" fontFamily="Songti SC,serif">{node.title}</text>
                )}
              </g>
            );
          })}
        </g>
        {/* The marker moves across a fixed pointer; progress is continuous and deterministic. */}
        <path d={`M${430} ${AXIS.y - 25} v50`} stroke={RED} strokeWidth="2" opacity={0.6 + travel * 0.4} />
        <path d={`M430 ${AXIS.y - 25} l-7 -11 h14 Z`} fill={RED} opacity={0.6 + travel * 0.4} />
      </svg>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: SAFE_Y, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: reveal }}>
          {NODES.map((node) => <EventCard key={node.tag} node={node} frame={frame} fps={fps} cameraX={cameraX} show={travel * (1 - handoff)} />)}
        </div>
      </div>
    </>
  );
}

function ArchiveHandoff({ frame, fps }: { frame: number; fps: number }) {
  const p = pBetween(frame, ...INTRO_V2_CUES.archiveHandoff, fps, BEZIER_PAPER);
  if (p <= 0.001) return null;
  const cards = [
    { left: 495, label: '杜甫 · 人物档案' },
    { left: 1015, label: '刘邦 · 经历档案' },
  ];
  return (
    <>
      {cards.map((card, i) => (
        <div key={card.label} style={{
          position: 'absolute', left: card.left, top: 113 + 14 * (1 - p), width: 410, height: 474,
          clipPath: QUAD, background: 'rgba(245,237,218,.93)',
          border: '1px solid rgba(83,62,36,.38)',
          boxShadow: softShadow(8, { color: '#2a1d10', strength: 0.9 }),
          opacity: 0.82 * p,
        }}>
          <div style={{ position: 'absolute', left: 18, top: 16, padding: '6px 12px', background: 'rgba(168,64,44,.1)', borderLeft: `3px solid ${RED}`, color: RED, fontFamily: '"Songti SC","Noto Serif SC",serif', fontSize: 20, letterSpacing: '0.06em' }}>
            <TextReveal text={card.label} start={sec(INTRO_V2_CUES.archiveHandoff[0] + 0.1 + i * 0.12, fps)} by="char" each={1} variant="rise" ease={EASE.out} />
          </div>
        </div>
      ))}
      <div style={{
        position: 'absolute', left: 835, top: 104, width: 250, height: 58,
        display: 'grid', placeItems: 'center', clipPath: QUAD,
        background: '#e9dcc0', border: `1px solid rgba(83,62,36,.4)`,
        boxShadow: softShadow(4, { color: '#2a1d10', strength: 0.8 }), opacity: p,
      }}>
        <TextReveal text="经历档案" start={sec(INTRO_V2_CUES.archiveHandoff[0] + 0.12, fps)} by="char" each={2} variant="rise" ease={EASE.out} style={{ color: RED, fontFamily: '"Songti SC","Noto Serif SC",serif', fontSize: 31, fontWeight: 700, letterSpacing: '0.18em' }} />
      </div>
    </>
  );
}

export const INTRO_PROCESS_V2_DURATION_IN_FRAMES = 648; // 21.6 s at the approved 30 fps output.

export const IntroProcess: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const light = pBetween(frame, ...INTRO_V2_CUES.lightSpread, fps, EASE.smooth);
  const ignition = pBetween(frame, ...INTRO_V2_CUES.lampIgnition, fps, EASE.out);
  const archive = pBetween(frame, ...INTRO_V2_CUES.archiveHandoff, fps, EASE.smooth);
  const flameShape = 0.985 + 0.015 * Math.sin(frame / (fps * 0.38));
  if (t > INTRO_V2_CUES.duration) return null;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: PAPER }}>
      <Stage
        look={LOOKS.paper}
        keyLight={{ x: 0.27, y: 0.34 }}
        fill={{ x: 0.64, y: 0.48 }}
        intensity={0.34 + light * 0.62}
        breathe={0}
        vignette={0.11}
        grain={0}
      />
      <PaperDesk light={light} />

      <ScrollUnfurl frame={frame} fps={fps} />
      <TimeTravel frame={frame} fps={fps} />
      <RecordLink frame={frame} fps={fps} />
      <ArchiveHandoff frame={frame} fps={fps} />

      {/* The lantern's state is the changing light field, not a camera zoom. */}
      <div style={{
        position: 'absolute', left: 0, top: 0, width: W, height: SAFE_Y, pointerEvents: 'none',
        opacity: ignition,
        background: `radial-gradient(circle ${Math.round(120 + 620 * light)}px at 14% 30.4%, rgba(242,188,102,.5) 0%, rgba(206,146,68,.2) 40%, transparent 100%)`,
      }} />
      <Img
        src={staticFile('assets/lamp_cutout_v2.png')}
        style={{
          position: 'absolute', left: 4, top: 285, width: 300, height: 255.18, objectFit: 'contain',
          opacity: 0.62 + 0.38 * ignition,
          filter: 'grayscale(1) sepia(.35) drop-shadow(0 14px 16px rgba(39,25,12,.32))',
        }}
      />
      <svg width="74" height="92" viewBox="0 0 74 92" aria-hidden="true" style={{ position: 'absolute', left: 231, top: 241, opacity: ignition, pointerEvents: 'none', transform: `scaleY(${flameShape})`, transformOrigin: '50% 100%' }}>
        <ellipse cx="37" cy="48" rx="31" ry="39" fill="rgba(246,178,75,.22)" filter="blur(14px)" />
        <path d="M37 82 C17 70 27 53 37 15 C44 39 59 48 53 67 C50 76 45 80 37 82Z" fill="#c16b2d" />
        <path d="M38 75 C29 67 35 53 40 38 C48 55 49 66 43 73 C42 75 40 76 38 75Z" fill="#f2c36b" />
        <path d="M39 68 C36 63 39 57 41 52 C44 60 44 65 41 68Z" fill="#fff1cc" />
      </svg>

      {PEOPLE.map((person) => <Person key={person.id} person={person} frame={frame} fps={fps} archive={archive} />)}

      {/* Grain is confined to the visual stage; the root owns the subtitle band. */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: SAFE_Y, overflow: 'hidden', pointerEvents: 'none' }}>
        <Grain opacity={0.028} step={3} blend="overlay" />
      </div>
    </AbsoluteFill>
  );
};
