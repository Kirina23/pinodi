// Pure date and number formatting. No Intl dependency, so results are identical
// on iPhone (Hermes), on the web stand and in tests.
import type { Lang } from './strings';

const RU_MONTH_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
// Same abbreviations as toLocaleDateString('ru-RU', {month:'short'}) in the prototype: "6 нояб."
const RU_MONTH_SHORT = ['янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];
const RU_MONTH_NOM = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const EN_MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const EN_MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/** Local calendar date → "YYYY-MM-DD". */
export function iso(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** "YYYY-MM-DD" → local Date at noon (noon avoids DST edge cases, as in the prototype). */
export function parseISO(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

export function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function noon(d: Date) {
  const r = new Date(d);
  r.setHours(12, 0, 0, 0);
  return r;
}

/** Monday of the week that contains d. */
export function monday(d: Date) {
  const r = noon(d);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7));
  return r;
}

export function isValidISO(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/** "6 нояб." / "Nov 6" */
export function shortDate(d: Date, lang: Lang) {
  return lang === 'ru' ? `${d.getDate()} ${RU_MONTH_SHORT[d.getMonth()]}` : `${EN_MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/** "6 ноября" / "November 6" */
export function longDate(d: Date, lang: Lang) {
  return lang === 'ru' ? `${d.getDate()} ${RU_MONTH_GEN[d.getMonth()]}` : `${EN_MONTH[d.getMonth()]} ${d.getDate()}`;
}

/** "Ноябрь 2026" / "November 2026" */
export function monthTitle(d: Date, lang: Lang) {
  return `${(lang === 'ru' ? RU_MONTH_NOM : EN_MONTH)[d.getMonth()]} ${d.getFullYear()}`;
}

/** Week range: "2–8 ноября", "30 нояб. – 6 дек." / "Nov 2–8", "Nov 30 – Dec 6". */
export function weekRange(a: Date, z: Date, lang: Lang) {
  if (a.getMonth() === z.getMonth()) {
    return lang === 'ru' ? `${a.getDate()}–${longDate(z, lang)}` : `${EN_MONTH_SHORT[a.getMonth()]} ${a.getDate()}–${z.getDate()}`;
  }
  return `${shortDate(a, lang)} – ${shortDate(z, lang)}`;
}

/** Russian plural: 1 файл, 2 файла, 5 файлов, 11 файлов, 21 файл. */
export function ruPlural(n: number, one: string, few: string, many: string) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a >= 11 && a <= 14) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}

export function fileCount(n: number, lang: Lang) {
  return lang === 'ru' ? `${n} ${ruPlural(n, 'файл', 'файла', 'файлов')}` : `${n} ${n === 1 ? 'file' : 'files'}`;
}

export function taskCount(n: number, lang: Lang) {
  return lang === 'ru' ? `${n} ${ruPlural(n, 'задача', 'задачи', 'задач')}` : `${n} ${n === 1 ? 'task' : 'tasks'}`;
}

/** 59:59 — minutes and seconds left (never negative). */
export function countdown(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
}

export function dayCount(n: number, lang: Lang) {
  return lang === 'ru' ? `${n} ${ruPlural(n, 'день', 'дня', 'дней')}` : `${n} ${n === 1 ? 'day' : 'days'}`;
}

/** 0:04, 1:05, 12:30 */
export function durationLabel(seconds: number | undefined) {
  const n = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(n / 60)}:${pad2(n % 60)}`;
}
