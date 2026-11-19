import { test, done, assert } from './_t';
import { iso, parseISO, monday, weekRange, monthTitle, shortDate, ruPlural, fileCount, durationLabel, dayCount, addDays } from '../src/i18n/format';

test('iso/parse round trip', () => {
  assert.equal(iso(parseISO('2026-11-04')), '2026-11-04');
  assert.equal(parseISO('2026-03-29').getHours(), 12);
});
test('monday is the start of week', () => {
  assert.equal(iso(monday(parseISO('2026-11-04'))), '2026-11-02'); // Wednesday
  assert.equal(iso(monday(parseISO('2026-11-08'))), '2026-11-02'); // Sunday
  assert.equal(iso(monday(parseISO('2026-11-09'))), '2026-11-09'); // Monday
});
test('week range text, ru and en', () => {
  const a = parseISO('2026-11-02');
  assert.equal(weekRange(a, addDays(a, 6), 'ru'), '2–8 ноября');
  assert.equal(weekRange(a, addDays(a, 6), 'en'), 'Nov 2–8');
  const b = parseISO('2026-11-30');
  assert.equal(weekRange(b, addDays(b, 6), 'ru'), '30 нояб. – 6 дек.');
  assert.equal(weekRange(b, addDays(b, 6), 'en'), 'Nov 30 – Dec 6');
});
test('month title', () => {
  assert.equal(monthTitle(parseISO('2026-11-04'), 'ru'), 'Ноябрь 2026');
  assert.equal(monthTitle(parseISO('2026-05-04'), 'en'), 'May 2026');
});
test('short date like the prototype', () => {
  assert.equal(shortDate(parseISO('2026-11-06'), 'ru'), '6 нояб.');
  assert.equal(shortDate(parseISO('2026-05-06'), 'ru'), '6 мая');
  assert.equal(shortDate(parseISO('2026-11-06'), 'en'), 'Nov 6');
});
test('russian plurals', () => {
  const f = (n: number) => ruPlural(n, 'файл', 'файла', 'файлов');
  assert.deepEqual([1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101, 111].map(f), ['файл', 'файла', 'файла', 'файлов', 'файлов', 'файлов', 'файлов', 'файл', 'файла', 'файлов', 'файл', 'файлов']);
  assert.equal(fileCount(3, 'ru'), '3 файла');
  assert.equal(fileCount(1, 'en'), '1 file');
  assert.equal(fileCount(2, 'en'), '2 files');
  assert.equal(dayCount(7, 'ru'), '7 дней');
  assert.equal(dayCount(3, 'ru'), '3 дня');
});
test('duration label', () => {
  assert.equal(durationLabel(4), '0:04');
  assert.equal(durationLabel(65.9), '1:05');
  assert.equal(durationLabel(undefined), '0:00');
});
done('format');
