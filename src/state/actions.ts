// Flows that touch both the plan and the screen: add, pick files, complete, delete.
import * as Haptics from 'expo-haptics';
import { Linking, Platform } from 'react-native';
import { t } from '../i18n';
import { MAX_PICK } from '../model/constants';
import { addBlockReason, bundleFiles, dueOutside, restoreBlocked } from '../model/logic';
import type { Media, Task } from '../model/types';
import { importAsset } from '../storage/media';
import { pick, type PickKind } from '../storage/pickers';
import { useApp } from './AppState';
import { useUI, type SheetRoute } from './UI';

const COMPLETE_DELAY = 1000; // check → card fades (0.65 s + 0.3 s) → leaves the board

export function haptic(kind: 'light' | 'medium' | 'success' | 'select' = 'light') {
  if (Platform.OS === 'web') return;
  try {
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === 'select') Haptics.selectionAsync();
    else Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

export function useActions() {
  const app = useApp();
  const ui = useUI();

  /** requireCardSpace(): opens Pro when the free limit (or storage) is reached. */
  const requireSpace = (n = 1) => {
    const reason = addBlockReason(app.data, n, app.pro);
    if (reason) {
      ui.openSheet({ name: 'pro', reason });
      return false;
    }
    return true;
  };

  const openAdd = () => {
    if (!requireSpace()) return;
    ui.setLayout(false);
    ui.openSheet({ name: 'add' });
  };

  /** Pick → copy into the app → hand the files over. */
  const pickFiles = async (kind: PickKind, receive: (files: Media[]) => void) => {
    if (kind === 'videos' && !app.pro) {
      ui.openSheet({ name: 'pro', reason: 'video' });
      return;
    }
    let res;
    try {
      res = await pick(kind);
    } catch {
      ui.toast(t('openFailed'));
      return;
    }
    if ('denied' in res) {
      ui.toast(t('cameraDenied'), { label: t('openSettings'), run: () => Linking.openSettings() });
      return;
    }
    if ('cancelled' in res) return;
    const assets = res.assets;
    if (!assets.length) return;
    if (assets.some((a) => a.kind === 'video') && !app.pro) {
      ui.openSheet({ name: 'pro', reason: 'video' });
      return;
    }
    if (assets.length > MAX_PICK) {
      ui.toast(t('max40'));
      return;
    }
    const out: Media[] = [];
    let failed = 0;
    let firstError = '';
    for (let i = 0; i < assets.length; i++) {
      if (assets.length > 1) ui.toast(t('openingN', { i: i + 1, n: assets.length }));
      else if (assets[i].kind !== 'image') ui.toast(t('openingOne'));
      try {
        out.push(await importAsset(assets[i]));
      } catch (e) {
        failed++;
        firstError ||= (e as Error).message;
      }
    }
    ui.hideToast();
    if (out.length) {
      receive(out);
      if (failed) ui.toast(t('addedPartial', { ok: out.length, failed }));
    } else ui.toast(firstError || t('openFailed'));
  };

  /** function newFiles(): several → batch sheet, one → editor. */
  const newFiles = (files: Media[]) => {
    if (files.length > 1) ui.openSheet({ name: 'batch', files });
    else ui.openSheet({ name: 'editor', draft: bundleFiles(files) });
  };

  /** After adding or saving: show the board where the task is visible. */
  const showSaved = (listId: string, due: string) => {
    ui.showBoard(ui.list === 'done' || (ui.list !== 'all' && listId !== ui.list) ? 'all' : ui.list);
    if (due && dueOutside(due, ui.period, ui.anchor)) {
      const [y, m, d] = due.split('-').map(Number);
      ui.setAnchor(new Date(y, m - 1, d, 12));
    }
  };

  /** A text card opens like a note (editable right away); a photo / file task opens its card. */
  const openTask = (id: string) => {
    const task = app.data.tasks.find((x) => x.id === id);
    if (!task) return;
    ui.openSheet(!task.cover && !task.files.length ? { name: 'note', id } : { name: 'detail', id });
  };

  const toggleDone = (id: string, done?: () => void) => {
    const task = app.data.tasks.find((x) => x.id === id);
    if (!task || ui.completing.has(id)) return;
    if (restoreBlocked(app.data, task, app.pro)) {
      ui.openSheet({ name: 'pro', reason: 'limit' });
      return;
    }
    const before = task.done;
    haptic(before ? 'light' : 'success');
    ui.setCompleting(id, true);
    setTimeout(() => {
      app.updateTask(id, { done: !before });
      ui.setCompleting(id, false);
      done?.();
      ui.toast(t(!before ? 'taskDone' : 'taskRestored'), { label: t('undo'), run: () => app.updateTask(id, { done: before }) });
    }, COMPLETE_DELAY);
  };

  const deleteTask = (id: string) => {
    const undo = app.deleteTask(id);
    ui.closeAll();
    ui.toast(t('taskDeleted'), { label: t('bringBack'), run: undo });
  };

  const shareTasks = (items: Task[], title: string, back?: SheetRoute) => {
    if (!items.length) {
      ui.toast(t('addFirst'));
      return;
    }
    ui.openSheet({ name: 'share', ids: items.map((x) => x.id), title, back });
  };

  return { requireSpace, openAdd, pickFiles, newFiles, showSaved, openTask, toggleDone, deleteTask, shareTasks };
}
