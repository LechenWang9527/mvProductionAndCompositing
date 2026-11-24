import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { EASE, ramp, softShadow } from '../vendor/shotcraft/Polish';
import { LOOKS, Stage, TextReveal } from '../vendor/shotcraft/Look';

type SceneProps = {
  /** Absolute composition time in seconds. Omit when mounted in a local Sequence. */
  globalTime?: number;
};

const W = 1920;
const H = 1080;
const SAFE_Y = 760;
const INK = '#30251a';
const MUTED = '#79684f';
const RED = '#a8402c';
const PAPER = '#f4ecd9';
const SERIF = '"Songti SC", "Noto Serif SC", SimSun, serif';
const CLAMP = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

const round = (x: number) => Number.isFinite(x) ? Number(x.toFixed(3)) : 0;
const cueFrame = (seconds: number, base: number, fps: number, globalTime?: number) =>
  (seconds - (globalTime === undefined ? base : 0)) * fps;
const sceneTime = (frame: number, fps: number, base: number, globalTime?: number) =>
  globalTime === undefined ? base + frame / fps : globalTime;
const cueProgress = (
  frame: number, seconds: number, duration: number, base: number, fps: number,
  globalTime?: number, ease: (t: number) => number = EASE.out,
) => ramp(frame, cueFrame(seconds, base, fps, globalTime), duration * fps, ease);
const floatText = (size: number, color = INK, weight = 600): React.CSSProperties => ({
  color, fontFamily: SERIF, fontSize: size, fontWeight: weight, lineHeight: 1.2,
});
const sheetStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(250,246,235,.98), rgba(236,225,202,.97))',
  border: '1px solid rgba(73,53,31,.30)',
  boxShadow: softShadow(7, { color: '#2a1d10', strength: 0.8 }),
};
const cutoutFilter = 'grayscale(1) sepia(.35) drop-shadow(0 8px 12px rgba(40,28,15,.25))';

export const LIU_PROCESS_V2_CUES = Object.freeze({
  start: 90,
  end: 103.94,
  identity: 90.052,
  ageAndRole: 90.914,
  duties: 92.75,
  districtLedger: 94.885,
  familyLetter: 96.784,
  silentHold: 100.58,
  wineReveal: 101.52,
  unfinishedGame: 103.004,
});

export const WAR_PROCESS_V2_CUES = Object.freeze({
  start: 111.95,
  end: 119.45,
  firstRecord: 112.08,
  lastPending: 115.44,
  lastResult: 116.92,
});

export const WIND_RECAP_V2_CUES = Object.freeze({
  start: 127.6,
  end: 137.3,
  ageRecord: 129.081,
  recap: 129.946,
  timeline: 133.52,
  lampIgnition: 136.4,
  timelineEnd: 136.72,
});

const GameCard: React.FC<{
  index: number; left: number; top: number; enter: number; open: number;
}> = ({ index, left, top, enter, open }) => (
  <div style={{
    position: 'absolute', left, top, width: 204, height: 236, opacity: enter,
    transform: 'translateY(' + round((1 - enter) * 28) + 'px)',
    perspective: 900, zIndex: 20 + index,
  }}>
    <div style={{
      position: 'absolute', inset: 0, transformStyle: 'preserve-3d',
      transform: 'rotateY(' + round(open * 180) + 'deg)',
      transformOrigin: '50% 50%',
      filter: 'drop-shadow(0 9px 12px rgba(46,32,19,.22))',
    }}>
      <div style={{
        position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
        background: 'linear-gradient(145deg,#e6d7b8,#f4ead4 52%,#d7c7a7)',
        border: '1px solid rgba(75,55,32,.5)', boxSizing: 'border-box',
        display: 'grid', placeItems: 'center',
      }}>
        <div style={{ width: 150, height: 180, border: '1px solid rgba(106,78,43,.35)', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 13, right: 13, top: 18, height: 1, background: 'rgba(106,78,43,.35)' }} />
          <div style={{ position: 'absolute', left: 13, right: 13, bottom: 18, height: 1, background: 'rgba(106,78,43,.35)' }} />
          <div style={{ position: 'absolute', left: '50%', top: 45, bottom: 45, width: 1, background: 'rgba(106,78,43,.18)' }} />
        </div>
      </div>
      <div style={{
        position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
        boxSizing: 'border-box', padding: '28px 22px',
        background: 'linear-gradient(180deg,#fffaf0,#e9dcc2)',
        border: '1px solid rgba(75,55,32,.48)',
      }}>
        <div style={{ width: 5, height: 50, background: RED, opacity: 0.74 }} />
        <div style={{ marginTop: 36, ...floatText(32, INK, 650), letterSpacing: '.1em' }}>未完</div>
        <div style={{ marginTop: 18, width: '100%', height: 1, background: 'rgba(75,55,32,.22)' }} />
      </div>
    </div>
  </div>
);

