// An open task, its action menu, and the video sheet.
// The open task is editable right away (like the text-card note): tap the caption or the note and
// type; it saves itself shortly after typing stops and when the sheet closes. No "Изменить" hunt.
import { useEffect, useRef, useState } from 'react';
import { Share, StyleSheet, TextInput, View } from 'react-native';
import { DateField } from '../components/DateField';
import { Icon } from '../components/Icon';
import { ListPicker } from '../components/ListPicker';
import { AttachmentRows, PhotoView, VideoPlayer, fitHeight } from '../components/Media';
import { ActionRow, FormRow, FormRows, IconButton, SheetTitle, T, Tap, serif, useGrow } from '../components/ui';
import { useScreen } from '../hooks/useScreen';
import { getLang, t } from '../i18n';
import { defaultDue, todayNoon } from '../model/logic';
import { NoDateButton } from './AddSheets';
import type { Media } from '../model/types';
import { mediaFileUri, previewFile } from '../storage/media';
import { useApp } from '../state/AppState';
import { useActions } from '../state/actions';
import { useUI, type SheetRoute } from '../state/UI';
import { C } from '../theme/tokens';

export function DetailSheet({ id }: { id: string }) {
  const ui = useUI();
  const app = useApp();
  const act = useActions();
  const scr = useScreen();
  const lang = getLang();
  const task = app.data.tasks.find((x) => x.id === id);
  const [pending, setPending] = useState(false);
  const [title, setTitle] = useState(task?.title ?? '');
  const [note, setNote] = useState(task?.note ?? '');
  const titleGrow = useGrow(44);
  const noteGrow = useGrow(32);

  // Save without a "Save" button: shortly after typing stops, and when the sheet closes.
  // A photo may have no caption, so an empty caption is saved too.
  const latest = useRef({ title, note });
  latest.current = { title, note };
  const appRef = useRef(app);
  appRef.current = app;
  const save = useRef(() => {
    const a = appRef.current;
    const cur = a.data.tasks.find((x) => x.id === id);
    if (!cur) return;
    const v = latest.current.title.trim();
    const n = latest.current.note.trim();
    const patch: { title?: string; note?: string } = {};
    if (v !== cur.title) patch.title = v;
    if (n !== cur.note) patch.note = n;
    if (patch.title !== undefined || patch.note !== undefined) a.updateTask(id, patch);
  }).current;
  useEffect(() => {
    const timer = setTimeout(save, 600);
    return () => clearTimeout(timer);
  }, [title, note, save]);
  useEffect(() => () => save(), [save]);

  if (!task) return null;
  const name = title.trim() || task.title || t('untitled');
  const back: SheetRoute = { name: 'detail', id };
  const done = pending ? !task.done : task.done;
  const mediaW = Math.min(scr.width, 560) - 40;
  const maxH = scr.height * 0.5;

  const openFile = async (f: Media) => {
    if (f.kind === 'image') ui.openViewer({ media: f, title: f.name });
    else if (f.kind === 'video') ui.openSheet({ name: 'video', media: f, title: f.name, back });
    else {
      if (await previewFile(f)) return;
      const url = mediaFileUri(f.uri);
      if (url) Share.share({ url, title: f.name }).catch(() => {});
    }
  };

  return (
    <View>
      {/* .detail-toolbar */}
      <View style={styles.toolbar}>
        <IconButton
          icon="close"
          label={t('backToTasks')}
          onPress={() => {
            save();
            ui.closeAll();
          }}
          iconSize={18}
          testID="detail-close"
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton
            icon="share"
            label={t('shareTask')}
            onPress={() => {
              save();
              act.shareTasks([{ ...task, title: title.trim(), note: note.trim() }], name, back);
            }}
            testID="detail-share"
          />
          <IconButton
            icon="more"
            label={t('taskActions')}
            onPress={() => {
              save();
              ui.openSheet({ name: 'cardMenu', id, back });
            }}
            testID="detail-menu"
          />
        </View>
      </View>
      {/* .detail-title: round check + the caption, editable in place */}
      <View style={styles.titleRow}>
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
          testID="detail-check"
        >
          <View style={[styles.ring, done && styles.ringDone]}>{done ? <Icon name="check" size={19} color={C.bg} weight="bold" bounceKey={pending ? 1 : undefined} /> : null}</View>
        </Tap>
        <TextInput
          value={title}
          onChangeText={setTitle}
          multiline
          scrollEnabled={false}
          blurOnSubmit
          returnKeyType="done"
          maxLength={120}
          placeholder={t('captionPlaceholder')}
          placeholderTextColor={C.placeholder}
          onContentSizeChange={titleGrow.onContentSizeChange}
          style={[styles.title, titleGrow.style]}
          accessibilityLabel={t('titleLabel')}
          maxFontSizeMultiplier={1.3}
          testID="detail-title"
        />
      </View>
      {task.cover?.kind === 'video' ? (
        <VideoPlayer media={task.cover} style={{ height: fitHeight(task.cover, mediaW, maxH) }} />
      ) : task.cover ? (
        <PhotoView media={task.cover} height={fitHeight(task.cover, mediaW, maxH)} onPress={() => ui.openViewer({ media: task.cover!, title: title.trim() })} label={t('openPhotoFull')} testID="detail-photo" />
      ) : null}
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
        testID="detail-note"
      />
      <FormRows>
        <FormRow icon="calendar" label={t('when')}>
          {task.due ? (
            <DateField value={task.due} onChange={(v) => app.updateTask(id, { due: v })} label={t('taskDate')} lang={lang} testID="detail-due" />
          ) : (
            <NoDateButton onPress={() => app.updateTask(id, { due: defaultDue(ui.period, ui.anchor, todayNoon()) })} />
          )}
        </FormRow>
        <ListPicker lists={app.data.lists} value={task.listId} onChange={(v) => app.updateTask(id, { listId: v })} label={t('taskList')} testID="detail-list" />
      </FormRows>
      {task.due ? (
        <Tap style={styles.chip} onPress={() => app.updateTask(id, { due: '' })} testID="detail-nodue">
          <T style={{ fontSize: 12 }}>{t('removeDate')}</T>
        </Tap>
      ) : null}
      {task.files.length ? (
        <>
          <T style={styles.filesTitle}>{t('filesN', { n: task.files.length })}</T>
          <AttachmentRows files={task.files} onOpen={openFile} />
        </>
      ) : null}
      <T style={styles.saved}>{t('savedAuto')}</T>
    </View>
  );
}

