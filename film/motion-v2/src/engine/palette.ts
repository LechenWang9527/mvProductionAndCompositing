import React, { createContext, useContext } from 'react';

export type DufuPalette = {
  name: string;
  bg: string;
  paper: string;
  ink: string;
  secondaryInk: string;
  accent: string;
  glow: string;
  vignette: string;
  rain: string;
  vignetteStrength: number;
  darkRatio: number;
};

// 1. inkDawn (30.0 ~ 36.9s): Classical warm rice paper, deep soot ink, vermilion seal, gentle dawn
export const inkDawn: DufuPalette = {
  name: 'inkDawn',
  bg: '#f4eee1',
  paper: '#faf6ee',
  ink: '#1a1918',
  secondaryInk: '#5a5752',
  accent: '#b93a2b',
  glow: '#e8b87d',
  vignette: '#201b15',
  rain: '#8a949e',
  vignetteStrength: 0.25,
  darkRatio: 0.05,
};

// 2. stormCold (36.9 ~ 45.64s): Gale tearing thatched roof, stormy dark cyan-grey, bone white ink
export const stormCold: DufuPalette = {
  name: 'stormCold',
  bg: '#161c22',
  paper: '#1f272e',
  ink: '#e6edf3',
  secondaryInk: '#7d8c99',
  accent: '#d46a43',
  glow: '#9ab0bf',
  vignette: '#090d12',
  rain: '#728594',
  vignetteStrength: 0.65,
  darkRatio: 0.90,
};

// 2b. stormWarm (43.0s+ smooth warming): Shelter warmth breaking through storm ("说白了 就是想有个家")
export const stormWarm: DufuPalette = {
  name: 'stormWarm',
  bg: '#2d2722',
  paper: '#3f352e',
  ink: '#f7f1e6',
  secondaryInk: '#b5a799',
  accent: '#e66b47',
  glow: '#f5ac62',
  vignette: '#14110e',
  rain: '#9e9285',
  vignetteStrength: 0.45,
  darkRatio: 0.65,
};

// 3. ledgerStark (45.64 ~ 60.05s): Modern daily pressure, fluorescent receipt, cold concrete, sharp stamp red
export const ledgerStark: DufuPalette = {
  name: 'ledgerStark',
  bg: '#eaeef1',
  paper: '#f6f8fa',
  ink: '#11161d',
  secondaryInk: '#48525e',
  accent: '#cf222e',
  glow: '#d4a72c',
  vignette: '#1b1f24',
  rain: '#6e7781',
  vignetteStrength: 0.35,
  darkRatio: 0.15,
};

// 4. midnightEmber (60.05 ~ 74.30s): 2 AM desk lamp, solitary warmth, steam from noodles, memories
export const midnightEmber: DufuPalette = {
  name: 'midnightEmber',
  bg: '#0d1117',
  paper: '#161b22',
  ink: '#f0e6d2',
  secondaryInk: '#8b949e',
  accent: '#ff9b37',
  glow: '#f0883e',
  vignette: '#040608',
  rain: '#30363d',
  vignetteStrength: 0.70,
  darkRatio: 0.88,
};

// 4b. midnightWarmPaper (67.4s+): Rice paper returns to gentle warmth ("我不是来教你的 我就是想说")
export const midnightWarmPaper: DufuPalette = {
  name: 'midnightWarmPaper',
  bg: '#181512',
  paper: '#2c231c',
  ink: '#fdeed9',
  secondaryInk: '#bca693',
  accent: '#ffa640',
  glow: '#f89a42',
  vignette: '#0a0806',
  rain: '#52473f',
  vignetteStrength: 0.58,
  darkRatio: 0.78,
};

// 4c. nightEdge (73.5 ~ 74.3s): Fade into midnight vignette edge transition
export const nightEdge: DufuPalette = {
  name: 'nightEdge',
  bg: '#05070a',
  paper: '#090d12',
  ink: '#c9d1d9',
  secondaryInk: '#484f58',
  accent: '#e6683b',
  glow: '#b05020',
  vignette: '#010203',
  rain: '#161b22',
  vignetteStrength: 0.92,
  darkRatio: 0.98,
};

