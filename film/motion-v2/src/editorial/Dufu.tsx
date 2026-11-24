import React, { useId, useMemo, type CSSProperties, type ReactNode } from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { sampleAudio, type AudioSample } from '../engine/audioFeatures';
import { sampleDufuPalette, PaletteContext, type DufuPalette } from '../engine/palette';
import { OverlapStage, type OverlapShot } from './transitions';
import { DynamicPainting } from './DynamicPainting';
import { DufuBills } from './DufuBills';
import { InkReveal } from '../visual/InkReveal';
import { BrushRule, EditorialStage } from '../visual/EditorialStage';
import { MV_FONT_FAMILIES } from '../visual/Fonts';
import { TextReveal } from '../vendor/shotcraft/Look';
import { EASE, Vignette } from '../vendor/shotcraft/Polish';
import { asset, MemoryTravel } from './Shot';
import {
  InkPathDraw,
  InkSketchIcon,
  InkCallout,
  InkChatBubble,
  type SketchIconName,
} from './InkSketchPrimitives';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export type DufuProps = {
  time: number;
  entryMode?: 'standalone' | 'fromV4Scroll';
};

/**
 * 1. Identity (30.00s ~ 33.065s):
 * dufu_reference_v2.png with micro-breathing float + vertical TextReveal "杜甫" +
 * code-drawn Cinnabar overshoot stamp + "迁入/搬离/再迁入" cadence badges +
 * 朱砂虚线折线穿梭坊市 + 搬家独轮车 + 打字机题记气泡
 */
