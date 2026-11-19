// Web stand: photos, videos and files live in the browser's IndexedDB (the saved JSON only keeps an
// "idb:<id>" reference, so a few videos no longer overflow localStorage and silently stop saving).
// Older stands kept data URLs inside the JSON; those still open.
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { MAX_FILE_MB } from '../model/constants';
import { uid } from '../model/logic';
import type { Media } from '../model/types';
import { t } from '../i18n';
import { DEMO_ASSETS } from './demoAssets';
import type { PickedAsset } from './picked';

const DB = 'snapdo-stand';
const STORE = 'media';
/** idb key → object URL, filled before the app reads its data (preloadMedia, from persist.web). */
const urls = new Map<string, string>();
/** Keys that existed when the page opened: only these may be cleaned up later. */
const atStart = new Set<string>();

function db(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  const d = await db();
  if (!d) return null;
  return new Promise((resolve) => {
    try {
      const r = run(d.transaction(STORE, mode).objectStore(STORE));
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** Called once before the saved plan is read, so every "idb:" picture is ready to show. */
export async function preloadMedia() {
  const d = await db();
  if (!d) return;
  await new Promise<void>((resolve) => {
    try {
      const req = d.transaction(STORE, 'readonly').objectStore(STORE).openCursor();
      req.onsuccess = () => {
        const c = req.result;
        if (!c) return resolve();
        const key = String(c.key);
        urls.set(key, URL.createObjectURL(c.value as Blob));
        atStart.add(key);
        c.continue();
      };
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function keep(blob: Blob): Promise<string> {
  const key = uid();
  const ok = await tx('readwrite', (s) => s.put(blob, key));
  urls.set(key, URL.createObjectURL(blob));
  // No IndexedDB (a locked-down preview): fall back to a data URL in the JSON.
  if (ok === null) return await blobToDataUrl(blob);
  return `idb:${key}`;
}

export function mediaSource(uri: string | undefined): number | { uri: string } | null {
  if (!uri) return null;
  if (uri.startsWith('demo:')) return DEMO_ASSETS[uri.slice(5)] ?? null;
  if (uri.startsWith('idb:')) {
    const u = urls.get(uri.slice(4));
    return u ? { uri: u } : null;
  }
  return { uri };
}

export function mediaFileUri(uri: string | undefined): string | null {
  if (!uri || uri.startsWith('demo:')) return null;
  if (uri.startsWith('idb:')) return urls.get(uri.slice(4)) ?? null;
  return uri;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** A frame of the video as a small JPEG, plus its real length and size (the browser decodes it). */
function videoInfo(url: string): Promise<{ poster?: string; duration?: number; width?: number; height?: number }> {
  return new Promise((resolve) => {
    let settled = false;
    const v = document.createElement('video');
    const finish = (r: { poster?: string; duration?: number; width?: number; height?: number }) => {
      if (settled) return;
      settled = true;
      v.removeAttribute('src');
      v.load();
      resolve(r);
    };
    const timer = setTimeout(() => finish({ duration: Number.isFinite(v.duration) ? v.duration : undefined }), 8000);
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.onloadedmetadata = () => {
      v.currentTime = Math.min(0.1, (v.duration || 0) / 2);
    };
    v.onseeked = () => {
      clearTimeout(timer);
      const w = v.videoWidth;
      const h = v.videoHeight;
      let poster: string | undefined;
      try {
        if (w && h) {
          const scale = Math.min(1, 900 / Math.max(w, h));
          const c = document.createElement('canvas');
          c.width = Math.round(w * scale);
          c.height = Math.round(h * scale);
          c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height);
          poster = c.toDataURL('image/jpeg', 0.82);
        }
      } catch {}
      finish({ poster, duration: Number.isFinite(v.duration) ? v.duration : undefined, width: w || undefined, height: h || undefined });
    };
    v.onerror = () => {
      clearTimeout(timer);
      finish({});
    };
    v.src = url;
  });
}

export async function importAsset(a: PickedAsset): Promise<Media> {
  if (a.size > MAX_FILE_MB * 1024 * 1024) throw new Error(t('fileTooBig', { name: a.name, mb: MAX_FILE_MB }));
  const id = uid();
  if (a.kind === 'image') {
    try {
      const w = a.width || 1600;
      const h = a.height || 1600;
      const scale = Math.min(1, 1600 / Math.max(w, h));
      const out = await manipulateAsync(a.uri, scale < 1 ? [{ resize: { width: Math.round(w * scale) } }] : [], { compress: 0.86, format: SaveFormat.JPEG });
      const uri = await keep(await (await fetch(out.uri)).blob());
      return { id, name: a.name, kind: 'image', mime: 'image/jpeg', uri, size: a.size, width: out.width, height: out.height };
    } catch {
      throw new Error(t('photoFailed'));
    }
  }
  let blob: Blob;
  try {
    blob = await (await fetch(a.uri)).blob();
  } catch {
    throw new Error(t('readFailed'));
  }
  const uri = await keep(blob);
  if (a.kind === 'video') {
    const info = await videoInfo(mediaFileUri(uri) || a.uri);
    return { id, name: a.name, kind: 'video', mime: a.mime, uri, size: a.size, duration: info.duration ?? a.duration, width: info.width ?? a.width, height: info.height ?? a.height, poster: info.poster };
  }
  return { id, name: a.name, kind: a.kind, mime: a.mime, uri, size: a.size };
}

/** Drop stored files no task uses any more (only those that were there when the page opened). */
export function collectGarbage(used: Set<string>) {
  for (const key of atStart) {
    if (used.has(`idb:${key}`)) continue;
    atStart.delete(key);
    tx('readwrite', (s) => s.delete(key));
  }
}

export async function previewFile(_m: Media): Promise<boolean> {
  return false;
}

export async function shareableUri(uri: string | undefined): Promise<string | null> {
  return mediaFileUri(uri);
}
