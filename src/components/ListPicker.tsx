// "Список" row: shows the chosen list; tapping opens the choices right below
// (iOS-Settings style) instead of the web <select>.
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { t } from '../i18n';
import type { TaskList } from '../model/types';
import { C } from '../theme/tokens';
import { Icon } from './Icon';
import { T, Tap } from './ui';

export function ListPicker({ lists, value, onChange, label, testID }: { lists: TaskList[]; value: string; onChange: (id: string) => void; label: string; testID?: string }) {
  const [open, setOpen] = useState(false);
  const options = [{ id: '', name: t('noList') }, ...lists];
  const current = options.find((o) => o.id === value)?.name || t('noList');
  return (
    <View>
      <View style={styles.row}>
        <Icon name="folder" size={20} />
        <T style={styles.label}>{t('list')}</T>
        <Tap onPress={() => setOpen((o) => !o)} style={styles.value} accessibilityLabel={`${label}: ${current}`} accessibilityState={{ expanded: open }} testID={testID}>
          <T style={styles.valueText} numberOfLines={1}>
            {current}
          </T>
          <Icon name={open ? 'down' : 'right'} size={12} color={C.muted} weight="semibold" />
        </Tap>
      </View>
      {open
        ? options.map((o) => (
            <Tap
              key={o.id || 'none'}
              style={styles.option}
              onPress={() => {
                onChange(o.id);
                setOpen(false);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: o.id === value }}
              testID={`${testID}-opt-${o.id || 'none'}`}
            >
              <T style={[styles.optionText, o.id === value && { fontWeight: '600' }]} numberOfLines={1}>
                {o.name}
              </T>
              {o.id === value ? <Icon name="check" size={17} weight="semibold" /> : null}
            </Tap>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 5, paddingHorizontal: 14, minHeight: 55 },
  label: { fontSize: 14, flex: 1 },
  value: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, maxWidth: 200, paddingLeft: 10 },
  valueText: { fontSize: 14, flexShrink: 1 },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 46, paddingLeft: 46, paddingRight: 16, borderTopWidth: 1, borderTopColor: C.line },
  optionText: { fontSize: 15, flex: 1 },
});