function DufuIdentity({
  time,
  audioSample,
  palette,
}: {
  time: number;
  audioSample: AudioSample;
  palette: DufuPalette;
}) {
  const p = clamp01((time - 30.0) / 0.6);
  const relocate = clamp01((time - 31.4) / 1.4);

  // Smooth entrance settle over 0.6s with no beatPulse or bass jitter
  const entranceY = 20 * (1 - EASE.smooth(p));

  // Stamping seal "少陵" - starts at 30.45s so it's fully stamped by 0.8s into Dufu standalone
  const sealP = clamp01((time - 30.45) / 0.28);
  const sealScale = 1 + 0.35 * (1 - EASE.overshoot(sealP));
  const sealOpacity = clamp01(sealP * 2.5);

  return (
    <EditorialStage cornerInkSrc={false} paperColor={palette.paper}>
      {/* Background calligraphy wash */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.16 + 0.1 * relocate,
          maskImage: 'linear-gradient(90deg, transparent 15%, black 65%)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent 15%, black 65%)',
          pointerEvents: 'none',
        }}
      >
        <Img
          src={asset('changan_ink_v2.png')}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* 朱砂虚线折线：从南门(960,650)穿梭坊市(740,520) -> (1340,480) -> (880,360) */}
      <InkPathDraw
        d="M 960 650 L 740 520 L 1340 480 L 880 360"
        progress={clamp01((time - 30.2) / 1.6)}
        color={palette.accent}
        dashed
        width={3}
      />

      {/* 在折线拐点放置搬家独轮车简笔画 */}
      <InkSketchIcon
        name="cart"
        x={1310}
        y={430}
        size={88}
        progress={clamp01((time - 30.8) / 0.9)}
        color={palette.accent}
        pulse={0}
        label="半生行李"
      />

      {/* Floating Portrait */}
      <div
        style={{
          position: 'absolute',
          left: 170 - 45 * relocate,
          top: 60,
          width: 630,
          height: 680,
          opacity: p,
          transform: `translateY(${entranceY}px)`,
          transformOrigin: 'bottom center',
        }}
      >
        <Img
          src={asset('dufu_reference_v2.png')}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      {/* Vertical Text "杜甫" - positioned in clear paper space avoiding roof ridge */}
      <div
        style={{
          position: 'absolute',
          left: 1010,
          top: 130,
          opacity: p,
          fontFamily: MV_FONT_FAMILIES.serif,
          fontWeight: 700,
          fontSize: 82,
          color: palette.ink,
          writingMode: 'vertical-rl',
          letterSpacing: 14,
        }}
      >
        <TextReveal
          text="杜甫"
          start={0}
          by="char"
          variant="rise"
          each={16}
          gap={6}
          ease={EASE.overshoot}
        />
      </div>

      {/* Cinnabar white-character seal */}
      {sealP > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 1140,
            top: 140,
            transform: `scale(${sealScale}) rotate(-4deg)`,
            transformOrigin: 'center center',
            opacity: sealOpacity,
            pointerEvents: 'none',
          }}
        >
          <svg width={58} height={58} viewBox="0 0 58 58">
            <rect x="2" y="2" width="54" height="54" rx="4" fill={palette.accent} stroke="#681610" strokeWidth="2" />
            <text
              x="29"
              y="38"
              fill={palette.paper}
              fontFamily={MV_FONT_FAMILIES.serif}
              fontSize="24"
              fontWeight="700"
              textAnchor="middle"
            >
              少陵
            </text>
          </svg>
        </div>
      )}

      {/* Connecting Brush Rule */}
      <BrushRule
        x={1160}
        y={285}
        width={340}
        progress={clamp01((time - 30.5) / 0.75)}
        thickness={3}
        color={palette.accent}
      />

      {/* Subtitle note: 一生辗转 */}
      <div
        style={{
          position: 'absolute',
          left: 1175,
          top: 335,
          fontFamily: MV_FONT_FAMILIES.serif,
          fontSize: 32,
          color: palette.secondaryInk,
          opacity: relocate,
        }}
      >
        一生辗转
      </div>

      {/* Cadence Badges: 迁入 / 搬离 / 再迁入 */}
      {['迁入', '搬离', '再迁入'].map((word, i) => {
        const itemP = clamp01((time - (31.48 + i * 0.38)) / 0.45);
        const isHighlight = i === 2;
        return (
          <div
            key={word}
            style={{
              position: 'absolute',
              left: 1160 + i * 150,
              top: 445 + i * 55,
              opacity: itemP,
              transform: `translateY(${14 * (1 - itemP)}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isHighlight ? palette.accent : palette.secondaryInk,
              }}
            />
            <span
              style={{
                fontFamily: MV_FONT_FAMILIES.serif,
                fontSize: 27,
                color: isHighlight ? palette.accent : palette.secondaryInk,
                letterSpacing: 2,
              }}
            >
              {word}
            </span>
          </div>
        );
      })}

      {/* 题记气泡 */}
      <InkChatBubble
        x={960}
        y={540}
        width={360}
        speaker="杜甫 · 题记"
        text="长安居，大不易。半生行李未卸。"
        mode="typewriter"
        progress={clamp01((time - 30.35) / 0.85)}
      />
    </EditorialStage>
  );
}

/**
 * 2. Rent (33.065s ~ 36.904s):
 * changan_ink_v2.png (opacity: 0.84 适度压柔) + vfxPreset="dust" +
 * 右侧顺着屋檐陡峭上扬的朱砂涨价折线 + 东侧长安房东气泡与算盘 + 西侧杜甫犹豫气泡
 */
function DufuRent({
  time,
  audioSample,
  palette,
}: {
  time: number;
  audioSample: AudioSample;
  palette: DufuPalette;
}) {
  const rentP = clamp01((time - 35.009) / 0.65);
  const arrowThrust = -26 * EASE.anticip(rentP);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <DynamicPainting
        name="changan_ink_v2.png"
        time={time}
        start={33.065}
        end={36.904}
        camera="in"
        vfxPreset="dust"
        audioSample={audioSample}
        palette={palette}
        style={{ opacity: 0.84 }}
      >
        {/* 顺着坊市屋檐陡峭上扬的朱砂涨价折线 (1060,520) -> (1220,440) -> (1380,310) -> (1540,180) */}
        <InkPathDraw
          d="M 1060 520 L 1220 440 L 1380 310 L 1540 180"
          progress={clamp01((time - 33.3) / 1.6)}
          color={palette.accent}
          width={3.5}
        />

        {/* 33.2s 东侧院落 anchorFrom={[1260, 460]} 弹出长安房东气泡与算盘图标 */}
        <InkChatBubble
          x={1160}
          y={96}
          width={340}
          speaker="长安房东"
          text="下月起，房钱再涨三成！"
          mode="typewriter"
          progress={clamp01((time - 33.2) / 0.75)}
          anchorFrom={[1260, 460]}
        />
        <InkSketchIcon
          name="abacus"
          x={1530}
          y={92}
          size={76}
          progress={clamp01((time - 33.3) / 0.8)}
          color={palette.accent}
          pulse={0}
        />

        {/* 33.55s 杜甫犹豫气泡 */}
        <InkChatBubble
          x={110}
          y={120}
          width={340}
          speaker="杜甫"
          mode="hesitate"
          hesitateText="屋顶尚漏雨…"
          text="容我月底凑齐。"
          progress={clamp01((time - 33.55) / 0.85)}
          anchorFrom={[580, 500]}
        />
      </DynamicPainting>
    </div>
  );
}

/**
 * 3. HutStorm (36.904s ~ 40.993s):
 * hut_ink_v2.png + vfxPreset="rainWind" + 38.694s onset micro-shake +
 * 3 道横扫屋顶的飞白狂风曲线 + 实景测绘引线标注 + 杜甫夜雨护儿气泡
 */
function DufuHutStorm({
  time,
  audioSample,
  palette,
}: {
  time: number;
  audioSample: AudioSample;
  palette: DufuPalette;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
      }}
    >
      <DynamicPainting
        name="hut_ink_v2.png"
        time={time}
        start={36.904}
        end={40.993}
        camera="still"
        vfxPreset="rainWind"
        audioSample={audioSample}
        palette={palette}
      >
        {/* Subtle Wind Poem Watermark */}
        <div
          style={{
            position: 'absolute',
            left: 120,
            top: 100,
            fontFamily: MV_FONT_FAMILIES.serif,
            fontSize: 34,
            color: palette.secondaryInk,
            opacity: clamp01((time - 37.2) / 0.8) * 0.45,
            writingMode: 'vertical-rl',
            letterSpacing: 10,
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          }}
        >
          八月秋高风怒号 卷我屋上三重茅
        </div>

        {/* 3 道横扫屋顶的飞白狂风曲线 */}
        <InkPathDraw
          d="M 160 210 Q 780 130 1760 240"
          progress={clamp01((time - 37.0) / 1.2)}
          color={palette.rain || '#8fa4b3'}
          width={4}
        />
        <InkPathDraw
          d="M 100 320 Q 820 220 1840 370"
          progress={clamp01((time - 37.2) / 1.2)}
          color={palette.rain || '#8fa4b3'}
          width={3.5}
        />
        <InkPathDraw
          d="M 220 440 Q 920 330 1720 490"
          progress={clamp01((time - 37.4) / 1.2)}
          color={palette.rain || '#8fa4b3'}
          width={3}
        />

        {/* 37.05s 与 37.25s 实景测绘引线标注 */}
        <InkCallout
          from={[1320, 210]}
          to={[1380, 110]}
          label="屋顶三重茅 · 掀飞"
          sublabel="八月秋高风怒号"
          icon="roofCrack"
          dark
          progress={clamp01((time - 37.05) / 0.65)}
          pulse={0}
        />
        <InkCallout
          from={[1140, 510]}
          to={[1360, 450]}
          label="门框倾仄 12°"
          sublabel="木栓松动 · 摇摇欲坠"
          dark
          progress={clamp01((time - 37.25) / 0.65)}
          pulse={0}
        />

        {/* 37.3s 左上弹出夜雨护儿气泡 */}
        <InkChatBubble
          x={90}
          y={170}
          width={350}
          dark
          speaker="杜甫 · 夜雨"
          text="床头屋漏，先把孩子往里挪。"
          anchorFrom={[680, 460]}
          progress={clamp01((time - 37.3) / 0.85)}
        />
      </DynamicPainting>
    </div>
  );
}

/**
 * 4. ManyHomes (40.993s ~ 43.015s):
 * inkBleed cut + many_homes_v2.png + vfxPreset="inkBloom" +
 * 金色与墨色交织的屋檐轮廓线 + homeGrid 图标 + 两处亮灯窗口引线
 */
function DufuManyHomes({
  time,
  audioSample,
  palette,
}: {
  time: number;
  audioSample: AudioSample;
  palette: DufuPalette;
}) {
  return (
    <DynamicPainting
      name="many_homes_v2.png"
      time={time}
      start={40.993}
      end={43.015}
      camera="out"
      reveal
      vfxPreset="inkBloom"
      audioSample={audioSample}
      palette={palette}
    >
      {/* Calligraphy Banner */}
      <div
        style={{
          position: 'absolute',
          left: 140,
          top: 90,
          fontFamily: MV_FONT_FAMILIES.serif,
          fontWeight: 700,
          fontSize: 68,
          color: palette.ink,
          letterSpacing: 12,
          textShadow: '0 4px 18px rgba(0,0,0,0.12)',
        }}
      >
        <TextReveal
          text="安得广厦千万间"
          start={0}
          by="char"
          variant="rise"
          each={14}
          gap={4}
          ease={EASE.overshoot}
        />
      </div>

      {/* 屋檐轮廓线 + homeGrid 图标 */}
      <InkPathDraw
        d="M 80 620 Q 340 540 640 620 Q 980 500 1340 570 Q 1620 470 1880 530"
        progress={clamp01((time - 41.0) / 1.0)}
        color={palette.accent}
        width={3}
      />
      <InkSketchIcon
        name="homeGrid"
        x={1560}
        y={120}
        size={110}
        progress={clamp01((time - 41.1) / 0.8)}
        color={palette.accent}
        pulse={0}
      />

      {/* 从两处亮灯窗口 (280, 800) 与 (1100, 560) 引出 InkCallout */}
      <InkCallout
        from={[280, 800]}
        elbow={[280, 710]}
        to={[340, 670]}
        label="万家灯火 · 俱欢颜"
        color={palette.accent}
        progress={clamp01((time - 41.1) / 0.6)}
        pulse={0}
      />
      <InkCallout
        from={[1100, 560]}
        elbow={[1200, 500]}
        to={[1280, 450]}
        label="风雨不动 · 安如山"
        color={palette.accent}
        progress={clamp01((time - 41.25) / 0.6)}
        pulse={0}
      />
    </DynamicPainting>
  );
}

/**
 * 5. Shelter (43.015s ~ 45.636s):
 * mistDissolve cut + shelter_ink_v2.png + vfxPreset="windowWarmth" +
 * 温暖金色手绘方框圈住门堂 + warmSoup 简笔画 + 杜甫与千年后的你双气泡
 */
function DufuShelter({
  time,
  audioSample,
  palette,
}: {
  time: number;
  audioSample: AudioSample;
  palette: DufuPalette;
}) {
  return (
    <DynamicPainting
      name="shelter_ink_v2.png"
      time={time}
      start={43.015}
      end={45.636}
      camera="in"
      vfxPreset="windowWarmth"
      audioSample={audioSample}
      palette={palette}
    >
      <div
        style={{
          position: 'absolute',
          left: 720,
          top: 64,
          fontFamily: MV_FONT_FAMILIES.serif,
          fontSize: 42,
          color: palette.ink,
          opacity: clamp01((time - 43.2) / 0.6),
          letterSpacing: 8,
          textShadow: `0 0 20px ${palette.glow}`,
        }}
      >
        大庇天下寒士俱欢颜
      </div>

      {/* 温暖的金色手绘方框圈住正中亮灯门堂 (880..1090, 440..640) */}
      <InkPathDraw
        d="M 880 440 L 1090 440 L 1090 640 L 880 640 Z"
        progress={clamp01((time - 43.1) / 0.8)}
        color="#f0b764"
        width={3}
      />
      <InkSketchIcon
        name="warmSoup"
        x={760}
        y={480}
        size={96}
        progress={clamp01((time - 43.3) / 0.8)}
        color={palette.accent}
        pulse={0}
      />

      {/* 右上弹出杜甫气泡 */}
      <InkChatBubble
        x={1180}
        y={125}
        width={360}
        dark
        speaker="杜甫"
        text="广厦太远，只求一扇不漏雨的窗。"
        anchorFrom={[1020, 470]}
        progress={clamp01((time - 43.12) / 0.75)}
      />

      {/* 43.35s 左上弹出千年后的你气泡 */}
      <InkChatBubble
        x={110}
        y={140}
        width={360}
        dark
        speaker="一千年后的你"
        text="推开门，有盏留给我的灯，就是家。"
        progress={clamp01((time - 43.35) / 0.75)}
      />
    </DynamicPainting>
  );
}

/**
 * 6. KeyLock (45.636s ~ 48.250s):
 * key_lock_v2.png + vfxPreset="metalPendulum" + rotating concentric lock rings +
 * 充分利用左半屏宣纸留白引出 3 条 InkCallout + 心底一问气泡
 */
function DufuKeyLock({
  time,
  audioSample,
  palette,
}: {
  time: number;
  audioSample: AudioSample;
  palette: DufuPalette;
}) {
  const rot = (time - 45.636) * 16 + Math.sin(time * 3) * 6;

  return (
    <DynamicPainting
      name="key_lock_v2.png"
      time={time}
      start={45.636}
      end={48.25}
      camera="still"
      vfxPreset="metalPendulum"
      audioSample={audioSample}
      palette={palette}
    >
      {/* Concentric Lock Rings */}
      <svg
        width={340}
        height={340}
        viewBox="0 0 340 340"
        style={{
          position: 'absolute',
          left: 790,
          top: 240,
          pointerEvents: 'none',
          opacity: 0.45,
        }}
      >
        <circle cx="170" cy="170" r="140" fill="none" stroke={palette.accent} strokeWidth="1.5" strokeDasharray="6 8" />
        <circle cx="170" cy="170" r="110" fill="none" stroke={palette.secondaryInk} strokeWidth="1" strokeDasharray="3 6" transform={`rotate(${-rot} 170 170)`} />
        <circle cx="170" cy="170" r="75" fill="none" stroke={palette.ink} strokeWidth="1.8" transform={`rotate(${rot * 1.5} 170 170)`} strokeDasharray="14 12" />
      </svg>

      {/* 3 条从右侧钥匙环与锁孔向左侧留白的 InkCallout */}
      <InkCallout
        from={[1300, 560]}
        elbow={[780, 170]}
        to={[120, 120]}
        label="壹 · 租屋的门锁"
        sublabel="按月交租 · 随时迁走"
        icon="keyHole"
        progress={clamp01((time - 45.7) / 0.55)}
        pulse={0}
      />
      <InkCallout
        from={[1520, 430]}
        elbow={[820, 290]}
        to={[120, 270]}
        label="贰 · 案头的柜锁"
        sublabel="卷宗待办 · 昼夜操持"
        progress={clamp01((time - 45.85) / 0.55)}
        pulse={0}
      />
      <InkCallout
        from={[1300, 560]}
        elbow={[780, 430]}
        to={[120, 420]}
        label="叁 · 奔波的日程"
        sublabel="替人守关 · 步履不停"
        progress={clamp01((time - 46.0) / 0.55)}
        pulse={0}
      />

      {/* 46.05s 左下弹出心底一问气泡 */}
      <InkChatBubble
        x={120}
        y={555}
        width={380}
        speaker="心底一问"
        text="钥匙成串，哪一把才开自己的闲？"
        progress={clamp01((time - 46.05) / 0.75)}
      />
    </DynamicPainting>
  );
}

/**
 * 7. WorkerBadge (48.250s ~ 51.930s):
 * worker_badge_v2.png + 脖子金色轨迹线 + 心电脉冲 ecgBadge 简笔画 + 工艺人托付责任气泡
 * （特别注意：绝不写任何负面考勤/抱怨文案）
 */
function DufuWorkerBadge({
  time,
  audioSample,
  palette,
}: {
  time: number;
  audioSample: AudioSample;
  palette: DufuPalette;
}) {
  return (
    <DynamicPainting
      name="worker_badge_v2.png"
      time={time}
      start={48.25}
      end={51.93}
      camera="still"
      vfxPreset="metalPendulum"
      audioSample={audioSample}
      palette={palette}
      style={{
        transform: 'translateY(-140px)',
        maskImage: 'linear-gradient(180deg, #000 0%, #000 82%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 82%, transparent 100%)',
      }}
    >
      {/* 顺着脖子上黄色挂绳画两条金色轨迹线 (680,30) -> (980,500) 与 (1140,30) -> (980,500) */}
      <InkPathDraw
        d="M 680 30 L 980 500 M 1140 30 L 980 500"
        progress={clamp01((time - 48.3) / 1.0)}
        color="#f0b764"
        width={2.5}
      />

      {/* 胸前工牌上方横向随节拍跳动的心电脉冲简笔画 */}
      <InkSketchIcon
        name="ecgBadge"
        x={660}
        y={410}
        size={140}
        progress={clamp01((time - 48.6) / 0.8)}
        color={palette.accent}
        pulse={0}
      />

      {/* 右侧从工牌 (1110, 600) 引出工艺人责任气泡 */}
      <InkChatBubble
        x={1260}
        y={230}
        width={380}
        speaker="过来人 · 工艺人"
        text="戴上是托付，胸前是沉甸甸的责任。"
        anchorFrom={[1110, 600]}
        progress={clamp01((time - 48.4) / 0.85)}
      />
    </DynamicPainting>
  );
}

/**
 * 8. Bills (51.930s ~ 60.053s):
 * DufuBills
 */
function DufuBillsShot({
  time,
  audioSample,
  palette,
}: {
  time: number;
  audioSample: AudioSample;
  palette: DufuPalette;
}) {
  return (
    <DufuBills
      time={time}
      start={51.93}
      end={60.053}
      audioSample={audioSample}
      palette={palette}
    />
  );
}

/**
 * 9. Cradle (60.053s ~ 61.617s):
 * mistDissolve cut + cradle_ink_v2.png + vfxPreset="dust" +
 * 初生印记简笔画 + 家书添丁气泡 + 从摇篮向右朱砂红线
 */
function DufuCradle({
  time,
  audioSample,
  palette,
}: {
  time: number;
  audioSample: AudioSample;
  palette: DufuPalette;
}) {
  return (
    <DynamicPainting
      name="cradle_ink_v2.png"
      time={time}
      start={60.053}
      end={61.617}
      camera="still"
      vfxPreset="dust"
      audioSample={audioSample}
      palette={palette}
    >
      {/* 从摇篮 (780,480) 向右拉出一条朱砂红线 */}
      <InkPathDraw
        d="M 780 480 C 950 480, 1020 540, 1920 540"
        progress={clamp01((time - 60.1) / 1.0)}
        color={palette.accent}
        width={3}
      />

      {/* 右半屏留白初生印记与家书添丁气泡 */}
      <InkSketchIcon
        name="footprint"
        x={1120}
        y={140}
        size={110}
        label="初生印记"
        progress={clamp01((time - 60.2) / 0.8)}
        color={palette.accent}
        pulse={0}
      />
      <InkChatBubble
        x={1080}
        y={290}
        width={380}
        speaker="家书 · 添丁"
        text="今日添丁，母子平安，唯米缸见底。"
        anchorFrom={[780, 460]}
        progress={clamp01((time - 60.12) / 0.6)}
      />
    </DynamicPainting>
  );
}

/**
 * 10. Petition (61.617s ~ 63.720s):
 * inkBleed wet ink wash + dufu_petition_v2.png + vfxPreset="inkBloom" +
 * 红线连接到低头作揖杜甫 + 朱门门房气泡 + 杜甫在门外候着犹豫气泡
 */
function DufuPetition({
  time,
  audioSample,
  palette,
}: {
  time: number;
  audioSample: AudioSample;
  palette: DufuPalette;
}) {
  return (
    <DynamicPainting
      name="dufu_petition_v2.png"
      time={time}
      start={61.617}
      end={63.72}
      camera="left"
      vfxPreset="inkBloom"
      audioSample={audioSample}
      palette={palette}
    >
      {/* 红线连接到低头作揖的杜甫 (750, 420) */}
      <InkPathDraw
        d="M 0 540 L 750 420"
        progress={clamp01((time - 61.62) / 0.5)}
        color={palette.accent}
        width={3}
      />

      {/* 右上门房气泡 */}
      <InkChatBubble
        x={1200}
        y={110}
        width={360}
        dark
        speaker="朱门门房"
        text="大人饮宴不见客，改日再来！"
        anchorFrom={[1420, 360]}
        progress={clamp01((time - 61.68) / 0.65)}
      />

      {/* 左上杜甫犹豫气泡 */}
      <InkChatBubble
        x={90}
        y={150}
        width={350}
        dark
        speaker="杜甫"
        mode="hesitate"
        hesitateText="孩子等米…"
        text="无妨，门外候着便是。"
        anchorFrom={[660, 290]}
        progress={clamp01((time - 61.82) / 0.7)}
      />
    </DynamicPainting>
  );
}

/**
 * 11. Midnight (63.720s ~ 67.410s):
 * noodle_ink_v2.png + vfxPreset="windowWarmth" + 02:00 beatPulse clock + multi-path steam +
 * 碗口手绘暖金弧线 + 左侧今夜的你气泡 + 右侧唐代残饼 flatbread 简笔画与杜甫独白气泡
 */
function DufuMidnight({
  time,
  audioSample,
  palette,
}: {
  time: number;
  audioSample: AudioSample;
  palette: DufuPalette;
}) {
  const filterId = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <DynamicPainting
      name="noodle_ink_v2.png"
      time={time}
      start={63.72}
      end={67.41}
      camera="in"
      vfxPreset="windowWarmth"
      audioSample={audioSample}
      palette={palette}
    >
      {/* 02:00 clock indicator */}
      <div
        style={{
          position: 'absolute',
          left: 140,
          top: 100,
          fontFamily: MV_FONT_FAMILIES.serif,
          fontSize: 72,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: palette.accent,
          opacity: 0.85,
          textShadow: `0 0 24px ${palette.glow}`,
          letterSpacing: 4,
        }}
      >
        02:00
      </div>

      {/* Upgraded Gaussian blurred noodle steam paths */}
      <svg width={1920} height={760} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
        <defs>
          <filter id={`noodleSteam-${filterId}`}>
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        {[0, 1, 2, 3].map((i) => {
          const q = ((time - 63.72) * 0.38 + i / 4) % 1;
          const x = 930 + i * 48 + Math.sin(q * 5 + i) * 20;
          return (
            <path
              key={i}
              d={`M${x} ${360 - q * 120} C${x - 40} ${300 - q * 120}, ${x + 45} ${240 - q * 120}, ${x + 6} ${170 - q * 120}`}
              stroke="#fff2db"
              strokeWidth={14}
              fill="none"
              opacity={0.24 * Math.sin(q * Math.PI)}
              filter={`url(#noodleSteam-${filterId})`}
            />
          );
        })}
      </svg>

      {/* 顺着碗口画一圈手绘暖金弧线 */}
      <InkPathDraw
        d="M 830 440 Q 960 500 1100 440"
        progress={clamp01((time - 63.8) / 0.8)}
        color="#ffdca8"
        width={3.5}
      />

      {/* 左侧留白弹出今夜的你气泡 */}
      <InkChatBubble
        x={80}
        y={250}
        width={350}
        dark
        speaker="02:00 · 今夜的你"
        text="改完方案，桌上的泡面又软了。"
        anchorFrom={[580, 380]}
        progress={clamp01((time - 63.85) / 0.75)}
      />

      {/* 右侧留白配残饼简笔画与千年前杜甫气泡 */}
      <InkSketchIcon
        name="flatbread"
        x={1660}
        y={105}
        size={95}
        progress={clamp01((time - 64.2) / 0.8)}
        color={palette.accent}
        pulse={0}
      />
      <InkChatBubble
        x={1310}
        y={230}
        width={380}
        dark
        speaker="千年前 · 杜甫"
        text="长安寒夜我也常醒，就冷水咽下残饼。"
        anchorFrom={[1220, 360]}
        progress={clamp01((time - 64.1) / 0.8)}
      />
    </DynamicPainting>
  );
}

/**
 * 12. MemoryTravel (67.410s ~ 74.300s):
 * Upgraded MemoryTravel with palette and audioSample +
 * 顶部居中浮现长条长辈杜甫气泡 + 73.5~74.3s night edge transition
 */
function DufuMemoryTravel({
  time,
  audioSample,
  palette,
}: {
  time: number;
  audioSample: AudioSample;
  palette: DufuPalette;
}) {
  const nightEdgeP = clamp01((time - 73.5) / 0.8);

  return (
    <AbsoluteFill>
      <MemoryTravel
        time={time}
        start={67.41}
        end={74.3}
        person="dufu"
        palette={palette}
        audioSample={audioSample}
        events={[
          { name: 'changan_ink_v2.png', label: '辗转' },
          { name: 'hut_ink_v2.png', label: '安身' },
          { name: 'dufu_petition_v2.png', label: '奔波' },
          { name: 'noodle_ink_v2.png', label: '深夜' },
        ]}
      />

      {/* 顶部居中浮现长条长辈杜甫气泡 */}
      <InkChatBubble
        x={520}
        y={84}
        width={880}
        dark
        speaker="过来人 · 杜甫"
        text="隔着一千年拍拍你的肩：这些难处，我都陪你走过。"
        progress={clamp01((time - 67.6) / 0.95)}
      />

      {/* Smooth transition into night edge at 73.5s ~ 74.3s */}
      {nightEdgeP > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: '#05070a',
            opacity: nightEdgeP * 0.92,
            pointerEvents: 'none',
          }}
        />
      )}
    </AbsoluteFill>
  );
}

