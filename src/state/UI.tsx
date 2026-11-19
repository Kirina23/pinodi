// What is on screen: list, period, layout mode, the open sheet, the photo viewer,
// the long-press menu, the one-time offer screen and the toast.
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { LimitReason } from '../model/logic';
import { todayNoon } from '../model/logic';
import type { ListFilter, Media, Period } from '../model/types';

export type ProReason = 'info' | 'video' | Exclude<LimitReason, null>;

export interface EditorDraft {
  cover: Media | null;
  files: Media[];
  due?: string;
  listId?: string;
}

export type SheetRoute = (
  | { name: 'add' }
  | { name: 'editor'; id?: string; draft?: EditorDraft; text?: boolean }
  | { name: 'batch'; files: Media[] }
  | { name: 'detail'; id: string }
  | { name: 'note'; id: string }
  | { name: 'cardMenu'; id: string }
  | { name: 'menu' }
  | { name: 'period' }
  | { name: 'notify' }
  | { name: 'notifyAsk' }
  | { name: 'listForm'; id?: string }
  | { name: 'share'; ids: string[]; title: string }
  | { name: 'pro'; reason: ProReason }
  | { name: 'video'; media: Media; title: string }
) & { back?: SheetRoute };

export interface ToastState {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
}

export interface ViewerState {
  media: Media;
  title: string;
}

export interface CtxMenuState {
  id: string;
  /** Card rectangle on screen when the long press started. */
  rect: { x: number; y: number; width: number; height: number };
}

interface UIState {
  list: ListFilter;
  period: Period;
  anchor: Date;
  layout: boolean;
  sheet: SheetRoute | null;
  toastState: ToastState | null;
  viewer: ViewerState | null;
  ctx: CtxMenuState | null;
  /** Ids of cards playing the "completed" fade-out. */
  completing: Set<string>;
  /** The one-time discount screen is open. */
  offer: boolean;
  openOffer(): void;
  closeOffer(): void;
  openList(id: ListFilter): void;
  setPeriod(p: Period): void;
  setAnchor(d: Date): void;
  setLayout(on: boolean): void;
  openSheet(r: SheetRoute): void;
  /** Close the sheet, or go back to the sheet it was opened from. */
  closeSheet(): void;
  /** Close the sheet without going back. */
  closeAll(): void;
  /** Show the board with this list, keeping the period. */
  showBoard(list: ListFilter): void;
  toast(message: string, action?: { label: string; run: () => void }): void;
  hideToast(): void;
  openViewer(v: ViewerState): void;
  closeViewer(): void;
  openCtx(c: CtxMenuState): void;
  closeCtx(): void;
  setCompleting(id: string, on: boolean): void;
}

const Ctx = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<ListFilter>('all');
  const [period, setPeriodState] = useState<Period>('all');
  const [anchor, setAnchor] = useState<Date>(todayNoon);
  const [layout, setLayout] = useState(false);
  const [sheet, setSheet] = useState<SheetRoute | null>(null);
  const [toastState, setToast] = useState<ToastState | null>(null);
  const [viewer, setViewer] = useState<ViewerState | null>(null);
  const [ctx, setCtx] = useState<CtxMenuState | null>(null);
  const [completing, setCompletingSet] = useState<Set<string>>(() => new Set());
  const [offer, setOffer] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastSeq = useRef(0);

  const hideToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  // #toast: 3 s, or 6.5 s when it has an "Undo" button.
  const toast = useCallback((message: string, action?: { label: string; run: () => void }) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    const id = ++toastSeq.current;
    setToast({ id, message, action });
    toastTimer.current = setTimeout(() => setToast((t) => (t?.id === id ? null : t)), action ? 6500 : 3000);
  }, []);

  const closeSheet = useCallback(() => {
    setSheet((r) => r?.back ?? null);
  }, []);

  const value = useMemo<UIState>(
    () => ({
      list,
      period,
      anchor,
      layout,
      sheet,
      toastState,
      viewer,
      ctx,
      completing,
      offer,
      openOffer: () => {
        setSheet(null);
        setOffer(true);
      },
      closeOffer: () => setOffer(false),
      openList: (id) => {
        setList(id);
        setPeriodState('all');
        setLayout(false);
      },
      setPeriod: (p) => {
        setPeriodState(p);
        setAnchor(todayNoon());
        setLayout(false);
      },
      setAnchor,
      setLayout,
      openSheet: (r) => setSheet(r),
      closeSheet,
      closeAll: () => setSheet(null),
      showBoard: (l) => {
        setList(l);
        setLayout(false);
      },
      toast,
      hideToast,
      openViewer: setViewer,
      closeViewer: () => setViewer(null),
      openCtx: (c) => {
        hideToast();
        setCtx(c);
      },
      closeCtx: () => setCtx(null),
      setCompleting: (id, on) =>
        setCompletingSet((s) => {
          const n = new Set(s);
          if (on) n.add(id);
          else n.delete(id);
          return n;
        }),
    }),
    [list, period, anchor, layout, sheet, toastState, viewer, ctx, completing, offer, closeSheet, toast, hideToast],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUI() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useUI outside provider');
  return v;
}
