// Web stand: safe areas of the simulated device (from the address), so iframes in the HTML
// stand lay out exactly like the real phone.
import type { ReactNode } from 'react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { standInsets } from '../stand';

export function StandInsets({ children }: { children: ReactNode }) {
  const ins = standInsets();
  if (!ins) return children;
  return <SafeAreaInsetsContext.Provider value={ins}>{children}</SafeAreaInsetsContext.Provider>;
}
