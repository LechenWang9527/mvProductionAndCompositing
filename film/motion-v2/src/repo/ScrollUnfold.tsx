import React from 'react';
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * ScrollUnfold —— 桌上手卷展开（从右往左拉开）+ 墨迹在纸面上洇开
 *
 * 这是 intro-v6 里唯一被认可的一镜，抽成自包含组件，不依赖任何 study 内的 kit。
 * 可被任意 Remotion 合成直接使用，也可作为 V4 之后版本的替换件。
 *
 * 设计要点（都是踩过坑换来的）：
 *  1. 3:1 的卷轴素材**绝不可拉伸铺满 16:9**。硬拉的结果是一条空白纸带浮在黑里，
 *     两端滚轴被裁到画外，完全没有「桌上摊开一卷手卷」的空间感。按真实比例放置，留白给桌面。
 *  2. 画心必须 `mixBlendMode: 'multiply'` + 径向 mask 羽化才「粘」在纸上。
 *     只调 brightness/sepia 会得到冷灰纸 vs 暖黄卷轴，硬边一目了然；
 *     multiply 但压亮度会发灰浑浊。
 *  3. 展开前沿要有 26px 的窄影，否则读不出「正被拉开」的方向。
 *  4. 纸面在墨迹到位前不能是纯白：叠一层极淡旧痕（0.2 multiply + 模糊），把空窗垫住。
 *
 * 纸面归一化坐标来自对 `scroll_cutout_v2.png`(2172×724) 的 alpha 实测：
 *   x 0.078–0.916 / y 0.153–0.849
 */
