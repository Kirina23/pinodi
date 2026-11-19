// Web stand (and any non-iOS platform): line drawings in the SF Symbols style.
// On iPhone the real SF Symbols are used instead (Icon.ios.tsx).
import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { C } from '../theme/tokens';
import type { IconName, IconProps, IconWeight } from './iconNames';

export type { IconName, IconWeight } from './iconNames';

const STROKE: Record<IconWeight, number> = { thin: 1.05, light: 1.4, regular: 1.7, medium: 1.95, semibold: 2.2, bold: 2.5 };

type Draw = (c: string, sw: number) => React.ReactNode;
const line = (d: string): Draw => (c, sw) => <Path d={d} stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />;

const DRAW: Record<IconName, Draw> = {
  plus: line('M12 4.5v15M4.5 12h15'),
  minus: line('M4.5 12h15'),
  check: line('M5 12.6l4.6 4.6L19.2 7'),
  tasks: (c, sw) => (
    <>
      <Rect x={3.6} y={3.6} width={16.8} height={16.8} rx={4} stroke={c} strokeWidth={sw} fill="none" />
      {line('M8 12.3l2.8 2.8 5.3-6')(c, sw)}
    </>
  ),
  tasksFill: (c, sw) => (
    <>
      <Rect x={3.6} y={3.6} width={16.8} height={16.8} rx={4} fill={c} stroke={c} strokeWidth={sw} />
      {line('M8 12.3l2.8 2.8 5.3-6')('#fff', sw + 0.2)}
    </>
  ),
  lists: (c, sw) => (
    <>
      <Rect x={3} y={4.5} width={18} height={15} rx={3.6} stroke={c} strokeWidth={sw} fill="none" />
      <Circle cx={7.3} cy={9.2} r={1} fill={c} />
      <Circle cx={7.3} cy={14.8} r={1} fill={c} />
      {line('M10.3 9.2h6.6M10.3 14.8h6.6')(c, sw)}
    </>
  ),
  listsFill: (c, sw) => (
    <>
      <Rect x={3} y={4.5} width={18} height={15} rx={3.6} fill={c} stroke={c} strokeWidth={sw} />
      <Circle cx={7.3} cy={9.2} r={1.1} fill="#fff" />
      <Circle cx={7.3} cy={14.8} r={1.1} fill="#fff" />
      {line('M10.3 9.2h6.6M10.3 14.8h6.6')('#fff', sw)}
    </>
  ),
  more: (c) => (
    <>
      <Circle cx={5} cy={12} r={1.55} fill={c} />
      <Circle cx={12} cy={12} r={1.55} fill={c} />
      <Circle cx={19} cy={12} r={1.55} fill={c} />
    </>
  ),
  share: line('M8.6 9.2H7.2a2 2 0 0 0-2 2v7.6a2 2 0 0 0 2 2h9.6a2 2 0 0 0 2-2v-7.6a2 2 0 0 0-2-2h-1.4M12 14.6V3.2M8.4 6.6 12 3l3.6 3.6'),
  left: line('M14.8 5 7.8 12l7 7'),
  right: line('M9.2 5l7 7-7 7'),
  down: line('M5.5 9l6.5 6.5L18.5 9'),
  close: line('M6.5 6.5l11 11M17.5 6.5l-11 11'),
  camera: (c, sw) => (
    <>
      {line('M3.4 8.6a2 2 0 0 1 2-2h2.4l1.5-2.2h5.4l1.5 2.2h2.4a2 2 0 0 1 2 2v9.4a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2z')(c, sw)}
      <Circle cx={12} cy={13} r={3.6} stroke={c} strokeWidth={sw} fill="none" />
    </>
  ),
  photo: (c, sw) => (
    <>
      <Rect x={3.2} y={4.6} width={17.6} height={14.8} rx={3} stroke={c} strokeWidth={sw} fill="none" />
      <Circle cx={8.6} cy={9.4} r={1.5} fill={c} />
      {line('M3.6 16.8l4.6-4.2 3.6 3.2 3.2-3.4 5.4 5.4')(c, sw)}
    </>
  ),
  photos: (c, sw) => (
    <>
      {line('M7 4.4h11.4a2.6 2.6 0 0 1 2.6 2.6v8.6')(c, sw)}
      <Rect x={3} y={7.4} width={15} height={12.4} rx={2.6} stroke={c} strokeWidth={sw} fill="none" />
      <Circle cx={7.8} cy={11.4} r={1.3} fill={c} />
      {line('M3.4 17.6l4-3.6 3 2.6 2.8-2.8 4.4 4.4')(c, sw)}
    </>
  ),
  emptyPhoto: (c, sw) => (
    <>
      {line('M6.2 6.1l10.6-2.7a2.4 2.4 0 0 1 2.9 1.7l2.1 8.3')(c, sw)}
      <Rect x={2.6} y={8.4} width={15} height={12} rx={2.6} stroke={c} strokeWidth={sw} fill="none" />
      <Circle cx={7.4} cy={12.4} r={1.3} stroke={c} strokeWidth={sw} fill="none" />
      {line('M3 18.2l4-3.4 3 2.4 2.8-2.6 4.4 4.2')(c, sw)}
    </>
  ),
  video: (c, sw) => (
    <>
      <Rect x={2.6} y={6.2} width={13.2} height={11.6} rx={3} stroke={c} strokeWidth={sw} fill="none" />
      {line('M15.8 10.6l5.4-3.2v9.2l-5.4-3.2')(c, sw)}
    </>
  ),
  play: (c) => <Path d="M7.6 5.2v13.6c0 .8.9 1.3 1.6.9l10.6-6.8c.6-.4.6-1.4 0-1.8L9.2 4.3c-.7-.4-1.6.1-1.6.9z" fill={c} />,
  file: line('M13.4 3.4H7a2 2 0 0 0-2 2v13.2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9zM13.4 3.4V9H19'),
  text: (c, sw) => (
    <>
      {line('M2.8 18.2 7.6 5.8l4.8 12.4M4.6 13.8h6')(c, sw)}
      <Circle cx={17.2} cy={15.2} r={2.9} stroke={c} strokeWidth={sw} fill="none" />
      {line('M20.1 12.2v6')(c, sw)}
    </>
  ),
  calendar: (c, sw) => (
    <>
      <Rect x={3.4} y={5} width={17.2} height={15.4} rx={3} stroke={c} strokeWidth={sw} fill="none" />
      {line('M3.4 9.8h17.2M8 3v4M16 3v4')(c, sw)}
    </>
  ),
  folder: line('M3.4 7.4a2 2 0 0 1 2-2h3.8l2 2.2h7.4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2z'),
  folderMinus: (c, sw) => (
    <>
      {line('M13 19.6H5.4a2 2 0 0 1-2-2V7.4a2 2 0 0 1 2-2h3.8l2 2.2h7.4a2 2 0 0 1 2 2v2.4')(c, sw)}
      <Circle cx={18} cy={17} r={4} stroke={c} strokeWidth={sw} fill="none" />
      {line('M16.2 17h3.6')(c, sw)}
    </>
  ),
  person: (c, sw) => (
    <>
      <Circle cx={12} cy={8} r={3.8} stroke={c} strokeWidth={sw} fill="none" />
      {line('M4.6 20.2c.7-3.8 3.7-6 7.4-6s6.7 2.2 7.4 6')(c, sw)}
    </>
  ),
  move: line('M12 3.2v17.6M3.2 12h17.6M9.6 5.6 12 3.2l2.4 2.4M9.6 18.4l2.4 2.4 2.4-2.4M5.6 9.6 3.2 12l2.4 2.4M18.4 9.6l2.4 2.4-2.4 2.4'),
  resize: line('M4 10.2V4h6.2M4 4l6.6 6.6M20 13.8V20h-6.2M20 20l-6.6-6.6'),
  trash: line('M4.2 6.6h15.6M9.4 6.6V4.4h5.2v2.2M6.2 6.6l.9 12.6a1.6 1.6 0 0 0 1.6 1.5h6.6a1.6 1.6 0 0 0 1.6-1.5l.9-12.6M10 10.6v6.2M14 10.6v6.2'),
  done: (c, sw) => (
    <>
      <Circle cx={12} cy={12} r={8.9} stroke={c} strokeWidth={sw} fill="none" />
      {line('M8.2 12.3l2.6 2.6 5-5.6')(c, sw)}
    </>
  ),
  menu: line('M4.5 7h15M4.5 12h15M4.5 17h15'),
  noAds: line('M12 3.8a8.2 8.2 0 1 0 0 16.4a8.2 8.2 0 1 0 0-16.4zM6.2 6.2l11.6 11.6'),
  bell: line('M12 3.6a5.4 5.4 0 0 0-5.4 5.4v3.3c0 1.3-.6 2.6-1.6 3.5l-.4.4h14.8l-.4-.4a4.7 4.7 0 0 1-1.6-3.5V9A5.4 5.4 0 0 0 12 3.6zM9.8 18.8a2.3 2.3 0 0 0 4.4 0'),
  pencil: line('M15.2 4.6l4.2 4.2L8.8 19.4l-5 1 1-5zM13.2 6.6l4.2 4.2'),
  infinity: line('M7 8.4a3.6 3.6 0 1 0 0 7.2c3.2 0 6.8-7.2 10-7.2a3.6 3.6 0 1 1 0 7.2c-3.2 0-6.8-7.2-10-7.2z'),
  zoomIn: (c, sw) => (
    <>
      <Circle cx={10.4} cy={10.4} r={6.6} stroke={c} strokeWidth={sw} fill="none" />
      {line('M15.2 15.2 20.4 20.4M10.4 7.6v5.6M7.6 10.4h5.6')(c, sw)}
    </>
  ),
  zoomOut: (c, sw) => (
    <>
      <Circle cx={10.4} cy={10.4} r={6.6} stroke={c} strokeWidth={sw} fill="none" />
      {line('M15.2 15.2 20.4 20.4M7.6 10.4h5.6')(c, sw)}
    </>
  ),
  paperclip: line('M19.6 11.2l-7.8 7.8a4.6 4.6 0 0 1-6.5-6.5l8.3-8.3a3 3 0 0 1 4.3 4.3l-8.1 8.1a1.5 1.5 0 0 1-2.1-2.1l7.4-7.4'),
  undo: line('M8.8 5.2 4.4 9.6 8.8 14M4.4 9.6h9.8a5.4 5.4 0 0 1 0 10.8h-3.2'),
};

export function Icon({ name, size = 22, color = C.ink, weight = 'regular' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" pointerEvents="none">
      {DRAW[name](color, STROKE[weight])}
    </Svg>
  );
}
