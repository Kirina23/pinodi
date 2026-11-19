// The plan (tasks + lists) and Pro status, shared with the whole app.
// Every change is saved to disk right away (debounced by a frame or two).
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getLang } from '../i18n';
import { normaliseData, referencedUris, reorder as reorderTasks, stepSize, todayNoon, uid } from '../model/logic';
import { seedData } from '../model/seed';
import type { AppData, Settings, Task, TaskList } from '../model/types';
import { collectGarbage } from '../storage/media';
import { loadRaw, saveRaw } from '../storage/persist';
import { DEMO_PRO_ENABLED, PRODUCT_IDS } from '../purchases/config';
import { activeIds, onEntitlements } from '../purchases/store';

interface AppState {
  ready: boolean;
  data: AppData;
  saveFailed: boolean;
  pro: boolean;
  setPro(ids: string[]): void;
  addTasks(tasks: Task[]): void;
  updateTask(id: string, patch: Partial<Task>): void;
  deleteTask(id: string): () => void;
  moveTask(id: string, targetId: string, after: boolean): void;
  sizeTask(id: string, step: number): void;
  addList(name: string): string;
  renameList(id: string, name: string): void;
  deleteList(id: string): () => void;
  clearExamples(): () => void;
  /** Change app settings (main board name, reminders, offer…). */
  updateSettings(patch: Partial<Settings>): void;
}

const EMPTY: AppData = { version: 1, lists: [], tasks: [], settings: {} };
const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [data, setDataState] = useState<AppData>(EMPTY);
  const [ready, setReady] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [pro, setProState] = useState(DEMO_PRO_ENABLED);
  const dataRef = useRef(data);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());

  const persist = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const snapshot = dataRef.current;
      chain.current = chain.current
        .catch(() => {})
        .then(() => saveRaw(snapshot))
        .then(() => setSaveFailed(false))
        .catch((e) => {
          console.warn('Save failed', e);
          setSaveFailed(true);
        });
    }, 120);
  }, []);

  const update = useCallback(
    (fn: (d: AppData) => AppData) => {
      const next = fn(dataRef.current);
      if (next === dataRef.current) return;
      dataRef.current = next;
      setDataState(next);
      persist();
    },
    [persist],
  );

  // Load once.
  useEffect(() => {
    let alive = true;
    (async () => {
      const raw = await loadRaw().catch(() => null);
      let loaded = normaliseData(raw) || seedData(todayNoon(), getLang());
      if (!alive) return;
      // Remember the first launch (the discount offer comes after 3 weeks of use).
      const firstRun = !loaded.settings.firstOpenAt;
      if (firstRun) loaded = { ...loaded, settings: { ...loaded.settings, firstOpenAt: Date.now() } };
      dataRef.current = loaded;
      setDataState(loaded);
      if (loaded.settings.proCache) setProState(true);
      setReady(true);
      if (!raw || firstRun) persist();
      // Clean up files of tasks deleted in earlier sessions.
      setTimeout(() => collectGarbage(referencedUris(loaded)), 1500);
    })();
    return () => {
      alive = false;
    };
  }, [persist]);

  const setPro = useCallback(
    (ids: string[]) => {
      const on = DEMO_PRO_ENABLED || ids.some((id) => PRODUCT_IDS.includes(id));
      setProState(on);
      update((d) => (d.settings.proCache === on ? d : { ...d, settings: { ...d.settings, proCache: on } }));
    },
    [update],
  );

  // Ask StoreKit what is active, and listen for renewals / refunds / purchases elsewhere.
  useEffect(() => {
    if (!ready) return;
    activeIds().then(setPro).catch(() => {});
    return onEntitlements(setPro);
  }, [ready, setPro]);

  const api = useMemo<AppState>(
    () => ({
      ready,
      data,
      saveFailed,
      pro,
      setPro,
      addTasks: (tasks) => update((d) => ({ ...d, tasks: [...tasks, ...d.tasks] })),
      updateTask: (id, patch) => update((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteTask: (id) => {
        const d0 = dataRef.current;
        const index = d0.tasks.findIndex((x) => x.id === id);
        if (index < 0) return () => {};
        const removed = d0.tasks[index];
        update((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== id) }));
        return () =>
          update((d) => {
            if (d.tasks.some((x) => x.id === id)) return d;
            const tasks = d.tasks.slice();
            tasks.splice(Math.min(index, tasks.length), 0, removed);
            return { ...d, tasks };
          });
      },
      moveTask: (id, targetId, after) => update((d) => ({ ...d, tasks: reorderTasks(d.tasks, id, targetId, after) })),
      sizeTask: (id, step) => update((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === id ? { ...x, size: stepSize(x.size, step) } : x)) })),
      addList: (name) => {
        const id = uid();
        update((d) => ({ ...d, lists: [...d.lists, { id, name }] }));
        return id;
      },
      renameList: (id, name) => update((d) => ({ ...d, lists: d.lists.map((l) => (l.id === id ? { ...l, name } : l)) })),
      deleteList: (id) => {
        const d0 = dataRef.current;
        const index = d0.lists.findIndex((l) => l.id === id);
        if (index < 0) return () => {};
        const list: TaskList = d0.lists[index];
        const members = new Set(d0.tasks.filter((x) => x.listId === id).map((x) => x.id));
        update((d) => ({ ...d, lists: d.lists.filter((l) => l.id !== id), tasks: d.tasks.map((x) => (x.listId === id ? { ...x, listId: '' } : x)) }));
        return () =>
          update((d) => {
            const lists = d.lists.slice();
            lists.splice(Math.min(index, lists.length), 0, list);
            return { ...d, lists, tasks: d.tasks.map((x) => (members.has(x.id) && !x.listId ? { ...x, listId: id } : x)) };
          });
      },
      updateSettings: (patch) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
      clearExamples: () => {
        const before = dataRef.current.tasks;
        update((d) => ({ ...d, tasks: d.tasks.filter((x) => !x.demo) }));
        // Undo puts the examples back where they were; tasks added in the meantime stay on top.
        return () =>
          update((d) => {
            const known = new Set(before.map((x) => x.id));
            const added = d.tasks.filter((x) => !known.has(x.id));
            const restored = before.filter((x) => x.demo || d.tasks.some((y) => y.id === x.id)).map((x) => d.tasks.find((y) => y.id === x.id) || x);
            return { ...d, tasks: [...added, ...restored] };
          });
      },
    }),
    [ready, data, saveFailed, pro, setPro, update],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside provider');
  return v;
}
