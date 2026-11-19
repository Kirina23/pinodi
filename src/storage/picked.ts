// What the pickers hand us before a file is copied into the app.
import type { MediaKind } from '../model/types';

export interface PickedAsset {
  uri: string;
  name: string;
  mime: string;
  size: number;
  kind: MediaKind;
  width?: number;
  height?: number;
  /** seconds */
  duration?: number;
}

const IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif|gif|avif|bmp|tiff?)$/i;
const VIDEO_EXT = /\.(mp4|m4v|mov|webm|3gp|avi|mkv)$/i;

export function kindOf(mime: string | null | undefined, name: string | null | undefined): MediaKind {
  const m = String(mime || '');
  const n = String(name || '');
  if (m.startsWith('image/') || IMAGE_EXT.test(n)) return 'image';
  if (m.startsWith('video/') || VIDEO_EXT.test(n)) return 'video';
  return 'file';
}

export function extOf(name: string, fallback: string) {
  const m = /\.([a-z0-9]{1,6})$/i.exec(name);
  return m ? m[1].toLowerCase() : fallback;
}

/** Safe file name for disk: letters, digits, dot, dash, underscore. */
export function safeName(name: string) {
  return name.replace(/[^A-Za-z0-9\u00C0-\u024F\u0400-\u04FF._-]+/g, '_').slice(-80) || 'file';
}
