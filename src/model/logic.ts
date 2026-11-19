// Business rules from the prototype, as pure functions (covered by tests/logic.test.ts).
import { FREE_CARD_LIMIT, PRO_CARD_LIMIT } from './constants';
import { addDays, iso, isValidISO, monday, monthTitle, noon, parseISO, shortDate, weekRange, fileCount } from '../i18n/format';
import { t, type Lang } from '../i18n';
import type { AppData, CardSize, ListFilter, Media, Period, Settings, Task } from './types';

export function uid() {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  return g.crypto?.randomUUID?.() || 't' + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// ── Periods ───────────────────────────────────────────────────────────────

/** function bounds(): week = Monday..Sunday, month = 1st..last day. */
export function periodBounds(period: Period, anchor: Date): [Date, Date] | null {
  if (period === 'week') {
    const a = monday(anchor);
    return [a, addDays(a, 6)];
  }
  if (period === 'month') {
    return [new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12), new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 12)];
  }
  return null;
}

export function rangeText(period: Period, anchor: Date, lang: Lang) {
  const b = periodBounds(period, anchor);
  if (!b) return t('allPlans', undefined, lang);
  if (period === 'month') return monthTitle(b[0], lang);
  return weekRange(b[0], b[1], lang);
}

export function shiftAnchor(period: Period, anchor: Date, n: number) {
  if (period === 'week') return addDays(anchor, 7 * n);
  if (period === 'month') return new Date(anchor.getFullYear(), anchor.getMonth() + n, 1, 12);
  return anchor;
}

/** "6 нояб." — always the date itself (no "Сегодня" / "Завтра": the person picks a date only if they want one). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function dateLabel(value: string, _today: Date, lang: Lang) {
  if (!value) return '';
  return shortDate(parseISO(value), lang);
}

/** The date offered when the person taps "Выбрать дату": today, or the first day of the period being viewed. New tasks have no date. */
export function defaultDue(period: Period, anchor: Date, today: Date) {
  const b = periodBounds(period, anchor);
  const d = iso(today);
  return b && (d < iso(b[0]) || d > iso(b[1])) ? iso(b[0]) : d;
}

export function dueOutside(due: string, period: Period, anchor: Date) {
  const b = periodBounds(period, anchor);
  return !!(b && due && (due < iso(b[0]) || due > iso(b[1])));
}

// ── Filters ───────────────────────────────────────────────────────────────

/** function currentTasks(): what the board shows. Tasks without a date show in every period. */
export function currentTasks(data: AppData, list: ListFilter, period: Period, anchor: Date): Task[] {
  const b = periodBounds(period, anchor);
  const from = b ? iso(b[0]) : '';
  const to = b ? iso(b[1]) : '';
  return data.tasks.filter((task) => {
    if (list === 'done') {
      if (!task.done) return false;
    } else if (task.done) return false;
    if (list !== 'all' && list !== 'done' && task.listId !== list) return false;
    if (b && task.due && (task.due < from || task.due > to)) return false;
    return true;
  });
}

export function listCount(data: AppData, id: ListFilter) {
  return data.tasks.filter((task) => (id === 'done' ? task.done : !task.done && (id === 'all' || task.listId === id))).length;
}

export function listName(data: AppData, id: string, lang: Lang) {
  return data.lists.find((l) => l.id === id)?.name || t('noList', undefined, lang);
}

/** The main board's name: the person's own ("Задачи на неделю") or "Задачи". */
export function allTitle(data: AppData, lang: Lang) {
  return data.settings.allTitle?.trim() || t('tasks', undefined, lang);
}

export function pageTitle(data: AppData, list: ListFilter, lang: Lang) {
  return list === 'done' ? t('done', undefined, lang) : list === 'all' ? allTitle(data, lang) : listName(data, list, lang);
}

export type EmptyKind = 'list' | 'done' | 'first' | 'allDone' | 'period';

/** Which empty state to show when the board is empty (renderCards in the prototype). */
export function emptyKind(data: AppData, list: ListFilter, period: Period): EmptyKind {
  const inScope = data.tasks.filter((task) => !task.done && (list === 'all' || list === 'done' || task.listId === list));
  if (list === 'done') return 'done';
  if (data.tasks.length === 0) return 'first';
  if (list === 'all' && inScope.length === 0) return 'allDone';
  if (period !== 'all' && inScope.length > 0) return 'period';
  return 'list';
}

// ── Limits (free: 10 active cards) ────────────────────────────────────────

/** Active cards that count toward the free limit. Examples don't count (UX fix: they used to eat 6 of 10). */
export function activeCount(data: AppData) {
  return data.tasks.filter((task) => !task.done && !task.demo).length;
}

export type LimitReason = 'limit' | 'storage' | null;

export function addBlockReason(data: AppData, n: number, pro: boolean): LimitReason {
  if (data.tasks.length + n > PRO_CARD_LIMIT) return 'storage';
  if (!pro && activeCount(data) + n > FREE_CARD_LIMIT) return 'limit';
  return null;
}

/** Bringing a done task back makes it active again, so it must fit in the free limit. */
export function restoreBlocked(data: AppData, task: Task, pro: boolean) {
  return task.done && !task.demo && !pro && activeCount(data) >= FREE_CARD_LIMIT;
}

// ── Files ─────────────────────────────────────────────────────────────────

/** function bundleFiles(): the first photo (or video) becomes the cover, the rest are attachments. */
export function bundleFiles(files: Media[]): { cover: Media | null; files: Media[] } {
  const cover = files.find((f) => f.kind === 'image') || files.find((f) => f.kind === 'video') || null;
  return { cover, files: files.filter((f) => f !== cover) };
}

