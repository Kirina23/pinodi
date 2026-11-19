// Local reminders on iPhone/iPad (modules/snapdo-notify). Without the native module
// (e.g. an old build) everything quietly does nothing.
import { SnapdoNotify, type NativeReminder, type NotifyStatus } from '../../modules/snapdo-notify';

export type { NotifyStatus };

export async function notifyStatus(): Promise<NotifyStatus> {
  try {
    return SnapdoNotify ? await SnapdoNotify.status() : 'undetermined';
  } catch {
    return 'undetermined';
  }
}

/** Shows the system permission dialog (only the first time iOS allows it). */
export async function requestNotify(): Promise<NotifyStatus> {
  try {
    return SnapdoNotify ? await SnapdoNotify.request() : 'denied';
  } catch {
    return 'denied';
  }
}

/** Replace all pending Snapdo reminders with these. */
export async function scheduleReminders(items: NativeReminder[]): Promise<number> {
  try {
    return SnapdoNotify ? await SnapdoNotify.replaceAll(items) : 0;
  } catch (e) {
    console.warn('Reminders not scheduled', e);
    return 0;
  }
}

export async function cancelReminders() {
  try {
    await SnapdoNotify?.cancelAll();
  } catch {
    // nothing to do
  }
}