export function CardMenuSheet({ id }: { id: string }) {
  const ui = useUI();
  const app = useApp();
  const act = useActions();
  const task = app.data.tasks.find((x) => x.id === id);
  if (!task) return null;
  return (
    <View>
      <SheetTitle title={task.title || t('taskActions')} onClose={ui.closeSheet} closeLabel={t('close')} />
      <ActionRow first icon="pencil" label={t('edit')} onPress={() => (task.cover || task.files.length ? ui.openSheet({ name: 'editor', id }) : ui.openSheet({ name: 'note', id }))} testID="menu-edit" />
      <ActionRow icon="trash" label={t('deleteTask')} danger onPress={() => act.deleteTask(id)} testID="menu-delete" />
    </View>
  );
}

export function VideoSheet({ media, title, example }: { media: Media; title: string; example?: boolean }) {
  const ui = useUI();
  const scr = useScreen();
  const w = Math.min(scr.width, 560) - 40;
  return (
    <View>
      <SheetTitle title={title} onClose={ui.closeSheet} closeLabel={t('close')} />
      <VideoPlayer media={media} style={{ height: fitHeight(media, w, scr.height * 0.55) }} />
      {example ? <T style={styles.exampleNote}>{t('videoExampleNote')}</T> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  // .detail-title{gap:7px;margin:10px 0 18px}  h2{font:400 31px/1.12 serif;letter-spacing:-.8px}
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10, marginBottom: 18 },
  check: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -7 },
  // .detail-ring{30px;border:1.5px solid var(--ink)}  .checked{background:var(--ink)}
  ring: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  ringDone: { backgroundColor: C.ink },
  // The caption: serif, as before, but a field — tap and type.
  title: { ...serif, flex: 1, fontSize: 28, lineHeight: 34, letterSpacing: -0.6, color: C.ink, paddingVertical: 4, paddingHorizontal: 0, textAlignVertical: 'top', ...({ outlineStyle: 'none' } as object) },
  // .detail-note{font-size:15px;line-height:1.6;margin-top:17px}
  note: { fontSize: 15, lineHeight: 24, marginTop: 14, marginBottom: 6, color: C.ink, paddingVertical: 4, paddingHorizontal: 0, textAlignVertical: 'top', ...({ outlineStyle: 'none' } as object) },
  chip: { alignSelf: 'flex-start', backgroundColor: C.soft, borderRadius: 9, minHeight: 44, paddingVertical: 6, paddingHorizontal: 11, justifyContent: 'center', marginTop: 12 },
  saved: { fontSize: 12, lineHeight: 16, color: C.muted, marginTop: 16 },
  // .meta{gap:10px;color:var(--muted);font-size:13px;margin-top:15px}
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 15 },
  metaText: { fontSize: 13, color: C.muted },
  // .detail-files-title{font-size:12px;color:var(--muted);margin:20px 0 8px}
  filesTitle: { fontSize: 12, color: C.muted, marginTop: 20, marginBottom: -6 },
  exampleNote: { fontSize: 12, lineHeight: 18, color: C.muted, marginTop: 15 },
});
