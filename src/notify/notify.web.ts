// Web stand only: a pretend notification centre, so the settings can be tried in the browser.
// The planned reminders are kept in window.__SNAPDO_REMINDERS__ for the stand's checks.
import type { NativeReminder, NotifyStatus } from '../../modules/snapdo-notify';

export type { NotifyStatus };

const KEY = 'snapdo-stand-notify';
const g = globalThis as unknown as { __SNAPDO_REMINDERS__?: NativeReminder[]; localStorage?: Storage };

function read(): NotifyStatus {
  try {
    const v = g.localStorage?.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : 'undetermined';
  } catch {
    return 'undetermined';
  }
}

export async function notifyStatus(): Promise<NotifyStatus> {
  return read();
}

export async function requestNotify(): Promise<NotifyStatus> {
  if (read() === 'undetermined') {
    try {
      g.localStorage?.setItem(KEY, 'granted');
    } catch {
      // private mode: stays undetermined
    }
  }
  return read() === 'undetermined' ? 'granted' : read();
}

export async function scheduleReminders(items: NativeReminder[]) {
  g.__SNAPDO_REMINDERS__ = items.filter((x) => x.at > Date.now());
  return g.__SNAPDO_REMINDERS__.length;
}

export async function cancelReminders() {
  g.__SNAPDO_REMINDERS__ = [];
}
