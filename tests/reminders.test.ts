import { test, done, assert } from './_t';
import { planReminders, namesLine, DEFAULT_NOTIFY } from '../src/model/reminders';
import { offerState, offerLeft, discountPercent, OFFER_AFTER_DAYS } from '../src/model/offer';
import { iso, addDays } from '../src/i18n/format';
import type { AppData, Task } from '../src/model/types';

const now = new Date(2026, 10, 6, 14, 30); // Friday 6 Nov 2026, 14:30
const task = (id: string, due: string, extra: Partial<Task> = {}): Task => ({ id, title: id, note: '', due, listId: '', done: false, size: 1, cover: null, files: [], createdAt: 0, ...extra });
const data = (tasks: Task[]): AppData => ({ version: 1, lists: [], tasks, settings: {} });
const day = (n: number) => iso(addDays(now, n));

test('morning message only on days with tasks, at the chosen hour, never in the past', () => {
  const d = data([task('Позвонить маме', day(0)), task('Хлеб', day(1)), task('Стоматолог', day(1)), task('Отпуск', day(20))]);
  const r = planReminders(d, now, 'ru', { ...DEFAULT_NOTIFY, nudge: false });
  assert.equal(r.length, 1, 'today 9:00 has passed; day+20 is too far');
  assert.equal(r[0].kind, 'today');
  assert.equal(new Date(r[0].at).getHours(), 9);
  assert.equal(iso(new Date(r[0].at)), day(1));
  assert.equal(r[0].body, 'Хлеб и Стоматолог');
});
test('examples and completed tasks never trigger reminders', () => {
  const d = data([task('Пример', day(1), { demo: true }), task('Готово', day(1), { done: true })]);
  assert.equal(planReminders(d, now, 'ru', { ...DEFAULT_NOTIFY, nudge: false }).length, 0);
});
test('nudge: one message 3 days later in the evening, with how many tasks wait', () => {
  const d = data([task('А', ''), task('Б', ''), task('Пример', '', { demo: true })]);
  const r = planReminders(d, now, 'ru', { ...DEFAULT_NOTIFY, today: false });
  assert.equal(r.length, 1);
  assert.equal(r[0].kind, 'nudge');
  assert.equal(iso(new Date(r[0].at)), day(3));
  assert.equal(new Date(r[0].at).getHours(), 19);
  assert.ok(r[0].body.includes('2 задачи'), r[0].body);
  const empty = planReminders(data([]), now, 'en', { ...DEFAULT_NOTIFY, today: false });
  assert.ok(empty[0].body.startsWith('Snap a photo'));
});
test('never more than one message a day: "today" wins over the nudge', () => {
  const d = data([task('Купить краски', day(3))]);
  const r = planReminders(d, now, 'ru', DEFAULT_NOTIFY);
  const days = r.map((x) => iso(new Date(x.at)));
  assert.equal(new Set(days).size, days.length);
  assert.equal(r.find((x) => iso(new Date(x.at)) === day(3))?.kind, 'today');
});
test('weekly plan: off by default; when on — next Sunday 19:00, counts the coming week', () => {
  assert.ok(!planReminders(data([]), now, 'ru').some((x) => x.kind === 'weekly'));
  const d = data([task('Пн', day(3)), task('Вс', day(9)), task('Потом', day(12))]); // Sunday = day(2)
  const r = planReminders(d, now, 'ru', { today: false, nudge: false, weekly: true, hour: 9 });
  assert.equal(r.length, 1);
  assert.equal(new Date(r[0].at).getDay(), 0);
  assert.equal(iso(new Date(r[0].at)), day(2));
  assert.ok(r[0].body.includes('2 задачи'), r[0].body);
});
test('all off → nothing; at most 9 reminders even with a full week', () => {
  assert.equal(planReminders(data([task('А', day(1))]), now, 'ru', { today: false, nudge: false, weekly: false, hour: 9 }).length, 0);
  const many = data(Array.from({ length: 30 }, (_, i) => task('T' + i, day(i % 7))));
  assert.ok(planReminders(many, now, 'ru', { ...DEFAULT_NOTIFY, weekly: true }).length <= 9);
});
test('names line: one, two, many; long titles shortened', () => {
  assert.equal(namesLine([task('А', '')], 'ru'), 'А');
  assert.equal(namesLine([task('А', ''), task('Б', ''), task('В', ''), task('Г', '')], 'ru'), 'А, Б и ещё 2');
  assert.equal(namesLine([task('A', ''), task('B', '')], 'en'), 'A and B');
  assert.ok(namesLine([task('x'.repeat(80), '')], 'en').length <= 40);
});

// ── One-time offer
const H = 60 * 60 * 1000;
const D = 24 * H;
test('offer: only after 3 weeks, never for Pro', () => {
  const t0 = now.getTime();
  assert.equal(offerState({ firstOpenAt: t0 - 20 * D }, false, t0), 'none');
  assert.equal(offerState({ firstOpenAt: t0 - OFFER_AFTER_DAYS * D }, false, t0), 'eligible');
  assert.equal(offerState({ firstOpenAt: t0 - 30 * D }, true, t0), 'none');
  assert.equal(offerState({}, false, t0), 'none');
});
test('offer: the hour is real — active for 60 minutes, then over for good', () => {
  const t0 = now.getTime();
  const s = { firstOpenAt: t0 - 30 * D, offerStartedAt: t0 };
  assert.equal(offerState(s, false, t0 + 59 * 60_000), 'active');
  assert.equal(offerLeft(s, t0 + 59 * 60_000), 60_000);
  assert.equal(offerState(s, false, t0 + H), 'over');
  assert.equal(offerState(s, false, t0 + 400 * D), 'over', 'never restarts');
  assert.equal(offerLeft(s, t0 + 2 * H), 0);
});
test('discount percent', () => {
  assert.equal(discountPercent(1490, 745), 50);
  assert.equal(discountPercent(1990, 1290), 35);
  assert.equal(discountPercent(1490, 1490), 0);
  assert.equal(discountPercent(0, 10), 0);
});

done('reminders + offer');
