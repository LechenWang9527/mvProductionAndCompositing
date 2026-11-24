import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { EASE, bezier, ramp, softShadow } from '../vendor/shotcraft/Polish';
import { LOOKS, Stage, TextReveal, alpha, type Look } from '../vendor/shotcraft/Look';

/** Absolute song-time cues. Render each component in a Sequence at its `from`
 * frame and omit `globalTime`, or render directly in the full composition and
 * pass `globalTime` in absolute seconds. */
export const LIFE_V2_CUES = {
  classmate: { start: 103.94, end: 111.95 },
  order: { start: 119.45, end: 127.60 },
} as const;

type SceneProps = {
  /** Absolute composition time in seconds. Omit when rendered in a local Sequence. */
  globalTime?: number;
};

const BASE_W = 1920;
const BASE_H = 1080;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const round = (n: number) => Number.isFinite(n) ? Number(n.toFixed(3)) : 0;
const MESSAGE_EASE = bezier(0.18, 0.9, 0.3, 1);

const timeFrame = (seconds: number, fps: number, absoluteStart: number, globalTime?: number) =>
  Math.round((seconds + (globalTime === undefined ? 0 : absoluteStart)) * fps);

const fit = (width: number, height: number) => {
  const scale = Math.min(width / BASE_W, height / BASE_H);
  return {
    scale,
    width: width / scale,
    height: height / scale,
  };
};

const frameEase = (frame: number, fps: number, at: number, duration: number, ease = EASE.out, origin = 0) =>
  ramp(frame, (at + origin) * fps, duration * fps, ease);

const blendHex = (from: string, to: string, t: number) => {
  const a = [1, 3, 5].map((i) => parseInt(from.slice(i, i + 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(to.slice(i, i + 2), 16));
  const p = clamp01(t);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * p)).join(',')})`;
};

const shellStyle: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  transformOrigin: 'center center',
  overflow: 'hidden',
};

const panelSurface = (look: Look, elevation = 10): React.CSSProperties => ({
  background: look.surface,
  border: `1px solid ${look.line}`,
  borderRadius: 24,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.78), ${softShadow(elevation, { color: look.shadow, strength: 1.15 })}`,
});

const Avatar: React.FC<{ letter: string; look: Look; size?: number; tone?: string }> = ({ letter, look, size = 48, tone }) => (
  <div style={{
    width: size,
    height: size,
    flex: 'none',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '50%',
    background: tone ?? look.surface2,
    color: look.ink,
    border: `1px solid ${look.line}`,
    fontSize: Math.round(size * 0.48),
    fontWeight: 700,
    lineHeight: 1,
  }}>{letter}</div>
);

const ChatRow: React.FC<{
  left: number;
  top: number;
  width: number;
  height: number;
  look: Look;
  person: string;
  initial: string;
  timeLabel: string;
  text: React.ReactNode;
  entry?: number;
  bubbleWidth?: number;
  accent?: boolean;
  children?: React.ReactNode;
}> = ({ left, top, width, height, look, person, initial, timeLabel, text, entry = 1, bubbleWidth, accent = false, children }) => (
  <div style={{
    position: 'absolute',
    left,
    top,
    width,
    height,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    opacity: entry,
    transform: `translateY(${round((1 - entry) * 22)}px)`,
    transformOrigin: 'left top',
    pointerEvents: 'none',
  }}>
    <Avatar letter={initial} look={look} size={46} />
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, color: look.ink2, fontSize: 22, lineHeight: 1.1 }}>
        <span style={{ fontWeight: 650, color: look.ink }}>{person}</span>
        <span>{timeLabel}</span>
      </div>
      <div style={{
        boxSizing: 'border-box',
        width: bubbleWidth,
        minWidth: 480,
        maxWidth: Math.min(width - 72, 1160),
        padding: '16px 24px',
        borderRadius: '6px 20px 20px 20px',
        background: accent ? '#fff5e5' : look.surface,
        border: `1px solid ${accent ? 'rgba(196,85,45,0.30)' : look.line}`,
        boxShadow: `0 3px 12px rgba(45,32,18,0.06), ${accent ? `inset 3px 0 0 ${look.accent}` : 'none'}`,
        color: look.ink,
        fontSize: 32,
        fontWeight: accent ? 650 : 520,
        lineHeight: 1.22,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}>{text}</div>
      {children}
    </div>
  </div>
);

