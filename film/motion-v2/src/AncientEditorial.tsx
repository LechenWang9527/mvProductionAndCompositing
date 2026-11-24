import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { SubtitleTrackEditorial } from './SubtitlesEditorial';
import { MVFonts } from './visual/Fonts';
import { OpeningV4Scroll } from './editorial/OpeningV4Scroll';
import { Dufu } from './editorial/Dufu';
import { Opening } from './editorial/Opening';
import { Liu } from './editorial/Liu';
import { Phone } from './editorial/Phone';
import { War } from './editorial/War';
import { Orders } from './editorial/Orders';
import { Ending } from './editorial/Ending';
import { sampleDufuPalette } from './engine/palette';

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => {
  const t = clamp01(n);
  return t * t * (3 - 2 * t);
};

export const AncientEditorial: React.FC<{ enhancedMotion?: boolean }> = ({ enhancedMotion = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  // 30.4s ~ 30.8s: 暗夜小巷到杜甫宣纸的柔滑过渡
  const paperBlend = time < 30.4 ? 0 : time >= 30.8 ? 1 : smooth((time - 30.4) / 0.4);

  return (
    <AbsoluteFill style={{ background: time < 30.6 ? '#070604' : '#f8f6f0', overflow: 'hidden' }}>
      <MVFonts />
      <Audio src={staticFile('audio/ogs.mp3')} />

      {/* 0 ~ 30.8s: 开场精修 v4scroll（孤灯点火 + 长卷展开 + 墨迹洇出 + 夜市时钟小巷） */}
      {time < 30.8 && <OpeningV4Scroll time={time} />}

      {/* 30.4 ~ 74.3s: 杜甫篇 V3（30.4~30.8s 柔滑叠化接入） */}
      {time >= 30.4 && time < 74.3 && (
        <div style={{ position: 'absolute', inset: 0, opacity: paperBlend }}>
          <Dufu time={time} entryMode="fromV4Scroll" />
        </div>
      )}

      {/* 74.3 ~ 90.0s: 副歌交棒桥（杜甫与刘邦跨时空交接） */}
      {time >= 74.3 && time < 90.0 && <Opening time={time} enhancedMotion={enhancedMotion} />}

      {/* 90.0 ~ 103.94s: 刘邦篇 · 大风起兮与泗水亭 */}
      {time >= 90.0 && time < 103.94 && <Liu time={time} />}

      {/* 103.94 ~ 111.95s: 汉初君臣同僚微信群聊 */}
      {time >= 103.94 && time < 111.95 && <Phone time={time} />}

      {/* 111.95 ~ 119.45s: 鸿门宴楚汉争霸烽烟 */}
      {time >= 111.95 && time < 119.45 && <War time={time} />}

      {/* 119.45 ~ 127.60s: 运筹帷幄四季奔波排兵列阵 */}
      {time >= 119.45 && time < 127.60 && <Orders time={time} alignMarkers={enhancedMotion} />}

      {/* 127.60 ~ 137.30s: 尾声终章壮阔回望 */}
      {time >= 127.60 && <Ending time={time} enhancedMotion={enhancedMotion} />}

      {/* 全片统一古风字幕轨道 */}
      <SubtitleTrackEditorial
        ancientOnly
        tone={time < 30.6 ? 'night' : 'paper'}
        palette={time >= 30.6 && time < 74.3 ? sampleDufuPalette(time) : undefined}
      />
    </AbsoluteFill>
  );
};
