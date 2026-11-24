import React from 'react';
import { AbsoluteFill, Img } from 'remotion';
import { EditorialStage, BrushRule } from '../visual/EditorialStage';
import { asset, at, MemoryTravel, RED } from './Shot';
import { WindScene } from '../visual/WindLayers';
import { InkPathDraw, InkCallout, InkChatBubble, clamp01 } from './InkSketchPrimitives';

export function Ending({ time, enhancedMotion = false }: { time: number; enhancedMotion?: boolean }) {
  if (time < 133.52) {
    return (
      <EditorialStage cornerInkSrc={false}>
        <WindScene time={time - 127.6} duration={5.92} layersReady={{ sky: true, land: true, flag: true }} />

        {/* 天际流云金色手绘线 */}
        <InkPathDraw
          d="M 140 220 Q 760 120 1680 240"
          progress={clamp01((time - 127.8) / 1.2)}
          color="#ffdca8"
          width={2.6}
        />
        <InkPathDraw
          d="M 240 280 Q 860 180 1560 300"
          progress={clamp01((time - 128.0) / 1.1)}
          color="#f3d09a"
          width={2.0}
          dashed
        />

        {/* 左上 六十岁 · 刘邦 豪迈定格气泡 */}
        <InkChatBubble
          dark
          speaker="六十岁 · 刘邦"
          text="大风起兮云飞扬！四十七岁起步，六十岁登顶——人生哪有什么太晚？"
          progress={clamp01((time - 127.85) / 0.8)}
          x={110}
          y={100}
          width={400}
        />

        {/* 右侧从迎风旌旗拉出折线标注 */}
        <InkCallout
          from={[1800, 520]}
          to={[1380, 360]}
          label="汉高祖 · 归沛县歌大风"
          sublabel="威加海内兮归故乡"
          dark
          progress={clamp01((time - 128.2) / 0.7)}
        />
      </EditorialStage>
    );
  }

  const light = at(time, 136.1, 1.05);

  return (
    <>
      <MemoryTravel
        time={time}
        start={133.52}
        end={137.3}
        events={[
          { name: 'changan_ink_v2.png', label: '安身' },
          { name: 'phone_down_ink_v2.png', label: '沉默' },
          { name: 'battle_ink_v2.png', label: '走过' },
          { name: 'wind_landscape_v3.png', label: '继续' },
        ]}
      />

      {/* 顶部古今交棒气泡 */}
      <InkChatBubble
        x={480}
        y={84}
        width={960}
        dark
        speaker="古今交棒 · 过来人"
        text="千年前的風雨讲完了，这盏灯，现在交到你们马牌工艺人手里。"
        progress={clamp01((time - 133.65) / 0.75)}
      />

      {/* 136.1s 油灯亮起，烛光呼吸与朱砂横线收束 */}
      <AbsoluteFill style={{ opacity: light }}>
        <EditorialStage cornerInkSrc={false}>
          <Img
            src={asset('lamp_cutout_v2.png')}
            style={{
              position: 'absolute',
              left: 704,
              top: 205,
              width: 510,
              height: 434,
              objectFit: 'contain',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 984,
              top: 189,
              width: 265,
              height: 240,
              background: 'radial-gradient(ellipse,rgba(232,162,56,.24),transparent 70%)',
              opacity: 0.8 + 0.1 * Math.sin(time * 6),
            }}
          />
          <svg width={1920} height={760} style={{ position: 'absolute', inset: 0 }}>
            <path d="M1152 278 C1137 264 1146 245 1154 219 C1165 246 1169 266 1152 278Z" fill="#bc6639" opacity={0.85} />
            <path d="M1153 272 C1147 260 1154 251 1156 243 C1163 260 1160 268 1153 272Z" fill="#ffdc93" />
          </svg>
          <BrushRule x={360} y={682} width={1200} progress={1} thickness={2} color={RED} opacity={0.45} />
        </EditorialStage>
      </AbsoluteFill>
    </>
  );
}