export const LiuProcess: React.FC<SceneProps> = ({ globalTime }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = LIU_PROCESS_V2_CUES;
  const now = sceneTime(frame, fps, cue.start, globalTime);
  if (now < cue.start || now > cue.end) return null;

  const identity = cueProgress(frame, cue.identity, 0.5, cue.start, fps, globalTime, EASE.smooth);
  const info = cueProgress(frame, cue.ageAndRole, 0.75, cue.start, fps, globalTime, EASE.out);
  const duties = cueProgress(frame, cue.duties, 0.45, cue.start, fps, globalTime, EASE.smooth);
  const ledger = cueProgress(frame, cue.districtLedger, 0.5, cue.start, fps, globalTime, EASE.smooth);
  const letterIn = cueProgress(frame, cue.familyLetter, 0.42, cue.start, fps, globalTime, EASE.out);
  const wineIn = cueProgress(frame, cue.wineReveal, 1.15, cue.start, fps, globalTime, EASE.smooth);
  const gameIn = cueProgress(frame, cue.unfinishedGame, 0.42, cue.start, fps, globalTime, EASE.out);
  const letterOut = cueProgress(frame, cue.unfinishedGame, 0.34, cue.start, fps, globalTime, EASE.smooth);
  const district = cueProgress(frame, cue.districtLedger, 0.55, cue.start, fps, globalTime, EASE.smooth);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: LOOKS.paper.bg[1] }}>
      <Stage
        look={LOOKS.paper}
        keyLight={{ x: 0.42, y: 0.12 }}
        fill={{ x: 0.72, y: 0.52 }}
        intensity={0.72}
        grain={0.018}
        vignette={0.08}
      />

      <div style={{
        position: 'absolute', left: 0, top: 0, width: W, height: SAFE_Y,
        background: 'radial-gradient(ellipse 42% 48% at 27% 63%, rgba(191,155,98,.16), transparent 78%)',
      }} />

      {/* Independent alpha cutout layer; contain preserves the seated Liu reference. */}
      <div style={{
        position: 'absolute', left: 35, top: 91, width: 500, height: 657, zIndex: 3,
        opacity: identity, transform: 'translateY(' + round((1 - identity) * 16) + 'px)',
      }}>
        <Img
          src={staticFile('assets/liubang_reference_v2.png')}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: cutoutFilter }}
        />
      </div>

      <div style={{ position: 'absolute', left: 528, top: 47, width: 1352, height: 704, opacity: identity, zIndex: 2 }}>
        <Img
          src={staticFile('assets/scroll_cutout_v2.png')}
          style={{ position: 'absolute', left: 0, top: 100, width: 1352, height: 451, objectFit: 'contain', filter: cutoutFilter }}
        />
        <div style={{ position: 'absolute', left: 108, top: 226, opacity: identity, color: INK, fontFamily: SERIF, fontSize: 50, fontWeight: 730, letterSpacing: '.1em' }}>
          <TextReveal text="刘邦" start={cueFrame(cue.identity, cue.start, fps, globalTime)} by="char" each={14} variant="rise" ease={EASE.out} />
        </div>

        <div style={{ position: 'absolute', left: 108, top: 303, opacity: info, ...floatText(48, INK, 720) }}>
          <TextReveal text="47岁" start={cueFrame(cue.ageAndRole, cue.start, fps, globalTime)} by="char" each={10} variant="rise" ease={EASE.out} />
        </div>
        <div style={{ position: 'absolute', left: 640, top: 302, width: 1, height: 65, background: 'rgba(80,61,38,.32)', opacity: info }} />
        <div style={{ position: 'absolute', left: 696, top: 303, opacity: info, ...floatText(48, INK, 720) }}>
          <TextReveal text="亭长" start={cueFrame(cue.ageAndRole + 0.12, cue.start, fps, globalTime)} by="char" each={14} variant="rise" ease={EASE.out} />
        </div>

        <div style={{ position: 'absolute', left: 108, top: 395, display: 'flex', alignItems: 'center', gap: 24, opacity: duties }}>
          <div style={{ width: 4, height: 44, background: RED }} />
          <TextReveal text="基层公务员" start={cueFrame(cue.duties, cue.start, fps, globalTime)} by="char" each={9} variant="rise" ease={EASE.out} style={{ ...floatText(34, INK, 620) }} />
          <div style={{ marginLeft: 48, width: 38, height: 38, border: '1px solid rgba(168,64,44,.58)', borderRadius: '50%', color: RED, display: 'grid', placeItems: 'center', fontFamily: SERIF, fontSize: 18 }}>印</div>
        </div>

        <div style={{ position: 'absolute', left: 108, top: 485, display: 'flex', alignItems: 'center', gap: 66, opacity: district }}>
          <TextReveal text="管十里地" start={cueFrame(cue.districtLedger, cue.start, fps, globalTime)} by="char" each={10} variant="rise" ease={EASE.out} style={{ ...floatText(33, INK, 620) }} />
          <div style={{ width: 1, height: 38, background: 'rgba(80,61,38,.28)' }} />
          <TextReveal text="月底领点粮" start={cueFrame(cue.districtLedger + 0.18, cue.start, fps, globalTime)} by="char" each={9} variant="rise" ease={EASE.out} style={{ ...floatText(33, INK, 620) }} />
          <div style={{ width: 38, height: 38, border: '1px solid rgba(168,64,44,.58)', borderRadius: '50%', color: RED, display: 'grid', placeItems: 'center', fontFamily: SERIF, fontSize: 18 }}>印</div>
        </div>

        <div style={{
          position: 'absolute', left: 366, top: 295, width: 498, height: 224,
          boxSizing: 'border-box', padding: '25px 30px', zIndex: 9,
          opacity: letterIn * (1 - letterOut * 0.45),
          transform: 'rotate(-1.2deg) translateY(' + round((1 - letterIn) * 18) + 'px)',
          background: 'linear-gradient(145deg,#fff9e9,#f1e3c8)',
          border: '1px solid rgba(97,70,39,.36)',
          boxShadow: softShadow(16, { color: '#2b1b0c', strength: 0.96 }),
        }}>
          <div style={{ width: 30, height: 1, background: RED }} />
          <div style={{ marginTop: 38, ...floatText(36, INK, 650), letterSpacing: '.05em' }}>
            <TextReveal text="就这样了？" start={cueFrame(cue.familyLetter, cue.start, fps, globalTime) + 5} by="char" each={5} variant="blur" ease={EASE.out} />
          </div>
          <div style={{ position: 'absolute', left: 30, right: 30, bottom: 24, height: 1, background: 'rgba(97,70,39,.18)' }} />
        </div>

        <div style={{
          position: 'absolute', left: 652, top: 311, width: 618, height: 344,
          padding: 10, boxSizing: 'border-box', zIndex: 12,
          background: 'rgba(249,244,232,.94)', border: '1px solid rgba(73,53,31,.35)',
          boxShadow: softShadow(11, { color: '#2b1b0c', strength: 0.76 }),
          opacity: wineIn, clipPath: 'inset(0 ' + round((1 - wineIn) * 100) + '% 0 0)',
          transform: 'translateY(' + round((1 - wineIn) * 13) + 'px)',
        }}>
          <div style={{ position: 'absolute', left: 10, top: 10, right: 10, bottom: 10, overflow: 'hidden' }}>
            <Img
              src={staticFile('assets/wine_pour_v2.png')}
              style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'contain', filter: cutoutFilter }}
            />
          </div>
        </div>

        <div style={{ position: 'absolute', left: 292, top: 425, width: 700, height: 290, perspective: 1200, zIndex: 20, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, color: RED, font: '16px ui-monospace,monospace', letterSpacing: '.16em', opacity: gameIn }}>未完牌局</div>
          {[0, 1, 2].map((i) => {
            const enter = cueProgress(frame, cue.unfinishedGame + 0.06 + i * 0.13, 0.48, cue.start, fps, globalTime, EASE.out);
            const open = i === 0 ? cueProgress(frame, cue.unfinishedGame + 0.17, 0.6, cue.start, fps, globalTime, EASE.smooth) : 0;
            const fromLeft = 106 + i * 13;
            const destLeft = i * 232;
            const left = fromLeft + (destLeft - fromLeft) * enter;
            return <GameCard key={i} index={i} left={left} top={38} enter={gameIn * enter} open={open} />;
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

type WarRecord = {
  id: number;
  arrival: number;
};

const WAR_RECORDS: WarRecord[] = Array.from({ length: 7 }, (_, id) => ({
  id: id + 1,
  arrival: id === 6 ? WAR_PROCESS_V2_CUES.lastPending : WAR_PROCESS_V2_CUES.firstRecord + id * 0.56,
}));

const WarRecordCard: React.FC<{
  record: WarRecord; frame: number; fps: number; globalTime?: number;
}> = ({ record, frame, fps, globalTime }) => {
  const entry = cueProgress(frame, record.arrival, 0.42, WAR_PROCESS_V2_CUES.start, fps, globalTime, EASE.out);
  const result = record.id === 7
    ? cueProgress(frame, WAR_PROCESS_V2_CUES.lastResult, 0.5, WAR_PROCESS_V2_CUES.start, fps, globalTime, EASE.smooth)
    : 0;
  const toStackAt = record.arrival + 1.3;
  const stack = record.id < 7
    ? cueProgress(frame, toStackAt, 0.72, WAR_PROCESS_V2_CUES.start, fps, globalTime, EASE.smooth)
    : 0;
  if (entry <= 0.001) return null;

  const column = (record.id - 1) % 4;
  const row = Math.floor((record.id - 1) / 4);
  const startLeft = 52 + column * 230;
  const startTop = 158 + row * 218;
  const stackIndex = record.id - 1;
  const left = startLeft + (74 + (stackIndex % 3) * 8 - startLeft) * stack;
  const top = startTop + (560 + (stackIndex % 6) * 7 - startTop) * stack;
  const scale = 1 - stack * 0.52;
  const opacity = entry * (1 - stack * 0.27);
  const pending = record.id === 7 && result < 1;
  const title = '战事 ' + String(record.id).padStart(2, '0');

  return (
    <div style={{
      position: 'absolute', left, top, width: 210, height: 198,
      boxSizing: 'border-box', padding: '15px 16px',
      background: record.id === 7 && result > 0.2 ? 'linear-gradient(180deg,#fffaf0,#f0e5ce)' : 'linear-gradient(180deg,rgba(248,242,229,.97),rgba(229,219,200,.96))',
      border: '1px solid rgba(75,55,32,.42)',
      boxShadow: softShadow(7, { color: '#2a1d10', strength: 0.74 }),
      opacity, transformOrigin: 'top left',
      transform: 'scale(' + round(scale) + ') rotate(' + round(stack * (record.id % 2 ? -1.1 : 1.1)) + 'deg) translateY(' + round((1 - entry) * 22) + 'px)',
      filter: 'grayscale(' + round(stack * 0.72) + ')',
      zIndex: 10 + record.id,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(75,55,32,.2)', paddingBottom: 10 }}>
        <span style={{ ...floatText(23, INK, 700) }}>{title}</span>
      </div>
      <div style={{ marginTop: 16, color: MUTED, fontSize: 16, letterSpacing: '.12em' }}>记录 {String(record.id).padStart(2, '0')}</div>
      <div style={{ marginTop: 10, height: 4, background: 'rgba(90,67,38,.13)' }}>
        <div style={{ width: record.id === 7 ? round(22 + result * 78) + '%' : '68%', height: '100%', background: record.id === 7 && result > 0.2 ? RED : '#88734e' }} />
      </div>
      <div style={{
        marginTop: 17, minHeight: 34, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 9px', borderLeft: '3px solid ' + (record.id === 7 && result > 0.2 ? RED : '#8b7756'),
        background: record.id === 7 && result > 0.2 ? 'rgba(168,64,44,.09)' : 'rgba(97,76,49,.07)',
      }}>
        <span style={{ color: MUTED, fontSize: 15 }}>状态</span>
        <span style={{ color: record.id === 7 && result > 0.2 ? RED : '#705b3d', fontSize: 21, fontWeight: 700 }}>
          {record.id === 7 ? (pending ? '待定' : '最后一场') : '未成'}
        </span>
      </div>
      {record.id < 7 && stack > 0.62 && (
        <div style={{ position: 'absolute', right: 12, bottom: 9, color: '#6e5f47', opacity: stack, font: '12px ui-monospace,monospace' }}>已归档</div>
      )}
      {record.id === 7 && result > 0.05 && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: result, pointerEvents: 'none' }}>
          <div style={{ padding: '7px 12px', border: '1px solid rgba(168,64,44,.45)', color: RED, background: 'rgba(250,242,226,.92)', font: '15px ui-monospace,monospace', letterSpacing: '.08em' }}>最后一场</div>
        </div>
      )}
    </div>
  );
};

export const WarProcess: React.FC<SceneProps> = ({ globalTime }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = WAR_PROCESS_V2_CUES;
  const now = sceneTime(frame, fps, cue.start, globalTime);
  if (now < cue.start || now > cue.end) return null;

  const figureEntry = cueProgress(frame, cue.lastResult, 0.82, cue.start, fps, globalTime, EASE.out);
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#e8d8b9' }}>
      <Stage look={LOOKS.paper} keyLight={{ x: 0.53, y: 0.12 }} fill={null} intensity={0.26} grain={0.018} vignette={0.12} />
      <Img
        src={staticFile('assets/battle_ink_v2.png')}
        style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, objectFit: 'cover', display: 'block', opacity: 0.84 }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(240,226,198,.34),rgba(240,226,198,.08) 48%,rgba(239,228,205,.38))' }} />

      <div style={{
        position: 'absolute', left: 52, top: 39, zIndex: 4,
        padding: '10px 17px 12px 14px', background: 'rgba(249,243,229,.88)',
        borderLeft: '4px solid ' + RED, boxShadow: softShadow(4, { color: '#2a1d10', strength: 0.6 }),
      }}>
        <div style={{ ...floatText(31, INK, 700), letterSpacing: '.12em' }}>战事序列</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 5 }}>{Array.from({ length: 7 }, (_, i) => <span key={i} style={{ width: 19, height: 3, background: 'rgba(110,86,52,.55)' }} />)}</div>
      </div>

      <div style={{
        position: 'absolute', left: 40, top: 132, width: 963, height: 450,
        border: '1px solid rgba(77,56,31,.28)', background: 'rgba(241,231,211,.26)',
        boxShadow: '0 14px 32px rgba(39,27,14,.12)', zIndex: 2,
      }} />
      {WAR_RECORDS.map((record) => (
        <WarRecordCard
          key={record.id}
          record={record}
          frame={frame}
          fps={fps}
          globalTime={globalTime}
        />
      ))}

      <div style={{
        position: 'absolute', left: 1300, top: 117, width: 535, height: 637, zIndex: 3,
        opacity: figureEntry, transform: 'translateX(' + round((1 - figureEntry) * 32) + 'px)',
      }}>
        <Img
          src={staticFile('assets/liubang_reference_v2.png')}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: cutoutFilter }}
        />
      </div>

      <div style={{
        position: 'absolute', left: 1303, top: 61, padding: '7px 12px',
        color: '#6f5736', background: 'rgba(248,240,223,.8)',
        borderLeft: '3px solid ' + RED, font: '16px ui-monospace,monospace',
        opacity: figureEntry,
      }}>刘邦</div>

      <div style={{
        position: 'absolute', left: 56, top: 602, width: 612, height: 89, zIndex: 1,
        padding: '12px 17px', boxSizing: 'border-box',
        background: 'rgba(244,235,215,.85)', border: '1px solid rgba(77,56,31,.22)',
        opacity: cueProgress(frame, cue.firstRecord + 0.55, 0.5, cue.start, fps, globalTime, EASE.out),
        display: 'flex', alignItems: 'center', gap: 15,
      }}>
        <div style={{ width: 4, height: 52, background: '#87724e' }} />
        <div>
          <div style={{ ...floatText(22, INK, 660) }}>历史堆栈</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5, alignItems: 'center' }}>
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ width: 23, height: 42, border: '1px solid rgba(107,83,49,.32)', background: 'linear-gradient(135deg,#e5d7bb,#f5ecd8)', transform: 'rotate(' + (i % 2 ? 3 : -3) + 'deg)' }} />)}
        </div>
      </div>

    </AbsoluteFill>
  );
};

