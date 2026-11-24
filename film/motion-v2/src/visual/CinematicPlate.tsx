import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, staticFile} from 'remotion';
import {InkReveal} from './InkReveal';

/** Full-frame artwork/video plate. Captions remain independent of generated media. */
export const CinematicPlate: React.FC<{
  image: string; video?: string; videoStartFrame?: number; reveal?: number;
}> = ({image, video, videoStartFrame = 0, reveal = 1}) => (
  <AbsoluteFill style={{background:'#f3efe6', overflow:'hidden'}}>
    <InkReveal progress={reveal}>
      {video ? <OffthreadVideo src={staticFile(video)} startFrom={videoStartFrame} muted
        style={{width:'100%',height:'100%',objectFit:'cover'}} />
        : <Img src={staticFile(image)} style={{width:'100%',height:'100%',objectFit:'cover'}} />}
    </InkReveal>
  </AbsoluteFill>
);