export function Dufu({ time, entryMode = 'standalone' }: DufuProps) {
  const palette = sampleDufuPalette(time);
  const audioSample = sampleAudio(time);

  // Define 12 motivated shots coordinated by OverlapStage
  const shots: OverlapShot[] = useMemo(() => [
    {
      id: 'shot1_identity',
      start: 30.0,
      end: 33.065,
      transition: 'scrollSlide',
      transitionDuration: 0.5,
      render: ({ time: t }) => <DufuIdentity time={t} audioSample={sampleAudio(t)} palette={sampleDufuPalette(t)} />,
    },
    {
      id: 'shot2_rent',
      start: 33.065,
      end: 36.904,
      transition: 'inkBleed',
      transitionDuration: 0.6,
      render: ({ time: t }) => <DufuRent time={t} audioSample={sampleAudio(t)} palette={sampleDufuPalette(t)} />,
    },
    {
      id: 'shot3_hutStorm',
      start: 36.904,
      end: 40.993,
      transition: 'inkBleed',
      transitionDuration: 0.55,
      render: ({ time: t }) => <DufuHutStorm time={t} audioSample={sampleAudio(t)} palette={sampleDufuPalette(t)} />,
    },
    {
      id: 'shot4_manyHomes',
      start: 40.993,
      end: 43.015,
      transition: 'mistDissolve',
      transitionDuration: 0.6,
      render: ({ time: t }) => <DufuManyHomes time={t} audioSample={sampleAudio(t)} palette={sampleDufuPalette(t)} />,
    },
    {
      id: 'shot5_shelter',
      start: 43.015,
      end: 45.636,
      transition: 'mistDissolve',
      transitionDuration: 0.55,
      render: ({ time: t }) => <DufuShelter time={t} audioSample={sampleAudio(t)} palette={sampleDufuPalette(t)} />,
    },
    {
      id: 'shot6_keyLock',
      start: 45.636,
      end: 48.25,
      transition: 'scrollSlide',
      transitionDuration: 0.5,
      render: ({ time: t }) => <DufuKeyLock time={t} audioSample={sampleAudio(t)} palette={sampleDufuPalette(t)} />,
    },
    {
      id: 'shot7_workerBadge',
      start: 48.25,
      end: 51.93,
      transition: 'scrollSlide',
      transitionDuration: 0.55,
      render: ({ time: t }) => <DufuWorkerBadge time={t} audioSample={sampleAudio(t)} palette={sampleDufuPalette(t)} />,
    },
    {
      id: 'shot8_bills',
      start: 51.93,
      end: 60.053,
      transition: 'scrollSlide',
      transitionDuration: 0.6,
      render: ({ time: t }) => <DufuBillsShot time={t} audioSample={sampleAudio(t)} palette={sampleDufuPalette(t)} />,
    },
    {
      id: 'shot9_cradle',
      start: 60.053,
      end: 61.617,
      transition: 'mistDissolve',
      transitionDuration: 0.55,
      render: ({ time: t }) => <DufuCradle time={t} audioSample={sampleAudio(t)} palette={sampleDufuPalette(t)} />,
    },
    {
      id: 'shot10_petition',
      start: 61.617,
      end: 63.72,
      transition: 'inkBleed',
      transitionDuration: 0.55,
      render: ({ time: t }) => <DufuPetition time={t} audioSample={sampleAudio(t)} palette={sampleDufuPalette(t)} />,
    },
    {
      id: 'shot11_midnight',
      start: 63.72,
      end: 67.41,
      transition: 'mistDissolve',
      transitionDuration: 0.6,
      render: ({ time: t }) => <DufuMidnight time={t} audioSample={sampleAudio(t)} palette={sampleDufuPalette(t)} />,
    },
    {
      id: 'shot12_memoryTravel',
      start: 67.41,
      end: 74.3,
      transition: 'mistDissolve',
      transitionDuration: 0.6,
      render: ({ time: t }) => <DufuMemoryTravel time={t} audioSample={sampleAudio(t)} palette={sampleDufuPalette(t)} />,
    },
  ], []);

  const content = <OverlapStage shots={shots} time={time} defaultTransition="mistDissolve" defaultDuration={0.6} />;

  // Standalone preview soft ink entry (0.35s)
  const isStandalone = entryMode === 'standalone';
  const entryProgress = isStandalone ? clamp01((time - 30.0) / 0.35) : 1;

  return (
    <PaletteContext.Provider value={palette}>
      <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: palette.bg }}>
        {isStandalone && entryProgress < 1 ? (
          <InkReveal progress={entryProgress}>{content}</InkReveal>
        ) : (
          content
        )}
      </AbsoluteFill>
    </PaletteContext.Provider>
  );
}
