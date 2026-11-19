import { test, done, assert } from './_t';
import { cardLayout, columnsFor, boardZones, boardHeight, visibleIds, hitCard, boardColumns, sideBarPlan, sideBarHeight, sideBarRight } from '../src/model/layout';
import type { CardSize } from '../src/model/types';

const items = (sizes: number[]) => sizes.map((s, i) => ({ id: 'c' + i, size: s as CardSize }));

test('columns by width (prototype breakpoints)', () => {
  assert.equal(columnsFor(353), 2);
  assert.equal(columnsFor(600), 3);
  assert.equal(columnsFor(860), 4);
});
test('phone: two columns, masonry into the shortest column', () => {
  const boxes = cardLayout(items([1, 0, 2, 1]), 353);
  const col = (353 - 12) / 2;
  assert.equal(boxes[0].x, 0);
  assert.equal(boxes[1].x, col + 12);
  assert.equal(boxes[0].h, Math.round(col * 1.12));
  assert.equal(boxes[1].h, Math.round(col * 0.78));
  // third goes under the shorter (second) column
  assert.equal(boxes[2].x, col + 12);
  assert.equal(boxes[2].y, boxes[1].h + 12);
});
test('wide card spans the width under everything', () => {
  const boxes = cardLayout(items([1, 3, 0]), 353);
  assert.equal(boxes[1].x, 0);
  assert.equal(boxes[1].w, 353);
  assert.equal(boxes[1].y, boxes[0].h + 12);
  assert.equal(boxes[2].y, boxes[1].y + boxes[1].h + 12);
});
test('no overlaps on a big board', () => {
  const sizes = Array.from({ length: 60 }, (_, i) => (i * 7) % 4);
  for (const w of [353, 734, 900]) {
    const b = cardLayout(items(sizes), w);
    for (let i = 0; i < b.length; i++)
      for (let j = i + 1; j < b.length; j++) {
        const p = b[i], q = b[j];
        const overlap = p.x < q.x + q.w - 0.01 && q.x < p.x + p.w - 0.01 && p.y < q.y + q.h - 0.01 && q.y < p.y + p.h - 0.01;
        assert.ok(!overlap, `overlap ${p.id} ${q.id} at width ${w}`);
      }
    assert.ok(b.every((x) => x.x >= 0 && x.x + x.w <= w + 0.01));
  }
});
test('vertical fold: cards never touch the fold', () => {
  const width = 911, fold = { x: 435.5, width: 40 };
  const zones = boardZones(width, fold);
  assert.equal(zones.length, 2);
  const b = cardLayout(items(Array.from({ length: 30 }, (_, i) => (i * 5) % 4)), width, 12, zones);
  for (const x of b) assert.ok(x.x + x.w <= fold.x || x.x >= fold.x + fold.width, `card ${x.id} on the fold`);
  // both halves are used
  assert.ok(b.some((x) => x.x < fold.x) && b.some((x) => x.x > fold.x));
});
test('fold outside the board is ignored', () => {
  assert.equal(boardZones(353, { x: 400, width: 40 }).length, 1);
  assert.equal(boardZones(353, null).length, 1);
});
test('visible window and hit testing', () => {
  const b = cardLayout(items(Array.from({ length: 40 }, () => 1)), 353);
  const h = boardHeight(b);
  assert.ok(h > 3000);
  const vis = visibleIds(b, 0, 800, 0);
  assert.ok(vis.has('c0') && !vis.has('c39'));
  const hit = hitCard(b, b[2].x + 10, b[2].y + b[2].h / 2);
  assert.equal(hit?.id, 'c2');
  assert.equal(hitCard(b, b[2].x + 10, b[2].y + 2), null); // top 20% doesn't count
});
test('explicit column count (landscape phone uses 4)', () => {
  const b = cardLayout(items([1, 1, 1, 1, 1]), 734, 12, undefined, 4);
  assert.equal(new Set(b.map((x) => x.x)).size, 4);
  assert.equal(b[4].y, b[0].h + 12);
});
test('iPad / Duo columns: about 230 pt each, even on Duo landscape', () => {
  assert.equal(boardColumns(786), 3);   // iPad 11" portrait
  assert.equal(boardColumns(984), 4);   // iPad 13" portrait
  assert.equal(boardColumns(1146), 5);  // iPad 11" landscape
  assert.equal(boardColumns(1328), 6);  // iPad 13" landscape
  assert.equal(boardColumns(362), 2);   // Duo outer
  assert.equal(boardColumns(629), 3);   // Duo inner portrait
  assert.equal(boardColumns(827, true), 4); // Duo inner landscape
});
test('Duo side bar: everything on a tall screen, fewer buttons on a short one, never in the camera strip', () => {
  // Duo inner portrait (951 high) and outer portrait (678): all buttons.
  assert.deepEqual(sideBarPlan(951 - 49 - 44), { top: ['menu', 'share', 'period'], quick: ['text', 'photos', 'camera'] });
  assert.deepEqual(sideBarPlan(678 - 25 - 44)?.top, ['menu', 'share', 'period']);
  // Duo outer landscape: 466 high with an 84 pt camera strip on top → Period goes first.
  const outerL = 466 - (25 + 84) - 29;
  const plan = sideBarPlan(outerL);
  assert.ok(plan, 'outer landscape still gets the side bar');
  assert.ok(sideBarHeight(plan!) <= outerL);
  assert.ok(!plan!.top.includes('period'));
  assert.deepEqual(plan!.quick, ['text', 'photos', 'camera']);
  // Absurdly short → no side bar (header buttons + floating «+» instead).
  assert.equal(sideBarPlan(200), null);
  // Camera strip 84 pt on the right: the bar starts 8 pt inside it, never on it.
  assert.equal(sideBarRight(84), 92);
  assert.equal(sideBarRight(0), 8);
});
done('layout');
