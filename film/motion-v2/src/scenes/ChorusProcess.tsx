import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { bezier, EASE, ramp, softShadow } from '../vendor/shotcraft/Polish';
import { LOOKS, Stage } from '../vendor/shotcraft/Look';

/** Absolute song-time marks shared by both chorus passes. */
export const CHORUS_PROCESS_CUES = Object.freeze({
  intro: {
    start: 21.6,
    archiveSettle: 24.663,
    sharedRoute: 24.663,
    archiveConverge: 26.623,
    lampIgnition: 27.93,
    end: 30,
  },
  reprise: {
    start: 74.3,
    travelEnd: 82.414,
    accompany: 82.414,
    archiveUnion: 86.494,
    lightHandoff: 88.126,
    end: 90,
    eventTimes: [74.84, 76.88, 78.92, 80.96] as const,
  },
});

const W = 1920;
const H = 1080;
const SAFE_Y = 760;
const PAPER = '#e7ddc8';
const INK = '#30251a';
const RED = '#a8402c';
const GOLD = '#e4b867';
const ASSET_FILTER = 'grayscale(1) sepia(.35)';
const CARD_CUT = 'polygon(.35% .2%,99.7% 0,100% 99.6%,0 100%)';
const CURVE = bezier(0.4, 0, 0.2, 1);
const QUAD_EASE = bezier(0.45, 0.04, 0.25, 1);
const CLAMP = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

type SceneProps = { globalTime?: number; reprise?: boolean };

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const r = (n: number) => Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
const at = (now: number, start: number, end: number, ease = EASE.out) =>
  ramp(now, start, Math.max(0.001, end - start), ease);
const image = (name: string) => staticFile(`assets/${name}`);

function LampFlame({ left, top, width, height, strength, phase = 0 }: {
  left: number; top: number; width: number; height: number; strength: number; phase?: number;
}) {
  if (strength <= 0.001) return null;
  // Source wick anchor: 1360×1157 lamp cutout, wick at roughly (88%, 17%).
  const wickX = left + width * 0.88;
  const wickY = top + height * 0.17;
  const flicker = 1 + 0.018 * Math.sin(phase * 8.1 + wickY / 16);
  return (
    <>
      <div style={{
        position: 'absolute', left: wickX - 178, top: wickY - 156, width: 356, height: 312,
        borderRadius: '50%', pointerEvents: 'none', opacity: strength * 0.88,
        zIndex: 28,
        background: 'radial-gradient(ellipse, rgba(244,185,91,.33) 0%, rgba(222,155,70,.15) 35%, rgba(205,139,59,0) 72%)',
        filter: 'blur(7px)',
      }} />
      <svg width="84" height="112" viewBox="0 0 84 112" aria-hidden="true" style={{
        position: 'absolute', left: wickX - 42, top: wickY - 98, overflow: 'visible',
        pointerEvents: 'none', opacity: strength, zIndex: 28, transform: `scaleY(${flicker})`, transformOrigin: '50% 100%',
      }}>
        <ellipse cx="42" cy="65" rx="31" ry="40" fill="rgba(246,177,73,.23)" filter="blur(12px)" />
        <path d="M42 102 C20 83 32 60 43 12 C54 47 68 67 54 91 C51 98 47 101 42 102Z" fill="#c16b2d" />
        <path d="M43 94 C33 81 40 61 46 41 C54 62 57 79 49 91 C47 94 45 95 43 94Z" fill="#f2ca70" />
        <path d="M45 88 C41 77 45 68 49 58 C53 73 52 81 48 87Z" fill="#fff0bc" />
      </svg>
    </>
  );
}

