// Web stand only: example prices so the paywall can be checked by eye. Never in the iPhone build.
import type { NativeProduct } from '../../modules/snapdo-store';
import { PRODUCT_MONTHLY, PRODUCT_YEARLY, PRODUCT_YEARLY_OFFER } from './config';

export type Product = NativeProduct;
export type PurchaseOutcome = 'purchased' | 'cancelled' | 'pending' | 'unverified';

const MOCK: Product[] = [
  { id: PRODUCT_YEARLY, displayName: 'Pinodi Pro', displayPrice: '1 490 ₽', price: 1490, period: 'year', periodCount: 1, monthlyPrice: '124 ₽', trialDays: 7 },
  { id: PRODUCT_MONTHLY, displayName: 'Pinodi Pro', displayPrice: '249 ₽', price: 249, period: 'month', periodCount: 1 },
  { id: PRODUCT_YEARLY_OFFER, displayName: 'Pinodi Pro', displayPrice: '745 ₽', price: 745, period: 'year', periodCount: 1, monthlyPrice: '62 ₽' },
];
// Remembered in this browser, so Pro survives a reload of the stand.
const KEY = 'snapdo-stand-pro';
let owned: string[] = (() => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
})();
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(owned));
  } catch {}
};
const listeners = new Set<(ids: string[]) => void>();

export const storeAvailable = () => true;
export async function loadProducts(ids: string[]) {
  return MOCK.filter((p) => ids.includes(p.id));
}
export async function buy(id: string): Promise<PurchaseOutcome> {
  owned = [id];
  save();
  listeners.forEach((l) => l(owned));
  return 'purchased';
}
export async function activeIds() {
  return owned;
}
export async function restore() {
  return owned;
}
export async function environment() {
  return 'Stand';
}
export function onEntitlements(cb: (ids: string[]) => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Stand only: «Включить Pro» / «Выключить Pro» in ☰, to try the app with and without Pro. */
export const testSwitchAvailable = () => true;
export function setTestPro(on: boolean) {
  owned = on ? [PRODUCT_YEARLY] : [];
  save();
  listeners.forEach((l) => l(owned));
}
