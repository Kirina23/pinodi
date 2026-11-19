// One name per icon in the app → the Apple SF Symbol drawn on iPhone/iPad.
// (sf-symbols-typescript checks every symbol name at type-check time.)
import type { SFSymbol } from 'sf-symbols-typescript';

export const SF = {
  plus: 'plus',
  minus: 'minus',
  check: 'checkmark',
  tasks: 'checkmark.square',
  tasksFill: 'checkmark.square.fill',
  lists: 'list.bullet.rectangle',
  listsFill: 'list.bullet.rectangle.fill',
  more: 'ellipsis',
  menu: 'line.3.horizontal',
  bell: 'bell',
  noAds: 'nosign',
  share: 'square.and.arrow.up',
  left: 'chevron.left',
  right: 'chevron.right',
  down: 'chevron.down',
  close: 'xmark',
  camera: 'camera',
  photo: 'photo',
  photos: 'photo.on.rectangle',
  emptyPhoto: 'photo.on.rectangle.angled',
  video: 'video',
  play: 'play.fill',
  file: 'doc',
  text: 'textformat',
  calendar: 'calendar',
  folder: 'folder',
  folderMinus: 'folder.badge.minus',
  person: 'person',
  move: 'arrow.up.and.down.and.arrow.left.and.right',
  resize: 'arrow.up.left.and.arrow.down.right',
  trash: 'trash',
  done: 'checkmark.circle',
  pencil: 'pencil',
  infinity: 'infinity',
  zoomIn: 'plus.magnifyingglass',
  zoomOut: 'minus.magnifyingglass',
  paperclip: 'paperclip',
  undo: 'arrow.uturn.backward',
} as const satisfies Record<string, SFSymbol>;

export type IconName = keyof typeof SF;

export type IconWeight = 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  weight?: IconWeight;
  /** Change this value to play the SF Symbol bounce once (iOS). */
  bounceKey?: number | string;
}