export function allFiles(task: Pick<Task, 'cover' | 'files'>): Media[] {
  return [...(task.cover ? [task.cover] : []), ...task.files];
}

export function fileKindLabel(f: Media, lang: Lang) {
  if (f.kind === 'image') return t('kindPhoto', undefined, lang);
  if (f.kind === 'video') return t('kindVideo', undefined, lang);
  const ext = String(f.name || '').split('.').pop() || '';
  return ext && ext.length < 7 && ext !== f.name ? ext.toUpperCase() : t('kindFile', undefined, lang);
}

/** Second line on a card: "Сегодня · 3 файла". */
export function cardSubtitle(task: Task, today: Date, lang: Lang) {
  const n = allFiles(task).length;
  const parts = [task.due ? dateLabel(task.due, today, lang) : '', n > 1 || (!task.cover && n) ? fileCount(n, lang) : ''];
  return parts.filter(Boolean).join(' · ');
}

/** "IMG_2041.jpeg" → "IMG_2041" (batch tasks are titled after their file). */
export function titleFromFileName(name: string) {
  return name.replace(/\.[^.]+$/, '');
}

// ── Order and size ────────────────────────────────────────────────────────

/** function reorder(): move `id` before (or after) `targetId`. Returns a new array. */
export function reorder(tasks: Task[], id: string, targetId: string, after = false): Task[] {
  if (id === targetId) return tasks;
  const from = tasks.findIndex((x) => x.id === id);
  if (from < 0) return tasks;
  const next = tasks.slice();
  const [moved] = next.splice(from, 1);
  let to = next.findIndex((x) => x.id === targetId);
  if (to < 0) to = next.length;
  else if (after) to++;
  next.splice(to, 0, moved);
  return next;
}

export function stepSize(size: CardSize, step: number): CardSize {
  return clamp(size + step, 0, 3) as CardSize;
}

// ── Loading saved data safely ─────────────────────────────────────────────

function normaliseMedia(m: unknown): Media | null {
  if (!m || typeof m !== 'object') return null;
  const o = m as Record<string, unknown>;
  if (typeof o.uri !== 'string' || !o.uri) return null;
  const kind = o.kind === 'image' || o.kind === 'video' ? o.kind : 'file';
  return {
    id: typeof o.id === 'string' && o.id ? o.id : uid(),
    name: typeof o.name === 'string' && o.name ? o.name : 'File',
    kind,
    mime: typeof o.mime === 'string' ? o.mime : 'application/octet-stream',
    uri: o.uri,
    size: Number(o.size) || 0,
    width: Number(o.width) || undefined,
    height: Number(o.height) || undefined,
    duration: Number(o.duration) || undefined,
    poster: typeof o.poster === 'string' && o.poster ? o.poster : undefined,
  };
}

/** Accepts anything read from disk and returns valid data, or null if it is unusable. */
export function normaliseData(raw: unknown): AppData | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.tasks) || !Array.isArray(o.lists)) return null;
  const lists = o.lists
    .filter((l): l is { id: string; name: string } => !!l && typeof (l as { id?: unknown }).id === 'string')
    .map((l) => ({ id: l.id, name: String(l.name || '') }));
  const tasks: Task[] = o.tasks
    .filter((x): x is Record<string, unknown> => !!x && typeof (x as { id?: unknown }).id === 'string')
    .map((x) => ({
      id: x.id as string,
      title: String(x.title ?? ''),
      note: String(x.note ?? ''),
      due: isValidISO(x.due) ? x.due : '',
      listId: typeof x.listId === 'string' && lists.some((l) => l.id === x.listId) ? x.listId : '',
      done: x.done === true,
      size: clamp(Number(x.size) || 0, 0, 3) as CardSize,
      demo: x.demo === true || undefined,
      cover: normaliseMedia(x.cover),
      files: Array.isArray(x.files) ? (x.files.map(normaliseMedia).filter(Boolean) as Media[]) : [],
      createdAt: Number(x.createdAt) || 0,
    }));
  const s = (o.settings && typeof o.settings === 'object' ? o.settings : {}) as Record<string, unknown>;
  const n = (s.notify && typeof s.notify === 'object' ? s.notify : null) as Record<string, unknown> | null;
  const time = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined);
  const settings: Settings = {
    proCache: s.proCache === true,
    allTitle: typeof s.allTitle === 'string' && s.allTitle.trim() ? s.allTitle.trim().slice(0, 50) : undefined,
    notify: n ? { today: n.today !== false, nudge: n.nudge !== false, weekly: n.weekly === true, hour: clamp(Math.round(Number(n.hour)) || 9, 0, 23) } : undefined,
    notifyAsked: s.notifyAsked === true || undefined,
    firstOpenAt: time(s.firstOpenAt),
    offerStartedAt: time(s.offerStartedAt),
    demoHintHidden: s.demoHintHidden === true || undefined,
  };
  for (const k of Object.keys(settings) as (keyof Settings)[]) if (settings[k] === undefined) delete settings[k];
  return { version: 1, lists, tasks, settings };
}

/** All media uris a task set references (for cleaning up deleted files). */
export function referencedUris(data: AppData): Set<string> {
  const out = new Set<string>();
  for (const task of data.tasks)
    for (const m of allFiles(task)) {
      out.add(m.uri);
      if (m.poster) out.add(m.poster);
    }
  return out;
}

export function todayNoon() {
  return noon(new Date());
}