const RECAP_NODES = [
  { label: '租房', image: 'assets/changan_ink_v2.png', x: 1020, kind: 'image' },
  { label: '茅屋', image: 'assets/hut_ink_v2.png', x: 1335, kind: 'image' },
  { label: '钥匙', image: 'assets/key_lock_v2.png', x: 1650, kind: 'image' },
    { label: '账单', image: '', x: 1965, kind: 'bill' },
  { label: '群聊', image: '', x: 2280, kind: 'chat' },
  { label: '战争', image: 'assets/battle_ink_v2.png', x: 2595, kind: 'image' },
  { label: '订单', image: '', x: 2910, kind: 'order' },
] as const;

const COLOR_INK_NODES = new Set(['租房', '茅屋', '战争']);

const AXIS_Y = 688;
const CARD_W = 252;
const CARD_H = 188;
const STEM_H = 23;
const MAX_CAMERA_X = RECAP_NODES[RECAP_NODES.length - 1].x - W / 2;
const WORLD_W = RECAP_NODES[RECAP_NODES.length - 1].x + 1100;

function camXAt(frame: number, start: number, end: number, maxX: number) {
  const t = interpolate(frame, [start, end], [0, 1], CLAMP);
  const eased = interpolate(t, [0, 0.15, 0.88, 1], [0, 0.055, 0.9, 1], {
    easing: Easing.inOut(Easing.quad),
    ...CLAMP,
  });
  return eased * maxX;
}

