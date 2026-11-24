import React from 'react';
import { BrushRule, EditorialStage } from '../visual/EditorialStage';
import { at, INK, Note, Portrait, RED, serif } from './Shot';
import { DynamicPainting } from './DynamicPainting';
import { InkPathDraw, InkSketchIcon, InkCallout, InkChatBubble, clamp01 } from './InkSketchPrimitives';
import { EASE } from '../vendor/shotcraft/Polish';
import { MV_FONT_FAMILIES } from '../visual/Fonts';

function PeiGongSeal({ time }: { time: number }) {
  const p = clamp01((time - 90.5) / 0.28);
  if (p <= 0) return null;
  const scale = 1 + 0.35 * (1 - EASE.overshoot(p));
  const opacity = clamp01(p * 2.5);
  return (
    <div
      style={{
        position: 'absolute',
        left: 912,
        top: 365,
        transform: `scale(${scale}) rotate(-4deg)`,
        transformOrigin: 'center center',
        opacity,
        pointerEvents: 'none',
      }}
    >
      <svg width={56} height={56} viewBox="0 0 56 56">
        <rect x="2" y="2" width="52" height="52" rx="4" fill="#a23e2c" stroke="#681610" strokeWidth="2" />
        <text
          x="28"
          y="37"
          fill="#f8f6f0"
          fontFamily={MV_FONT_FAMILIES.serif}
          fontSize="23"
          fontWeight="700"
          textAnchor="middle"
        >
          沛公
        </text>
      </svg>
    </div>
  );
}

export function Liu({ time }: { time: number }) {
  // 子镜 3 (101.520 ~ 103.940s 倒酒亮牌: wine_pour_v2.png)
  if (time >= 101.52) {
    return (
      <DynamicPainting name="wine_pour_v2.png" time={time} start={101.52} end={103.94} camera="still" vfxPreset="inkBloom">
        <BrushRule x={1160} y={690} width={620} progress={at(time, 103.004, 0.82)} thickness={2.5} color={RED} />
        <InkPathDraw
          d="M 815 445 Q 680 540 625 675"
          progress={clamp01((time - 101.6) / 0.7)}
          color="#ffdca8"
          width={3.2}
        />
        <InkCallout
          from={[625, 675]}
          to={[160, 520]}
          label="浊酒一樽 · 壮志未酬"
          icon="warmSoup"
          dark
          progress={clamp01((time - 101.65) / 0.6)}
        />
        <InkChatBubble
          x={1140}
          y={130}
          width={400}
          dark
          speaker="刘邦 · 举壶定声"
          text="爹，急什么？这局牌，还没发完呢。"
          progress={clamp01((time - 101.65) / 0.7)}
          anchorFrom={[960, 320]}
        />
      </DynamicPainting>
    );
  }

  // 子镜 2 (96.784 ~ 101.520s 家宴劝退: liubang_family_ink_v3.png)
  if (time >= 96.784) {
    return (
      <DynamicPainting name="liubang_family_ink_v3.png" time={time} start={96.784} end={101.52} camera="in" vfxPreset="windowWarmth">
        <InkChatBubble
          x={90}
          y={84}
          width={380}
          dark
          speaker="刘太公 · 当众数落"
          text="四十七了还混个亭长，你这辈子也就这样了！"
          progress={clamp01((time - 96.95) / 0.75)}
          anchorFrom={[620, 250]}
        />
        <InkCallout
          from={[890, 260]}
          to={[820, 110]}
          label="满座亲戚 · 摇头叹气"
          sublabel="泗水刘氏家宴"
          dark
          progress={clamp01((time - 97.2) / 0.65)}
        />
        <InkChatBubble
          x={1360}
          y={96}
          width={380}
          dark
          speaker="刘邦"
          mode="hesitate"
          hesitateText="大丈夫当如是…"
          text="（摩挲酒盏，含笑不语）"
          progress={clamp01((time - 97.45) / 0.8)}
          anchorFrom={[1520, 280]}
        />
      </DynamicPainting>
    );
  }

  // 子镜 1 (90.00 ~ 96.784s 47岁亭长)
  const identity = at(time, 90, 0.65);
  const role = at(time, 90.914, 0.8);
  const district = at(time, 94.885, 0.65);

  return (
    <EditorialStage cornerInkSrc={false}>
      <DynamicPainting
        name="wind_landscape_v3.png"
        time={time}
        start={90}
        end={96.784}
        camera="right"
        opacity={0.17}
        style={{ maskImage: 'linear-gradient(90deg, transparent 20%, black 74%)' }}
        vfxPreset="dust"
      />
      <Portrait who="liubang" x={155} y={66} w={635} h={684} opacity={identity} style={{ transform: `translateY(${20 * (1 - identity)}px)` }} />
      <Note x={910} y={168} size={80} opacity={identity} vertical>刘邦</Note>
      <PeiGongSeal time={time} />
      <Note x={1120} y={147} size={96} opacity={role} style={{ fontVariantNumeric: 'tabular-nums' }}>47</Note>
      <Note x={1270} y={210} size={30} opacity={role} color="#746b5d">岁</Note>
      <BrushRule x={1124} y={300} width={330} progress={role} thickness={2} color={RED} />
      <Note x={1125} y={336} size={46} opacity={role}>亭长</Note>
      <Note x={1126} y={430} size={30} opacity={at(time, 92.75, 0.55)} color="#746b5d">基层差事</Note>
      <div style={{ position: 'absolute', left: 1126, top: 495, fontFamily: serif, color: INK, display: 'flex', gap: 70, alignItems: 'baseline', opacity: district }}>
        <span style={{ fontSize: 46 }}>十里</span><span style={{ fontSize: 30, color: '#746b5d' }}>月俸</span><span style={{ fontSize: 46 }}>粮</span>
      </div>

      {/* 泗水十里亭巡检路线与界标 */}
      <InkPathDraw
        d="M 1450 535 Q 1560 480 1680 510 Q 1770 460 1840 475"
        progress={clamp01((time - 90.4) / 1.2)}
        color="#a23e2c"
        width={2.6}
        dashed
      />
      <InkSketchIcon
        name="cart"
        x={1620}
        y={440}
        size={84}
        progress={clamp01((time - 91.0) / 0.8)}
        label="十里亭界"
      />

      {/* 泗水亭长留白气泡 */}
      <InkChatBubble
        x={1120}
        y={605}
        width={420}
        speaker="刘邦 · 泗水亭长"
        text="四十七岁管十里亭，外人笑我混日子，我心里有数。"
        progress={clamp01((time - 90.6) / 0.85)}
      />
    </EditorialStage>
  );
}
