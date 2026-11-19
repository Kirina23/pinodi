// ☰ menu, "Период" and the name form (lists and the main board).
import * as Application from 'expo-application';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '../components/Icon';
import { ActionRow, Btn, Field, IconButton, SheetTitle, T } from '../components/ui';
import { getLang, t } from '../i18n';
import { FREE_CARD_LIMIT } from '../model/constants';
import { activeCount, pageTitle, rangeText, shiftAnchor, todayNoon } from '../model/logic';
import { DEFAULT_NOTIFY } from '../model/reminders';
import { notifyStatus, type NotifyStatus } from '../notify/notify';
import type { Period } from '../model/types';
import { setTestPro, testSwitchAvailable } from '../purchases/store';
import { useApp } from '../state/AppState';
import { useUI } from '../state/UI';
import { ListGroups } from '../screens/Main';
import { C } from '../theme/tokens';

// ☰ — one menu for everything that is not the board itself: the lists (switch, create),
// this board (rename, period, card size, delete list, remove examples) and settings
// (reminders, Pro). Same on iPhone, iPad and iPhone Duo.
export function MenuSheet() {
  const ui = useUI();
  const app = useApp();
  const lang = getLang();
  const custom = ui.list !== 'all' && ui.list !== 'done' && app.data.lists.some((l) => l.id === ui.list);
  const hasDemo = ui.list === 'all' && app.data.tasks.some((x) => x.demo);
  const version = Application.nativeApplicationVersion || '1.0.0';
  const build = Application.nativeBuildVersion || '1';
  const [status, setStatus] = useState<NotifyStatus | null>(null);
  useEffect(() => {
    let alive = true;
    notifyStatus().then((v) => alive && setStatus(v));
    return () => {
      alive = false;
    };
  }, []);
  const n = app.data.settings.notify ?? DEFAULT_NOTIFY;
  const remindersOn = status === 'granted' && (n.today || n.nudge || n.weekly);
  let first = true;
  const isFirst = () => {
    const f = first;
    first = false;
    return f;
  };
  return (
    <View>
      <SheetTitle title={t('menu')} onClose={ui.closeSheet} closeLabel={t('close')} />
      <ListGroups
        current={ui.list}
        onPick={(id) => {
          ui.openList(id);
          ui.closeAll();
        }}
      />

      <T style={styles.section} numberOfLines={1}>
        {`${t('thisBoard')} · ${pageTitle(app.data, ui.list, lang)}`}
      </T>
      {ui.list === 'all' || custom ? <ActionRow first={isFirst()} icon="pencil" label={t('renameBoard')} onPress={() => ui.openSheet({ name: 'listForm', id: ui.list, back: { name: 'menu' } })} testID="menu-rename" /> : null}
      {ui.list !== 'done' ? <ActionRow first={isFirst()} icon="calendar" label={t('period')} note={ui.period === 'all' ? t('anyTime') : rangeText(ui.period, ui.anchor, lang)} onPress={() => ui.openSheet({ name: 'period', back: { name: 'menu' } })} testID="menu-period" /> : null}
      <ActionRow
        first={isFirst()}
        icon="resize"
        label={t('cardSize')}
        onPress={() => {
          ui.closeAll();
          ui.setLayout(true);
        }}
        testID="menu-size"
      />
      {custom ? (
        <ActionRow
          icon="folderMinus"
          label={t('deleteList')}
          danger
          onPress={() => {
            const undo = app.deleteList(ui.list);
            ui.closeAll();
            ui.openList('all');
            ui.toast(t('listDeleted'), { label: t('bringBack'), run: undo });
          }}
          testID="menu-delete-list"
        />
      ) : null}
      {hasDemo ? (
        <ActionRow
          icon="trash"
          label={t('removeExamples')}
          onPress={() => {
            const undo = app.clearExamples();
            ui.closeAll();
            ui.toast(t('examplesRemoved'), { label: t('bringBack'), run: undo });
          }}
          testID="menu-examples"
        />
      ) : null}

      <T style={styles.section}>{t('settingsSection')}</T>
      <ActionRow first icon="bell" label={t('notifications')} note={status === null ? undefined : remindersOn ? t('on') : t('off')} onPress={() => ui.openSheet({ name: 'notify', back: { name: 'menu' } })} testID="menu-notify" />
      <ActionRow icon="infinity" label={t('proName')} note={app.pro ? 'Pro' : `${activeCount(app.data)} / ${FREE_CARD_LIMIT}`} onPress={() => ui.openSheet({ name: 'pro', reason: 'info' })} testID="menu-pro" />
      {/* Web stand only (never in the iPhone app): try the app with and without Pro. */}
      {testSwitchAvailable() ? (
        <ActionRow
          icon="infinity"
          label={app.pro ? t('testProOff') : t('testProOn')}
          note={t('testProNote')}
          onPress={() => {
            setTestPro(!app.pro);
            ui.toast(app.pro ? t('testProOffDone') : t('testProOnDone'));
          }}
          testID="menu-test-pro"
        />
      ) : null}
      <T style={styles.version} testID="version">
        {t('versionLabel', { v: version, b: build })}
      </T>
    </View>
  );
}

