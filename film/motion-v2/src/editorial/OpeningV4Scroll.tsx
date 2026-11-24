import React from 'react';
import { AbsoluteFill } from 'remotion';
import { LampIgnitionDemo } from '../../studies/lamp-ignition/src/LampIgnitionDemo';
import { ScrollUnfold } from '../repo/ScrollUnfold';
import { JourneyProcess } from '../../studies/chorus-process/src/parts/JourneyProcess';
import { NightClock } from '../../studies/chorus-process/src/parts/NightClock';
import { UnsentThought } from '../../studies/chorus-process/src/parts/UnsentThought';
import { AlleyLampSlow } from '../../studies/chorus-process/src/parts/AlleyLampSlow';
import { AlleyRoad } from '../../studies/chorus-process/src/v4scroll/AlleyRoad';

const PROCESS_CUTOFF = 23.357;
const ALLEY_START = 23.357;
const ALLEY_READY = 24.663;

/** 被替换的时间窗（= JourneyProcess 的 SONG_A_START / SONG_A_END） */
const SCROLL_START = 14.99;
const SCROLL_END = 19.945;
/** 进出各留 0.22 s 的坡度，避免硬切跳变 */
const SCROLL_FADE = 0.22;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => {
  const t = clamp01(n);
  return t * t * (3 - 2 * t);
};

/**
 * 0 ~ 30.8s 纯视觉开场组件 OpeningV4Scroll
 * 提炼自 ChorusProcessDemoV4Scroll，不包含外层统一调度的 Dufu、字幕与全局音轨。
 */
export const OpeningV4Scroll: React.FC<{ time: number }> = ({ time }) => {
  if (time < 0 || time > 30.8) return null;

  const alleyIn = smooth((time - ALLEY_START) / (ALLEY_READY - ALLEY_START));

  // 卷轴段的进出坡（只在 SCROLL_START±FADE 与 SCROLL_END±FADE 生效）
  const scrollIn = smooth((time - SCROLL_START) / SCROLL_FADE);
  const scrollOut = 1 - smooth((time - (SCROLL_END - SCROLL_FADE)) / SCROLL_FADE);
  const scrollMix = Math.min(scrollIn, scrollOut); // 1 = 卷轴满，0 = 原画面满

  return (
    <AbsoluteFill style={{ backgroundColor: '#070604', overflow: 'hidden' }}>
      {/* 桌面夜景 + 孤灯点亮：withAudio={false} 避免与全局音频重复 */}
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - alleyIn }}>
        <LampIgnitionDemo withAudio={false} />
      </div>

      {/* 原 JourneyProcess：只在 14.99–19.945 被卷轴段按 scrollMix 让位 */}
      <div style={{ position: 'absolute', inset: 0, opacity: (time < PROCESS_CUTOFF ? 1 : 0) * (1 - scrollMix) }}>
        <JourneyProcess />
      </div>

      {/* 卷轴段：只在被替换的时间窗内出现 */}
      {time >= SCROLL_START && time <= SCROLL_END && (
        <div style={{ position: 'absolute', inset: 0, opacity: scrollMix }}>
          <ScrollUnfold
            start={SCROLL_START}
            end={SCROLL_END}
            openSeconds={2.55}
            inkDelay={0.9}
            inkSeconds={1.9}
            width={1620}
            push={0.06}
            fadeIn={0}
            fadeOut={0}
            background={null}
            vignette={false}
            desk="assets/lamp_desk_ink_v3.png"
          />
        </div>
      )}

      <NightClock time={time} />
      <UnsentThought time={time} />
      <AlleyLampSlow time={time} />
      <AlleyRoad time={time} />
    </AbsoluteFill>
  );
};
