import { useId, useMemo, type CSSProperties, type ReactNode } from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { MV_FONT_FAMILIES } from './Fonts';

export const EDITORIAL_CANVAS = { width: 1920, height: 1080 } as const;
export const EDITORIAL_SAFE_AREA = { top: 60, bottom: 730, subtitlesTop: 778 } as const;

export const EDITORIAL_COLORS = {
  paper: '#F8F6F0',
  ink: '#211D19',
  secondaryInk: '#615950',
  cinnabar: '#9A3028',
  hairline: 'rgba(33, 29, 25, 0.28)',
} as const;

/** Readable editorial hierarchy at 1920×1080; no display title is added by default. */
export const EDITORIAL_TYPE: Record<'display' | 'heading' | 'body' | 'support', CSSProperties> = {
  display: { fontFamily: MV_FONT_FAMILIES.serif, fontSize: 72, fontWeight: 600, lineHeight: 1.12, color: EDITORIAL_COLORS.ink },
  heading: { fontFamily: MV_FONT_FAMILIES.serif, fontSize: 54, fontWeight: 600, lineHeight: 1.16, color: EDITORIAL_COLORS.ink },
  body: { fontFamily: MV_FONT_FAMILIES.serif, fontSize: 38, fontWeight: 400, lineHeight: 1.38, color: EDITORIAL_COLORS.ink },
  support: { fontFamily: MV_FONT_FAMILIES.sans, fontSize: 30, fontWeight: 400, lineHeight: 1.3, color: EDITORIAL_COLORS.secondaryInk },
};

// Fixed, seamless grayscale grain follows the cached feTurbulence tile approach in
// ref_drawai/lib/motion/shotcraft/upstream/demos/_fixtures/Polish.tsx (grainTile).
const PAPER_GRAIN = (() => {
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'>" +
    "<filter id='g' x='0' y='0' width='100%' height='100%'>" +
    "<feTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='2' seed='7' stitchTiles='stitch'/>" +
    "<feColorMatrix type='saturate' values='0'/>" +
    "</filter><rect width='100%' height='100%' filter='url(#g)'/></svg>";
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
})();

const resolveAsset = (src: string) => {
  if (/^(?:[a-z]+:|\/)/i.test(src)) return src;
  return staticFile(src.startsWith('assets/') ? src : `assets/${src}`);
};

export type EditorialStageProps = {
  children?: ReactNode;
  /** Existing artwork used as a low-contrast corner wash; pass false to omit it. */
  cornerInkSrc?: string | false;
  cornerOpacity?: number;
  style?: CSSProperties;
  /** Custom paper background color, defaults to EDITORIAL_COLORS.paper (#F8F6F0). */
  paperColor?: string;
  /** Paper tooth grain opacity, defaults to 0.075. */
  grainOpacity?: number;
};

/** Warm-white paper stage with a fixed grayscale paper tooth and a real generated ink corner. */
export function EditorialStage({
  children,
  cornerInkSrc = 'wind_ink_v2.png',
  cornerOpacity = 0.13,
  style,
  paperColor = EDITORIAL_COLORS.paper,
  grainOpacity = 0.075,
}: EditorialStageProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: EDITORIAL_CANVAS.width,
        height: EDITORIAL_CANVAS.height,
        overflow: 'hidden',
        isolation: 'isolate',
        backgroundColor: paperColor,
        ...style,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: PAPER_GRAIN,
          backgroundSize: '256px 256px',
          backgroundRepeat: 'repeat',
          opacity: grainOpacity,
          mixBlendMode: 'multiply',
        }}
      />
      {cornerInkSrc !== false && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 520,
            height: 330,
            overflow: 'hidden',
            pointerEvents: 'none',
            opacity: cornerOpacity,
            mixBlendMode: 'multiply',
            filter: 'grayscale(1) sepia(0.18) brightness(1.08) contrast(0.78)',
            maskImage: 'radial-gradient(ellipse 100% 100% at 0% 0%, #000 16%, rgba(0,0,0,0.7) 54%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 0% 0%, #000 16%, rgba(0,0,0,0.7) 54%, transparent 100%)',
          }}
        >
          <Img
            src={resolveAsset(cornerInkSrc)}
            style={{ position: 'absolute', left: 0, top: 0, width: 960, height: 540, objectFit: 'cover', objectPosition: 'left top' }}
          />
        </div>
      )}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>{children}</div>
    </div>
  );
}

