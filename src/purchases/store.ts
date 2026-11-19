// Thin wrapper over the native StoreKit module (modules/snapdo-store).
import { SnapdoStore, type NativeProduct } from '../../modules/snapdo-store';

export type Product = NativeProduct;
export type PurchaseOutcome = 'purchased' | 'cancelled' | 'pending' | 'unverified';

export const storeAvailable = () => !!SnapdoStore;

export async function loadProducts(ids: string[]): Promise<Product[]> {
  if (!SnapdoStore) return [];
  return SnapdoStore.getProducts(ids);
}

export async function buy(id: string): Promise<PurchaseOutcome> {
  if (!SnapdoStore) throw new Error('Store unavailable');
  return SnapdoStore.purchase(id);
}

export async function activeIds(): Promise<string[]> {
  if (!SnapdoStore) return [];
  return SnapdoStore.entitlements();
}

export async function restore(): Promise<string[]> {
  if (!SnapdoStore) return [];
  return SnapdoStore.restore();
}

export async function environment(): Promise<string> {
  if (!SnapdoStore) return 'none';
  return SnapdoStore.environment();
}

export function onEntitlements(cb: (ids: string[]) => void) {
  if (!SnapdoStore) return () => {};
  const sub = SnapdoStore.addListener('onEntitlementsChanged', (e) => cb(e.ids || []));
  return () => sub.remove();
}

/** The «Включить Pro» test switch in ☰ exists only on the web stand — never in the iPhone app
 *  (App Store rule 3.1.1: Pro is unlocked only by a real purchase; in TestFlight that purchase is free). */
export const testSwitchAvailable = () => false;
export function setTestPro(_on: boolean) {}
