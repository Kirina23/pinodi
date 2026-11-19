// Tapping a text card opens it like a note (as in Apple Notes): the full text, editable right
// away, saved by itself (a moment after typing stops, and when the sheet closes). Below: an
// optional note, the date (only if the person wants one) and the list. Fields grow with the text.
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { DateField } from '../components/DateField';
import { Icon } from '../components/Icon';
import { ListPicker } from '../components/ListPicker';
import { FormRow, FormRows, IconButton, T, Tap, useGrow } from '../components/ui';
import { getLang, t } from '../i18n';
import { TEXT_CARD_MAX } from '../model/constants';
import { defaultDue, todayNoon } from '../model/logic';
import { useApp } from '../state/AppState';
import { useActions } from '../state/actions';
import { useUI, type SheetRoute } from '../state/UI';
import { AVENIR, C } from '../theme/tokens';
import { NoDateButton } from './AddSheets';

export function NoteSheet({ id }: { id: string }) {
  const ui = useUI();
  const app = useApp();
  const act = useActions();
  const lang = getLang();
  const task = app.data.tasks.find((x) => x.id === id);
  const [text, setText] = useState(task?.title ?? '');
  const [note, setNote] = useState(task?.note ?? '');
  const [pending, setPending] = useState(false);
  const textGrow = useGrow(120);
  const noteGrow = useGrow(48);

  // Save without a "Save" button: shortly after typing stops, and when the sheet closes.
  const latest = useRef({ text, note });
  latest.current = { text, note };
  const appRef = useRef(app);
  appRef.current = app;
  const save = useRef(() => {
    const a = appRef.current;
    const cur = a.data.tasks.find((x) => x.id === id);
    if (!cur) return;
    const v = latest.current.text.trim();
    const n = latest.current.note.trim();
    const patch: { title?: string; note?: string } = {};
    if (v && v !== cur.title) patch.title = v; // empty text is never saved: the card keeps its old text
    if (n !== cur.note) patch.note = n;
    if (patch.title !== undefined || patch.note !== undefined) a.updateTask(id, patch);
  }).current;
  useEffect(() => {
    const timer = setTimeout(save, 600);
    return () => clearTimeout(timer);
  }, [text, note, save]);
  useEffect(() => () => save(), [save]);

  if (!task) return null;
  const back: SheetRoute = { name: 'note', id };
  const done = pending ? !task.done : task.done;

  return (
    <View>
      <View style={styles.toolbar}>
        <Tap
          style={styles.check}
          disabled={pending}
          onPress={() => {
            save();
            setPending(true);
            act.toggleDone(id, () => ui.closeAll());
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={done ? t('restoreTask') : t('completeTask')}
          testID="note-check"
        >
          <View style={[styles.ring, done && styles.ringDone]}>{done ? <Icon name="check" size={19} color={C.bg} weight="bold" /> : null}</View>
        </Tap>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <IconButton
            icon="share"
            label={t('shareTask')}
            onPress={() => {
              save();
              act.shareTasks([{ ...task, title: text.trim() || task.title, note: note.trim() }], text.trim() || task.title, back);
            }}
            testID="note-share"
          />
          <IconButton icon="trash" label={t('deleteTask')} onPress={() => act.deleteTask(id)} testID="note-delete" />
          <Tap
            onPress={() => {
              save();
              ui.closeAll();
            }}
            style={styles.doneBtn}
            accessibilityLabel={t('finish')}
            testID="note-done"
          >
            <T style={styles.doneText}>{t('finish')}</T>
          </Tap>
        </View>
      </View>

      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        scrollEnabled={false}
        maxLength={TEXT_CARD_MAX}
        placeholder={t('textCardPlaceholder')}
        placeholderTextColor={C.placeholder}
        onContentSizeChange={textGrow.onContentSizeChange}
        style={[styles.text, textGrow.style]}
        accessibilityLabel={t('textCardLabel')}
        maxFontSizeMultiplier={1.4}
        testID="note-text"
      />
      <View style={styles.under}>
        <T style={[styles.small, !text.trim() && { color: C.danger }]} testID="note-hint">
          {text.trim() ? t('savedAuto') : t('noteEmpty')}
        </T>
        {text.length > TEXT_CARD_MAX - 60 ? <T style={styles.small} testID="note-count">{`${text.length} / ${TEXT_CARD_MAX}`}</T> : null}
      </View>

      <View style={styles.sep} />
      <TextInput
        value={note}
        onChangeText={setNote}
        multiline
        scrollEnabled={false}
        maxLength={3000}
        placeholder={t('notePlaceholder')}
        placeholderTextColor={C.placeholder}
        onContentSizeChange={noteGrow.onContentSizeChange}
        style={[styles.note, noteGrow.style]}
        accessibilityLabel={t('noteLabel')}
        maxFontSizeMultiplier={1.4}
        testID="note-note"
      />

      <FormRows>
        <FormRow icon="calendar" label={t('when')}>
          {task.due ? (
            <DateField value={task.due} onChange={(v) => app.updateTask(id, { due: v })} label={t('taskDate')} lang={lang} testID="note-due" />
          ) : (
            <NoDateButton onPress={() => app.updateTask(id, { due: defaultDue(ui.period, ui.anchor, todayNoon()) })} />
          )}
        </FormRow>
        <ListPicker lists={app.data.lists} value={task.listId} onChange={(v) => app.updateTask(id, { listId: v })} label={t('taskList')} testID="note-list" />
      </FormRows>
      {task.due ? (
        <Tap style={styles.chip} onPress={() => app.updateTask(id, { due: '' })} testID="note-nodue">
          <T style={{ fontSize: 12 }}>{t('removeDate')}</T>
        </Tap>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 },
  check: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -7 },
  ring: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  ringDone: { backgroundColor: C.ink },
  doneBtn: { backgroundColor: C.ink, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 22, minHeight: 44, justifyContent: 'center' },
  doneText: { color: C.bg, fontSize: 13, fontWeight: '600' },
  // The card text, as typed (on the card it is in capitals): big, easy to read and fix.
  text: { fontFamily: AVENIR, fontWeight: '500', fontSize: 24, lineHeight: 32, color: C.ink, paddingVertical: 4, paddingHorizontal: 0, textAlignVertical: 'top', ...({ outlineStyle: 'none' } as object) },
  under: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 4 },
  small: { fontSize: 12, lineHeight: 16, color: C.muted, flexShrink: 1 },
  sep: { height: 1, backgroundColor: C.line, marginTop: 14, marginBottom: 10 },
  note: { fontSize: 16, lineHeight: 24, color: C.ink, paddingVertical: 4, paddingHorizontal: 0, textAlignVertical: 'top', ...({ outlineStyle: 'none' } as object) },
  chip: { alignSelf: 'flex-start', backgroundColor: C.soft, borderRadius: 9, minHeight: 44, paddingVertical: 6, paddingHorizontal: 11, justifyContent: 'center', marginTop: 12 },
});
