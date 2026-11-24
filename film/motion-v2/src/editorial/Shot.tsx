import React, {type CSSProperties, type ReactNode} from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useVideoConfig} from 'remotion';
import {InkReveal} from '../visual/InkReveal';
import {MV_FONT_FAMILIES} from '../visual/Fonts';
import {BrushRule, EditorialStage} from '../visual/EditorialStage';
import clips from '../../public/data/editorial_clips.json';
import type {AudioSample, DufuPalette} from './transitions';
import {InkSketchIcon, type SketchIconName} from './InkSketchPrimitives';

export const INK = '#29251f';
export const RED = '#a23e2c';
export const PAPER = '#f8f6f0';
export const serif = MV_FONT_FAMILIES.serif;
export const sans = MV_FONT_FAMILIES.sans;
export const clamp = (v:number) => Math.max(0, Math.min(1,v));
export const ease = (v:number) => { const u=clamp(v); return u*u*(3-2*u); };
export const at = (t:number,start:number,duration=.55) => ease((t-start)/duration);
export const asset = (name:string) => staticFile(`assets/${name}`);

/** Existing art is the setting itself. All transforms preserve its aspect ratio. */
export function Painting({name, time, start, end, opacity=1, camera='still', style, children, reveal=false}: {
  name:string; time:number; start:number; end:number; opacity?:number;
  camera?:'still'|'left'|'right'|'in'|'out'; style?:CSSProperties; children?:ReactNode; reveal?:boolean;
}) {
  const {fps}=useVideoConfig();
  const p=clamp((time-start)/Math.max(.1,end-start));
  const scale=camera==='in' ? 1.025+.035*p : camera==='out' ? 1.06-.035*p : camera==='still' ? 1 : 1.055;
  const x=camera==='left' ? 25-50*p : camera==='right' ? -25+50*p : 0;
  const entry=reveal ? at(time,start,.6) : 1;
  const clip=(clips as Record<string,{src:string|null; sourceStartFrame:number}>)[name];
  return <AbsoluteFill style={{opacity,overflow:'hidden',...style}}>
    <InkReveal progress={entry}>
      <AbsoluteFill style={{transform:`translateX(${x}px) scale(${scale})`,transformOrigin:'50% 42%'}}>
        {clip?.src ? <Sequence from={Math.round(start*fps)} layout="none">
          <OffthreadVideo src={staticFile(clip.src)} muted startFrom={clip.sourceStartFrame} style={{width:'100%',height:'100%',objectFit:'cover'}} />
        </Sequence> : <Img src={asset(name)} style={{width:'100%',height:'100%',objectFit:'cover'}} />}
      </AbsoluteFill>
      {children}
    </InkReveal>
  </AbsoluteFill>;
}

export function Portrait({who,x=120,y=62,w=620,h=690,opacity=1,style}: {
  who:'dufu'|'liubang'; x?:number;y?:number;w?:number;h?:number;opacity?:number;style?:CSSProperties;
}) {
  return <Img src={asset(`${who}_reference_v2.png`)} style={{position:'absolute',left:x,top:y,width:w,height:h,objectFit:'contain',opacity,...style}} />;
}

export function Note({children,x,y,size=32,color=INK,opacity=1,vertical=false,style}: {
  children:ReactNode;x:number;y:number;size?:number;color?:string;opacity?:number;vertical?:boolean;style?:CSSProperties;
}) {
  return <div style={{position:'absolute',left:x,top:y,fontFamily:serif,fontSize:size,fontWeight:400,lineHeight:1.45,color,opacity,whiteSpace:'nowrap',writingMode:vertical?'vertical-rl':undefined,letterSpacing:vertical?8:1,...style}}>{children}</div>;
}

export type MemoryTravelProps = {
  time: number;
  start: number;
  end: number;
  events: { name: string; label: string }[];
  person?: 'dufu' | 'liubang';
  palette?: DufuPalette;
  audioSample?: AudioSample;
};