function PaperCard({ left, top, width, height, opacity = 1, children, style }: {
  left: number; top: number; width: number; height: number; opacity?: number;
  children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      position: 'absolute', left, top, width, height, boxSizing: 'border-box',
      overflow: 'hidden', clipPath: CARD_CUT, opacity,
      background: 'linear-gradient(150deg, rgba(250,244,230,.98), rgba(230,217,190,.97))',
      border: '1px solid rgba(83,62,36,.25)',
      boxShadow: `${softShadow(8, { color: '#352414', strength: 0.86 })}, inset 0 1px 0 rgba(255,255,255,.78)`,
      ...style,
    }}>{children}</div>
  );
}

function PersonArchive({ kind, now, left, arrive, converge }: {
  kind: 'dufu' | 'liubang'; now: number; left: number; arrive: number; converge: number;
}) {
  const isDufu = kind === 'dufu';
  const name = isDufu ? '杜甫' : '刘邦';
  const photo = isDufu ? 'dufu_reference_v2.png' : 'liubang_reference_v2.png';
  const tags = isDufu ? ['夜晚', '未竟'] : ['走过'];
  const imageHeight = 306;
  return (
    <PaperCard left={left} top={98 - (1 - arrive) * 22} width={450} height={446} opacity={arrive} style={{
      transform: `translateY(${r((1 - arrive) * 16)}px)`,
    }}>
      <div style={{ position: 'absolute', left: 24, right: 24, top: 19, height: 38, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 5, height: 30, background: RED }} />
        <span style={{ fontFamily: '"Songti SC","Noto Serif SC",serif', fontSize: 25, fontWeight: 720, color: INK }}>{name}</span>
        <span style={{ marginLeft: 'auto', color: '#83745e', fontSize: 17, letterSpacing: '.08em' }}>经历档案</span>
      </div>
      <div style={{ position: 'absolute', left: 24, top: 67, width: 402, height: imageHeight, overflow: 'hidden', background: 'linear-gradient(180deg,rgba(219,206,180,.34),rgba(242,233,214,.18))', border: '1px solid rgba(77,57,34,.17)' }}>
        <Img src={image(photo)} style={{
          width: '100%', height: '100%', objectFit: 'contain', display: 'block',
          filter: `${ASSET_FILTER} drop-shadow(0 8px 9px rgba(43,29,16,.15))`,
          transform: `translateY(${r((1 - converge) * 2)}px)`,
        }} />
      </div>
      <div style={{ position: 'absolute', left: 26, bottom: 19, display: 'flex', gap: 10 }}>
        {tags.map((tag) => <span key={tag} style={{
          padding: '5px 13px', background: 'rgba(168,64,44,.075)', borderLeft: `2px solid ${RED}`,
          color: '#715d45', fontSize: 19, letterSpacing: '.04em',
        }}>{tag}</span>)}
      </div>
      {now >= CHORUS_PROCESS_CUES.intro.archiveSettle && <div style={{
        position: 'absolute', right: 18, bottom: 20, color: 'rgba(83,62,36,.48)',
        fontFamily: 'ui-monospace,monospace', fontSize: 15, letterSpacing: '.1em',
      }}>ARCHIVE / {isDufu ? '01' : '02'}</div>}
    </PaperCard>
  );
}

const INTRO_THUMBS = [
  { x: 510, src: 'dufu_reference_v2.png', tag: '未竟' },
  { x: 930, src: 'liubang_reference_v2.png', tag: '走过' },
  { x: 1350, src: 'lamp_cutout_v2.png', tag: '灯火' },
] as const;

