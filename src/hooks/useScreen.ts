// Window size, safe areas (one edge at a time!), breakpoints from the prototype's CSS,
// and the iPhone Duo fold.
import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useReservedRegions } from 'react-native-reserved-regions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface Fold {
  /** vertical = "book" (left|right halves), horizontal = "laptop" (top|bottom halves) */
  dir: 'vertical' | 'horizontal';
  x: number;
  y: number;
  width: number;
  height: number;
}

type Frame = { x: number; y: number; width: number; height: number };

// Web stand only: window.__SNAPDO_FOLD__ = {x,y,width,height}; dispatchEvent(new Event('snapdofold'))
function readWebFold(): Frame | null {
  const g = globalThis as { __SNAPDO_FOLD__?: Frame | null };
  return Platform.OS === 'web' && g.__SNAPDO_FOLD__ ? g.__SNAPDO_FOLD__ : null;
}

export function useFold(): Fold | null {
  const regions = useReservedRegions();
  const [webFold, setWebFold] = useState<Frame | null>(readWebFold);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const on = () => setWebFold(readWebFold());
    window.addEventListener('snapdofold', on);
    return () => window.removeEventListener('snapdofold', on);
  }, []);
  const division = regions.find((r) => r.kind === 'division');
  const f: Frame | null = division ? division.frame : webFold;
  if (!f || f.width <= 0 || f.height <= 0) return null;
  return { dir: f.height > f.width ? 'vertical' : 'horizontal', ...f };
}

export interface Screen {
  width: number;
  height: number;
  insets: { top: number; left: number; bottom: number; right: number };
  /** @media (min-width:700px) and (min-height:650px) — iPad, iPhone Duo inner screen landscape */
  wide: boolean;
  /** @media (min-width:500px) and (max-height:650px) — iPhone in landscape */
  short: boolean;
  /** @media (max-width:350px) */
  narrow: boolean;
  /**
   * "Board" layout (iPad, iPhone Duo): no bottom tab bar — lists open from the title,
   * "+" floats bottom-right, actions stay top-right. iPhones keep the prototype's tab bar.
   */
  board: boolean;
  /** iPhone Duo (inner or outer display): controls along the side. */
  duo: boolean;
  /** iPhone Duo inner display: even number of columns in landscape. */
  duoInner: boolean;
  /** Content column: centred, at most 940 (wide) / 1100 (short) points. */
  appLeft: number;
  appWidth: number;
  /** Side paddings of header and board: max(20, safe-area) — each side on its own. */
  padLeft: number;
  padRight: number;
  fold: Fold | null;
}

export function useScreen(): Screen {
  const { width, height } = useWindowDimensions();
  const ins = useSafeAreaInsets();
  const fold = useFold();
  const wide = width >= 700 && height >= 650;
  const short = !wide && width >= 500 && height <= 650;
  const narrow = width <= 350;
  // iPhone Duo: the camera strip makes one side inset large and the other zero.
  const sideStrip = (ins.right >= 60 && ins.left < 20) || (ins.left >= 60 && ins.right < 20);
  const regular = width >= 600 && height >= 600;
  // iPhone Duo outer display: almost square (≈1.45), unlike any iPhone (≥1.78). In landscape
  // its camera strip runs along the top, so the side-inset test above doesn't catch it.
  const outerDuo = Math.min(width, height) < 500 && Math.max(width, height) / Math.min(width, height) < 1.6;
  const board = regular || sideStrip || outerDuo;
  const duo = sideStrip || outerDuo || !!fold || (regular && Math.min(width, height) < 700);
  /** iPhone Duo inner display (it has a fold, so grids use an even number of columns). */
  const duoInner = duo && regular;
  const max = board ? 1400 : wide ? 940 : short ? 1100 : width;
  const appWidth = Math.min(width, max);
  const appLeft = Math.round((width - appWidth) / 2);
  const base = narrow ? 15 : board && !duo ? 24 : 20;
  // Safe areas only matter where the column touches the screen edge.
  const padLeft = Math.max(base, ins.left - appLeft);
  const padRight = Math.max(base, ins.right - (width - appLeft - appWidth));
  return {
    width,
    height,
    insets: { top: ins.top, left: ins.left, bottom: ins.bottom, right: ins.right },
    wide,
    short,
    narrow,
    board,
    duo,
    duoInner,
    appLeft,
    appWidth,
    padLeft,
    padRight,
    fold,
  };
}
