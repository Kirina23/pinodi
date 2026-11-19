import { test, done, assert } from './_t';
import { parseISO, iso } from '../src/i18n/format';
import { seedData } from '../src/model/seed';
import { currentTasks, periodBounds, rangeText, dateLabel, defaultDue, emptyKind, activeCount, addBlockReason, restoreBlocked, bundleFiles, cardSubtitle, reorder, stepSize, normaliseData, listCount, shiftAnchor, referencedUris, fileKindLabel, titleFromFileName } from '../src/model/logic';
import { shareText } from '../src/model/share';
import type { AppData, Media, Task } from '../src/model/types';

const today = parseISO('2026-11-04');
const fresh = () => seedData(today, 'ru');
const task = (id: string, extra: Partial<Task> = {}): Task => ({ id, title: id, note: '', due: '', listId: '', done: false, size: 1, cover: null, files: [], createdAt: 1, ...extra });
const media = (kind: Media['kind'], name = 'x'): Media => ({ id: name, name, kind, mime: '', uri: 'media/' + name, size: 1 });

test('seed has 6 demo tasks in 2 lists', () => {
  const d = fresh();
  assert.equal(d.tasks.length, 6);
  assert.equal(d.lists.length, 2);
  assert.ok(d.tasks.every((x) => x.demo));
  assert.ok(d.tasks.every((x) => x.due === ''), 'examples have no dates: a date appears only when chosen');
});
test('week filter keeps undated tasks and drops other weeks', () => {
  const d = fresh();
  d.tasks[5].due = '2026-11-16'; // +12 days
  const ids = currentTasks(d, 'all', 'week', today).map((x) => x.id);
  assert.ok(ids.includes('demo-paint'));      // no date
  assert.ok(!ids.includes('demo-month'));     // +12 days
  assert.equal(ids.length, 5);
});
test('list and done filters', () => {
  const d = fresh();
  assert.equal(currentTasks(d, 'work', 'all', today).length, 3);
  d.tasks[0].done = true;
  assert.equal(currentTasks(d, 'work', 'all', today).length, 2);
  assert.deepEqual(currentTasks(d, 'done', 'all', today).map((x) => x.id), ['demo-brand']);
  assert.equal(listCount(d, 'done'), 1);
  assert.equal(listCount(d, 'all'), 5);
});
test('period bounds and text', () => {
  const [a, z] = periodBounds('month', today)!;
  assert.equal(iso(a), '2026-11-01');
  assert.equal(iso(z), '2026-11-30');
  assert.equal(rangeText('week', today, 'ru'), '2–8 ноября');
  assert.equal(rangeText('all', today, 'en'), 'All plans');
  assert.equal(iso(shiftAnchor('month', today, 1)), '2026-12-01');
  assert.equal(iso(shiftAnchor('week', today, -1)), '2026-10-28');
});
test('date labels: always the date itself, never «Сегодня» / «Завтра»', () => {
  assert.equal(dateLabel('2026-11-04', today, 'ru'), '4 нояб.');
  assert.ok(!/Tomorrow|Today/.test(dateLabel('2026-11-05', today, 'en')));
  assert.equal(dateLabel('2026-11-06', today, 'ru'), '6 нояб.');
  assert.equal(dateLabel('', today, 'ru'), '');
});
test('default due date follows the viewed period', () => {
  assert.equal(defaultDue('all', today, today), '2026-11-04');
  assert.equal(defaultDue('month', parseISO('2026-12-10'), today), '2026-12-01');
});
test('empty states', () => {
  const d: AppData = { version: 1, lists: [{ id: 'l', name: 'L' }], tasks: [], settings: {} };
  assert.equal(emptyKind(d, 'all', 'all'), 'first');
  d.tasks.push(task('a', { done: true }));
  assert.equal(emptyKind(d, 'all', 'all'), 'allDone');
  assert.equal(emptyKind(d, 'done', 'all'), 'done');
  d.tasks.push(task('b', { due: '2026-12-20' }));
  assert.equal(emptyKind(d, 'all', 'week'), 'period');
  assert.equal(emptyKind(d, 'l', 'all'), 'list');
});
test('free limit: 10 active, examples and done tasks do not count', () => {
  const d = fresh();
  assert.equal(activeCount(d), 0);
  for (let i = 0; i < 10; i++) d.tasks.push(task('t' + i));
  assert.equal(addBlockReason(d, 1, false), 'limit');
  assert.equal(addBlockReason(d, 1, true), null);
  d.tasks[6].done = true;
  assert.equal(addBlockReason(d, 1, false), null);
  d.tasks.push(task('t10'));
  assert.equal(restoreBlocked(d, d.tasks[6], false), true);
  assert.equal(restoreBlocked(d, d.tasks[6], true), false);
  // Deleting a card frees its place too (Liza: «после удаления он сможет»).
  d.tasks = d.tasks.filter((x) => x.id !== 't10');
  d.tasks = d.tasks.filter((x) => x.id !== 't0');
  assert.equal(addBlockReason(d, 1, false), null);
  assert.equal(addBlockReason(d, 2, false), 'limit');
});
test('storage limit 2000', () => {
  const d: AppData = { version: 1, lists: [], tasks: Array.from({ length: 2000 }, (_, i) => task('x' + i, { done: true })), settings: {} };
  assert.equal(addBlockReason(d, 1, true), 'storage');
});
test('bundle files: first photo is the cover, else first video', () => {
  const a = media('file', 'a.pdf'), b = media('video', 'b.mov'), c = media('image', 'c.jpg');
  assert.deepEqual(bundleFiles([a, b, c]), { cover: c, files: [a, b] });
  assert.deepEqual(bundleFiles([a, b]), { cover: b, files: [a] });
  assert.deepEqual(bundleFiles([a]), { cover: null, files: [a] });
});
test('card subtitle', () => {
  assert.equal(cardSubtitle(task('a', { due: '2026-11-04' }), today, 'ru'), '4 нояб.');
  assert.equal(cardSubtitle(task('a', { cover: media('image'), files: [media('file', 'b'), media('file', 'c')] }), today, 'ru'), '3 файла');
  assert.equal(cardSubtitle(task('a', { files: [media('file', 'b')] }), today, 'en'), '1 file');
  assert.equal(cardSubtitle(task('a', { cover: media('image') }), today, 'ru'), '');
});
test('file kind labels', () => {
  assert.equal(fileKindLabel(media('file', 'plan.pdf'), 'ru'), 'PDF');
  assert.equal(fileKindLabel(media('file', 'README'), 'ru'), 'Файл');
  assert.equal(fileKindLabel(media('image'), 'en'), 'Photo');
  assert.equal(titleFromFileName('IMG_2041.jpeg'), 'IMG_2041');
});
test('reorder moves before or after the target', () => {
  const list = ['a', 'b', 'c', 'd'].map((id) => task(id));
  assert.deepEqual(reorder(list, 'a', 'c', true).map((x) => x.id), ['b', 'c', 'a', 'd']);
  assert.deepEqual(reorder(list, 'd', 'b').map((x) => x.id), ['a', 'd', 'b', 'c']);
  assert.equal(reorder(list, 'a', 'a'), list);
  assert.deepEqual(list.map((x) => x.id), ['a', 'b', 'c', 'd']); // not mutated
});
test('size steps clamp to 0..3', () => {
  assert.equal(stepSize(0, -1), 0);
  assert.equal(stepSize(3, 1), 3);
  assert.equal(stepSize(1, 1), 2);
});
test('normalise survives junk and drops broken items', () => {
  assert.equal(normaliseData(null), null);
  assert.equal(normaliseData({ tasks: 1 }), null);
  const d = normaliseData({ lists: [{ id: 'w', name: 'Work' }, 5], tasks: [{ id: 'a', size: 9, due: 'bad', listId: 'gone', cover: { uri: '' }, files: [{ uri: 'media/x', kind: 'video' }, null] }, { nope: 1 }] })!;
  assert.equal(d.lists.length, 1);
  assert.equal(d.tasks.length, 1);
  assert.equal(d.tasks[0].size, 3);
  assert.equal(d.tasks[0].due, '');
  assert.equal(d.tasks[0].listId, '');
  assert.equal(d.tasks[0].cover, null);
  assert.equal(d.tasks[0].files[0].kind, 'video');
  // round trip of real data
  const s = fresh();
  assert.deepEqual(normaliseData(JSON.parse(JSON.stringify(s)))!.tasks.map((x) => x.id), s.tasks.map((x) => x.id));
});
test('referenced uris include posters', () => {
  const d: AppData = { version: 1, lists: [], tasks: [task('a', { cover: { ...media('video', 'v.mov'), poster: 'media/p.jpg' } })], settings: {} };
  assert.deepEqual([...referencedUris(d)].sort(), ['media/p.jpg', 'media/v.mov']);
});
test('share text', () => {
  const d = fresh();
  d.tasks[1].due = '2026-11-05';
  const s = shareText(d.tasks.slice(0, 2), 'Задачи', '2–8 ноября', today, 'ru');
  assert.ok(s.startsWith('Задачи\n2–8 ноября\n\n○ Оформить рабочее место\n  Выбрать свет'), s);
  assert.ok(s.includes('○ Планы на неделю · 5 нояб.'));
  const photo = shareText([{ ...d.tasks[0], title: '' }], 'Задачи', '', today, 'ru');
  assert.ok(photo.includes('○ Фото'), 'a photo without a caption is «Фото» in shared text');
});
done('logic');