function IntroRoute({ now }: { now: number }) {
  const cursor = interpolate(now, [24.663, 26.623], [278, 1638], { easing: CURVE, ...CLAMP });
  const reveal = at(now, 24.663, 24.94, EASE.out);
  const routeEnd = at(now, 24.663, 26.623, CURVE);
  return (
    <>
      {INTRO_THUMBS.map((thumb) => {
        const wipe = clamp01((cursor - (thumb.x - 92)) / 172);
        return (
          <div key={thumb.tag} style={{ position: 'absolute', left: thumb.x - 82, top: 566, width: 164, height: 94, opacity: reveal, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', clipPath: `inset(0 ${r((1 - wipe) * 100)}% 0 0)` }}>
              <Img src={image(thumb.src)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 43%', filter: ASSET_FILTER, display: 'block' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 29, display: 'flex', alignItems: 'center', paddingLeft: 9, color: '#fff8e8', fontSize: 17, background: 'linear-gradient(90deg,rgba(48,37,26,.78),rgba(48,37,26,.18))' }}>{thumb.tag}</div>
            </div>
            <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(73,53,31,.32)', boxShadow: softShadow(3, { color: '#322212', strength: 0.48 }) }} />
          </div>
        );
      })}
      <svg width={W} height={SAFE_Y} viewBox={`0 0 ${W} ${SAFE_Y}`} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
        <path d="M278 696 H1638" stroke="rgba(71,55,35,.2)" strokeWidth="7" strokeLinecap="round" />
        <path d={`M278 696 H${r(278 + 1360 * routeEnd)}`} stroke={RED} strokeWidth="3" strokeLinecap="round" />
        {INTRO_THUMBS.map((thumb) => <g key={thumb.tag}>
          <circle cx={thumb.x} cy="696" r="11" fill="#eee2ca" stroke={RED} strokeWidth="3" />
          <circle cx={thumb.x} cy="696" r="3.5" fill={RED} />
        </g>)}
        <circle cx={cursor} cy="696" r="18" fill="rgba(222,164,82,.2)" />
        <circle cx={cursor} cy="696" r="8" fill={GOLD} stroke={RED} strokeWidth="2.5" />
      </svg>
    </>
  );
}

function IntroChorus({ now }: { now: number }) {
  const appear = at(now, 21.6, 22.28, EASE.out);
  const converge = at(now, 26.623, 27.48, QUAD_EASE);
  const lamp = at(now, 27.93, 28.55, EASE.out);
  const lampX = 1512;
  const lampY = 414;
  const lampW = 320;
  const lampH = lampW * 1157 / 1360;
  const wickX = lampX + lampW * 0.88;
  const wickY = lampY + lampH * 0.17;
  const pathP = at(now, 27.93, 29.22, CURVE);
  const warmPulse = lamp * (0.94 + 0.06 * Math.sin((now - 27.93) * Math.PI * 1.6));
  return (
    <>
      <PersonArchive kind="dufu" now={now} left={r(282 + 150 * converge)} arrive={appear} converge={converge} />
      <PersonArchive kind="liubang" now={now} left={r(1188 - 150 * converge)} arrive={appear} converge={converge} />
      <IntroRoute now={now} />
      <svg width={W} height={SAFE_Y} viewBox={`0 0 ${W} ${SAFE_Y}`} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
        <path d={`M1638 696 C${r(1666 - pathP * 14)} 640 ${r(wickX - 7)} ${r(wickY + 160)} ${r(wickX - 7)} ${r(wickY + 13)}`} fill="none" stroke="rgba(207,146,66,.28)" strokeWidth="13" strokeLinecap="round" />
        <path d={`M1638 696 C${r(1666 - pathP * 14)} 640 ${r(wickX - 7)} ${r(wickY + 160)} ${r(wickX - 7)} ${r(wickY + 13)}`} fill="none" stroke="#b97737" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="420" strokeDashoffset={r(420 * (1 - pathP))} />
      </svg>
      <div style={{ position: 'absolute', left: wickX - 160, top: wickY - 120, width: 320, height: 290, borderRadius: '50%', opacity: warmPulse, background: 'radial-gradient(ellipse,rgba(247,187,95,.22),rgba(208,143,61,.08) 42%,transparent 72%)', filter: 'blur(8px)', pointerEvents: 'none' }} />
      <Img src={image('lamp_cutout_v2.png')} style={{
        position: 'absolute', left: lampX, top: lampY, width: lampW, height: lampH,
        objectFit: 'contain', opacity: lamp, filter: `${ASSET_FILTER} drop-shadow(0 12px 15px rgba(44,29,14,.28))`,
        transform: `translateY(${r((1 - lamp) * 12)}px)`, transformOrigin: '50% 80%',
      }} />
      <LampFlame left={lampX} top={lampY} width={lampW} height={lampH} strength={lamp} phase={now} />
      <div style={{ position: 'absolute', left: 1490, top: 370, width: 360, height: 300, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(ellipse,rgba(238,179,84,.12),transparent 72%)', opacity: lamp * 0.85 }} />
    </>
  );
}

type RepriseCard = { label: string; file: string; focal: string; filter?: string };
const REPRISE_CARDS: RepriseCard[] = [
  { label: '长安', file: 'changan_ink_v2.png', focal: '50% 45%' },
  { label: '茅屋', file: 'hut_ink_v2.png', focal: '50% 52%' },
  { label: '付账', file: 'worker_badge_v2.png', focal: '50% 54%', filter: ASSET_FILTER },
  { label: '深夜', file: 'noodle_ink_v2.png', focal: '50% 47%' },
];

const GATE_X = 830;
const CAMERA_END = 1570;
const CARD_W = 350;
const CARD_H = 342;
const DEST_LEFT = [225, 409, 593, 777] as const;
const DEST_TOP = [294, 280, 266, 252] as const;

function camXAt(now: number, fps: number) {
  void fps;
  const { start, travelEnd } = CHORUS_PROCESS_CUES.reprise;
  return ramp(now, start, travelEnd - start, QUAD_EASE) * CAMERA_END;
}

/** Event-frame threshold adaptation from TimelineTravel.tsx: cards activate as the moving camera reaches a gate. */
export function repriseEventFrame(index: number, fps: number) {
  const cue = CHORUS_PROCESS_CUES.reprise.eventTimes[index];
  if (cue === undefined) return null;
  const expectedNodeX = GATE_X + camXAt(cue, fps);
  const threshold = expectedNodeX - GATE_X;
  const first = Math.floor(CHORUS_PROCESS_CUES.reprise.start * fps);
  const last = Math.ceil(CHORUS_PROCESS_CUES.reprise.travelEnd * fps);
  for (let frame = first; frame <= last; frame++) {
    if (camXAt(frame / fps, fps) >= threshold) return frame;
  }
  return Math.round(cue * fps);
}

function ArchiveEventCard({ card, index, now, fps }: {
  card: RepriseCard; index: number; now: number; fps: number;
}) {
  const eventFrame = repriseEventFrame(index, fps) ?? Math.round(now * fps);
  const eventTime = eventFrame / fps;
  const worldX = GATE_X + camXAt(eventTime, fps);
  const visibleAt = eventTime - 0.62;
  const appear = at(now, visibleAt, eventTime + 0.12, EASE.out);
  if (now < visibleAt) return null;
  const pop = at(now, eventTime - 0.03, eventTime + 0.32, EASE.out);
  const transferStart = eventTime + 0.43;
  const transferEnd = transferStart + 0.77;
  const transfer = at(now, transferStart, transferEnd, QUAD_EASE);
  const cameraLeft = worldX - camXAt(Math.min(now, transferStart), fps) - CARD_W / 2;
  const transferLeft = worldX - camXAt(transferStart, fps) - CARD_W / 2;
  const destination = DEST_LEFT[index];
  const left = now <= transferStart ? cameraLeft : transferLeft + (destination - transferLeft) * transfer;
  const top = now <= transferStart ? 204 - pop * 18 : 204 - pop * 18 + (DEST_TOP[index] - 204 + pop * 18) * transfer;
  const z = now > transferStart ? 20 + index : 4 + index;
  const mask = clamp01((now - visibleAt) / Math.max(0.001, eventTime + 0.24 - visibleAt));
  const stamp = at(now, eventTime + 0.06, eventTime + 0.3, EASE.out);
  const settled = at(now, transferEnd - 0.08, transferEnd + 0.2, EASE.out);
  return (
    <div style={{
      position: 'absolute', left: r(left), top: r(top), width: CARD_W, height: CARD_H,
      boxSizing: 'border-box', padding: 11, zIndex: z, clipPath: CARD_CUT,
      background: 'linear-gradient(155deg,#f7efdc,#e4d6b8)',
      border: '1px solid rgba(80,58,32,.32)',
      boxShadow: `${softShadow(7 + pop * 8, { color: '#2a1d10', strength: 0.92 })}, inset 0 1px 0 rgba(255,255,255,.8)`,
      opacity: appear,
      transform: `rotate(${r((index % 2 ? 1 : -1) * (1 - settled) * 1.2)}deg) scale(${r(0.985 + pop * 0.022)})`,
      transformOrigin: '50% 100%',
    }}>
      <div style={{ position: 'relative', width: '100%', height: 250, overflow: 'hidden', background: '#d8c8a8', border: '1px solid rgba(75,53,31,.25)' }}>
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${r((1 - mask) * 100)}% 0 0)` }}>
          <Img src={image(card.file)} style={{
            width: '100%', height: '100%', display: 'block', objectFit: 'cover', objectPosition: card.focal,
            filter: card.filter,
          }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(255,250,230,.27)', pointerEvents: 'none' }} />
      </div>
      <div style={{ position: 'absolute', left: 18, bottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: INK }}>
        <span style={{ width: 4, height: 25, background: RED }} />
        <span style={{ fontFamily: '"Songti SC","Noto Serif SC",serif', fontSize: 26, fontWeight: 720 }}>{card.label}</span>
        <span style={{ marginLeft: 4, color: '#76664f', fontSize: 16, letterSpacing: '.08em' }}>档案节点</span>
      </div>
      <div style={{
        position: 'absolute', right: 14, top: 14, width: 90, height: 43, display: 'grid', placeItems: 'center',
        border: '2px solid rgba(168,64,44,.77)', color: RED, background: 'rgba(245,234,212,.76)',
        fontFamily: '"Songti SC","Noto Serif SC",serif', fontSize: 22, fontWeight: 720, letterSpacing: '.08em',
        opacity: stamp, transform: `rotate(-7deg) translateY(${r((1 - stamp) * -7)}px)`,
      }}>经历</div>
      <div style={{ position: 'absolute', left: 19, top: 268, width: 68 + index * 18, height: 2, background: RED, opacity: 0.34 + settled * 0.34 }} />
    </div>
  );
}

function RepriseTimeline({ now, fps }: { now: number; fps: number }) {
  return (
    <svg width={W} height={SAFE_Y} viewBox={`0 0 ${W} ${SAFE_Y}`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <path d="M150 674 H1780" stroke="rgba(63,48,31,.18)" strokeWidth="8" strokeLinecap="round" />
      <path d={`M${GATE_X} 636 V710`} stroke={RED} strokeWidth="2" opacity=".72" />
      <path d={`M${GATE_X - 9} 636 L${GATE_X} 624 L${GATE_X + 9} 636 Z`} fill={RED} />
      {REPRISE_CARDS.map((item, i) => {
        const eventFrame = repriseEventFrame(i, fps)!;
        const event = eventFrame / fps;
        const nodeX = GATE_X + camXAt(event, fps) - camXAt(now, fps);
        const shown = at(now, CHORUS_PROCESS_CUES.reprise.eventTimes[i] - 0.2, CHORUS_PROCESS_CUES.reprise.eventTimes[i] + 0.25, EASE.out);
        return <g key={item.label} opacity={0.2 + shown * 0.8}>
          <circle cx={nodeX} cy="674" r="18" fill="rgba(168,64,44,.12)" />
          <circle cx={nodeX} cy="674" r="8" fill={shown > 0.7 ? RED : PAPER} stroke={RED} strokeWidth="2.5" />
        </g>;
      })}
      <circle cx={GATE_X} cy="674" r="17" fill="rgba(224,169,88,.2)" />
      <circle cx={GATE_X} cy="674" r="7" fill={GOLD} stroke={RED} strokeWidth="2" />
    </svg>
  );
}

function DufuCompanion({ now }: { now: number }) {
  const enter = at(now, 82.414, 83.02, EASE.out);
  const exit = at(now, 86.35, 86.9, EASE.exit);
  const visible = enter * (1 - exit);
  const left = 1094 + 32 * at(now, 82.414, 86.35, CURVE);
  return (
    <>
      <div style={{ position: 'absolute', left: left + 21, top: 575, width: 230, height: 26, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(48,37,26,.22),transparent 72%)', opacity: visible }} />
      <Img src={image('dufu_reference_v2.png')} style={{
        position: 'absolute', left: r(left), top: 132, width: 274, height: 446, objectFit: 'contain',
        opacity: visible, filter: `${ASSET_FILTER} drop-shadow(0 9px 12px rgba(42,27,13,.17))`,
      }} />
      <div style={{ position: 'absolute', left: left + 181, top: 422, padding: '5px 11px', borderLeft: `3px solid ${RED}`, background: 'rgba(246,238,221,.86)', color: INK, fontFamily: '"Songti SC","Noto Serif SC",serif', fontSize: 22, opacity: visible }}>杜甫 · 同行</div>
    </>
  );
}

function FinalDossier({ person, now, left, targetLeft, enter }: {
  person: 'dufu' | 'liubang'; now: number; left: number; targetLeft: number; enter: number;
}) {
  const dufu = person === 'dufu';
  const label = dufu ? '杜甫' : '刘邦';
  const file = dufu ? 'dufu_reference_v2.png' : 'liubang_reference_v2.png';
  const x = left + (targetLeft - left) * enter;
  return (
    <PaperCard left={r(x)} top={170 + (1 - enter) * 16} width={310} height={408} opacity={enter} style={{ zIndex: dufu ? 28 : 29 }}>
      <div style={{ position: 'absolute', left: 18, top: 16, right: 18, height: 36, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 4, height: 28, background: RED }} />
        <span style={{ fontFamily: '"Songti SC","Noto Serif SC",serif', color: INK, fontSize: 25, fontWeight: 720 }}>{label}</span>
        <span style={{ marginLeft: 'auto', color: '#76664f', fontSize: 15, letterSpacing: '.08em' }}>经历档案</span>
      </div>
      <div style={{ position: 'absolute', left: 17, top: 62, width: 274, height: 276, overflow: 'hidden', background: 'rgba(207,192,160,.32)', border: '1px solid rgba(78,56,32,.19)' }}>
        <Img src={image(file)} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: `${ASSET_FILTER} drop-shadow(0 6px 8px rgba(43,29,16,.15))` }} />
      </div>
      <div style={{ position: 'absolute', left: 19, bottom: 15, color: '#76664f', fontSize: 16, letterSpacing: '.08em' }}>{dufu ? '过往' : now >= 88.126 ? '灯下' : '新程'}</div>
    </PaperCard>
  );
}

function RepriseUnion({ now }: { now: number }) {
  const join = at(now, 86.494, 87.18, QUAD_EASE);
  const light = at(now, 88.126, 88.72, EASE.out);
  const lampX = 34;
  const lampY = 598;
  const lampW = 180;
  const lampH = lampW * 1157 / 1360;
  const wickX = lampX + lampW * 0.88;
  const wickY = lampY + lampH * 0.17;
  const pathProgress = at(now, 88.126, 89.34, CURVE);
  const unionProgress = at(now, 86.494, 87.66, CURVE);
  return (
    <>
      <svg width={W} height={SAFE_Y} viewBox={`0 0 ${W} ${SAFE_Y}`} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 5 }}>
        <path d="M1360 385 C1400 327 1434 327 1475 385" fill="none" stroke="rgba(168,64,44,.18)" strokeWidth="11" strokeLinecap="round" />
        <path d={`M1360 385 C1400 327 1434 327 ${r(1360 + 115 * unionProgress)} 385`} fill="none" stroke={RED} strokeWidth="3" strokeLinecap="round" />
        <circle cx={r(1360 + 115 * unionProgress)} cy="385" r="7" fill={GOLD} stroke={RED} strokeWidth="2" />
        <path d={`M${wickX} ${wickY} C${r(wickX + 210 * pathProgress)} ${r(wickY - 130 * pathProgress)} ${r(850 + 430 * pathProgress)} 420 ${r(1230 + 280 * pathProgress)} 402`} fill="none" stroke="rgba(204,145,67,.23)" strokeWidth="12" strokeLinecap="round" />
        <path d={`M${wickX} ${wickY} C${r(wickX + 210 * pathProgress)} ${r(wickY - 130 * pathProgress)} ${r(850 + 430 * pathProgress)} 420 ${r(1230 + 280 * pathProgress)} 402`} fill="none" stroke="#b97737" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1140" strokeDashoffset={r(1140 * (1 - pathProgress))} />
      </svg>
      <div style={{ position: 'absolute', left: wickX - 135, top: wickY - 130, width: 300, height: 260, borderRadius: '50%', opacity: light, background: 'radial-gradient(ellipse,rgba(244,184,89,.28),rgba(210,145,62,.1) 42%,transparent 73%)', filter: 'blur(7px)', pointerEvents: 'none', zIndex: 26 }} />
      <Img src={image('lamp_cutout_v2.png')} style={{
        position: 'absolute', left: lampX, top: lampY, width: lampW, height: lampH,
        objectFit: 'contain', opacity: light, zIndex: 27,
        filter: `${ASSET_FILTER} drop-shadow(0 10px 13px rgba(44,29,14,.27))`,
      }} />
      <LampFlame left={lampX} top={lampY} width={lampW} height={lampH} strength={light} phase={now} />
    </>
  );
}

function RepriseChorus({ now, fps }: { now: number; fps: number }) {
  const dufuUnionEnter = at(now, 86.494, 86.94, EASE.out);
  const unionEnter = at(now, 86.494, 87.06, EASE.out);
  return (
    <>
      <RepriseTimeline now={now} fps={fps} />
      {REPRISE_CARDS.map((card, index) => <ArchiveEventCard key={card.label} card={card} index={index} now={now} fps={fps} />)}
      <DufuCompanion now={now} />
      <FinalDossier person="dufu" now={now} left={1110} targetLeft={1110} enter={dufuUnionEnter} />
      <FinalDossier person="liubang" now={now} left={1530} targetLeft={1462} enter={unionEnter} />
      <RepriseUnion now={now} />
    </>
  );
}

export const ChorusProcess: React.FC<SceneProps> = ({ globalTime, reprise = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = reprise ? CHORUS_PROCESS_CUES.reprise.start : CHORUS_PROCESS_CUES.intro.start;
  const end = reprise ? CHORUS_PROCESS_CUES.reprise.end : CHORUS_PROCESS_CUES.intro.end;
  // When mounted in a local Sequence, local frame zero maps to this pass's song-time start.
  const now = globalTime === undefined ? start + frame / fps : globalTime;
  if (now < start || now > end) return null;
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: PAPER, fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif' }}>
      <Stage
        look={LOOKS.paper}
        keyLight={{ x: 0.36, y: 0.1 }}
        fill={{ x: 0.82, y: 0.92 }}
        intensity={0.43}
        breathe={0.035}
        vignette={0.09}
        grain={0.022}
      />
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: SAFE_Y, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 76, top: 38, width: 1768, height: SAFE_Y - 76, clipPath: CARD_CUT, background: 'linear-gradient(160deg,rgba(250,245,232,.32),rgba(211,197,169,.12))', boxShadow: softShadow(7, { color: '#302313', strength: 0.24 }) }} />
        {reprise ? <RepriseChorus now={now} fps={fps} /> : <IntroChorus now={now} />}
      </div>
    </AbsoluteFill>
  );
};