/** TimelineTravel-style node gate: each milestone flips when the camera reaches x−center. */
function popFrameOf(nodeX: number, start: number, end: number, maxX: number) {
  const threshold = nodeX - W / 2;
  for (let f = Math.ceil(start); f <= Math.ceil(end); f++) {
    if (camXAt(f, start, end, maxX) >= threshold) return f;
  }
  return Math.ceil(end);
}

const ChatThumbnail: React.FC = () => (
  <Img
    src={staticFile('assets/chat_phone_v2.png')}
    style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', objectPosition: '50% 50%' }}
  />
);

const BillThumbnail: React.FC = () => (
  <div style={{
    width: '100%', height: '100%', boxSizing: 'border-box', padding: '5px 9px',
    background: 'linear-gradient(180deg,#fbf6ea,#eee2ca)', color: INK,
    fontFamily: 'SimSun,"Noto Serif SC",serif', overflow: 'hidden',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', height: 16, alignItems: 'center',
      borderBottom: '1px solid rgba(71,55,36,.28)', fontSize: 10, fontWeight: 700 }}>
      <span>金额示意</span><span style={{ color: MUTED }}>元</span>
    </div>
    {[
      ['房租', '6800'],
      ['学费', '2400'],
      ['日用', '1200'],
    ].map(([label, amount]) => (
      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        height: 17, borderBottom: '1px solid rgba(71,55,36,.13)', fontSize: 10 }}>
        <span style={{ color: MUTED }}>{label}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{amount}</span>
      </div>
    ))}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 19,
      borderTop: '1px solid rgba(71,55,36,.28)', marginTop: 2, fontSize: 11, fontWeight: 700 }}>
      <span>合计</span><span style={{ color: RED, fontVariantNumeric: 'tabular-nums' }}>10400</span>
    </div>
  </div>
);

