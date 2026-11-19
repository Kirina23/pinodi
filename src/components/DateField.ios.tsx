// iPhone: Apple's compact date picker (the grey date button that opens a calendar).
import DateTimePicker from '@react-native-community/datetimepicker';
import { iso, parseISO } from '../i18n/format';
import { C } from '../theme/tokens';

export function DateField({ value, onChange, label, lang, testID }: { value: string; onChange: (v: string) => void; label: string; lang: string; testID?: string }) {
  return (
    <DateTimePicker
      testID={testID}
      accessibilityLabel={label}
      value={value ? parseISO(value) : new Date()}
      mode="date"
      display="compact"
      locale={lang === 'ru' ? 'ru-RU' : 'en-US'}
      accentColor={C.ink}
      themeVariant="light"
      onValueChange={(_e, d) => {
        if (d) onChange(iso(d));
      }}
    />
  );
}
