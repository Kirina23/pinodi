// Web stand only: the HTML stand opens the app inside device frames and passes the device's
// safe areas, fold and language in the address: #insets=59,0,34,0&fold=book&lang=en
import { setLang } from './i18n';

function params(): URLSearchParams {
  if (typeof location === 'undefined') return new URLSearchParams();
  const p = new URLSearchParams(location.search);
  new URLSearchParams(location.hash.replace(/^#/, '')).forEach((v, k) => p.set(k, v));
  return p;
}

export function applyStandParams() {
  const p = params();
  const lang = p.get('lang');
  if (lang === 'ru' || lang === 'en') setLang(lang);
  const fold = p.get('fold');
  if ((fold === 'book' || fold === 'laptop') && typeof window !== 'undefined') {
    const w = window.innerWidth;
    const h = window.innerHeight;
    (window as unknown as { __SNAPDO_FOLD__: object }).__SNAPDO_FOLD__ =
      fold === 'book' ? { x: Math.round(w / 2) - 20, y: 0, width: 40, height: h } : { x: 0, y: Math.round(h / 2) - 20, width: w, height: 40 };
  }
}

export function standInsets() {
  const raw = params().get('insets');
  if (!raw) return null;
  const [top, left, bottom, right] = raw.split(',').map((n) => Number(n) || 0);
  return { top, left, bottom, right };
}
