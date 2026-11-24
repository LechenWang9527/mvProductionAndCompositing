import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import timing from '../public/data/og_timing.json';

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const lines = timing.lines;
// Keep the supplied timing unchanged. The ancient preview excludes the modern
// section, whose first line overlaps the last ancient line in the source data.
export const SubtitleTrack: React.FC<{offset?: number; ancientOnly?: boolean}> = ({offset = 0, ancientOnly = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps + offset;
  const source = ancientOnly ? lines.filter(line => line.start < 136.9) : lines;
  let index = -1;
  for (let i = 0; i < source.length && source[i].start <= t; i++) index = i;
  if (index < 0) return null;
  const current = source[index];
  const fontSize = Math.min(60, 1530 / Math.max(1, Array.from(current.text).length));
  let timedIndex = 0;
  const currentChars = Array.from(current.text).map((char, i) => {
    if (/\s/.test(char)) return <span key={i} style={{whiteSpace: 'pre'}}> </span>;
    const c = current.chars[timedIndex];
    const next = current.chars[timedIndex + 1];
    timedIndex++;
    const progress = c ? clamp((t - c.t) / Math.max(.05, (next?.t ?? current.end) - c.t)) : 0;
    return <span key={i} style={{display:'inline-block', position:'relative', color:'#40372c'}}>
      {char}<span style={{position:'absolute', inset:0, color:'#a8402c', clipPath:`inset(0 ${100 * (1 - progress)}% 0 0)`}}>{char}</span>
    </span>;
  });
  return <div style={{position:'absolute', left:96, top:778, width:1728, height:196,
    boxSizing:'border-box', background:'rgba(241,233,215,.97)', border:'1.5px solid rgba(48,39,28,.72)',
    color:'#201b15', fontFamily:'SimSun,"Noto Serif SC",serif', textAlign:'center', zIndex:100,
  }}>
    <div style={{position:'absolute', left:15, top:14, bottom:14, width:4, background:'#a8402c'}} />
    <div style={{height:82, lineHeight:'82px', fontSize, fontWeight:700, whiteSpace:'nowrap', letterSpacing:1.2}}>{currentChars}</div>
    {[1,2].map((step) => {
      const line = source[index + step];
      const size = Math.min(step === 1 ? 36 : 32, 1530 / Math.max(1, Array.from(line?.text ?? '').length));
      return <div key={step} style={{height:48, lineHeight:'48px', fontSize:size, whiteSpace:'nowrap', letterSpacing:1.2}}>{line?.text ?? ''}</div>;
    })}
  </div>;
};
