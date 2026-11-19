// Reminders: the settings sheet (☰ → Уведомления) and the one-time gentle question that comes
// after the first own task — before iOS shows its own "Allow notifications?" dialog
// (Apple recommends explaining first). Reminders are rare: at most one message a day.
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Switch, View } from 'react-native';
import { Btn, SheetTitle, T, Tap } from '../components/ui';
import { t } from '../i18n';
import { DEFAULT_NOTIFY } from '../model/reminders';
import type { NotifySettings } from '../model/types';
import { notifyStatus, requestNotify, type NotifyStatus } from '../notify/notify';
import { useApp } from '../state/AppState';
import { useUI } from '../state/UI';
import { C } from '../theme/tokens';

const HOURS = [7, 8, 9, 10, 12];

export function NotifySheet() {
  const ui = useUI();
  const app = useApp();
  const [status, setStatus] = useState<NotifyStatus | null>(null);
  const s: NotifySettings = app.data.settings.notify ?? DEFAULT_NOTIFY;

  useEffect(() => {
    let alive = true;
    notifyStatus().then((v) => alive && setStatus(v));
    return () => {
      alive = false;
    };
  }, []);

  const enable = async () => {
    const v = await requestNotify();
    setStatus(v);
    app.updateSettings({ notifyAsked: true, notify: s });
    if (v === 'granted') ui.toast(t('notifyOn'));
  };

  const set = async (patch: Partial<NotifySettings>) => {
    // Turning something on before iOS was asked: ask now.
    if (status === 'undetermined' && Object.values(patch).some((v) => v === true)) {
      const v = await requestNotify();
      setStatus(v);
    }
    app.updateSettings({ notify: { ...s, ...patch }, notifyAsked: true });
  };

  // The whole row (64 pt) toggles, not only the small switch.
  const row = (key: 'today' | 'nudge' | 'weekly', label: string, note: string, first?: boolean) => (
    <Tap
      style={[styles.row, !first && styles.sep]}
      onPress={() => set({ [key]: !s[key] })}
      disabled={status === 'denied'}
      accessibilityRole="switch"
      accessibilityState={{ checked: s[key], disabled: status === 'denied' }}
      aria-checked={s[key]}
      accessibilityLabel={`${label}. ${note}`}
      testID={`notify-${key}`}
    >
      <View style={{ flex: 1 }}>
        <T style={styles.label}>{label}</T>
        <T style={styles.note}>{note}</T>
      </View>
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Switch
          value={s[key]}
          disabled={status === 'denied'}
          trackColor={{ true: C.ink, false: '#d9d6cd' }}
          thumbColor="#ffffff"
          {...({ activeThumbColor: '#ffffff' } as object)}
          ios_backgroundColor="#d9d6cd"
          testID={`switch-${key}`}
        />
      </View>
    </Tap>
  );

  return (
    <View>
      <SheetTitle title={t('notifications')} onClose={ui.closeSheet} closeLabel={t('close')} />
      {status === 'denied' ? (
        <View style={styles.banner} testID="notify-denied">
          <T style={styles.bannerText}>{t('notifyDenied')}</T>
          <Btn kind="secondary" title={t('openSettings')} onPress={() => Linking.openSettings()} style={{ marginTop: 10 }} testID="notify-settings" />
        </View>
      ) : status === 'undetermined' ? (
        <Btn title={t('notifyEnable')} onPress={enable} style={{ marginBottom: 16 }} testID="notify-enable" />
      ) : null}

      <View style={[styles.group, status === 'denied' && { opacity: 0.5 }]}>
        {row('today', t('notifyToday'), t('notifyTodayNote'), true)}
        {row('nudge', t('notifyNudge'), t('notifyNudgeNote'))}
        {row('weekly', t('notifyWeekly'), t('notifyWeeklyNote'))}
      </View>

      {s.today ? (
        <>
          <T style={styles.caption}>{t('notifyTime')}</T>
          <View style={styles.hours} accessibilityRole="radiogroup">
            {HOURS.map((h) => {
              const on = s.hour === h;
              return (
                <Tap key={h} onPress={() => set({ hour: h })} style={[styles.hour, on && styles.hourOn]} accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={`${h}:00`} testID={`notify-hour-${h}`}>
                  <T style={[styles.hourText, on && { color: C.bg }]}>{`${h}:00`}</T>
                </Tap>
              );
            })}
          </View>
        </>
      ) : null}
      <T style={styles.footer}>{t('notifyRare')}</T>
    </View>
  );
}

/** Shown once, after the first own task: explain, then let iOS ask. */
export function NotifyAskSheet() {
  const ui = useUI();
  const app = useApp();
  const yes = async () => {
    const v = await requestNotify();
    app.updateSettings({ notifyAsked: true, notify: app.data.settings.notify ?? DEFAULT_NOTIFY });
    ui.closeAll();
    if (v === 'granted') ui.toast(t('notifyOn'));
  };
  const no = () => {
    app.updateSettings({ notifyAsked: true });
    ui.closeAll();
  };
  return (
    <View>
      <SheetTitle title={t('notifyAskTitle')} onClose={no} closeLabel={t('close')} />
      <T style={styles.askText}>{t('notifyAskText')}</T>
      <Btn title={t('notifyAskYes')} onPress={yes} testID="notify-ask-yes" />
      <Btn kind="quiet" title={t('notifyAskNo')} onPress={no} style={{ marginTop: 6 }} testID="notify-ask-no" />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { borderWidth: 1, borderColor: C.line, borderRadius: 16, backgroundColor: C.card, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 11, paddingHorizontal: 14 },
  sep: { borderTopWidth: 1, borderTopColor: C.line },
  label: { fontSize: 16 },
  note: { fontSize: 12, lineHeight: 16, color: C.muted, marginTop: 2 },
  caption: { fontSize: 12, color: C.muted, marginTop: 18, marginBottom: 8, marginHorizontal: 3 },
  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hour: { minHeight: 44, minWidth: 60, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
  hourOn: { backgroundColor: C.ink },
  hourText: { fontSize: 14, fontWeight: '500' },
  footer: { fontSize: 12, lineHeight: 17, color: C.muted, textAlign: 'center', marginTop: 18 },
  banner: { backgroundColor: '#fff1cc', borderRadius: 14, padding: 14, marginBottom: 16 },
  bannerText: { fontSize: 13, lineHeight: 19, color: '#5e4c24' },
  askText: { fontSize: 15, lineHeight: 22, color: C.muted, marginBottom: 20 },
});
