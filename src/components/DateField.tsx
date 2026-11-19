// Web stand: looks like the iOS compact date button ("4 нояб. 2026 г."), with a real
// <input type="date"> laid over it so it can be changed.
import { View } from 'react-native';
import { parseISO, shortDate } from '../i18n/format';
import { C } from '../theme/tokens';
import { T } from './ui';
import { createElement } from 'react';

export function DateField({ value, onChange, label, lang, testID }: { value: string; onChange: (v: string) => void; label: string; lang: string; testID?: string }) {
  const d = parseISO(value);
  const text = lang === 'ru' ? `${shortDate(d, 'ru')} ${d.getFullYear()} г.` : `${shortDate(d, 'en')}, ${d.getFullYear()}`;
  return (
    <View testID={testID} style={{ position: 'relative', backgroundColor: 'rgba(118,118,128,0.12)', borderRadius: 7, paddingHorizontal: 11, minHeight: 34, justifyContent: 'center' }}>
      <T style={{ fontSize: 16, color: C.ink }}>{text}</T>
      {createElement('input', {
        type: 'date',
        value,
        'aria-label': label,
        'data-testid': testID ? `${testID}-input` : undefined,
        onChange: (e: { target: { value: string } }) => e.target.value && onChange(e.target.value),
        style: { position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', border: 0, cursor: 'pointer' },
      })}
    </View>
  );
}