export type ArtworkProps = {
  /** Public asset path such as `assets/hut_ink_v2.png`, or a direct URL. */
  src: string;
  left: number | string;
  top: number | string;
  width: number | string;
  height: number | string;
  objectFit?: CSSProperties['objectFit'];
  objectPosition?: CSSProperties['objectPosition'];
  transform?: CSSProperties['transform'];
  transformOrigin?: CSSProperties['transformOrigin'];
  opacity?: number;
  alt?: string;
  style?: CSSProperties;
};

/** Draws an image in place. It adds no card, paper rectangle, border, or shadow. */
export function Artwork({
  src,
  left,
  top,
  width,
  height,
  objectFit = 'contain',
  objectPosition = 'center',
  transform,
  transformOrigin = 'center center',
  opacity = 1,
  alt = '',
  style,
}: ArtworkProps) {
  return (
    <Img
      src={resolveAsset(src)}
      alt={alt}
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        objectFit,
        objectPosition,
        transform,
        transformOrigin,
        opacity,
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}

export type ProgressEase = 'linear' | 'smooth' | 'out';

/** Pure frame-based progress helper with endpoint clamping. */
export function progressBetween(frame: number, startFrame: number, endFrame: number, ease: ProgressEase = 'linear') {
  const raw = endFrame <= startFrame ? (frame < startFrame ? 0 : 1) : Math.max(0, Math.min(1, (frame - startFrame) / (endFrame - startFrame)));
  if (ease === 'smooth') return raw * raw * (3 - 2 * raw);
  if (ease === 'out') return 1 - (1 - raw) * (1 - raw);
  return raw;
}

/** Remotion hook version of progressBetween; start/end are composition frame numbers. */
export function useProgress(startFrame: number, endFrame: number, ease: ProgressEase = 'linear') {
  return progressBetween(useCurrentFrame(), startFrame, endFrame, ease);
}

const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Variable-width hand-mark path adapted from MarkerUnderlineTitle.tsx's buildStroke().
function buildBrushPath(length: number, thickness: number, seed: number) {
  const rand = mulberry32(seed);
  const steps = 40;
  const wobble = Array.from({ length: steps + 1 }, () => rand() - 0.5);
  const top: string[] = [];
  const bottom: string[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = t * length;
    const center = thickness * 1.55 - t * thickness * 0.26 + Math.sin(t * Math.PI * 1.6 + 0.4) * thickness * 0.075 + wobble[i] * 1.4;
    const base = thickness * (0.86 + Math.sin(t * Math.PI) * 0.28) - Math.max(0, t - 0.86) * thickness * 4;
    const width = Math.max(1.6, base + wobble[i] * thickness * 0.14);
    top.push(`${x.toFixed(1)},${(center - width / 2).toFixed(1)}`);
    bottom.push(`${x.toFixed(1)},${(center + width / 2).toFixed(1)}`);
  }

  return `M${top.join('L')}L${bottom.reverse().join('L')}Z`;
}

export type BrushRuleProps = {
  x: number;
  y: number;
  width: number;
  progress: number;
  thickness?: number;
  color?: string;
  opacity?: number;
  seed?: number;
  style?: CSSProperties;
};

/** A deterministic, dry-ink horizontal rule revealed from left to right. */
export function BrushRule({
  x,
  y,
  width,
  progress,
  thickness = 9,
  color = EDITORIAL_COLORS.ink,
  opacity = 0.92,
  seed = 77,
  style,
}: BrushRuleProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const value = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const safeWidth = Math.max(1, width);
  const safeThickness = Math.max(1, thickness);
  const height = safeThickness * 3.2;
  const path = useMemo(() => buildBrushPath(safeWidth, safeThickness, seed), [safeWidth, safeThickness, seed]);

  if (value <= 0) return null;

  const revealId = `brushReveal-${uid}`;
  const dryId = `brushDry-${uid}`;

  return (
    <svg
      x={x}
      y={y}
      width={safeWidth}
      height={height}
      viewBox={`0 0 ${safeWidth} ${height}`}
      style={{ position: 'absolute', left: x, top: y, overflow: 'visible', pointerEvents: 'none', ...style }}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={revealId} clipPathUnits="userSpaceOnUse">
          <rect x={0} y={0} width={safeWidth * value} height={height} />
        </clipPath>
        <filter id={dryId} x="-5%" y="-60%" width="110%" height="220%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.09 0.5" numOctaves={2} seed={seed} result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale={1.8} xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.9" numOctaves={2} seed={seed + 12} result="grain" />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -16 11.4"
            result="dryHoles"
          />
          <feComposite in="rough" in2="dryHoles" operator="in" />
        </filter>
      </defs>
      <g clipPath={`url(#${revealId})`}>
        <path d={path} fill={color} fillOpacity={opacity} filter={`url(#${dryId})`} />
      </g>
    </svg>
  );
}
