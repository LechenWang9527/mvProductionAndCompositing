import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

type Props = { globalTime?: number };

type ChatItem = {
  id: string;
  at: number;
  name: string;
  text: string;
  avatar: string;
  avatarPosition: string;
  side: 'left' | 'right';
  reaction?: boolean;
};

type MeasuredRow = {
  height: number;
  bubbleHeight: number;
  bubbleWidth: number;
  lines: string[];
};

type RowLayoutInput = { height: number; progress: number };
type RowLayout = { top: number; opacity: number };

const START = 103.94;
const END = 111.95;
const SCREEN = { x: 446, y: 0, width: 1030, height: 760 };
const THREAD = { top: 88, height: 552, bottomPad: 12, gap: 20 };
const BODY_FONT = 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
const BODY_SIZE = 30;
const BODY_LINE_HEIGHT = 39;
const BUBBLE_PAD_X = 20;
const BUBBLE_PAD_Y = 13;
const BUBBLE_BORDER = 1;
const BUBBLE_WIDTH_SLACK = 4;
const MAX_BUBBLE_WIDTH = 820;
const NAME_HEIGHT = 23;
const NAME_GAP = 7;
const AVATAR_SIZE = 50;

const ITEMS: ChatItem[] = [
  {
    id: 'greeting', at: START, name: '同学', text: '最近都好吗？',
    avatar: 'assets/many_homes_v2.png', avatarPosition: '69% 49%', side: 'left',
  },
  {
    id: 'listed', at: 105.19, name: '同学', text: '公司上市了',
    avatar: 'assets/wind_ink_v2.png', avatarPosition: '76% 25%', side: 'left',
  },
  {
    id: 'new-car', at: 106.717, name: '同学', text: '换了新车，也换了新牌',
    avatar: 'assets/wind_ink_v2.png', avatarPosition: '76% 25%', side: 'left',
  },
  {
    id: 'like', at: 108.681, name: '我', text: '👍',
    avatar: 'assets/chat_phone_v2.png', avatarPosition: '91% 67%', side: 'right', reaction: true,
  },
];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function cue(now: number, start: number, duration: number, easing = Easing.out(Easing.quad)) {
  return interpolate(now, [start, start + duration], [0, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

/** Bottom-anchored row positions; each in-flight row reserves height progressively. */
export function layoutPhoneChatRows(rows: RowLayoutInput[], bottom: number, gap = 18): RowLayout[] {
  const out = new Array<RowLayout>(rows.length);
  let laterMotion = 0;
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const progress = clamp01(rows[i].progress);
    out[i] = {
      top: bottom + gap * (1 - progress) - rows[i].height * progress - laterMotion,
      opacity: progress,
    };
    laterMotion += progress * (rows[i].height + gap);
  }
  return out;
}

function measureTextRows(text: string, ctx: CanvasRenderingContext2D | null, maxWidth: number) {
  const glyphs = Array.from(text);
  const widthOf = (value: string) => ctx ? ctx.measureText(value).width : Array.from(value).length * BODY_SIZE;
  const lines: string[] = [];
  let line = '';
  for (const glyph of glyphs) {
    const next = line + glyph;
    if (line && widthOf(next) > maxWidth) {
      lines.push(line);
      line = glyph;
    } else {
      line = next;
    }
  }
  if (line || !lines.length) lines.push(line);
  return { lines, maxLineWidth: Math.max(0, ...lines.map(widthOf)) };
}

export function measureChatBubble(text: string, ctx: CanvasRenderingContext2D | null, maxBubbleWidth = MAX_BUBBLE_WIDTH) {
  const contentWidth = maxBubbleWidth - BUBBLE_PAD_X * 2 - BUBBLE_BORDER * 2 - BUBBLE_WIDTH_SLACK;
  const { lines, maxLineWidth } = measureTextRows(text, ctx, contentWidth);
  const bubbleWidth = Math.min(
    maxBubbleWidth,
    Math.ceil(maxLineWidth + BUBBLE_PAD_X * 2 + BUBBLE_BORDER * 2 + BUBBLE_WIDTH_SLACK),
  );
  const bubbleHeight = lines.length * BODY_LINE_HEIGHT + BUBBLE_PAD_Y * 2 + BUBBLE_BORDER * 2;
  return { lines, bubbleWidth, bubbleHeight };
}

function measureRows(): MeasuredRow[] {
  const canvas = typeof document === 'undefined' ? null : document.createElement('canvas');
  const ctx = canvas?.getContext('2d') ?? null;
  if (ctx) ctx.font = `500 ${BODY_SIZE}px ${BODY_FONT}`;

  return ITEMS.map((item) => {
    if (item.reaction) {
      return { height: NAME_HEIGHT + NAME_GAP + 54, bubbleHeight: 54, bubbleWidth: 76, lines: [item.text] };
    }
    const { lines, bubbleWidth, bubbleHeight } = measureChatBubble(item.text, ctx);
    return {
      height: NAME_HEIGHT + NAME_GAP + bubbleHeight,
      bubbleHeight,
      bubbleWidth,
      lines,
    };
  });
}

const Avatar: React.FC<{ item: ChatItem }> = ({ item }) => (
  <Img
    src={staticFile(item.avatar)}
    style={{
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      flex: 'none',
      objectFit: 'cover',
      objectPosition: item.avatarPosition,
      borderRadius: 5,
      border: '1px solid rgba(65,55,43,.18)',
      boxSizing: 'border-box',
      background: '#e9e1d3',
    }}
  />
);

const BackMark: React.FC = () => (
  <svg width="23" height="28" viewBox="0 0 24 28" aria-hidden="true">
    <path d="M16.5 3.5 6 14l10.5 10.5" fill="none" stroke="#494943" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MoreMark: React.FC = () => (
  <svg width="27" height="24" viewBox="0 0 27 24" aria-hidden="true">
    {[5, 13.5, 22].map((x) => <circle key={x} cx={x} cy="12" r="1.65" fill="#494943" />)}
  </svg>
);

const VoiceMark: React.FC = () => (
    <svg width="27" height="27" viewBox="0 0 28 28" aria-hidden="true">
      <rect x="7.4" y="3.8" width="13.2" height="15.5" rx="6.5" fill="none" stroke="#62625c" strokeWidth="1.7" />
      <path d="M5.8 13.8a8.2 8.2 0 0 0 16.4 0M14 22v2.8m-4.1 0h8.2" fill="none" stroke="#62625c" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
);

const AddMark: React.FC = () => (
  <svg width="27" height="27" viewBox="0 0 28 28" aria-hidden="true">
    <circle cx="14" cy="14" r="10.2" fill="none" stroke="#62625c" strokeWidth="1.7" />
    <path d="M14 7.5v13M8.5 14h11" stroke="#62625c" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const MessageRow: React.FC<{ item: ChatItem; metric: MeasuredRow; top: number; opacity: number }> = ({ item, metric, top, opacity }) => {
  const right = item.side === 'right';
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top,
      height: metric.height, display: 'flex', alignItems: 'flex-start',
      flexDirection: right ? 'row-reverse' : 'row', gap: 17,
      opacity,
    }}>
      <Avatar item={item} />
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: right ? 'flex-end' : 'flex-start',
        minWidth: 0, maxWidth: `calc(100% - ${AVATAR_SIZE + 17}px)`,
      }}>
        <div style={{
          height: NAME_HEIGHT, lineHeight: `${NAME_HEIGHT}px`, marginBottom: NAME_GAP,
          color: 'rgba(67,67,61,.68)', fontSize: 19, fontWeight: 400,
          letterSpacing: '.015em', whiteSpace: 'nowrap',
        }}>{item.name}</div>
        <div style={{
          width: metric.bubbleWidth, minHeight: metric.bubbleHeight,
          boxSizing: 'border-box', padding: item.reaction ? '5px 18px' : `${BUBBLE_PAD_Y}px ${BUBBLE_PAD_X}px`,
          display: 'flex', alignItems: 'center', justifyContent: item.reaction ? 'center' : 'flex-start',
          borderRadius: 5,
          background: item.reaction ? 'rgba(225,234,224,.94)' : 'rgba(255,255,253,.94)',
          border: '1px solid rgba(63,61,53,.10)',
          boxShadow: '0 1px 2px rgba(37,34,28,.07)',
          color: item.reaction ? '#46584a' : '#3e3e39',
          fontFamily: item.reaction ? '"Segoe UI Emoji", "Noto Color Emoji", sans-serif' : BODY_FONT,
          fontSize: item.reaction ? 31 : BODY_SIZE,
          fontWeight: item.reaction ? 400 : 500,
          lineHeight: `${BODY_LINE_HEIGHT}px`,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 'none', whiteSpace: 'pre' }}>
            {metric.lines.map((line, i) => (
              <div key={i} style={{ height: BODY_LINE_HEIGHT, lineHeight: `${BODY_LINE_HEIGHT}px`, whiteSpace: 'pre', flex: 'none' }}>{line}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PhoneChatProcess: React.FC<Props> = ({ globalTime }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const now = globalTime ?? START + frame / fps;
  const metrics = useMemo(measureRows, []);

  if (now < START || now > END) return null;

  const imageIn = cue(now, START, 0.2);
  const fold = cue(now, 109.553, 2.28, Easing.in(Easing.cubic));
  const lineHandoff = cue(now, 109.553, 1.85, Easing.inOut(Easing.quad));
  const photoExit = cue(now, 111.15, 0.4, Easing.inOut(Easing.quad));
  const photoOpacity = imageIn * (1 - photoExit);

  const visible = ITEMS
    .map((item, i) => ({ item, metric: metrics[i], progress: cue(now, item.at, 0.3) }))
    .filter(({ item }) => now >= item.at);
  const rowLayout = layoutPhoneChatRows(
    visible.map(({ metric, progress }) => ({ height: metric.height, progress })),
    THREAD.height - THREAD.bottomPad,
    THREAD.gap,
  );

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#e8ddc6', fontFamily: BODY_FONT }}>
      <Img
        src={staticFile('assets/phone_down_ink_v2.png')}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: lineHandoff }}
      />

      <div style={{ position: 'absolute', inset: 0, perspective: 1500, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', inset: 0,
          transform: `translateY(${(fold * 270).toFixed(2)}px) rotateX(${(fold * 68).toFixed(2)}deg) scale(${(1 - fold * 0.035).toFixed(4)})`,
          transformOrigin: '50% 100%',
          opacity: photoOpacity,
        }}>
          <Img
            src={staticFile('assets/chat_phone_v2.png')}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />

          <div style={{
            position: 'absolute', left: SCREEN.x, top: SCREEN.y, width: SCREEN.width, height: SCREEN.height,
            overflow: 'hidden', clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)',
            background: 'rgba(249,248,242,.78)', color: '#40403a', pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute', left: 0, right: 0, top: 0, height: 76,
              display: 'grid', gridTemplateColumns: '76px 1fr 76px', alignItems: 'center',
              background: 'rgba(248,247,241,.82)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><BackMark /></div>
              <div style={{ textAlign: 'center', color: '#3f403b', fontSize: 27, lineHeight: '34px', fontWeight: 600, letterSpacing: '.04em' }}>同学群</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><MoreMark /></div>
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 75, height: 1, background: 'rgba(83,82,75,.17)' }} />

            <div style={{
              position: 'absolute', left: 28, right: 28, top: THREAD.top, height: THREAD.height,
              overflow: 'hidden', background: 'rgba(250,249,245,.23)',
            }}>
              {visible.map(({ item, metric, progress }, i) => (
                <MessageRow key={item.id} item={item} metric={metric} top={rowLayout[i].top} opacity={rowLayout[i].opacity} />
              ))}
            </div>

            <div style={{ position: 'absolute', left: 0, right: 0, top: 664, height: 1, background: 'rgba(83,82,75,.16)' }} />
            <div style={{
              position: 'absolute', left: 25, right: 24, top: 681, height: 54,
              display: 'flex', alignItems: 'center', gap: 15,
            }}>
              <div style={{ width: 38, height: 38, display: 'grid', placeItems: 'center', flex: 'none' }}><VoiceMark /></div>
              <div style={{
                height: 48, flex: 1, boxSizing: 'border-box', borderRadius: 8,
                background: 'rgba(255,255,252,.72)', border: '1px solid rgba(69,68,61,.24)',
              }} />
              <div style={{ width: 40, height: 40, display: 'grid', placeItems: 'center', flex: 'none', color: '#62625c' }}><AddMark /></div>
            </div>
          </div>

          {/* Screen sheen remains above the UI, separate from the phone artwork. */}
          <div style={{
            position: 'absolute', left: SCREEN.x, top: SCREEN.y, width: SCREEN.width, height: SCREEN.height,
            pointerEvents: 'none', opacity: 0.56,
            background: 'linear-gradient(118deg,transparent 27%,rgba(255,255,255,.12) 35%,rgba(255,255,255,.025) 39%,transparent 45%)',
          }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
