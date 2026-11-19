import { test, done, assert } from './_t';
import { STRINGS } from '../src/i18n/strings';
import { t, pickLang } from '../src/i18n';

// Latin words allowed inside Russian strings.
const ALLOW = new Set(['Pinodi', 'Pro', 'iPhone', 'Upgrade', 'JPEG', 'PNG', 'HEIC', 'MP4', 'MOV', 'PDF', 'Apple', 'ID', 'v', 'b']);

test('every key has ru and en text', () => {
  for (const [k, v] of Object.entries(STRINGS)) {
    assert.ok(v.ru && v.ru.trim(), `ru missing: ${k}`);
    assert.ok(v.en && v.en.trim(), `en missing: ${k}`);
  }
});
test('no English leaks into Russian', () => {
  for (const [k, v] of Object.entries(STRINGS)) {
    const words = v.ru.replace(/\{[a-z]+\}/gi, '').match(/[A-Za-z][A-Za-z0-9.]*/g) || [];
    for (const w of words) assert.ok(ALLOW.has(w.replace(/\.$/, '')), `Latin word "${w}" in ru:${k}`);
  }
});
test('placeholders match between languages', () => {
  for (const [k, v] of Object.entries(STRINGS)) {
    const ph = (s: string) => (s.match(/\{[a-z]+\}/gi) || []).sort().join(',');
    assert.equal(ph(v.ru), ph(v.en), `placeholders differ in ${k}`);
  }
});
test('t fills placeholders', () => {
  assert.equal(t('addedN', { n: 3 }, 'ru'), 'Добавлено задач: 3');
  assert.equal(t('openingN', { i: 1, n: 2 }, 'en'), 'Opening files: 1 of 2');
});
test('language pick', () => {
  assert.equal(pickLang('ru-RU'), 'ru');
  assert.equal(pickLang('kk'), 'ru');
  assert.equal(pickLang('de'), 'en');
  assert.equal(pickLang(undefined), 'en');
});
done('i18n');
