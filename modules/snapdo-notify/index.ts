// JS side of the local reminders module. On the web stand (and anywhere the native module is
// missing) this is null and src/notify/notify.ts falls back gracefully.
import { requireOptionalNativeModule } from 'expo-modules-core';

export type NotifyStatus = 'granted' | 'denied' | 'undetermined';

export interface NativeReminder {
  id: string;
  title: string;
  body: string;
  /** ms since 1970 */
  at: number;
}

export interface SnapdoNotifyNative {
  status(): Promise<NotifyStatus>;
  request(): Promise<NotifyStatus>;
  replaceAll(items: NativeReminder[]): Promise<number>;
  cancelAll(): Promise<void>;
}

export const SnapdoNotify = requireOptionalNativeModule<SnapdoNotifyNative>('SnapdoNotify');