const OrderThumbnail: React.FC = () => (
  <div style={{
    width: '100%', height: '100%', boxSizing: 'border-box', padding: 9,
    background: 'linear-gradient(180deg,#f9f5ec,#eee6d8)', border: '1px solid rgba(71,55,36,.2)',
    overflow: 'hidden',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', color: INK, fontSize: 12, fontWeight: 700, borderBottom: '1px solid rgba(71,55,36,.18)', paddingBottom: 3 }}>
      <span>订单账页</span><span style={{ color: '#637866' }}>处理中</span>
    </div>
    {[
      { id: '订单01', status: '已完成', progress: 100 },
      { id: '订单02', status: '已完成', progress: 100 },
      { id: '订单03', status: '继续中', progress: 76 },
      { id: '订单04', status: '处理中', progress: 36 },
    ].map((row) => (
      <div key={row.id} style={{ display: 'flex', alignItems: 'center', height: 14, gap: 5, borderBottom: '1px solid rgba(71,55,36,.1)' }}>
        <span style={{ width: 44, color: MUTED, font: '8px ui-monospace,monospace' }}>{row.id}</span>
        <div style={{ flex: 1, height: 3, background: 'rgba(91,73,48,.12)' }}><div style={{ width: row.progress + '%', height: '100%', background: '#927c59' }} /></div>
        <span style={{ color: MUTED, fontSize: 8 }}>{row.status}</span>
      </div>
    ))}
  </div>
);

const RecapCard: React.FC<{
  node: typeof RECAP_NODES[number]; frame: number; cameraX: number; popFrame: number;
}> = ({ node, frame, cameraX, popFrame }) => {
  const turn = ramp(frame, popFrame, 18, EASE.out);
  if (turn <= 0.001) return null;
  const complete = frame >= popFrame + 18;
  const left = node.x - cameraX - CARD_W / 2;
  const cardTop = AXIS_Y - STEM_H - CARD_H;
  const thumbnail = node.kind === 'chat'
    ? <ChatThumbnail />
    : node.kind === 'order'
      ? <OrderThumbnail />
      : node.kind === 'bill'
        ? <BillThumbnail />
      : <Img src={staticFile(node.image)} style={{ width: '100%', height: '100%', objectFit: node.label === '账单' ? 'contain' : 'cover', display: 'block', filter: node.label === '账单' ? cutoutFilter : COLOR_INK_NODES.has(node.label) ? undefined : 'grayscale(.18) sepia(.12)' }} />;

  return (
    <div style={{
      position: 'absolute', left, top: cardTop, width: CARD_W, height: CARD_H,
      perspective: 1000, opacity: Math.min(1, turn * 1.5),
      zIndex: complete ? 4 : 8,
    }}>
      <div style={{
        position: 'absolute', inset: 0, boxSizing: 'border-box', padding: 10,
        background: 'linear-gradient(180deg,#fffaf0,#eee2ca)',
        border: '1px solid rgba(74,54,31,.38)',
        boxShadow: softShadow(5, { color: '#2b1d10', strength: 0.7 }),
        transformOrigin: '50% 100%',
        transform: 'rotateY(' + round((1 - turn) * 78) + 'deg) translateY(' + round((1 - turn) * 13) + 'px)',
        filter: complete ? 'saturate(.72)' : 'none',
      }}>
        <div style={{ width: '100%', height: 104, overflow: 'hidden', border: '1px solid rgba(83,62,36,.25)', background: '#e7dcc6' }}>
          {thumbnail}
        </div>
        <div style={{ height: 31, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ ...floatText(21, INK, 680) }}>{node.label}</span>
          <span style={{
            padding: '3px 7px', color: complete ? '#536a58' : RED,
            border: '1px solid ' + (complete ? 'rgba(83,106,88,.34)' : 'rgba(168,64,44,.32)'),
            font: '12px ui-monospace,monospace',
          }}>{complete ? '已经历' : '正在经过'}</span>
        </div>
      </div>
    </div>
  );
};

const CloudLayers: React.FC<{ farX: number; nearX: number }> = ({ farX, nearX }) => (
  <svg width={W} height={SAFE_Y} viewBox={'0 0 ' + W + ' ' + SAFE_Y} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden="true">
    <g transform={'translate(' + round(farX) + ' 0)'} opacity=".2" fill="none" stroke="#fff8e8" strokeWidth="17" strokeLinecap="round">
      <path d="M-100 114 C 55 72 176 132 315 92 S 566 83 680 119 S 888 139 1035 91 S 1280 78 1435 120 S 1685 139 1940 91" />
      <path d="M1000 208 C 1148 168 1286 227 1418 188 S 1657 176 1798 215 S 1992 230 2120 186" />
    </g>
    <g transform={'translate(' + round(nearX) + ' 0)'} opacity=".13" fill="none" stroke="#fbf2de" strokeWidth="25" strokeLinecap="round">
      <path d="M-170 294 C -28 249 108 319 246 278 S 492 257 617 302 S 858 320 1002 276 S 1244 251 1390 297 S 1648 320 1827 270 S 2045 277 2160 313" />
    </g>
  </svg>
);

const WavingFlag: React.FC<{ frame: number }> = ({ frame }) => {
  const id = 'windFlag' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const wave = Math.sin(frame * 0.12) * 8;
  const lift = Math.cos(frame * 0.075) * 4;
  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id={id} x="-4%" y="-5%" width="108%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.052" numOctaves="1" seed="8" stitchTiles="stitch" result="fabricNoise" />
            <feOffset in="fabricNoise" dx={wave} dy={lift} result="movingNoise" />
            <feDisplacementMap in="SourceGraphic" in2="movingNoise" scale="11" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <div style={{
        position: 'absolute', left: 0, top: 0, width: W, height: H,
        clipPath: 'polygon(60.5% 5%,68% 7%,78% 5%,88% 8%,100% 7%,100% 40%,91% 42%,81% 39%,70% 35%,60.5% 34%)',
        pointerEvents: 'none', overflow: 'hidden',
      }}>
        <Img
          src={staticFile('assets/wind_ink_v2.png')}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'url(#' + id + ')' }}
        />
      </div>
    </>
  );
};

