import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile } from 'remotion';
import { layoutPhoneChatRows } from '../scenes/PhoneChatProcess';
import { loadMVFontsOnce, MVFonts, MV_FONT_FAMILIES } from '../visual/Fonts';
import { Painting } from './Shot';
import { InkPathDraw, InkCallout, InkChatBubble } from './InkSketchPrimitives';

type Props = { time: number };
type ChatItem = {
  id: string;
  at: number;
  name: string;
  text: string;
  avatar: string;
  avatarPosition: string;
  avatarFit?: 'cover' | 'contain';
  side: 'left' | 'right';
  reaction?: boolean;
};
type MeasuredRow = { height: number; bubbleHeight: number; bubbleWidth: number; lines: string[] };

const START = 103.94;
const END = 111.95;
const HANDOFF_AT = 110.208;
const SCREEN = { x: 446, y: 0, width: 1030, height: 760 };
const THREAD = { top: 88, height: 552, bottomPad: 12, gap: 20 };
const BODY_SIZE = 30;
const BODY_LINE_HEIGHT = 39;
const PAD_X = 20;
const PAD_Y = 13;
const BORDER = 1;
const WIDTH_SLACK = 5;
const MAX_BUBBLE_WIDTH = 820;
const NAME_HEIGHT = 28;
const NAME_GAP = 6;
const AVATAR_SIZE = 48;
const BODY_FONT = `"${MV_FONT_FAMILIES.sans}"`;

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
    avatar: 'assets/lamp_cutout_v2.png', avatarPosition: '50% 50%', avatarFit: 'contain', side: 'right', reaction: true,
  },
];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function cue(time: number, start: number, duration: number, easing = Easing.out(Easing.quad)) {
  return interpolate(time, [start, start + duration], [0, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

/** Measure and emit explicit line breaks with the same sizing rules as the original chat scene. */
function measureBubble(text: string, ctx: CanvasRenderingContext2D | null) {
  const maxWidth = MAX_BUBBLE_WIDTH - PAD_X * 2 - BORDER * 2 - WIDTH_SLACK;
  const widthOf = (value: string) => ctx ? ctx.measureText(value).width : Array.from(value).length * BODY_SIZE;
  const lines: string[] = [];
  let line = '';
  for (const glyph of Array.from(text)) {
    const candidate = line + glyph;
    if (line && widthOf(candidate) > maxWidth) {
      lines.push(line);
      line = glyph;
    } else {
      line = candidate;
    }
  }
  if (line || lines.length === 0) lines.push(line);
  const contentWidth = Math.max(0, ...lines.map(widthOf));
  const bubbleWidth = Math.min(MAX_BUBBLE_WIDTH, Math.ceil(contentWidth + PAD_X * 2 + BORDER * 2 + WIDTH_SLACK));
  const bubbleHeight = lines.length * BODY_LINE_HEIGHT + PAD_Y * 2 + BORDER * 2;
  return { lines, bubbleWidth, bubbleHeight };
}

function measureRows(): MeasuredRow[] {
  const canvas = typeof document === 'undefined' ? null : document.createElement('canvas');
  const ctx = canvas?.getContext('2d') ?? null;
  if (ctx) ctx.font = `400 ${BODY_SIZE}px ${BODY_FONT}`;
  return ITEMS.map((item) => {
    if (item.reaction) return { height: NAME_HEIGHT + NAME_GAP + 58, bubbleHeight: 58, bubbleWidth: 78, lines: [item.text] };
    const bubble = measureBubble(item.text, ctx);
    return { ...bubble, height: NAME_HEIGHT + NAME_GAP + bubble.bubbleHeight };
  });
}

const Avatar: React.FC<{ item: ChatItem }> = ({ item }) => (
  <Img src={staticFile(item.avatar)} style={{
    width: AVATAR_SIZE, height: AVATAR_SIZE, flex: 'none', objectFit: item.avatarFit ?? 'cover',
    objectPosition: item.avatarPosition, borderRadius: 4,
    background: item.avatarFit === 'contain' ? '#f6efe2' : '#e8e8e8',
    padding: item.avatarFit === 'contain' ? 2 : 0, boxSizing: 'border-box',
  }} />
);

const BubbleTail: React.FC<{ right: boolean; fill: string }> = ({ right, fill }) => (
  <svg
    aria-hidden="true"
    width="10"
    height="17"
    viewBox="0 0 10 17"
    style={{ position: 'absolute', top: 12, [right ? 'right' : 'left']: -7, overflow: 'visible' }}
  >
    <path d={right ? 'M1 2 L9 0 L8 9 Q5 13 1 15 Z' : 'M9 2 L1 0 L2 9 Q5 13 9 15 Z'} fill={fill} />
  </svg>
);

const BackMark: React.FC = () => (
  <svg width="23" height="28" viewBox="0 0 24 28" aria-hidden="true">
    <path d="M16.5 3.5 6 14l10.5 10.5" fill="none" stroke="#363733" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MoreMark: React.FC = () => (
  <svg width="27" height="24" viewBox="0 0 27 24" aria-hidden="true">
    {[5, 13.5, 22].map((x) => <circle key={x} cx={x} cy="12" r="1.7" fill="#454641" />)}
  </svg>
);

const VoiceMark: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
    <rect x="7.4" y="3.8" width="13.2" height="15.5" rx="6.5" fill="none" stroke="#555650" strokeWidth="1.7" />
    <path d="M5.8 13.8a8.2 8.2 0 0 0 16.4 0M14 22v2.8m-4.1 0h8.2" fill="none" stroke="#555650" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const AddMark: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
    <circle cx="14" cy="14" r="10.2" fill="none" stroke="#555650" strokeWidth="1.7" />
    <path d="M14 7.5v13M8.5 14h11" stroke="#555650" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const MessageRow: React.FC<{ item: ChatItem; metric: MeasuredRow; top: number; opacity: number }> = ({ item, metric, top, opacity }) => {
  const right = item.side === 'right';
  const fill = item.reaction ? '#95df76' : '#ffffff';
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top, height: metric.height,
      display: 'flex', alignItems: 'flex-start', flexDirection: right ? 'row-reverse' : 'row',
      gap: 16, opacity,
    }}>
      <Avatar item={item} />
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: right ? 'flex-end' : 'flex-start',
        minWidth: 0, maxWidth: `calc(100% - ${AVATAR_SIZE + 16}px)`,
      }}>
        <div style={{
          height: NAME_HEIGHT, lineHeight: `${NAME_HEIGHT}px`, marginBottom: NAME_GAP,
          color: '#898a86', fontFamily: BODY_FONT, fontSize: 23, fontWeight: 400,
          whiteSpace: 'nowrap',
        }}>{item.name}</div>
        <div style={{
          position: 'relative', width: metric.bubbleWidth, minHeight: metric.bubbleHeight,
          boxSizing: 'border-box', padding: item.reaction ? '4px 16px' : `${PAD_Y}px ${PAD_X}px`,
          display: 'flex', alignItems: 'center', justifyContent: item.reaction ? 'center' : 'flex-start',
          borderRadius: 5, background: fill, color: '#30312e',
          fontFamily: BODY_FONT, fontSize: item.reaction ? 32 : BODY_SIZE,
          fontWeight: 400, lineHeight: `${BODY_LINE_HEIGHT}px`,
        }}>
          <BubbleTail right={right} fill={fill} />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 'none', whiteSpace: 'pre' }}>
            {metric.lines.map((line, i) => <div key={i} style={{ height: BODY_LINE_HEIGHT, lineHeight: `${BODY_LINE_HEIGHT}px`, whiteSpace: 'pre', flex: 'none' }}>{line}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Screen-only WeChat-style conversation composited onto the existing phone artwork. */
export const Phone: React.FC<Props> = ({ time }) => {
  const [metrics, setMetrics] = useState<MeasuredRow[] | null>(null);
  useEffect(() => {
    let mounted = true;
    void loadMVFontsOnce()
      .then(() => {
        if (mounted) setMetrics(measureRows());
      })
      .catch(() => {
        // MVFonts owns the delayRender failure and reports the load error.
      });
    return () => { mounted = false; };
  }, []);

  const active = time >= START && time <= END;
  const visible = !active || !metrics ? [] : ITEMS
    .map((item, i) => ({ item, metric: metrics[i], progress: cue(time, item.at, 0.3) }))
    .filter(({ item }) => time >= item.at);
  const rowLayout = !active || !metrics ? [] : layoutPhoneChatRows(
    visible.map(({ metric, progress }) => ({ height: metric.height, progress })),
    THREAD.height - THREAD.bottomPad,
    THREAD.gap,
  );

  const imageIn = cue(time, START, 0.2);
  const handoff = time >= HANDOFF_AT ? 1 : 0;

  return (
    <>
      <MVFonts />
      {active && metrics ? <AbsoluteFill style={{ overflow: 'hidden', background: '#4c3828' }}>
        <Painting name="phone_down_ink_v2.png" time={time} start={HANDOFF_AT} end={END} opacity={handoff} camera="still" />
        {/* 子镜 2 (110.208 ~ 111.950s 手机扣在桌上) */}
        {handoff > 0 && (
          <>
            <InkPathDraw
              d="M 320 420 L 660 310 L 1460 450 L 1180 620 Z"
              progress={clamp01((time - 110.25) / 0.55)}
              color="#e8b87a"
              width={2.4}
            />
            <InkChatBubble
              x={110}
              y={96}
              width={390}
              dark
              speaker="此刻的你"
              text="把手机扣下，不让别人的热闹乱了自己的阵脚。"
              progress={clamp01((time - 110.25) / 0.55)}
              anchorFrom={[680, 420]}
            />
            <InkChatBubble
              x={1260}
              y={96}
              width={380}
              dark
              speaker="千年前 · 刘邦"
              text="当年沛县酒桌上，我也这样把酒碗一扣。"
              progress={clamp01((time - 110.35) / 0.55)}
            />
          </>
        )}
        <div style={{ position: 'absolute', inset: 0, opacity: imageIn * (1 - handoff) }}>
          <Painting name="chat_phone_v2.png" time={time} start={START} end={END} camera="still" />
          <div style={{
            position: 'absolute', left: SCREEN.x, top: SCREEN.y, width: SCREEN.width, height: SCREEN.height,
            overflow: 'hidden', background: '#ededed', color: '#30312e', fontFamily: BODY_FONT,
          }}>
            <div style={{
              position: 'absolute', left: 0, right: 0, top: 0, height: 76,
              display: 'grid', gridTemplateColumns: '76px 1fr 76px', alignItems: 'center',
              background: '#f7f7f7',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><BackMark /></div>
              <div style={{ textAlign: 'center', color: '#30312e', fontSize: 27, lineHeight: '34px', fontWeight: 600 }}>同学群</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><MoreMark /></div>
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 75, height: 1, background: '#dededb' }} />

            <div style={{
              position: 'absolute', left: 28, right: 28, top: THREAD.top, height: THREAD.height,
              overflow: 'hidden', background: '#ededed',
            }}>
              {visible.map(({ item, metric }, i) => (
          <MessageRow key={item.id} item={item} metric={metric} top={rowLayout[i].top} opacity={rowLayout[i].opacity} />
              ))}
            </div>

            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 88, height: 1, background: '#d9d9d6' }} />
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, height: 88,
              display: 'flex', alignItems: 'center', gap: 15, padding: '0 23px', boxSizing: 'border-box',
              background: '#f7f7f7',
            }}>
              <div style={{ width: 38, height: 38, display: 'grid', placeItems: 'center', flex: 'none' }}><VoiceMark /></div>
              <div style={{
                height: 48, flex: 1, boxSizing: 'border-box', borderRadius: 6,
                background: '#ffffff', border: '1px solid #d6d6d2',
              }} />
              <div style={{ width: 40, height: 40, display: 'grid', placeItems: 'center', flex: 'none' }}><AddMark /></div>
            </div>
          </div>

          <div style={{
            position: 'absolute', left: SCREEN.x, top: SCREEN.y, width: SCREEN.width, height: SCREEN.height,
            pointerEvents: 'none', opacity: 0.45,
            background: 'linear-gradient(118deg,transparent 27%,rgba(255,255,255,.12) 35%,rgba(255,255,255,.025) 39%,transparent 45%)',
          }} />

          {/* 子镜 1 桌面与留白气泡 (103.94 ~ 110.208s) */}
          <InkCallout
            from={[160, 360]}
            to={[60, 520]}
            label="案头清茶 · 静看喧嚣"
            dark
            progress={clamp01((time - 104.2) / 0.7)}
          />

          <InkChatBubble
            x={1500}
            y={160}
            width={350}
            dark
            speaker="屏幕外的你"
            mode="hesitate"
            hesitateText="也说说我的不易…"
            text="默默点了个赞，深吸一口气。"
            progress={clamp01((time - 105.8) / 0.8)}
            anchorFrom={[1620, 480]}
          />
        </div>
      </AbsoluteFill> : null}
    </>
  );
};
