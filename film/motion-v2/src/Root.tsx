import React from 'react';
import {AbsoluteFill, Audio, Composition, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {IntroProcess} from './scenes/IntroProcess';
import {SubtitleTrack} from './Subtitles';
import {SubtitleTrackEditorial} from './SubtitlesEditorial';
import {ClassmateProcess, OrderProcess} from './scenes/LifeProcess';
import {DufuProcess} from './scenes/DufuProcess';
import {ChorusProcess} from './scenes/ChorusProcess';
import {LiuProcess, WarProcess, WindRecapProcess} from './scenes/LiuProcess';
import {PhoneChatProcess} from './scenes/PhoneChatProcess';
import {ArtDirectionPreview} from './ArtDirectionPreview';
import {AncientEditorial} from './AncientEditorial';
import {Dufu} from './editorial/Dufu';
import {Opening} from './editorial/Opening';
import {Liu} from './editorial/Liu';
import {Phone} from './editorial/Phone';
import {War} from './editorial/War';
import {Orders} from './editorial/Orders';
import {Ending} from './editorial/Ending';
import {sampleDufuPalette} from './engine/palette';
import {MVFonts} from './visual/Fonts';

const AncientDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  let scene: React.ReactNode;
  if (t < 21.6) scene = <IntroProcess />;
  else if (t < 30) scene = <ChorusProcess globalTime={t} />;
  else if (t < 74.3) scene = <DufuProcess globalTime={t} />;
  else if (t < 90) scene = <ChorusProcess globalTime={t} reprise />;
  else if (t < 103.94) scene = <LiuProcess globalTime={t} />;
  else if (t < 111.95) scene = <PhoneChatProcess globalTime={t} />;
  else if (t < 119.45) scene = <WarProcess globalTime={t} />;
  else if (t < 127.6) scene = <OrderProcess globalTime={t} />;
  else scene = <WindRecapProcess globalTime={t} />;
  return <AbsoluteFill style={{background:'#e7ddc8'}}>
    <Audio src={staticFile('audio/ogs.mp3')} />
    {scene}
    <SubtitleTrack ancientOnly />
  </AbsoluteFill>;
};

const IntroSample: React.FC = () => <AbsoluteFill style={{background:'#e7ddc8'}}>
  <Audio src={staticFile('audio/ogs.mp3')} />
  <IntroProcess />
  <SubtitleTrack />
</AbsoluteFill>;

const ClassmateSample: React.FC = () => <AbsoluteFill style={{background:'#e7ddc8'}}>
  <Audio src={staticFile('audio/ogs.mp3')} startFrom={3118} />
  <PhoneChatProcess />
  <SubtitleTrack offset={103.94} ancientOnly />
</AbsoluteFill>;

const OrderSample: React.FC = () => <AbsoluteFill style={{background:'#e7ddc8'}}>
  <Audio src={staticFile('audio/ogs.mp3')} startFrom={3584} />
  <OrderProcess />
  <SubtitleTrack offset={119.45} ancientOnly />
</AbsoluteFill>;

/** Dufu standalone chapter composition: 30.00s ~ 74.30s (1329 frames @ 30fps) */
const DufuChapter: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = 30 + frame / fps;
  const palette = sampleDufuPalette(time);

  return (
    <AbsoluteFill style={{backgroundColor: palette.bg, overflow: 'hidden'}}>
      <MVFonts />
      <Audio src={staticFile('audio/ogs.mp3')} startFrom={900} />
      <Dufu time={time} entryMode="standalone" />
      <SubtitleTrackEditorial offset={30} ancientOnly palette={palette} />
    </AbsoluteFill>
  );
};

/** Liubang standalone chapter composition: 74.30s ~ 137.30s (1890 frames @ 30fps) */
const LiubangChapterPreview: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = 74.3 + frame / fps;

  const scene = time < 90 ? <Opening time={time} enhancedMotion />
    : time < 103.94 ? <Liu time={time} />
    : time < 111.95 ? <Phone time={time} />
    : time < 119.45 ? <War time={time} />
    : time < 127.6 ? <Orders time={time} alignMarkers />
    : <Ending time={time} enhancedMotion />;

  return (
    <AbsoluteFill style={{background: '#f8f6f0', overflow: 'hidden'}}>
      <MVFonts />
      <Audio src={staticFile('audio/ogs.mp3')} startFrom={2229} />
      {scene}
      <SubtitleTrackEditorial offset={74.3} ancientOnly />
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => <>
  <Composition id="LiubangChapterV1" component={LiubangChapterPreview} durationInFrames={1890} fps={30} width={1920} height={1080} />
  <Composition id="DufuChapterV1" component={DufuChapter} durationInFrames={1329} fps={30} width={1920} height={1080} />
  <Composition id="AncientEditorialV3" component={AncientEditorial} durationInFrames={4119} fps={30} width={1920} height={1080} />
  <Composition id="AncientEditorialV4" component={AncientEditorial} durationInFrames={4119} fps={30} width={1920} height={1080} defaultProps={{enhancedMotion:true}} />
  <Composition id="ArtDirectionPreviewV2" component={ArtDirectionPreview} durationInFrames={4119} fps={30} width={1920} height={1080} />
  <Composition id="AncientDemoV2" component={AncientDemo} durationInFrames={4119} fps={30} width={1920} height={1080} />
  <Composition id="IntroProcessV2" component={IntroSample} durationInFrames={648} fps={30} width={1920} height={1080} />
  <Composition id="ClassmateProcessV2" component={ClassmateSample} durationInFrames={241} fps={30} width={1920} height={1080} />
  <Composition id="OrderProcessV2" component={OrderSample} durationInFrames={245} fps={30} width={1920} height={1080} />
</>;
