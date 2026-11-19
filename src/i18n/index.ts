import { STRINGS, type Lang, type StringKey } from './strings';

export type { Lang, StringKey };

/** Device language → app language. Russian for ru/be/kk speakers, English for everyone else. */
export function pickLang(code: string | null | undefined): Lang {
  const c = String(code || '').toLowerCase().slice(0, 2);
  return c === 'ru' || c === 'be' || c === 'kk' ? 'ru' : 'en';
}

let current: Lang = 'ru';

export function setLang(lang: Lang) {
  current = lang;
}

export function getLang(): Lang {
  return current;
}

/** Translate a key, filling {placeholders}. */
export function t(key: StringKey, vars?: Record<string, string | number>, lang: Lang = current): string {
  let s: string = STRINGS[key][lang];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