/** #23–25: a group conversation whose list moves as new messages arrive. */
export const ClassmateProcess: React.FC<SceneProps> = ({ globalTime }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const start = LIFE_V2_CUES.classmate.start;
  const t = globalTime === undefined ? frame / fps : globalTime - start;
  const { scale, width: logicalW, height: logicalH } = fit(width, height);
  const look = LOOKS.sand;

  const frameOrigin = globalTime === undefined ? 0 : start;
  const event = (at: number, duration: number, ease = EASE.out) => frameEase(frame, fps, at, duration, ease, frameOrigin);
  const companyIn = event(105.19 - start, 0.34, MESSAGE_EASE);
  const carIn = event(106.717 - start, 0.36, MESSAGE_EASE);
  const liked = frame >= timeFrame(108.681 - start, fps, start, globalTime) ? 1 : 0;
  const likeIn = event(108.681 - start, 0.28, EASE.snappy);
  const fold = event(109.553 - start, 0.56, EASE.exit);
  const handoff = event(109.553 - start, 0.62, EASE.out);

  const panelW = Math.min(logicalW - 160, Math.max(1560, logicalW * 0.86));
  const panelH = 666;
  const panelX = (logicalW - panelW) / 2;
  const panelY = 44;
  const viewX = 44;
  const viewY = 116;
  const viewW = panelW - 88;
  const rowWidth = viewW - 24;
  const revealStart = (localSeconds: number) => (frameOrigin + localSeconds) * fps;
  const companyTop = 184 - 28 * carIn;
  const earlyLift = 26 * companyIn + 18 * carIn;
  const carTop = 252;
  const likeFrame = timeFrame(108.681 - start, fps, start, globalTime);
  const pressScale = interpolate(frame, [likeFrame, likeFrame + 3, likeFrame + 10], [1, 0.91, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: look.bg[1], fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif' }}>
      <div style={{ ...shellStyle, width: logicalW, height: logicalH, transform: `translate(-50%, -50%) scale(${scale})` }}>
        <Stage look={look} keyLight={{ x: 0.47, y: 0.08 }} fill={{ x: 0.84, y: 0.9 }} intensity={0.5} grain={0.025} vignette={0.1} />

        <Img
          src={staticFile('assets/phone_down_ink_v2.png')}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: handoff, transform: `scale(${round(1 + 0.012 * handoff)})`,
          }}
        />

        <div style={{ position: 'absolute', inset: 0, perspective: 1500, pointerEvents: 'none' }}>
          <div style={{
            ...panelSurface(look, 18),
            position: 'absolute', left: panelX, top: panelY, width: panelW, height: panelH,
            boxSizing: 'border-box', overflow: 'hidden',
            opacity: 1 - handoff,
            transform: `translateY(${round(fold * 310)}px) rotateX(${round(fold * 78)}deg) scale(${round(1 - fold * 0.025)})`,
            transformOrigin: '50% 84%',
          }}>
            {/* Group header */}
            <div style={{ position: 'absolute', left: 38, right: 38, top: 22, height: 66, display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ marginRight: -10, zIndex: 3 }}><Avatar letter="A" look={look} size={38} tone="#efe4d5" /></div>
                <div style={{ marginRight: -10, zIndex: 2 }}><Avatar letter="B" look={look} size={38} tone="#e6e7dc" /></div>
                <Avatar letter="C" look={look} size={38} tone="#f2ddd0" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: look.ink, fontSize: 38, fontWeight: 740, lineHeight: 1.05 }}>同学群</div>
                <div style={{ color: look.ink2, fontSize: 22, marginTop: 6 }}>群聊消息</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: look.ink2, fontSize: 23 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: look.accent }} />
                对话持续更新
              </div>
            </div>
            <div style={{ position: 'absolute', left: 38, right: 38, top: 100, height: 1, background: look.line }} />

            {/* Conversation viewport: old messages shift when a new message joins. */}
            <div style={{
              position: 'absolute', left: viewX, top: viewY, width: viewW, height: 470,
              overflow: 'hidden', borderRadius: 16,
              background: `linear-gradient(180deg, ${alpha('#fffefa', 0.55)}, ${alpha('#f2eadc', 0.26)})`,
              border: `1px solid ${alpha('#58452f', 0.06)}`,
            }}>
              <div style={{ position: 'absolute', top: 9, left: 0, right: 0, textAlign: 'center', color: look.ink3, fontSize: 21, letterSpacing: '0.05em' }}>最近</div>

              <ChatRow
                left={22} top={34 - earlyLift * 0.55} width={rowWidth} height={74} look={look}
                person="同学 A" initial="A" timeLabel="稍早" bubbleWidth={620}
                text={<span>大家最近都还好吗？</span>}
              />
              <ChatRow
                left={22} top={108 - earlyLift} width={rowWidth} height={74} look={look}
                person="同学 B" initial="B" timeLabel="稍早" bubbleWidth={680}
                text={<span>各自忙着，偶尔聊聊近况。</span>}
              />

              {t >= 105.19 - start && (
                <ChatRow
                  left={22} top={companyTop} width={rowWidth} height={80} look={look}
                  person="同学 A" initial="A" timeLabel="刚刚" entry={companyIn}
                  bubbleWidth={700} accent
                  text={<TextReveal text="公司上市了" start={revealStart(105.19 - start)} each={9} gap={1.3} variant="rise" style={{ display: 'inline-block' }} />}
                />
              )}

              {t >= 106.717 - start && (
                <ChatRow
                  left={22} top={carTop} width={rowWidth} height={206} look={look}
                  person="同学 B" initial="B" timeLabel="刚刚" entry={carIn}
                  bubbleWidth={860} accent
                  text={<TextReveal text="换了新车，也换了新牌" start={revealStart(106.717 - start)} each={8} gap={1.15} variant="rise" style={{ display: 'inline-block' }} />}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 1, marginLeft: 2 }}>
                    <div style={{
                      width: 310, height: 64, boxSizing: 'border-box', borderRadius: 12,
                      display: 'flex', alignItems: 'center', gap: 14, padding: '8px 14px',
                      background: 'linear-gradient(115deg, #eee5d8, #f8f4ec 48%, #e8ece7)',
                      border: `1px solid ${look.line}`,
                    }}>
                      <div style={{ width: 52, height: 44, borderRadius: 8, background: 'linear-gradient(135deg, #bdc8c0, #f0e6d8 55%, #d3b9a3)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: look.ink }}>
                        <span style={{ fontSize: 22, fontWeight: 680 }}>图片附件</span>
                        <span style={{ fontSize: 20, color: look.ink2 }}>车辆照片</span>
                      </div>
                      <span style={{ marginLeft: 'auto', color: look.ink3, fontSize: 25 }}>›</span>
                    </div>
                    <div style={{ color: look.ink2, fontSize: 21 }}>图片已展开</div>
                  </div>
                  <div style={{
                    height: 36, minWidth: 128, padding: '0 15px', boxSizing: 'border-box', marginTop: 4,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    borderRadius: 18, border: `1px solid ${liked ? alpha(look.accent, 0.48) : look.line}`,
                    color: liked ? look.accent : look.ink2,
                    background: liked ? alpha(look.accent, 0.08) : look.surface,
                    fontSize: 21, fontWeight: 650,
                    transform: `scale(${round(pressScale * (1 + 0.04 * likeIn * (1 - likeIn)))} )`,
                    boxShadow: liked ? `0 0 18px ${alpha(look.accent, 0.12)}` : 'none',
                  }}>{liked ? '♥ 已赞' : '♡ 赞'}</div>
                </ChatRow>
              )}
            </div>

            {/* Input remains part of the interface; no lyric copy is placed here. */}
            <div style={{
              position: 'absolute', left: 44, right: 44, bottom: 18, height: 48,
              boxSizing: 'border-box', padding: '0 18px', borderRadius: 15,
              background: look.surface2, border: `1px solid ${look.line}`,
              display: 'flex', alignItems: 'center', gap: 15,
              color: look.ink3, fontSize: 23,
            }}>
              <span style={{ flex: 1 }}>输入消息…</span>
              <span style={{ color: look.ink2, fontSize: 25 }}>＋</span>
              <span style={{ width: 1, height: 22, background: look.line }} />
              <span style={{ color: look.accent, fontWeight: 700 }}>发送</span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