/** TimelineTravel's continuous world/camera relationship; images stay full size rather than becoming cards. */
export function MemoryTravel({
  time,
  start,
  end,
  events,
  person,
  palette,
  audioSample,
}: MemoryTravelProps) {
  const p = clamp((time - start) / Math.max(0.1, end - start));
  const position = p * (events.length - 1);
  const i = Math.min(events.length - 1, Math.floor(position));
  const fraction = position - i;
  const next = Math.min(events.length - 1, i + 1);
  const change = ease((fraction - 0.82) / 0.18);
  const world = 1200 * position;

  const beatPulse = audioSample?.beatPulse ?? 0;
  const paperColor = palette?.paper ?? PAPER;
  const redColor = palette?.accent ?? RED;
  const inkColor = palette?.ink ?? INK;
  const darkR = palette?.darkRatio ?? 0;

  const gradientBottom = darkR > 0.5
    ? `linear-gradient(180deg, rgba(31,23,18,.08) 20%, rgba(31,23,18,.05) 48%, rgba(31,23,18,.84) 70%, ${paperColor} 100%)`
    : `linear-gradient(180deg, rgba(248,246,240,.08) 20%, rgba(248,246,240,.05) 48%, rgba(248,246,240,.84) 70%, ${paperColor} 100%)`;

  return (
    <EditorialStage cornerInkSrc={false} paperColor={paperColor}>
      {/* Current scene with subtle mist defocus during transition out */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          filter: change > 0.05 ? `blur(${(change * 6).toFixed(1)}px)` : undefined,
          opacity: 1 - change * 0.35,
        }}
      >
        <Painting name={events[i].name} time={time} start={start} end={end} camera="left" />
      </div>

      {/* Next scene entering with InkReveal + mist soft focus */}
      {next !== i && change > 0 && (
        <AbsoluteFill>
          <InkReveal progress={change}>
            <div
              style={{
                width: '100%',
                height: '100%',
                filter: change < 0.95 ? `blur(${((1 - change) * 6).toFixed(1)}px)` : undefined,
              }}
            >
              <Painting name={events[next].name} time={time} start={start} end={end} camera="left" />
            </div>
          </InkReveal>
        </AbsoluteFill>
      )}

      {/* Warm Xuan paper / night gradient veil */}
      <AbsoluteFill style={{ background: gradientBottom }} />

      {/* Horizontal timeline ruler with pulsating nodes */}
      <div style={{ position: 'absolute', left: 0, top: 0, transform: `translateX(${-world}px)` }}>
        <BrushRule
          x={640}
          y={637}
          width={1200 * (events.length - 1) + 550}
          progress={1}
          thickness={2}
          color="#89715a"
          opacity={0.35}
        />
        <BrushRule
          x={640}
          y={637}
          width={1200 * (events.length - 1) + 550}
          progress={clamp((world + 260) / (1200 * (events.length - 1) + 550))}
          thickness={3}
          color={redColor}
        />
        {events.map((e, index) => {
          const isCurrent = Math.abs(index - position) < 0.55;
          const dotColor = index <= position ? redColor : '#b7aa97';
          const iconList: SketchIconName[] = ['cart', 'homeGrid', 'footprint', 'warmSoup'];
          const iconName = iconList[index % iconList.length];
          const iconProgress = clamp((world + 300 - index * 1200) / 400);

          return (
            <div key={e.label} style={{ position: 'absolute', left: 650 + index * 1200, top: 0 }}>
              {/* Floating Sketch Icon above node */}
              <div
                style={{
                  position: 'absolute',
                  left: -32,
                  top: 550,
                  transformOrigin: 'center center',
                }}
              >
                <InkSketchIcon
                  name={iconName}
                  x={0}
                  y={0}
                  size={64}
                  progress={iconProgress}
                  color={index <= position ? redColor : '#877d70'}
                  accentColor={redColor}
                  pulse={0}
                />
              </div>

              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 634,
                  width: 11,
                  height: 11,
                  background: dotColor,
                  borderRadius: '50%',
                  boxShadow:
                    isCurrent ? `0 0 8px ${redColor}` : undefined,
                }}
              />
              <Note x={-5} y={675} size={28} color={index <= position ? redColor : '#877d70'}>
                {e.label}
              </Note>
            </div>
          );
        })}
      </div>
    </EditorialStage>
  );
}
