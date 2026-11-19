// Which reminders to schedule — rarely, and only when there is something to say:
//  • "Today's tasks": in the morning, only on days that have tasks with that date (next 7 days);
//  • "Gentle reminder": one message 3 days after the app was last opened (re-planned on every visit,
//    so it only fires if the person really stayed away);
//  • "Weekly plan" (off by default): Sunday 19:00, the coming week.
// Never more than one message a day: "today" wins, then "weekly", then "nudge".
// Examples (demo cards) never trigger reminders. Pure and tested (tests/reminders.test.ts).
import { t, type Lang } from '../i18n';
import { addDays, iso, taskCount } from '../i18n/format';
import type { AppData, NotifySettings, Task } from './types';

export interface Reminder {
  id: string;
  kind: 'today' | 'nudge' | 'weekly';
  /** ms since 1970 */
  at: number;
  title: string;
  body: string;
}

export const DEFAULT_NOTIFY: NotifySettings = { today: true, nudge: true, weekly: false, hour: 9 };
export const NUDGE_AFTER_DAYS = 3;
export const EVENING_HOUR = 19;
const DAYS_AHEAD = 7;

function at(day: Date, hour: number) {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0);
  return d.getTime();
}

function shortTitle(task: Task, lang: Lang) {
  const s = (task.title || t('untitled', undefined, lang)).replace(/\s+/g, ' ').trim();
  return s.length > 40 ? `${s.slice(0, 39).trimEnd()}…` : s;
}

/** "Позвонить маме", "А и Б", "А, Б и ещё 3". */
export function namesLine(tasks: Task[], lang: Lang) {
  const n = tasks.map((x) => shortTitle(x, lang));
  if (n.length === 1) return n[0];
  if (n.length === 2) return t('nTodayTwo', { a: n[0], b: n[1] }, lang);
  return t('nTodayMany', { a: n[0], b: n[1], n: n.length - 2 }, lang);
}

export function planReminders(data: AppData, now: Date, lang: Lang, s: NotifySettings = DEFAULT_NOTIFY): Reminder[] {
  const own = data.tasks.filter((x) => !x.demo && !x.done);
  const out: Reminder[] = [];
  const nowMs = now.getTime();
  const later = (ms: number) => ms > nowMs + 60_000;

  if (s.today) {
    for (let d = 0; d < DAYS_AHEAD; d++) {
      const day = addDays(now, d);
      const when = at(day, s.hour);
      if (!later(when)) continue;
      const due = own.filter((x) => x.due === iso(day));
      if (!due.length) continue;
      out.push({ id: `today-${iso(day)}`, kind: 'today', at: when, title: t('nTodayTitle', undefined, lang), body: namesLine(due, lang) });
    }
  }

  if (s.weekly) {
    // Next Sunday 19:00 (today, if it is Sunday and still before 19:00).
    let sunday = addDays(now, (7 - now.getDay()) % 7);
    if (!later(at(sunday, EVENING_HOUR))) sunday = addDays(sunday, 7);
    const from = iso(addDays(sunday, 1));
    const to = iso(addDays(sunday, 7));
    const week = own.filter((x) => x.due && x.due >= from && x.due <= to);
    out.push({
      id: `weekly-${iso(sunday)}`,
      kind: 'weekly',
      at: at(sunday, EVENING_HOUR),
      title: t('nWeeklyTitle', undefined, lang),
      body: week.length ? t('nWeeklyTasks', { tasks: taskCount(week.length, lang) }, lang) : t('nWeeklyEmpty', undefined, lang),
    });
  }

  if (s.nudge) {
    const day = addDays(now, NUDGE_AFTER_DAYS);
    out.push({
      id: 'nudge',
      kind: 'nudge',
      at: at(day, EVENING_HOUR),
      title: t('nNudgeTitle', undefined, lang),
      body: own.length ? t('nNudgeTasks', { tasks: taskCount(own.length, lang) }, lang) : t('nNudgeEmpty', undefined, lang),
    });
  }

  // At most one message a day.
  const rank = { today: 0, weekly: 1, nudge: 2 } as const;
  const byDay = new Map<string, Reminder>();
  for (const r of out) {
    const key = iso(new Date(r.at));
    const had = byDay.get(key);
    if (!had || rank[r.kind] < rank[had.kind]) byDay.set(key, r);
  }
  return [...byDay.values()].sort((a, b) => a.at - b.at);
}