type OrderStatus = '处理中' | '已完成' | '继续中' | '待处理';
type OrderItem = { id: string; appears: number; completes?: number; queueAt?: number; processAt?: number };

const ORDER_ITEMS: OrderItem[] = [
  { id: '订单01', appears: 0.08, completes: 0.78 },
  { id: '订单02', appears: 0.58, completes: 2.35 },
  { id: '订单03', appears: 1.20, queueAt: 5.43 },
  { id: '订单04', appears: 5.43, processAt: 7.40 },
  { id: '订单05', appears: 7.72 },
];

const StatusMark: React.FC<{ status: OrderStatus; look: Look }> = ({ status, look }) => {
  const colors: Record<OrderStatus, { color: string; background: string }> = {
    处理中: { color: '#8a531c', background: 'transparent' },
    已完成: { color: '#536b58', background: 'transparent' },
    继续中: { color: '#80572b', background: 'transparent' },
    待处理: { color: look.ink2, background: 'transparent' },
  };
  const c = colors[status];
  return <span style={{
    minWidth: 104, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8,
    background: c.background, color: c.color, fontSize: 20, fontWeight: 650, whiteSpace: 'nowrap',
  }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />{status}</span>;
};

const OrderRow: React.FC<{
  item: OrderItem;
  time: number;
  frame: number;
  fps: number;
  frameOrigin: number;
  look: Look;
  top: number;
  width: number;
}> = ({ item, time, frame, fps, frameOrigin, look, top, width }) => {
  const visible = frameEase(frame, fps, item.appears, 0.28, MESSAGE_EASE, frameOrigin);
  if (time < item.appears) return null;
  const done = item.completes !== undefined && time >= item.completes;
  const queued = item.queueAt !== undefined && time >= item.queueAt;
  const processing = item.processAt !== undefined && time >= item.processAt;
  let status: OrderStatus = done ? '已完成' : '处理中';
  if (item.queueAt !== undefined && queued) status = '继续中';
  if (item.processAt !== undefined && !processing) status = '待处理';
  if (item.id === '订单05') status = '待处理';

  const duration = item.completes === undefined ? 5.2 : item.completes - item.appears;
  const p = done ? 1 : Math.min(0.76, clamp01((time - item.appears) / duration));
  return (
    <div style={{
      position: 'absolute', left: 0, top, width, height: 58,
      boxSizing: 'border-box', padding: '0 10px',
      display: 'flex', alignItems: 'center', gap: 14,
      borderBottom: '1px solid rgba(71,55,36,.2)',
      opacity: visible,
      transform: `translateY(${round((1 - visible) * -18)}px)`,
    }}>
      <span style={{ width: 142, flex: 'none', color: look.ink, fontSize: 24, fontWeight: 650 }}>{item.id}</span>
      <div style={{ flex: 1, height: 3, background: 'rgba(71,55,36,.14)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.max(2, p * 100)}%`, height: '100%', background: done ? '#647761' : '#a8402c' }} />
      </div>
      <div style={{ width: 124, marginLeft: 'auto' }}><StatusMark status={status} look={look} /></div>
    </div>
  );
};

/** #29–31: a deterministic order-to-ledger workflow, with unresolved work kept active. */
export const OrderProcess: React.FC<SceneProps> = ({ globalTime }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const start = LIFE_V2_CUES.order.start;
  const t = globalTime === undefined ? frame / fps : globalTime - start;
  const frameOrigin = globalTime === undefined ? 0 : start;
  const event = (at: number, duration: number, ease = EASE.out) => frameEase(frame, fps, at, duration, ease, frameOrigin);
  const { scale, width: logicalW, height: logicalH } = fit(width, height);
  const look = LOOKS.paper;

  const seasonLocal = 1.40;
  const seasonIn = event(seasonLocal, 0.42, EASE.out);
  const seasonP = clamp01((t - seasonLocal) / 3.25) * 3;
  const seasonIndex = Math.min(3, Math.floor(seasonP));
  const seasonMix = seasonIndex === 3 ? 1 : seasonP - seasonIndex;
  const seasonColors = ['#ead8b9', '#e4cda8', '#ddd8bc', '#d7dfd6'];
  const stageTone = blendHex(seasonColors[seasonIndex], seasonColors[Math.min(3, seasonIndex + 1)], seasonMix);
  const seasons = ['春', '夏', '秋', '冬'];
  const panelW = Math.min(logicalW - 160, Math.max(1560, logicalW * 0.86));
  const panelH = 666;
  const panelX = (logicalW - panelW) / 2;
  const panelY = 44;
  const contentX = 42;
  const contentY = 116;
  const contentW = panelW - 84;
  const gap = 42;
  const workW = Math.round(contentW * 0.57);
  const ledgerW = contentW - workW - gap;
  const ledgerX = contentX + workW + gap;
  const seasonCue = t >= seasonLocal;
  const unresolved = event(3.70, 0.36, MESSAGE_EASE);
  const order02Write = event(2.70, 0.48, MESSAGE_EASE);
  const order01Write = event(1.00, 0.44, MESSAGE_EASE);
  const flowPulse = t >= 7.407 ? 1 : 0;
  const rowTop = 130;
  const rowStep = 58;
  const rowStyle: React.CSSProperties = {
    position: 'absolute', left: contentX, top: contentY, width: workW, height: 472,
    background: 'rgba(247, 237, 216, .22)', borderTop: '1px solid rgba(100, 73, 40, .35)', borderBottom: '1px solid rgba(100, 73, 40, .35)',
  };

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: stageTone, fontFamily: '"Source Han Serif SC", "Songti SC", "SimSun", serif' }}>
      <div style={{ ...shellStyle, width: logicalW, height: logicalH, transform: `translate(-50%, -50%) scale(${scale})` }}>
        <Stage look={look} keyLight={{ x: 0.48, y: 0.1 }} fill={null} intensity={0.38} grain={0.022} vignette={0.08} style={{ background: `linear-gradient(180deg, ${stageTone}, #e9dec8)` }} />
        <div style={{ position: 'absolute', inset: 0, background: alpha(stageTone, 0.06), pointerEvents: 'none' }} />

        <div style={{
          position: 'absolute', left: panelX, top: panelY, width: panelW, height: panelH,
          boxSizing: 'border-box', padding: 0, overflow: 'hidden', borderRadius: 4,
          background: 'linear-gradient(145deg, #f1e3c8 0%, #e8d6b5 100%)',
          border: '1px solid rgba(112, 81, 45, .48)',
          boxShadow: '0 18px 40px rgba(75, 54, 28, .16), inset 0 0 0 1px rgba(255, 251, 235, .24)',
          transform: `translateY(${round((1 - event(0, 0.4, MESSAGE_EASE)) * 16)}px)`,
        }}>
          {/* Stable workbench masthead */}
          <div style={{ position: 'absolute', left: 38, right: 38, top: 20, height: 72, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 3, height: 48, background: '#9e452f' }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: look.ink, fontSize: 39, fontWeight: 760, lineHeight: 1.05 }}>订单与账页</div>
              <div style={{ color: look.ink2, fontSize: 22, marginTop: 6 }}>处理队列 · 累计账页</div>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, padding: '5px 0 5px 14px', borderLeft: '1px solid rgba(100, 73, 40, .34)',
              color: flowPulse ? '#536b58' : look.ink2, fontSize: 22, fontWeight: 680,
            }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: flowPulse ? '#668878' : '#9e452f' }} />{flowPulse ? '流程继续' : '处理中'}</div>
          </div>
          <div style={{ position: 'absolute', left: 38, right: 38, top: 100, height: 1, background: look.line }} />

          {/* Order queue and season index */}
          <div style={rowStyle}>
            <div style={{ position: 'absolute', left: 24, right: 24, top: 20, height: 58, opacity: seasonIn }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 30 }}>
                <span style={{ color: look.ink2, fontSize: 21, width: 118, flex: 'none' }}>季节索引</span>
                <div style={{ position: 'relative', flex: 1, height: 34, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: '4%', right: '4%', top: 16, height: 2, background: look.line }} />
                  <div style={{ position: 'absolute', left: '4%', top: 15, width: `${Math.max(0, (seasonP / 3) * 92)}%`, height: 3, background: alpha('#9e452f', 0.68) }} />
                  {seasons.map((s, i) => (
                    <div key={s} style={{ position: 'relative', zIndex: 1, justifySelf: 'center', display: 'flex', alignItems: 'center', gap: 8, color: seasonCue && i === seasonIndex ? look.accent : look.ink2, fontSize: 22, fontWeight: seasonCue && i === seasonIndex ? 740 : 540 }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: seasonCue && i <= seasonIndex ? '#9e452f' : '#efe2c9', border: `1px solid ${seasonCue && i <= seasonIndex ? '#9e452f' : 'rgba(100, 73, 40, .5)'}` }} />{s}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ position: 'absolute', left: 24, right: 24, top: 98, height: 30, display: 'flex', alignItems: 'center', color: look.ink3, fontSize: 20, letterSpacing: '0.02em' }}>
              <span style={{ width: 170 }}>事项</span><span style={{ flex: 1 }}>处理进度</span><span style={{ minWidth: 126, textAlign: 'right' }}>状态</span>
            </div>
            {ORDER_ITEMS.map((item, i) => (
              <OrderRow
                key={item.id} item={item} time={t} frame={frame} fps={fps} frameOrigin={frameOrigin}
                look={look} top={rowTop + i * rowStep} width={workW - 40}
              />
            ))}
          </div>

          {/* A matching ledger record appears after its order is complete. */}
          <div style={{
            position: 'absolute', left: ledgerX, top: contentY, width: ledgerW, height: 472,
            boxSizing: 'border-box', padding: '22px 24px',
            background: 'rgba(247, 237, 216, .12)', borderLeft: '1px solid rgba(100, 73, 40, .35)',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, paddingBottom: 16, borderBottom: '1px solid rgba(100, 73, 40, .35)' }}>
              <div style={{ color: look.ink, fontSize: 31, fontWeight: 740 }}>累计账页</div>
            </div>
            <div style={{ marginTop: 14, height: 30, display: 'flex', alignItems: 'center', color: look.ink3, fontSize: 20 }}>
              <span style={{ flex: 1 }}>事项</span><span style={{ minWidth: 116 }}>状态</span><span style={{ minWidth: 94, textAlign: 'right' }}>记录</span>
            </div>

            {[
              { id: '订单01', opacity: order01Write },
              { id: '订单02', opacity: order02Write },
            ].map((entry, i) => entry.opacity > 0 ? (
              <div key={entry.id} style={{
                position: 'absolute', left: 24, right: 24, top: 146 + i * 66,
                height: 54, boxSizing: 'border-box', padding: '0 14px',
                display: 'flex', alignItems: 'center', gap: 12,
                background: i === 1 && order02Write < 1 ? 'rgba(166, 70, 43, .07)' : 'transparent',
                borderBottom: '1px solid rgba(100, 73, 40, .28)',
                opacity: entry.opacity,
                transform: `translateX(${round((1 - entry.opacity) * -38)}px)`,
              }}>
                <span style={{ flex: 1, color: look.ink, fontSize: 24, fontWeight: 690 }}>{entry.id}</span>
                <span style={{ minWidth: 116, color: '#315d4e', fontSize: 21, fontWeight: 650 }}>已完成</span>
                <span style={{ minWidth: 94, textAlign: 'right', color: look.accent, fontSize: 21, fontWeight: 680 }}>{entry.opacity >= 1 ? '已写入' : '写入中'}</span>
              </div>
            ) : null)}

            {t >= 3.70 && <div style={{
              position: 'absolute', left: 24, right: 24, top: 292, minHeight: 84, padding: '13px 16px', boxSizing: 'border-box',
              display: 'flex', alignItems: 'center', gap: 16,
              borderTop: `1px solid ${unresolved > 0 ? alpha('#9e452f', 0.5) : 'rgba(100, 73, 40, .3)'}`,
              borderBottom: '1px solid rgba(100, 73, 40, .3)',
              opacity: unresolved,
              transform: `translateY(${round((1 - unresolved) * 10)}px)`,
            }}>
              <div style={{ width: 2, height: 42, background: unresolved > 0 ? '#9e452f' : look.ink3 }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: look.ink, fontSize: 25, fontWeight: 710 }}>结果未定</div>
              </div>
              <div style={{ color: look.accent, fontSize: 25, opacity: unresolved }}>…</div>
            </div>}
          </div>

          {/* Short causal connector: the second completed row writes into the ledger. */}
          {order02Write > 0 && order02Write < 1 && (
            <svg width={gap + 16} height={54} viewBox={`0 0 ${gap + 16} 54`} style={{ position: 'absolute', left: contentX + workW - 8, top: contentY + rowTop + rowStep + 3, overflow: 'visible', pointerEvents: 'none' }}>
              <path d={`M 0 27 H ${gap + 4} l -8 -7 M ${gap + 4} 27 l -8 7`} fill="none" stroke="#9e452f" strokeWidth={2} strokeLinecap="square" strokeLinejoin="round" strokeDasharray="8 6" strokeDashoffset={round((1 - order02Write) * 56)} />
            </svg>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
