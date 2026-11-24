import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {SubtitleTrackEditorial} from './SubtitlesEditorial';
import {CinematicPlate} from './visual/CinematicPlate';

/** Layout-only proof while Gemini's real subject-motion clips are being produced.
 * No claim that a static source plate is a generated motion clip.
 * The production scene routes remain separate until this treatment is reviewed.
 */
export const ArtDirectionPreview: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const selected = t >= 127.6 ? {image:'wind_landscape_v3.png',at:127.6}
    : t >= 40.993 ? {image:'many_homes_v2.png',at:40.993}
    : {image:'changan_ink_v2.png',at:33.065};
  const reveal = Math.max(0,Math.min(1,(t-selected.at)/0.8));
  return <AbsoluteFill style={{background:'#f3efe6'}}>
    <CinematicPlate image={`assets/${selected.image}`} reveal={reveal} />
    <SubtitleTrackEditorial ancientOnly />
  </AbsoluteFill>;
};
