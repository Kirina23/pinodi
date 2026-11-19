// The one-time discount: after 3 weeks of using Snapdo without Pro, a screen offers a year of Pro
// at a lower price for one hour. The hour is real: it starts once, is saved, and never restarts —
// a timer that resets would be fake urgency, which Apple treats as manipulative (guideline 5.6).
// Pure and tested (tests/offer.test.ts).
import type { Settings } from './types';

export const OFFER_AFTER_DAYS = 21;
export const OFFER_MINUTES = 60;
const DAY = 24 * 60 * 60 * 1000;

export type OfferState = 'none' | 'eligible' | 'active' | 'over';

export function offerState(s: Settings, pro: boolean, now: number): OfferState {
  if (pro) return 'none';
  if (s.offerStartedAt) return now < s.offerStartedAt + OFFER_MINUTES * 60_000 ? 'active' : 'over';
  if (s.firstOpenAt && now - s.firstOpenAt >= OFFER_AFTER_DAYS * DAY) return 'eligible';
  return 'none';
}

/** Milliseconds left in the offer (0 when there is none). */
export function offerLeft(s: Settings, now: number) {
  return s.offerStartedAt ? Math.max(0, s.offerStartedAt + OFFER_MINUTES * 60_000 - now) : 0;
}

/** Whole-percent discount of `offer` against `regular` (0 if it is not cheaper). */
export function discountPercent(regular: number, offer: number) {
  if (!(regular > 0) || !(offer > 0) || offer >= regular) return 0;
  return Math.round((1 - offer / regular) * 100);
}
