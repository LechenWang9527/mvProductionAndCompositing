import React from 'react';
import { EditorialStage, BrushRule } from '../visual/EditorialStage';
import { at, INK, Note, RED, serif } from './Shot';
import { MVFonts } from '../visual/Fonts';
import { DynamicPainting } from './DynamicPainting';
import { InkPathDraw, InkCallout, InkChatBubble, clamp01 } from './InkSketchPrimitives';

type Props = { time: number };

const START = 111.95;
const END = 119.45;
const MARKS = [112.08, 112.63, 113.18, 113.73, 114.28, 114.83];
const NODE_X = [210, 340, 470, 600, 730, 860, 990];

export const War: React.FC<Props> = ({ time }) => {
  if (time < START) return <MVFonts />;
  if (time > END) return null;

  const lineIn = at(time, START, 0.48);
  const slash = at(time, 113.0, 0.46);
  const seventh = at(time, 115.544, 0.48);
  const victory = at(time, 116.92, 0.42);

  return (
    <>
      <MVFonts />
      <EditorialStage cornerInkSrc={false}>
        <DynamicPainting name="battle_ink_v2.png" time={time} start={START} end={END} camera="in" vfxPreset="inkBloom" />
        <BrushRule x={190} y={155} width={825} progress={lineIn} thickness={1.7} color={RED} opacity={0.68} seed={31} />

        {/* 战局节点 一~七 */}
        {NODE_X.map((x, i) => {
          const active = i < MARKS.length ? at(time, MARKS[i], 0.42) : seventh;
          const numeral = '一二三四五六七'[i];
          return (
            <React.Fragment key={numeral}>
              <div style={{ position: 'absolute', left: x - 6, top: 149, width: 12, height: 12, borderRadius: '50%', background: '#b6a999', opacity: 0.55 }} />
              <div style={{ position: 'absolute', left: x - 6, top: 149, width: 12, height: 12, borderRadius: '50%', background: INK, opacity: active }} />
              <Note x={x - 22} y={90} size={34} color="#988d80" style={{ width: 44, textAlign: 'center' }}>
                {numeral}
              </Note>
              <div style={{ position: 'absolute', left: x - 22, top: 90, width: 44, textAlign: 'center', fontFamily: serif, fontSize: 34, lineHeight: 1.45, color: INK, opacity: active, pointerEvents: 'none' }}>
                {numeral}
              </div>
            </React.Fragment>
          );
        })}

        {/* 113.0s 输了六年：红线划过前六场 */}
        <svg width={1920} height={210} viewBox="0 0 1920 210" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }} aria-hidden="true">
          <path
            d="M190 132 L900 154"
            fill="none"
            stroke={RED}
            strokeWidth={2.4}
            strokeLinecap="round"
            opacity={0.78 * slash}
            strokeDasharray={710.4}
            strokeDashoffset={710.4 * (1 - slash)}
          />
        </svg>

        {/* 113.1s 弹出败绩折线标注 */}
        <InkCallout
          from={[540, 150]}
          to={[580, 240]}
          label="六载败绩 · 彭城荥阳屡败屡战"
          sublabel="无人问津的漫长低谷"
          progress={clamp01((time - 113.1) / 0.65)}
        />

        {/* 第七场 未定 / 胜 */}
        <div style={{
          position: 'absolute', left: NODE_X[6] - 14, top: 181, width: 40, height: 40,
          border: `1.5px solid ${RED}`, borderRadius: '50%', boxSizing: 'border-box',
          opacity: seventh, transform: `scale(${0.78 + 0.22 * seventh})`,
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'absolute', left: NODE_X[6] - 47, top: 181, width: 94, height: 48, textAlign: 'center', fontFamily: serif, fontSize: 29, lineHeight: '42px', color: RED, opacity: seventh * (1 - victory) }}>
          未定
        </div>
        <div style={{
          position: 'absolute', left: NODE_X[6] - 23, top: 181, width: 46, height: 46,
          display: 'grid', placeItems: 'center', boxSizing: 'border-box',
          border: `1.6px solid ${RED}`, color: RED, fontFamily: serif, fontSize: 25, lineHeight: 1,
          opacity: victory, transform: `scale(${0.86 + 0.14 * victory})`,
        }}>
          胜
        </div>

        {/* 115.4s 长矛直冲云霄暖金锋芒线 */}
        <InkPathDraw
          d="M 1255 680 L 1395 35"
          progress={clamp01((time - 115.4) / 0.7)}
          color="#ffdca8"
          width={3.6}
        />

        {/* 115.6s 战旗拉出垓下一战标注 */}
        <InkCallout
          from={[1560, 180]}
          to={[1440, 90]}
          label="垓下一战 · 乾坤逆转"
          dark
          progress={clamp01((time - 115.6) / 0.65)}
        />

        {/* 112.3s 提早浮现并稳稳停驻整段的主题气泡 */}
        <InkChatBubble
          dark
          speaker="汉王 · 刘邦"
          text="没人记得你摔过多少跤，只记得最后站着的人是谁。"
          progress={clamp01((time - 112.3) / 0.8)}
          anchorFrom={[1180, 320]}
          x={120}
          y={340}
          width={420}
        />
      </EditorialStage>
    </>
  );
};
