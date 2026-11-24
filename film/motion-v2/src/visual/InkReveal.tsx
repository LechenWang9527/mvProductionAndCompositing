import { useId, type ReactNode } from 'react';

// Adapted from ref_drawai/lib/motion/shotcraft/upstream/demos/transition/print-texture-transitions/InkBleedReveal.tsx:
// a seeded turbulence/displacement/feather chain shapes the mask only, keeping revealed content sharp.
// The Shotcraft source is Apache-2.0; see film/motion-v2/src/vendor/shotcraft/LICENSE.

const WIDTH = 1920;
const HEIGHT = 1080;

export type InkRevealProps = {
  /** Reveal progress, clamped to [0, 1]. */
  progress: number;
  children: ReactNode;
};

/** Reveals a fixed 1920×1080 composition through a softly feathered ink edge. */
export function InkReveal({ progress, children }: InkRevealProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const value = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;

  if (value <= 0) return null;

  // Drop the SVG entirely once revealed so no filter can soften the finished frame.
  if (value >= 1) {
    return <div style={{ width: WIDTH, height: HEIGHT, position: 'relative', overflow: 'hidden' }}>{children}</div>;
  }

  const filterId = `inkRevealFilter-${uid}`;
  const maskId = `inkRevealMask-${uid}`;
  const radius = 2400 * value;
  const displacement = 12 + 12 * value;

  return (
    <div style={{ width: WIDTH, height: HEIGHT, position: 'relative', overflow: 'hidden' }}>
      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ position: 'absolute', inset: 0, display: 'block' }}
        aria-hidden="true"
      >
        <defs>
          <filter
            id={filterId}
            filterUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={WIDTH}
            height={HEIGHT}
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.02"
              numOctaves="3"
              seed="7"
              result="inkNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="inkNoise"
              scale={displacement}
              xChannelSelector="R"
              yChannelSelector="G"
              result="roughEdge"
            />
            <feGaussianBlur in="roughEdge" stdDeviation="2.2" />
          </filter>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={WIDTH} height={HEIGHT}>
            <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="black" />
            <circle cx={WIDTH / 2} cy={HEIGHT / 2} r={radius} fill="white" filter={`url(#${filterId})`} />
          </mask>
        </defs>
        <g mask={`url(#${maskId})`}>
          <foreignObject x="0" y="0" width={WIDTH} height={HEIGHT}>
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              style={{ width: WIDTH, height: HEIGHT, position: 'relative', overflow: 'hidden' }}
            >
              {children}
            </div>
          </foreignObject>
        </g>
      </svg>
    </div>
  );
}
