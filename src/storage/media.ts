// iPhone: every picked photo, video or file is copied into Documents/media/.
// Photos are resized to 2048 px on the long side (sharp on any screen, light on storage).
import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { MAX_FILE_MB } from '../model/constants';
import { uid } from '../model/logic';
import type { Media } from '../model/types';
import { t } from '../i18n';
import { DEMO_ASSETS } from './demoAssets';
import { extOf, safeName, type PickedAsset } from './picked';

const DIR = 'media';
const MAX_SIDE = 2048;

let docUri = '';
function doc() {
  if (!docUri) {
    docUri = Paths.document.uri;
    if (!docUri.endsWith('/')) docUri += '/';
  }
  return docUri;
}

function mediaDir() {
  const d = new Directory(Paths.document, DIR);
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  return d;
}

/** Source for <Image>/<VideoView>: a bundled asset number or a file uri. */
export function mediaSource(uri: string | undefined): number | { uri: string } | null {
  if (!uri) return null;
  if (uri.startsWith('demo:')) return DEMO_ASSETS[uri.slice(5)] ?? null;
  if (uri.startsWith(DIR + '/')) return { uri: doc() + uri };
  return { uri };
}

/** Absolute file uri (for sharing / Quick Look). Bundled demo files have none. */
export function mediaFileUri(uri: string | undefined): string | null {
  if (!uri || uri.startsWith('demo:')) return null;
  if (uri.startsWith(DIR + '/')) return doc() + uri;
  return uri;
}

async function moveIn(fromUri: string, name: string): Promise<{ rel: string; size: number }> {
  const src = new File(fromUri);
  const dest = new File(mediaDir(), name);
  if (dest.exists) dest.delete();
  src.copy(dest);
  return { rel: `${DIR}/${name}`, size: dest.size || 0 };
}

function tooBig(a: PickedAsset) {
  return a.size > MAX_FILE_MB * 1024 * 1024;
}

export async function importAsset(a: PickedAsset): Promise<Media> {
  if (tooBig(a)) throw new Error(t('fileTooBig', { name: a.name, mb: MAX_FILE_MB }));
  const id = uid();
  if (a.kind === 'image') {
    try {
      let w = a.width || 0;
      let h = a.height || 0;
      if (!w || !h) {
        const probe = await manipulateAsync(a.uri, [], {});
        w = probe.width;
        h = probe.height;
      }
      const scale = Math.min(1, MAX_SIDE / Math.max(w, h, 1));
      const actions = scale < 1 ? [{ resize: w >= h ? { width: Math.round(w * scale) } : { height: Math.round(h * scale) } }] : [];
      const out = await manipulateAsync(a.uri, actions, { compress: 0.86, format: SaveFormat.JPEG });
      const { rel, size } = await moveIn(out.uri, `${id}.jpg`);
      return { id, name: a.name, kind: 'image', mime: 'image/jpeg', uri: rel, size, width: out.width, height: out.height };
    } catch {
      throw new Error(t('photoFailed'));
    }
  }
  if (a.kind === 'video') {
    try {
      const { rel, size } = await moveIn(a.uri, `${id}.${extOf(a.name, 'mov')}`);
      let poster: string | undefined;
      let width = a.width;
      let height = a.height;
      try {
        const th = await VideoThumbnails.getThumbnailAsync(a.uri, { time: 100, quality: 0.8 });
        const small = await manipulateAsync(th.uri, th.width > 900 || th.height > 900 ? [{ resize: th.width >= th.height ? { width: 900 } : { height: 900 } }] : [], { compress: 0.82, format: SaveFormat.JPEG });
        poster = (await moveIn(small.uri, `${id}-poster.jpg`)).rel;
        width = width || th.width;
        height = height || th.height;
      } catch {}
      return { id, name: a.name, kind: 'video', mime: a.mime || 'video/quicktime', uri: rel, size, width, height, duration: a.duration, poster };
    } catch {
      throw new Error(t('videoFailed'));
    }
  }
  try {
    const { rel, size } = await moveIn(a.uri, `${id}-${safeName(a.name)}`);
    return { id, name: a.name, kind: 'file', mime: a.mime || 'application/octet-stream', uri: rel, size };
  } catch {
    throw new Error(t('readFailed'));
  }
}

/** Removes files in Documents/media that no task uses any more (run on launch). */
export function collectGarbage(used: Set<string>) {
  try {
    const d = new Directory(Paths.document, DIR);
    if (!d.exists) return;
    for (const item of d.list()) {
      if (item instanceof File && !used.has(`${DIR}/${item.name}`)) item.delete();
    }
  } catch {}
}

/** Opens a non-image attachment in Quick Look. Returns false if it can't be previewed. */
export async function previewFile(m: Media): Promise<boolean> {
  const u = mediaFileUri(m.uri);
  if (!u) return false;
  try {
    const f = new File(u);
    if (!(await f.canPreview({ mimeType: m.mime }))) return false;
    await f.preview({ title: m.name, mimeType: m.mime });
    return true;
  } catch {
    return false;
  }
}

/** A real file uri for sharing (bundled demo photos are copied out of the app bundle first). */
export async function shareableUri(uri: string | undefined): Promise<string | null> {
  if (!uri) return null;
  if (uri.startsWith('demo:')) {
    const mod = DEMO_ASSETS[uri.slice(5)];
    if (!mod) return null;
    const asset = Asset.fromModule(mod);
    await asset.downloadAsync();
    return asset.localUri || null;
  }
  return mediaFileUri(uri);
}
