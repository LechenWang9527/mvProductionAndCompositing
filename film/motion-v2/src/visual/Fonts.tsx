import React, { useEffect, useRef, useState } from 'react';
import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';

export const MV_FONT_FAMILIES = {
  serif: 'MV Serif',
  sans: 'MV Sans',
} as const;

const FONT_PROBE = '我是工艺人这些事经历过';
const FONT_REQUESTS = [
  { family: MV_FONT_FAMILIES.serif, weight: 400 },
  { family: MV_FONT_FAMILIES.serif, weight: 600 },
  { family: MV_FONT_FAMILIES.sans, weight: 400 },
  { family: MV_FONT_FAMILIES.sans, weight: 600 },
] as const;

let fontLoadPromise: Promise<void> | null = null;

function normalizedFamily(family: string) {
  return family.trim().replace(/^['"]|['"]$/g, '');
}

function faceCoversWeight(face: FontFace, weight: number) {
  const values = face.weight.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (values.length === 1) return weight === values[0];
  return values.length >= 2 && weight >= values[0] && weight <= values[1];
}

export function loadMVFontsOnce() {
  if (!fontLoadPromise) {
    fontLoadPromise = (async () => {
      if (typeof document === 'undefined' || !document.fonts || typeof FontFace === 'undefined') {
        throw new Error('FontFace API or document.fonts is unavailable');
      }

      const sources = [
        { family: MV_FONT_FAMILIES.serif, src: staticFile('fonts/NotoSerifSC-VF.ttf') },
        { family: MV_FONT_FAMILIES.sans, src: staticFile('fonts/NotoSansSC-VF.ttf') },
      ];
      const faces = await Promise.all(sources.map(async ({ family, src }) => {
        const face = new FontFace(family, `url(${JSON.stringify(src)})`, {
          style: 'normal',
          weight: '100 900',
        });
        try {
          return await face.load();
        } catch (cause) {
          const detail = cause instanceof Error ? cause.message : String(cause);
          throw new Error(`${family} failed to load from ${src}: ${detail}`);
        }
      }));

      for (const face of faces) document.fonts.add(face);

      for (const { family, weight } of FONT_REQUESTS) {
        const query = `${weight} 16px "${family}"`;
        const loadedFace = faces.find((face) => normalizedFamily(face.family) === family && face.status === 'loaded' && faceCoversWeight(face, weight));
        const check = document.fonts.check(query, FONT_PROBE);
        if (!loadedFace || !check) {
          const registeredFaces = Array.from(document.fonts).map((face) => ({
            family: face.family,
            normalizedFamily: normalizedFamily(face.family),
            status: face.status,
            weight: face.weight,
            covers400: faceCoversWeight(face, 400),
            covers600: faceCoversWeight(face, 600),
            check400: document.fonts.check(`400 16px "${normalizedFamily(face.family)}"`, FONT_PROBE),
            check600: document.fonts.check(`600 16px "${normalizedFamily(face.family)}"`, FONT_PROBE),
          }));
          const diagnostic = JSON.stringify({
            requested: { family, weight, query },
            matchingLoadedFace: Boolean(loadedFace),
            check,
            faces: registeredFaces,
          });
          console.error(`[MVFonts] FontFace verification failed: ${diagnostic}`);
          throw new Error(`${query} did not resolve to a loaded MV variable font face. ${diagnostic}`);
        }
      }
    })().catch((error) => {
      fontLoadPromise = null;
      throw error;
    });
  }

  return fontLoadPromise;
}

/** Installs the local variable fonts and holds Remotion until all requested weights load. */
export const MVFonts: React.FC = () => {
  const [handle] = useState(() => delayRender('Load MV Serif and MV Sans'));
  const settled = useRef(false);

  useEffect(() => {
    void loadMVFontsOnce()
      .then(() => {
        if (settled.current) return;
        settled.current = true;
        continueRender(handle);
      })
      .catch((cause: unknown) => {
        if (settled.current) return;
        settled.current = true;
        const detail = cause instanceof Error ? cause.message : String(cause);
        cancelRender(new Error(`MV font loading failed; fallback fonts are disabled. ${detail}`));
      });
  }, [handle]);

  return null;
};