const EndArchive: React.FC<{ frame: number; fps: number; globalTime?: number; base: number; cameraX: number }> = ({ frame, fps, globalTime, base, cameraX }) => {
  const appear = cueProgress(frame, WIND_RECAP_V2_CUES.timelineEnd - 1.42, 0.7, base, fps, globalTime, EASE.out);
  const ignite = cueProgress(frame, WIND_RECAP_V2_CUES.lampIgnition, 0.72, base, fps, globalTime, EASE.smooth);
  if (appear <= 0.001) return null;
  const left = 3035 - cameraX;
  return (
    <div style={{
      position: 'absolute', left, top: 79, width: 744, height: 331,
      boxSizing: 'border-box', padding: 17,
      background: 'linear-gradient(145deg,rgba(248,241,223,.97),rgba(228,215,188,.96))',
      border: '1px solid rgba(77,56,31,.39)',
      boxShadow: softShadow(12, { color: '#2a1d10', strength: 0.88 }),
      opacity: appear, transform: 'translateY(' + round((1 - appear) * 20) + 'px)',
      zIndex: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(77,56,31,.23)', paddingBottom: 10 }}>
        <div style={{ width: 4, height: 24, background: RED }} />
      </div>
      <div style={{ position: 'absolute', left: 17, top: 64, width: 196, height: 239, display: 'grid', placeItems: 'center' }}>
        <div style={{
          position: 'absolute', inset: 3,
          opacity: ignite,
          background: 'radial-gradient(ellipse 70% 58% at 55% 43%, rgba(241,179,81,.54), rgba(215,153,68,.2) 40%, transparent 76%)',
          filter: 'blur(7px)',
        }} />
        <Img
          src={staticFile('assets/lamp_cutout_v2.png')}
          style={{ position: 'relative', width: 185, height: 205, objectFit: 'contain', display: 'block', filter: cutoutFilter, opacity: 0.5 + 0.5 * ignite }}
        />
        <svg width="34" height="42" viewBox="0 0 34 42" style={{ position: 'absolute', left: 151, top: 42, opacity: ignite, pointerEvents: 'none' }}>
          <ellipse cx="17" cy="22" rx="15" ry="20" fill="rgba(239,168,68,.22)" />
          <path d="M17 38 C7 31 13 20 18 5 C23 18 28 28 17 38Z" fill="#c87935" />
          <path d="M18 33 C14 28 17 21 19 17 C23 24 23 29 18 33Z" fill="#f3c776" />
        </svg>
      </div>
      <div style={{ position: 'absolute', left: 220, top: 70, width: 1, height: 218, background: 'rgba(77,56,31,.2)' }} />
      {[
        { label: '杜甫', src: 'assets/dufu_reference_v2.png', left: 246 },
        { label: '刘邦', src: 'assets/liubang_reference_v2.png', left: 478 },
      ].map((person) => (
        <div key={person.label} style={{
          position: 'absolute', left: person.left, top: 68, width: 207, height: 236,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{ width: 165, height: 190, overflow: 'hidden' }}>
            <Img src={staticFile(person.src)} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: cutoutFilter }} />
          </div>
          <div style={{ marginTop: 4, color: INK, fontFamily: SERIF, fontSize: 20, fontWeight: 700, letterSpacing: '.12em' }}>{person.label}</div>
        </div>
      ))}
    </div>
  );
};

export const WindRecapProcess: React.FC<SceneProps> = ({ globalTime }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = WIND_RECAP_V2_CUES;
  const now = sceneTime(frame, fps, cue.start, globalTime);
  if (now < cue.start || now > cue.end) return null;

  const age = cueProgress(frame, cue.ageRecord, 1.5, cue.start, fps, globalTime, EASE.smooth);
  const timelineIn = cueProgress(frame, cue.timeline, 0.44, cue.start, fps, globalTime, EASE.out);
  const travelStart = cueFrame(cue.timeline, cue.start, fps, globalTime);
  const travelEnd = cueFrame(cue.timelineEnd, cue.start, fps, globalTime);
  const cameraX = camXAt(frame, travelStart, travelEnd, MAX_CAMERA_X);
  const elapsed = Math.max(0, now - cue.start);
  const farX = -elapsed * 1.25 - cameraX * 0.075;
  const nearX = -elapsed * 2.1 - cameraX * 0.18;
  const light = cueProgress(frame, cue.lampIgnition, 0.72, cue.start, fps, globalTime, EASE.smooth);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: LOOKS.paper.bg[1] }}>
      <Stage look={LOOKS.paper} keyLight={{ x: 0.34, y: 0.1 }} fill={null} intensity={0.36} grain={0.018} vignette={0.12} />
      <Img
        src={staticFile('assets/wind_ink_v2.png')}
        style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, objectFit: 'cover', display: 'block' }}
      />
      <CloudLayers farX={farX} nearX={nearX} />
      <WavingFlag frame={frame} />

      {/* This portrait remains still; all motion is confined to wind layers, records, and the timeline. */}
      <div style={{ position: 'absolute', left: 44, top: 94, width: 467, height: 657, zIndex: 3 }}>
        <Img
          src={staticFile('assets/liubang_reference_v2.png')}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: cutoutFilter }}
        />
      </div>

      <div style={{
        position: 'absolute', left: 536, top: 58, width: 252, height: 96,
        boxSizing: 'border-box', padding: '11px 15px',
        ...sheetStyle, opacity: age, transform: 'translateY(' + round((1 - age) * 18) + 'px)', zIndex: 4,
      }}>
        <div style={{ color: MUTED, font: '13px ui-monospace,monospace', letterSpacing: '.08em' }}>刘邦</div>
        <div style={{ marginTop: 4, ...floatText(34, INK, 720) }}>
          <TextReveal text="60岁" start={cueFrame(cue.ageRecord, cue.start, fps, globalTime)} by="char" each={18} variant="rise" ease={EASE.out} />
        </div>
      </div>

      <div style={{
        position: 'absolute', left: 0, top: 0, width: W, height: SAFE_Y,
        overflow: 'hidden', pointerEvents: 'none', zIndex: 5,
      }}>
        <svg width={W} height={SAFE_Y} viewBox={'0 0 ' + W + ' ' + SAFE_Y} style={{ position: 'absolute', left: 0, top: 0 }}>
          <g transform={'translate(' + round(-cameraX) + ' 0)'} opacity={timelineIn}>
            <path d={'M260 ' + AXIS_Y + ' H' + (WORLD_W - 120)} stroke="rgba(55,43,28,.22)" strokeWidth="8" strokeLinecap="round" />
            <path d={'M260 ' + AXIS_Y + ' H' + (WORLD_W - 120)} stroke="#735d3d" strokeWidth="2.5" strokeLinecap="round" />
            {Array.from({ length: 48 }, (_, i) => {
              const x = 300 + i * 68;
              const major = i % 6 === 0;
              return <line key={i} x1={x} y1={AXIS_Y - (major ? 12 : 6)} x2={x} y2={AXIS_Y + (major ? 12 : 6)} stroke="rgba(91,69,42,.45)" strokeWidth={major ? 2 : 1} />;
            })}
            {RECAP_NODES.map((node) => {
              const popFrame = popFrameOf(node.x, travelStart, travelEnd, MAX_CAMERA_X);
              const reached = frame >= popFrame;
              const p = reached ? ramp(frame, popFrame, 12, EASE.out) : 0;
              return (
                <g key={node.label}>
                  <circle cx={node.x} cy={AXIS_Y} r={reached ? 18 + p * 4 : 14} fill={reached ? 'rgba(168,64,44,.14)' : 'rgba(255,248,232,.36)'} />
                  <circle cx={node.x} cy={AXIS_Y} r={reached ? 9 + p * 2 : 8} fill={reached ? RED : PAPER} stroke={RED} strokeWidth="2.5" />
                  <text x={node.x} y={AXIS_Y + 48} textAnchor="middle" fill="#493a25" fontSize="19" fontFamily="Songti SC,SimSun,serif">{node.label}</text>
                </g>
              );
            })}
          </g>
          <path d={'M450 ' + (AXIS_Y - 24) + ' v48'} stroke={RED} strokeWidth="2.5" opacity={0.55 + 0.45 * timelineIn} />
          <path d={'M450 ' + (AXIS_Y - 24) + ' l-7 -11 h14 Z'} fill={RED} opacity={0.55 + 0.45 * timelineIn} />
        </svg>

        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {RECAP_NODES.map((node) => (
            <RecapCard
              key={node.label}
              node={node}
              frame={frame}
              cameraX={cameraX}
              popFrame={popFrameOf(node.x, travelStart, travelEnd, MAX_CAMERA_X)}
            />
          ))}
        </div>

        <EndArchive frame={frame} fps={fps} globalTime={globalTime} base={cue.start} cameraX={cameraX} />
      </div>

    </AbsoluteFill>
  );
};

