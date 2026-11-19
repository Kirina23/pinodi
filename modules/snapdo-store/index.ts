// JS side of the local StoreKit module. On the web stand (and anywhere the native
// module is missing) this is null and src/purchases/store.ts falls back gracefully.
import { requireOptionalNativeModule, type EventSubscription } from 'expo-modules-core';

export interface NativeProduct {
  id: string;
  displayName: string;
  displayPrice: string;
  price: number;
  period?: 'day' | 'week' | 'month' | 'year' | 'unknown';
  periodCount?: number;
  monthlyPrice?: string;
  trialDays?: number;
}

export interface SnapdoStoreNative {
  getProducts(ids: string[]): Promise<NativeProduct[]>;
  purchase(id: string): Promise<'purchased' | 'cancelled' | 'pending' | 'unverified'>;
  entitlements(): Promise<string[]>;
  restore(): Promise<string[]>;
  environment(): Promise<string>;
  addListener(event: 'onEntitlementsChanged', cb: (e: { ids: string[] }) => void): EventSubscription;
}

export const SnapdoStore = requireOptionalNativeModule<SnapdoStoreNative>('SnapdoStore');