export type ScrollUnfoldProps = {
  /** 歌曲时间（秒）。不传则由 useCurrentFrame 驱动（合成内直接使用时推荐不传） */
  time?: number;
  /** 出场时间窗 */
  start: number;
  end: number;
  /** 展开时长，默认 2.4 s */
  openSeconds?: number;
  /** 墨迹相对 start 的延迟与时长，默认 1.05 / 1.65 s */
  inkDelay?: number;
  inkSeconds?: number;
  /** 卷轴显示宽度（px），默认 1780，高度按素材真实比例算 */
  width?: number;
  /** 素材（public/ 下的相对路径） */
  paper?: string;
  ink?: string;
  /** 承托用的桌面底图，传 null 关闭 */
  desk?: string | null;
  /** 进出画面的淡入淡出秒数 */
  fadeIn?: number;
  fadeOut?: number;
  /** 整镜轻微推近的幅度（0 = 不推） */
  push?: number;
  /** 底色；传 null 则不画底板（叠加到既有场景上时用） */
  background?: string | null;
  /** 是否自己压暗角；叠加到已有暗角的画面上时传 false */
  vignette?: boolean;
  style?: React.CSSProperties;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOutQuart = (u: number) => 1 - Math.pow(1 - u, 4);
const easeInOutQuad = (u: number) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

/**
 * 《长安》原图底色实测为 (233,196,161) 的米黄，不是纯白。
 * 直接 multiply 会在卷轴纸上留一块矩形色带（用户截图即此）。
 * 这里先做白场归一：把纸色除以自身 → 纯白，乘算时才真正「只留墨」。
 * 系数 = 255 / 纸色各通道。
 */
const INK_LEVELS = 'ink-levels';

const INK_MASK =
  'radial-gradient(ellipse 64% 70% at 50% 50%, #000 0%, #000 50%, rgba(0,0,0,0.74) 78%, rgba(0,0,0,0.2) 92%, rgba(0,0,0,0) 100%)';
/** 上下退场：原图自带的淡雾地脚乘算后不变色，会在纸上留一条无纸纹平带 */
const INK_MASK_V =
  'linear-gradient(to bottom, rgba(0,0,0,0) 0%, #000 12%, #000 84%, rgba(0,0,0,0) 100%)';

export const ScrollUnfold: React.FC<ScrollUnfoldProps> = ({
  time,
  start,
  end,
  openSeconds = 2.4,
  inkDelay = 1.05,
  inkSeconds = 1.65,
  width = 1780,
  paper = 'assets/scroll_cutout_v2.png',
  ink = 'assets/changan_ink_v2.png',
  desk = 'assets/lamp_desk_ink_v3.png',
  fadeIn = 0.45,
  fadeOut = 0.1,
  push = 0.1,
  background = '#0b0907',
  vignette = true,
  style,
}) => {
  // 组件也可以在合成外部被驱动：优先用传入的 time
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = typeof time === 'number' ? time : frame / fps;

  if (t < start || t > end) return null;

  const lt = t - start;
  const dur = end - start;
  const aIn = fadeIn > 0 ? clamp01(lt / fadeIn) : 1;
  const aOut = fadeOut > 0 ? clamp01((dur - lt) / fadeOut) : 1;
  const alpha = Math.min(aIn, aOut);

  const open = easeOutQuart(clamp01(lt / openSeconds));
  const inkP = easeInOutQuad(clamp01((lt - inkDelay) / inkSeconds));
  const pushP = easeInOutQuad(clamp01(lt / dur));

  // 卷轴真实比例 2172×724
  const SW = width;
  const SH = (SW * 724) / 2172;
  const px = SW * 0.078;
  const py = SH * 0.153;
  const pw = SW * 0.838;
  const ph = SH * 0.696;
  // 画心：手卷式横幅 2.9:1，居中于纸面
  const aw = pw * 0.94;
  const ah = aw / 2.9;

  const src = (p: string) => (p.startsWith('http') ? p : staticFile(p));

  return (
    <AbsoluteFill style={{ opacity: alpha, background: background ?? 'transparent', ...style }}>
      {desk && (
        <AbsoluteFill style={{ filter: 'brightness(0.3) blur(14px) sepia(0.2)', transform: 'scale(1.5)' }}>
          <img src={src(desk)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
      )}
      {/* 桌面暖光 */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 62% 50% at 50% 52%, rgba(255,176,92,0.16) 0%, rgba(0,0,0,0) 72%)',
          mixBlendMode: 'screen',
        }}
      />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            position: 'relative',
            width: SW,
            height: SH,
            transform: 'scale(' + (1 + pushP * push).toFixed(4) + ')',
          }}
        >
          {/* 卷轴本体：clip 自左向右揭开，右端仍在卷里 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              clipPath: 'inset(0 ' + (100 * (1 - open)).toFixed(2) + '% 0 0)',
              willChange: 'clip-path',
              filter: 'drop-shadow(0 26px 46px rgba(0,0,0,0.62)) brightness(0.94) sepia(0.08)',
            }}
          >
            <img src={src(paper)} alt="" style={{ width: '100%', height: '100%' }} />

            {/* 纸面旧痕：极淡的山水残迹，避免「一张白纸」的空窗 */}
            <div
              style={{
                position: 'absolute',
                left: px,
                top: py,
                width: pw,
                height: ph,
                overflow: 'hidden',
                opacity: 0.2,
                mixBlendMode: 'multiply',
              }}
            >
              <img
                src={src(ink)}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: '50% 62%',
                  filter: 'blur(5px) brightness(1.02) contrast(0.8) saturate(0.5)',
                }}
              />
            </div>

            {/* 白场归一的滤镜定义（把米黄纸色除成纯白，乘算后不改变卷轴纸面） */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <filter id={INK_LEVELS} colorInterpolationFilters="sRGB">
                <feColorMatrix
                  type="matrix"
                  values="1.094 0 0 0 0  0 1.301 0 0 0  0 0 1.584 0 0  0 0 0 1 0"
                />
              </filter>
            </svg>

            {/* 画心：墨从中心洇开 */}
            <div
              style={{
                position: 'absolute',
                left: px + (pw - aw) / 2,
                top: py + (ph - ah) / 2,
                width: aw,
                height: ah,
                overflow: 'hidden',
                opacity: inkP,
                filter: 'blur(' + ((1 - inkP) * 6).toFixed(2) + 'px)',
                transform: 'scale(' + (0.88 + 0.12 * inkP).toFixed(4) + ')',
                // 混合模式必须落在这一层：它和外层纸张同处一个 stacking context（纸张父层带 filter，
                // 自身是隔离组，但纸 img 与本 div 是组内兄弟）。若把 multiply 写到里面那个 img 上，
                // 它只会与透明底混合，白底原样露出 → 纸上出现冷白硬矩形。
                mixBlendMode: 'multiply',
              }}
            >
              <img
                src={src(ink)}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: '50% 46%',
                  filter: 'url(#' + INK_LEVELS + ') contrast(1.06) saturate(0.62)',
                  maskImage: INK_MASK + ', ' + INK_MASK_V,
                  WebkitMaskImage: INK_MASK + ', ' + INK_MASK_V,
                  maskComposite: 'intersect',
                  WebkitMaskComposite: 'source-in',
                }}
              />
            </div>

            {/* 画心的细绢边 */}
            <div
              style={{
                position: 'absolute',
                left: px + (pw - aw) / 2 - 9,
                top: py + (ph - ah) / 2 - 9,
                width: aw + 18,
                height: ah + 18,
                border: '1px solid rgba(116,92,60,0.22)',
                opacity: inkP,
              }}
            />
          </div>

          {/* 展开前沿的一道窄影：给出「正被拉开」的方向 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: (SW * open - 26).toFixed(1),
              width: 26,
              height: SH,
              background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)',
              opacity: open < 0.99 ? 1 : 0,
              pointerEvents: 'none',
            }}
          />
        </div>
      </AbsoluteFill>

      {/* 暗角（不用 kit 的 Vignette，保持组件零依赖） */}
      {vignette && (
        <AbsoluteFill
          style={{
            pointerEvents: 'none',
            background:
              'radial-gradient(ellipse 78% 72% at 50% 50%, rgba(10,8,6,0) 30%, rgba(10,8,6,0.52) 78%, rgba(10,8,6,0.78) 100%)',
          }}
        />
      )}
    </AbsoluteFill>
  );
};