export function PeriodSheet() {
  const ui = useUI();
  const lang = getLang();
  const options: [Period, string][] = [
    ['all', t('anyTime')],
    ['week', t('week')],
    ['month', t('month')],
  ];
  return (
    <View>
      <SheetTitle title={t('period')} onClose={ui.closeSheet} closeLabel={t('close')} />
      {options.map(([value, label], i) => (
        <ActionRow
          key={value}
          first={i === 0}
          icon={value === 'all' ? 'tasks' : 'calendar'}
          label={label}
          selected={ui.period === value}
          right={ui.period === value ? <Icon name="check" size={19} weight="semibold" /> : <View style={{ width: 19 }} />}
          onPress={() => {
            ui.setPeriod(value);
            ui.closeAll();
          }}
          testID={`period-${value}`}
        />
      ))}
      {ui.period !== 'all' ? (
        <>
          <View style={styles.range}>
            <IconButton icon="left" label={t('prevPeriod')} onPress={() => ui.setAnchor(shiftAnchor(ui.period, ui.anchor, -1))} testID="period-prev" />
            <T style={styles.rangeText} testID="period-range">
              {rangeText(ui.period, ui.anchor, lang)}
            </T>
            <IconButton icon="right" label={t('nextPeriod')} onPress={() => ui.setAnchor(shiftAnchor(ui.period, ui.anchor, 1))} testID="period-next" />
          </View>
          <Btn kind="quiet" title={t('currentPeriod')} onPress={() => ui.setAnchor(todayNoon())} testID="period-current" />
        </>
      ) : null}
    </View>
  );
}

export function ListFormSheet({ id }: { id?: string }) {
  const ui = useUI();
  const app = useApp();
  const lang = getLang();
  // id 'all' = the main board: its own name instead of "Задачи" (e.g. "Задачи на неделю").
  const main = id === 'all';
  const list = id && !main ? app.data.lists.find((l) => l.id === id) : undefined;
  const [name, setName] = useState(main ? app.data.settings.allTitle ?? '' : list?.name ?? '');
  const submit = () => {
    const v = name.trim();
    if (main) {
      app.updateSettings({ allTitle: v || undefined });
      ui.closeAll();
      ui.toast(t('boardRenamed'));
      return;
    }
    if (!v) return;
    if (list) app.renameList(list.id, v);
    else app.addList(v);
    ui.closeAll();
    ui.toast(t(list ? 'listRenamed' : 'listCreated'));
  };
  return (
    <View>
      <SheetTitle title={main ? t('boardNameTitle') : list ? t('listNameTitle') : t('newList')} onClose={ui.closeSheet} closeLabel={t('close')} />
      <Field label={t('nameLabel')} value={name} onChangeText={setName} placeholder={main ? t('tasks') : t('listPlaceholder')} maxLength={50} autoFocus returnKeyType="done" onSubmitEditing={submit} testID="list-name" />
      {main ? <T style={styles.hint}>{t('boardNameHint')}</T> : null}
      <Btn title={list || main ? t('save') : t('create')} onPress={submit} disabled={!main && !name.trim()} testID="list-submit" />
      {main && app.data.settings.allTitle ? (
        <Btn
          kind="quiet"
          title={t('resetName', { name: t('tasks', undefined, lang) })}
          onPress={() => {
            app.updateSettings({ allTitle: undefined });
            ui.closeAll();
            ui.toast(t('boardRenamed'));
          }}
          style={{ marginTop: 6 }}
          testID="list-reset"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  version: { textAlign: 'center', fontSize: 11, color: C.faint, marginTop: 18 },
  // Small grey caption above a group of rows in the ☰ menu.
  section: { fontSize: 12, color: C.muted, marginTop: 22, marginBottom: 2, marginHorizontal: 6 },
  hint: { fontSize: 12, lineHeight: 17, color: C.muted, marginTop: -4, marginBottom: 14, marginHorizontal: 3 },
  // .menu-range{gap:8px;padding:15px 0 4px;margin-top:10px;border-top:1px solid var(--line)}  strong{font-size:14px;font-weight:500}
  range: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 15, paddingBottom: 4, marginTop: 10, borderTopWidth: 1, borderTopColor: C.line },
  rangeText: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '500' },
});
