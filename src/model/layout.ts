// Masonry board layout — function cardLayout() from the prototype, plus fold awareness
// for iPhone Duo. Pure and tested (tests/layout.test.ts).
import { CARD_RATIOS } from './constants';
import type { CardSize } from './types';

export interface CardBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A horizontal span of the board that cards may use. Normally one; two when a vertical fold splits the screen. */
export interface Zone {
  x: number;
  width: number;
}

/** const columns = width>=860 ? 4 : width>=600 ? 3 : 2 */
export function columnsFor(width: number) {
  return width >= 860 ? 4 : width >= 600 ? 3 : 2;
}

/**
 * Columns on iPad / iPhone Duo (instead of the prototype's 2-3-4 steps, which were made for
 * a 940 pt column): about one column per 230 pt, 2…6. iPhone Duo in landscape always gets an
 * even number (Apple: "prefer an even number of columns" so the fold falls between them).
 */
export function boardColumns(width: number, duoLandscape = false) {
  if (duoLandscape) return width >= 700 ? 4 : 2;
  return Math.max(2, Math.min(6, Math.round(width / 230)));
}

/**
 * Board zones. Without a fold: the whole width. With a vertical fold (book posture)
 * the cards are split so no card lies on the fold: the fold's span becomes a gap.
 */
export function boardZones(width: number, fold?: { x: number; width: number } | null, gap = 12): Zone[] {
  if (!fold || fold.width <= 0 || fold.x <= 0 || fold.x + fold.width >= width) return [{ x: 0, width }];
  // Keep at least half a gap of air on each side of the fold.
  const leftEnd = fold.x - gap / 2;
  const rightStart = fold.x + fold.width + gap / 2;
  const zones: Zone[] = [];
  if (leftEnd > 120) zones.push({ x: 0, width: leftEnd });
  if (width - rightStart > 120) zones.push({ x: rightStart, width: width - rightStart });
  return zones.length ? zones : [{ x: 0, width }];
}

export function cardLayout(items: { id: string; size: CardSize }[], width: number, gap = 12, zones: Zone[] = [{ x: 0, width }], columns?: number): CardBox[] {
  type Col = { x: number; w: number; zone: number; h: number };
  const cols: Col[] = [];
  zones.forEach((z, zi) => {
    // Inside a fold zone use 2 columns per half (as on a phone); otherwise the usual rule.
    const n = zones.length > 1 ? (z.width >= 300 ? 2 : 1) : columns ?? columnsFor(z.width);
    const cw = (z.width - gap * (n - 1)) / n;
    for (let i = 0; i < n; i++) cols.push({ x: z.x + i * (cw + gap), w: cw, zone: zi, h: 0 });
  });
  return items.map((it) => {
    if (it.size === 3) {
      // Wide card: spans its whole zone; pick the zone whose tallest column is lowest.
      let best = 0;
      let bestY = Infinity;
      zones.forEach((_, zi) => {
        const y = Math.max(...cols.filter((c) => c.zone === zi).map((c) => c.h));
        if (y < bestY) {
          bestY = y;
          best = zi;
        }
      });
      const z = zones[best];
      const h = Math.round(z.width * CARD_RATIOS[3]);
      for (const c of cols) if (c.zone === best) c.h = bestY + h + gap;
      return { id: it.id, x: z.x, y: bestY, w: z.width, h };
    }
    let ci = 0;
    for (let i = 1; i < cols.length; i++) if (cols[i].h < cols[ci].h) ci = i;
    const c = cols[ci];
    const h = Math.round(c.w * CARD_RATIOS[it.size]);
    const box = { id: it.id, x: c.x, y: c.h, w: c.w, h };
    c.h += h + gap;
    return box;
  });
}

export function boardHeight(boxes: CardBox[]) {
  return boxes.reduce((m, b) => Math.max(m, b.y + b.h), 0);
}

/** Cards that intersect [top, bottom] (plus a margin). Used to render only what is near the screen. */
export function visibleIds(boxes: CardBox[], top: number, bottom: number, margin = 600): Set<string> {
  const a = top - margin;
  const z = bottom + margin;
  return new Set(boxes.filter((b) => b.y + b.h >= a && b.y <= z).map((b) => b.id));
}

/** Which card is under a point (board coordinates), ignoring `exceptId`; only the middle 60% counts, as in the prototype. */
export function hitCard(boxes: CardBox[], x: number, y: number, exceptId?: string): CardBox | null {
  for (const b of boxes) {
    if (b.id === exceptId) continue;
    if (x >= b.x && x <= b.x + b.w && y > b.y + b.h * 0.2 && y < b.y + b.h * 0.8) return b;
  }
  return null;
}

// ── iPhone Duo side bar ─────────────────────────────────────────────────
// On iPhone Duo, Apple moves an app's bars into one vertical bar along the side of the screen.
// Snapdo does the same: ☰, Share and Period at the top («Изм.» stays in the header); quick add (text, photos, camera) and the
// big «+» at the bottom, under the thumb. When the screen is too short, the least needed buttons
// go first (Period, then Share back into the header); below that the side bar is not used.

export const SIDEBAR = { width: 56, button: 44, gap: 4, pad: 6, plus: 56, groupGap: 16, margin: 8, toBoard: 12 } as const;

export type SideTop = 'menu' | 'share' | 'period';
export type SideQuick = 'text' | 'photos' | 'camera';

export interface SidePlan {
  top: SideTop[];
  quick: SideQuick[];
}

const groupHeight = (n: number) => (n ? n * SIDEBAR.button + (n - 1) * SIDEBAR.gap + 2 * SIDEBAR.pad : 0);

/** Height the side bar needs for a plan. */
export function sideBarHeight(plan: SidePlan) {
  return groupHeight(plan.top.length) + SIDEBAR.groupGap + groupHeight(plan.quick.length) + SIDEBAR.margin + SIDEBAR.plus;
}

/** What fits in `avail` points of height (null = too short: keep the header buttons and the floating «+»). */
export function sideBarPlan(avail: number): SidePlan | null {
  const quick: SideQuick[] = ['text', 'photos', 'camera'];
  const tries: SideTop[][] = [['menu', 'share', 'period'], ['menu', 'share'], ['menu']];
  for (const top of tries) {
    const plan = { top, quick };
    if (sideBarHeight(plan) <= avail) return plan;
  }
  return null;
}

/** Distance of the side bar from the right screen edge: clear of the camera strip / safe area. */
export function sideBarRight(insetRight: number) {
  return Math.max(0, insetRight) + SIDEBAR.margin;
}
