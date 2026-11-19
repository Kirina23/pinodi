// Web stand only: the plan lives in localStorage (photos and videos in IndexedDB, see media.web).
import { preloadMedia } from './media.web';

const KEY = 'snapdo-data-v1';

export async function loadRaw(): Promise<unknown> {
  await preloadMedia().catch(() => {});
  try {
    const s = globalThis.localStorage?.getItem(KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export async function saveRaw(data: unknown): Promise<void> {
  // Some preview frames block storage; the stand then simply doesn't remember changes.
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(data));
  } catch {}
}