function parseHex(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0, 0, 0];
  const str = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
  const n = parseInt(str, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number): string {
  const clampByte = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const h = ((clampByte(r) << 16) | (clampByte(g) << 8) | clampByte(b)).toString(16).padStart(6, '0');
  return `#${h}`;
}

function lerpColor(c1: string, c2: string, k: number): string {
  if (k <= 0) return c1;
  if (k >= 1) return c2;
  const [r1, g1, b1] = parseHex(c1);
  const [r2, g2, b2] = parseHex(c2);
  return toHex(r1 + (r2 - r1) * k, g1 + (g2 - g1) * k, b1 + (b2 - b1) * k);
}

function smoothstep(min: number, max: number, x: number): number {
  if (x <= min) return 0;
  if (x >= max) return 1;
  const t = (x - min) / (max - min);
  return t * t * (3 - 2 * t);
}

export function mixPal(a: DufuPalette, b: DufuPalette, k: number): DufuPalette {
  if (k <= 0 || a === b) return a;
  if (k >= 1) return b;
  const lerpNum = (v1: number, v2: number) => v1 + (v2 - v1) * k;
  return {
    name: `${a.name}>${b.name}`,
    bg: lerpColor(a.bg, b.bg, k),
    paper: lerpColor(a.paper, b.paper, k),
    ink: lerpColor(a.ink, b.ink, k),
    secondaryInk: lerpColor(a.secondaryInk, b.secondaryInk, k),
    accent: lerpColor(a.accent, b.accent, k),
    glow: lerpColor(a.glow, b.glow, k),
    vignette: lerpColor(a.vignette, b.vignette, k),
    rain: lerpColor(a.rain, b.rain, k),
    vignetteStrength: lerpNum(a.vignetteStrength, b.vignetteStrength),
    darkRatio: lerpNum(a.darkRatio, b.darkRatio),
  };
}

export function sampleDufuPalette(t: number): DufuPalette {
  // Before Du Fu section
  if (t < 30.0) {
    return inkDawn;
  }

  // 1. inkDawn: 30.0 ~ 36.9s
  if (t < 36.9) {
    return inkDawn;
  }

  // Transition from inkDawn to stormCold: 36.9s ~ 38.69s ("秋风一来屋子都快散架")
  if (t < 38.69) {
    const k = smoothstep(36.9, 38.69, t);
    return mixPal(inkDawn, stormCold, k);
  }

  // 2. stormCold: 38.69s ~ 43.0s
  if (t < 43.0) {
    return stormCold;
  }

  // Storm smoothing warm: 43.0s ~ 45.64s ("说白了 就是想有个家")
  if (t < 45.0) {
    const k = smoothstep(43.0, 45.0, t);
    return mixPal(stormCold, stormWarm, k);
  }

  // Blend from stormWarm into ledgerStark: 45.0s ~ 45.64s ("钥匙串上挂的全是别人的锁")
  if (t < 45.64) {
    const k = smoothstep(45.0, 45.64, t);
    return mixPal(stormWarm, ledgerStark, k);
  }

  // 3. ledgerStark: 45.64 ~ 59.5s
  if (t < 59.5) {
    return ledgerStark;
  }

  // Transition into midnightEmber: 59.5s ~ 60.05s ("我儿子出生那天")
  if (t < 60.05) {
    const k = smoothstep(59.5, 60.05, t);
    return mixPal(ledgerStark, midnightEmber, k);
  }

  // 4. midnightEmber: 60.05 ~ 67.4s
  if (t < 67.4) {
    return midnightEmber;
  }

  // Warm paper return: 67.4s ~ 70.85s ("我不是来教你的 我就是想说")
  if (t < 70.85) {
    const k = smoothstep(67.4, 70.85, t);
    return mixPal(midnightEmber, midnightWarmPaper, k);
  }

  // Holding midnight warm paper: 70.85s ~ 73.5s
  if (t < 73.5) {
    return midnightWarmPaper;
  }

  // Fade into night edge: 73.5s ~ 74.3s
  if (t < 74.3) {
    const k = smoothstep(73.5, 74.3, t);
    return mixPal(midnightWarmPaper, nightEdge, k);
  }

  return nightEdge;
}

export const PaletteContext: React.Context<DufuPalette> = createContext<DufuPalette>(inkDawn);

export function usePalette(): DufuPalette {
  return useContext(PaletteContext);
}
