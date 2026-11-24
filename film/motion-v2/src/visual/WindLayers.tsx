import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {EASE, ramp} from '../vendor/shotcraft/Polish';

const WIDTH = 1920;
const HEIGHT = 1080;
const LAYER_SCALE = 1.035;
const FALLBACK = 'assets/wind_landscape_v3.png';

export type WindLayersReady = {
  sky: boolean;
  land: boolean;
  flag: boolean;
};

export type FlagMotionSpec = {
  /** Measured full-frame placement for the 1024x1536 transparent source. */
  imageRect: {x: number; y: number; width: number; height: number};
  /** Measured cloth bounding band in 1920x1080 output coordinates. */
  flagBand: {x: number; y: number; width: number; height: number};
  /** 0..1 distance from the tip where the displacement field reaches its pinned root. */
  anchorRatio: number;
  /** The tip edge of the measured band. */
  tipSide: 'left' | 'right';
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function constraintField(spec: FlagMotionSpec) {
  const {x, y, width, height} = spec.flagBand;
  if (width <= 0 || height <= 0 || x < 0 || y < 0 || x + width > WIDTH || y + height > HEIGHT) {
    throw new Error('FlagMotionSpec.flagBand must be a measured rectangle inside the 1920x1080 source.');
  }
  const image = spec.imageRect;
  if (image.width <= 0 || image.height <= 0 || image.x < 0 || image.y < 0 || image.x + image.width > WIDTH || image.y + image.height > HEIGHT) {
    throw new Error('FlagMotionSpec.imageRect must fit inside the 1920x1080 output.');
  }
  if (!(spec.anchorRatio > 0 && spec.anchorRatio <= 1)) {
    throw new Error('FlagMotionSpec.anchorRatio must be a measured value in (0, 1].');
  }

  const tipX = spec.tipSide === 'left' ? x : x + width;
  const rootX = spec.tipSide === 'left' ? x + width : x;
  const field = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}"><defs><linearGradient id="a" gradientUnits="userSpaceOnUse" x1="${tipX}" y1="${y + height / 2}" x2="${rootX}" y2="${y + height / 2}"><stop offset="0%" stop-color="#fff"/><stop offset="${(clamp01(spec.anchorRatio) * 100).toFixed(3)}%" stop-color="#000"/><stop offset="100%" stop-color="#000"/></linearGradient></defs><rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="#000"/><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#a)"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(field)}`;
}

/**
 * Local, deterministic SVG cloth motion over the measured portrait imageRect.
 */
export const FlagMotion: React.FC<{src: string; time: number; motion: FlagMotionSpec}> = ({src, time, motion}) => {
  const imageSrc = staticFile(src);
  const fieldSrc = constraintField(motion);
  const flowX = 16 * time;
  const filterId = 'wind-flag-displacement';

  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMin slice"
      style={{position: 'absolute', inset: 0, overflow: 'visible'}}
      aria-hidden="true"
    >
      <defs>
        <filter id={filterId} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x={-40} y={-40} width={WIDTH + 80} height={HEIGHT + 80}>
          <feComponentTransfer in="SourceGraphic" result="cleanFlag">
            <feFuncA type="linear" slope={2} intercept={-0.6} />
          </feComponentTransfer>
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.022" numOctaves={1} seed={11} result="n" />
          <feColorMatrix in="n" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 1" result="opaqueNoise" />
          <feOffset in="opaqueNoise" dx={flowX} dy={0} result="flow" />
          <feImage href={fieldSrc} x={0} y={0} width={WIDTH} height={HEIGHT} preserveAspectRatio="none" result="a" />
          <feComposite in="flow" in2="a" operator="arithmetic" k1={1} k2={0} k3={0} k4={0} result="na" />
          <feComposite in="na" in2="a" operator="arithmetic" k1={0} k2={1} k3={-0.5} k4={0.5} result="d" />
          <feDisplacementMap in="cleanFlag" in2="d" scale={16} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <image
        href={imageSrc}
        x={motion.imageRect.x}
        y={motion.imageRect.y}
        width={motion.imageRect.width}
        height={motion.imageRect.height}
        preserveAspectRatio="xMidYMid meet"
        filter={`url(#${filterId})`}
      />
    </svg>
  );
};

const LandCleanup: React.FC<{src: string; erosionRadius?: number; blurRadius?: number}> = ({src, erosionRadius = 6, blurRadius = 0.6}) => (
  <svg
    width={WIDTH}
    height={HEIGHT}
    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    style={{position: 'absolute', inset: 0, overflow: 'visible'}}
    aria-hidden="true"
  >
    <defs>
      <filter id="wind-land-alpha-cleanup" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x={-12} y={-12} width={WIDTH + 24} height={HEIGHT + 24}>
        <feMorphology in="SourceAlpha" operator="erode" radius={erosionRadius} result="erodedAlpha" />
        <feGaussianBlur in="erodedAlpha" stdDeviation={blurRadius} result="cleanAlpha" />
        <feComposite in="SourceGraphic" in2="cleanAlpha" operator="in" result="cleanLand" />
      </filter>
    </defs>
    <image
      href={staticFile(src)}
      x={0}
      y={0}
      width={WIDTH}
      height={HEIGHT}
      preserveAspectRatio="xMidYMin slice"
      filter="url(#wind-land-alpha-cleanup)"
    />
  </svg>
);

export const MEASURED_FLAG_MOTION: FlagMotionSpec = {
  imageRect: {x: 1420, y: 260, width: 500, height: 750},
  flagBand: {x: 1485, y: 335, width: 335, height: 205},
  anchorRatio: 0.9,
  tipSide: 'left',
};

export const WindScene: React.FC<{
  time: number;
  duration?: number;
  layersReady?: WindLayersReady;
  flagMotion?: FlagMotionSpec;
}> = ({time, duration = 8, layersReady = {sky: false, land: false, flag: false}, flagMotion = MEASURED_FLAG_MOTION}) => {
  const localTime = Math.max(0, Math.min(duration, time));
  const fps = 30;
  const settleStartFrame = Math.max(1, (duration - 1.5) * fps);
  const settleFrames = 0.6 * fps;
  const frame = localTime * fps;
  const drive = 33.5 * ramp(frame, 0, settleStartFrame, EASE.smooth)
    + 1.5 * ramp(frame, settleStartFrame, settleFrames, EASE.smooth);
  const hasAllLayers = layersReady.sky && layersReady.land && layersReady.flag;

  if (!hasAllLayers) {
    return (
      <AbsoluteFill style={{background: '#f3eadb', overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: 0, transform: `translateX(${-drive * 0.65}px) scale(${LAYER_SCALE})`, transformOrigin: '50% 50%'}}>
          <Img src={staticFile(FALLBACK)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{background: '#f3eadb', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${-drive * 0.25 - 18 * localTime}px) scale(${LAYER_SCALE})`, transformOrigin: '50% 50%'}}>
        <Img
          src={staticFile('assets/wind-study/sky.png')}
          style={{position: 'absolute', left: '50%', top: 0, width: 'auto', height: '100%', minWidth: '100%', maxWidth: 'none', transform: 'translateX(-50%)'}}
        />
      </div>
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${-drive * 0.65}px) scale(${LAYER_SCALE})`, transformOrigin: '50% 50%'}}>
        <LandCleanup src="assets/wind-study/land.png" />
      </div>
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${-drive}px) scale(${LAYER_SCALE})`, transformOrigin: '50% 50%'}}>
        <FlagMotion src="assets/wind-study/flag.png" time={localTime} motion={flagMotion} />
      </div>
    </AbsoluteFill>
  );
};
