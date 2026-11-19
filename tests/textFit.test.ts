import { test, done, assert } from './_t';
import { balanceLines, glueShortWords, unhang, countLines, fitCardText, lineWidth, textCardBox, wordWidth, wrapLines, TEXT_CARD, textCardBoxFor } from '../src/model/textFit';

// iPhone 16 Pro, two columns: card 170.5 pt wide → sizes 0 / 1 / 2 and the wide card.
const W = 170;
const sizes = { small: 133, normal: 190, tall: 272 };

test('word width counts capitals, lower case is measured as capitals', () => {
  assert.equal(wordWidth('молоко'), wordWidth('МОЛОКО'));
  assert.ok(wordWidth('ЖЖ') > wordWidth('II'));
});
test('lines: greedy wrap, hard line breaks, long words broken by letters', () => {
  assert.equal(countLines('КУПИТЬ МОЛОКО', 100), 1);
  assert.equal(countLines('КУПИТЬ МОЛОКО', Math.max(wordWidth('КУПИТЬ'), wordWidth('МОЛОКО')) + 0.1), 2);
  assert.equal(countLines('А\nБ\n\nВ', 100), 4);
  const n = countLines('ОЧЕНЬДЛИННОЕСЛОВО', wordWidth('ОЧЕНЬДЛИННОЕСЛОВО') / 3 + 0.01);
  assert.ok(n === 3 || n === 4, `split by letters into 3–4 lines (${n})`);
  for (const l of wrapLines('ОЧЕНЬДЛИННОЕСЛОВО', 3)) assert.ok(lineWidth(l) <= 3 + 1e-9 || Array.from(l).length === 1);
});
test('short text is big, longer text gets smaller (same card)', () => {
  const box = textCardBox(W, sizes.normal, { layout: false });
  const a = fitCardText('Хлеб', box.width, box.height);
  const b = fitCardText('Позвонить маме вечером', box.width, box.height);
  const c = fitCardText('Забрать пальто из химчистки до пятницы и заодно купить подарок Ане на день рождения', box.width, box.height);
  assert.ok(a.fontSize > b.fontSize, `${a.fontSize} > ${b.fontSize}`);
  assert.ok(b.fontSize > c.fontSize, `${b.fontSize} > ${c.fontSize}`);
  assert.ok(a.fits && b.fits && c.fits);
  assert.ok(c.fontSize >= TEXT_CARD.min);
});
test('a bigger card gives the same text a bigger font', () => {
  const text = 'Позвонить маме вечером';
  const s = textCardBox(W, sizes.small, { layout: false });
  const t = textCardBox(W, sizes.tall, { layout: false });
  assert.ok(fitCardText(text, t.width, t.height).fontSize >= fitCardText(text, s.width, s.height).fontSize);
  const wide = textCardBox(353, 226, { layout: false });
  assert.ok(fitCardText(text, wide.width, wide.height).fontSize > fitCardText(text, s.width, s.height).fontSize);
});
test('the fit really fits: lines × line height inside the box, width inside the line', () => {
  for (const h of Object.values(sizes)) {
    const box = textCardBox(W, h, { layout: false });
    for (const text of ['Хлеб', 'Купить молоко', 'Записаться к стоматологу на четверг', 'Позвонить маме вечером и спросить про выходные']) {
      const f = fitCardText(text, box.width, box.height);
      if (!f.fits) continue;
      assert.ok(f.lines * f.lineHeight <= box.height, `${text} @${h}: ${f.lines}×${f.lineHeight} > ${box.height}`);
      assert.equal(countLines(text, (box.width * TEXT_CARD.slack) / f.fontSize), f.lines);
      // the longest word fits on one line
      const longest = Math.max(...text.split(' ').map((w) => wordWidth(w)));
      assert.ok(longest * f.fontSize <= box.width, `${text}: a word is wider than the card`);
    }
  }
});
test('one short word never shouts: capped by card width', () => {
  const box = textCardBox(W, sizes.tall, { layout: false });
  assert.ok(fitCardText('ОК', box.width, box.height).fontSize <= Math.floor(box.width / 4.6));
  assert.ok(fitCardText('ОК', 1000, 1000).fontSize <= TEXT_CARD.max);
});
test('too much text: smallest size, as many lines as fit, marked as not fitting (ends with …)', () => {
  const box = textCardBox(W, sizes.small, { layout: false });
  const long = 'очень '.repeat(40);
  const f = fitCardText(long, box.width, box.height);
  assert.equal(f.fits, false);
  assert.equal(f.fontSize, TEXT_CARD.min);
  assert.equal(f.lines, Math.floor(box.height / f.lineHeight));
  assert.ok(f.lines >= 1);
  assert.ok(f.text.endsWith('…') && f.text.split('\n').every((l) => /^(очень ?)+…?$/.test(l.toLowerCase())), 'whole words, «…» at the end');
});
test('empty or whitespace text does not crash', () => {
  const f = fitCardText('   ', 100, 60);
  assert.ok(f.fontSize >= TEXT_CARD.min && f.lines >= 1);
});
test('the text box is centred: same room above and below; layout mode leaves room for its buttons', () => {
  const a = textCardBox(W, sizes.normal, { layout: false });
  const c = textCardBox(W, sizes.normal, { layout: true });
  assert.equal(a.top, a.bottom);
  assert.equal(c.top, c.bottom);
  assert.ok(a.height > c.height);
  assert.ok(a.top >= 44, 'clear of the round check (it ends 43 pt from the top)');
  assert.ok(textCardBox(20, 20, { layout: true }).height >= 10);
});
test('balanced lines: same number of lines as greedy, but more even, words never split', () => {
  const text = 'Забрать пальто из химчистки до пятницы и заодно купить подарок Ане на день рождения';
  const em = 12;
  const g = wrapLines(text, em);
  const b = balanceLines(text, em);
  assert.equal(b.length, g.length);
  const spread = (ls: string[]) => Math.max(...ls.map((l) => lineWidth(l))) - Math.min(...ls.map((l) => lineWidth(l)));
  assert.ok(spread(b) <= spread(g), `${spread(b)} <= ${spread(g)}`);
  assert.equal(b.join(' '), text, 'same words in the same order');
  for (const l of b) assert.ok(lineWidth(l) <= em + 1e-9);
  // "Хлеб и молоко" on two lines: not "Хлеб и молоко" + nothing
  const two = balanceLines('Позвонить маме вечером', wordWidth('ПОЗВОНИТЬ МАМЕ') + 0.5);
  assert.equal(two.length, 2);
  assert.ok(Math.abs(lineWidth(two[0]) - lineWidth(two[1])) < wordWidth('ПОЗВОНИТЬ'));
});
test('fit returns the balanced lines when it fits, whole words + «…» when it is cut', () => {
  const box = textCardBox(W, sizes.normal, { layout: false });
  const f = fitCardText('Забрать пальто из химчистки до пятницы', box.width, box.height);
  assert.ok(f.fits);
  assert.equal(f.text.split('\n').length, f.lines);
  assert.equal(f.text.replace(/\n/g, ' '), 'Забрать пальто из химчистки до пятницы');
  const long = 'очень '.repeat(60).trim();
  const g = fitCardText(long, box.width, box.height);
  assert.equal(g.fits, false);
  assert.ok(long.startsWith(g.text.replace(/\n/g, ' ').replace(/…$/, '')) && g.text.endsWith('…'), 'cut after a whole word, with «…»');
});
test('no line ends with a short word (в, к, и, на…): it moves to the next line', () => {
  assert.equal(glueShortWords('Записаться к стоматологу'), 'Записаться к\u00A0стоматологу');
  assert.equal(glueShortWords('и в доме'), 'и\u00A0в\u00A0доме');
  for (const [w, h] of [[170, 133], [170, 190], [170, 272], [353, 226]]) {
    const b = textCardBox(w, h, { layout: false });
    for (const t of ['Записаться к стоматологу на четверг', 'Забрать пальто из химчистки до пятницы и заодно купить подарок Ане на день рождения', 'Позвонить маме вечером']) {
      const f = fitCardText(t, b.width, b.height);
      if (!f.fits) continue;
      assert.ok(!f.text.includes('\u00A0'), 'only normal spaces are drawn');
      // At the smallest size, showing all the text wins over this rule (rare: very long text on a small card).
      if (f.fontSize === TEXT_CARD.min) continue;
      for (const line of f.text.split('\n').slice(0, -1)) {
        const last = line.split(' ').pop() || '';
        assert.ok(Array.from(last).length > 2, `line «${line}» ends with a short word (${w}×${h})`);
      }
    }
  }
});
test('unhang: a short word at a line end moves down when the next line has room', () => {
  assert.deepEqual(unhang(['до пятницы и', 'заодно'], 20), ['до пятницы', 'и заодно']);
  assert.deepEqual(unhang(['до пятницы и', 'заодно купить подарок'], wordWidth('ЗАОДНО КУПИТЬ ПОДАРОК') + 0.1), ['до пятницы и', 'заодно купить подарок'], 'no room: stays');
});
test('emoji and digits are measured', () => {
  assert.ok(wordWidth('🎂') > wordWidth('1'));
});

test('small cards (Duo closed with the side bar): short texts shown whole, not «ХЛЕБ И МОЛ…»', () => {
  for (const date of [false, true]) {
    const b = textCardBoxFor('Хлеб и молоко', 133, 103, { date, layout: false });
    const f = fitCardText('Хлеб и молоко', b.width, b.height);
    assert.ok(f.fits && f.lines === 2, `date=${date}: ${f.lines} lines, fits=${f.fits}`);
    assert.ok(b.top >= 44, 'still clear of the check at the top');
    assert.ok(b.bottom >= (date ? 28 : 16), 'clear of the date line');
  }
  // A long text on such a small card: as many whole lines as there is room for (the rest is one tap away).
  const z = textCardBoxFor('Записаться к стоматологу на четверг', 133, 103, { date: true, layout: false });
  assert.ok(fitCardText('Записаться к стоматологу на четверг', z.width, z.height).lines >= 2, 'at least two lines, not one cut line');
  // Normal cards keep the centred box.
  const n = textCardBoxFor('Хлеб и молоко', 171, 133, { date: false, layout: false });
  assert.equal(n.top, n.bottom);
});
done('textFit.test.ts');
