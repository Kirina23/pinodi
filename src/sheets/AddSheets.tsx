// "Добавить задачу", "Добавить N файлов" and the task editor.
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';
import { DateField } from '../components/DateField';
import { Icon } from '../components/Icon';
import { ListPicker } from '../components/ListPicker';
import { AttachmentRows, PhotoView, VideoPlayer, fitHeight } from '../components/Media';
import { ActionRow, Btn, Field, FormRow, FormRows, IconButton, SheetTitle, T, Tap, sans } from '../components/ui';
import { useScreen } from '../hooks/useScreen';
import { fileCount } from '../i18n/format';
import { getLang, t } from '../i18n';
import { bundleFiles, defaultDue, titleFromFileName, todayNoon, uid } from '../model/logic';
import type { Media, Task } from '../model/types';
import { mediaSource } from '../storage/media';
import { useApp } from '../state/AppState';
import { useActions } from '../state/actions';
import { useUI, type EditorDraft } from '../state/UI';
import { AVENIR, AVENIR_WEIGHT, C } from '../theme/tokens';
import { TEXT_CARD_MAX } from '../model/constants';
import { countLines, fitCardText } from '../model/textFit';

export function AddSheet() {
  const ui = useUI();
  const app = useApp();
  const act = useActions();
  return (
    <View>
      <SheetTitle title={t('addTask')} onClose={ui.closeSheet} closeLabel={t('close')} />
      <ActionRow first icon="camera" label={t('takePhoto')} onPress={() => act.pickFiles('camera', act.newFiles)} testID="add-camera" />
      <ActionRow icon="photos" label={t('choosePhoto')} note={t('severalOk')} onPress={() => act.pickFiles('photos', act.newFiles)} testID="add-photos" />
      <ActionRow icon="video" label={t('chooseVideo')} note={app.pro ? undefined : 'Pro'} onPress={() => act.pickFiles('videos', act.newFiles)} testID="add-video" />
      <ActionRow icon="file" label={t('chooseFiles')} note={t('filesHint')} onPress={() => act.pickFiles('files', act.newFiles)} testID="add-files" />
      <ActionRow icon="text" label={t('textCard')} onPress={() => ui.openSheet({ name: 'editor', text: true })} testID="add-text" />
      <Btn kind="quiet" title={t('cancel')} onPress={ui.closeSheet} style={{ marginTop: 8 }} testID="add-cancel" />
    </View>
  );
}

// ── Several files → several tasks ─────────────────────────────────────

export function BatchSheet({ files }: { files: Media[] }) {
  const ui = useUI();
  const app = useApp();
  const act = useActions();
  const lang = getLang();
  const initialList = ui.list !== 'all' && ui.list !== 'done' ? ui.list : '';
  const [due, setDue] = useState('');
  const [listId, setListId] = useState(initialList);

  const submit = () => {
    if (!act.requireSpace(files.length)) return;
    const now = Date.now();
    // Photos and videos stay without a caption; documents keep their file name.
    const tasks: Task[] = files.map((f, i) => ({ id: uid(), title: f.kind === 'file' ? titleFromFileName(f.name) : '', note: '', due, listId, done: false, size: 1, ...bundleFiles([f]), createdAt: now + i }));
    app.addTasks(tasks);
    ui.closeAll();
    act.showSaved(listId, due);
    ui.toast(t('addedN', { n: tasks.length }));
  };

  return (
    <View>
      <SheetTitle title={t('addFilesTitle', { files: fileCount(files.length, lang) })} onClose={ui.closeSheet} closeLabel={t('close')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip} style={{ marginHorizontal: -20 }}>
        {files.map((f) => {
          const thumb = f.kind === 'image' ? f.uri : f.poster;
          return (
            <View key={f.id} style={styles.thumb}>
              {thumb ? (
                <Image source={mediaSource(thumb)} style={styles.thumbImg} contentFit="cover" />
              ) : (
                <>
                  <Icon name={f.kind === 'video' ? 'video' : 'file'} size={26} color={C.muted} />
                  <T style={styles.thumbName} numberOfLines={2}>
                    {f.name}
                  </T>
                </>
              )}
            </View>
          );
        })}
      </ScrollView>
      <T style={styles.summary}>{t('batchSummary')}</T>
      <FormRows>
        <FormRow icon="calendar" label={t('when')}>
          {due ? <DateField value={due} onChange={setDue} label={t('dueOfNew')} lang={lang} testID="batch-due" /> : <NoDateButton onPress={() => setDue(defaultDue(ui.period, ui.anchor, todayNoon()))} />}
        </FormRow>
        <ListPicker lists={app.data.lists} value={listId} onChange={setListId} label={t('listOfNew')} testID="batch-list" />
      </FormRows>
      <Btn title={t('addTasksN', { n: files.length })} onPress={submit} style={{ marginTop: 18 }} testID="batch-submit" />
      <Tap style={styles.join} onPress={() => ui.openSheet({ name: 'editor', draft: { ...bundleFiles(files), due, listId } })} testID="batch-join">
        <T style={styles.joinText}>{t('joinFiles')}</T>
      </Tap>
    </View>
  );
}

/** No date yet: "Выбрать дату" (the person decides if the task needs one). */
export function NoDateButton({ onPress }: { onPress: () => void }) {
  return (
    <Tap onPress={onPress} style={styles.noDate} accessibilityLabel={t('pickDate')} testID="no-date">
      <T style={{ fontSize: 14, color: C.muted }}>{t('pickDate')}</T>
    </Tap>
  );
}

// ── Editor ────────────────────────────────────────────────────────────

export function EditorSheet({ id, draft, text }: { id?: string; draft?: EditorDraft; text?: boolean }) {
  const ui = useUI();
  const app = useApp();
  const act = useActions();
  const scr = useScreen();
  const lang = getLang();
  const task = id ? app.data.tasks.find((x) => x.id === id) : undefined;
  const textMode = !!text || (!!task && !task.cover && !task.files.length);
  const initialList = draft?.listId ?? task?.listId ?? (ui.list !== 'all' && ui.list !== 'done' ? ui.list : '');

  const [cover, setCover] = useState<Media | null>(draft?.cover ?? task?.cover ?? null);
  const [files, setFiles] = useState<Media[]>(draft?.files ?? task?.files ?? []);
  const [title, setTitle] = useState(task?.title ?? '');
  const [note, setNote] = useState(task?.note ?? '');
  // No date unless the person picks one.
  const [due, setDue] = useState(draft?.due ?? task?.due ?? '');
  const [listId, setListId] = useState(initialList);
  const [error, setError] = useState('');
  const titleRef = useRef<TextInputInstance>(null);

  if (id && !task) return null;
  const hasMedia = !!cover || files.length > 0;
  const heading = textMode ? t('textCardShort') : task ? t('task') : t('newTask');
  const previewW = Math.min(scr.width, 560) - 40;
  // Text card: the font shrinks while typing, as it will on the card.
  const inputFit = fitCardText(title, previewW - 32, 130, { min: 17, max: 28 });
  // Its height follows the text (grows and shrinks): lines at that size + the padding.
  const inputHeight = Math.max(150, countLines(title || ' ', ((previewW - 32) * 0.97) / inputFit.fontSize) * inputFit.lineHeight + 52);

  const replaceCover = () =>
    act.pickFiles(cover?.kind === 'video' ? 'videos' : 'photos', (picked) => {
      const b = bundleFiles(picked);
      setCover(b.cover);
      setFiles((f) => [...f, ...b.files]);
    });
  const appendFiles = () =>
    act.pickFiles('files', (picked) => {
      if (!cover) {
        const b = bundleFiles(picked);
        setCover(b.cover);
        setFiles((f) => [...f, ...b.files]);
      } else setFiles((f) => [...f, ...picked]);
    });
  const removeCover = () => {
    const b = bundleFiles(files);
    setCover(b.cover);
    setFiles(b.files);
  };

  const submit = () => {
    if (!task && !act.requireSpace()) return;
    if ((cover?.kind === 'video' || files.some((f) => f.kind === 'video')) && !app.pro) {
      ui.openSheet({ name: 'pro', reason: 'video' });
      return;
    }
    let name = title.trim();
    if (!name && !hasMedia) {
      setError(t('formError'));
      titleRef.current?.focus();
      return;
    }
    if (!name && !cover && files.length) name = files[0].name;
    const values = { title: name, note: note.trim(), due, listId, cover: textMode ? null : cover, files: textMode ? [] : files };
    if (task) app.updateTask(task.id, values);
    else app.addTasks([{ id: uid(), ...values, done: false, size: 1, createdAt: Date.now() }]);
    ui.closeAll();
    act.showSaved(listId, due);
    ui.toast(t(task ? 'changesSaved' : 'taskAdded'));
  };

  return (
    <View>
      {/* .editor-nav: Отмена · title · Добавить */}
      <View style={styles.editorNav}>
        <Tap onPress={ui.closeAll} style={styles.textBtn} testID="editor-cancel">
          <T style={{ fontSize: 14 }}>{t('cancel')}</T>
        </Tap>
        <T style={styles.editorTitle} numberOfLines={1} accessibilityRole="header">
          {heading}
        </T>
        <Tap onPress={submit} style={styles.saveBtn} testID="editor-save" accessibilityLabel={task ? t('finish') : t('add')}>
          <T style={styles.saveText}>{task ? t('finish') : t('add')}</T>
        </Tap>
      </View>

      {!textMode ? (
        cover ? (
          <View>
            <View>
              {cover.kind === 'video' ? <VideoPlayer media={cover} style={{ height: fitHeight(cover, previewW, 280) }} /> : <PhotoView media={cover} height={fitHeight(cover, previewW, 280)} radius={19} testID="editor-photo" />}
              <IconButton icon="close" label={t('removeCover')} onPress={removeCover} style={styles.removeCover} iconSize={17} testID="remove-cover" />
            </View>
            <View style={styles.photoActions}>
              <Tap onPress={replaceCover} style={styles.photoAction} testID="replace-cover">
                <T style={styles.photoActionText}>{cover.kind === 'video' ? t('replaceVideo') : t('replacePhoto')}</T>
              </Tap>
              <Tap onPress={appendFiles} style={styles.photoAction} testID="append-files">
                <Icon name="plus" size={17} color={C.muted} />
                <T style={styles.photoActionText}>{t('filesBtn')}</T>
              </Tap>
            </View>
          </View>
        ) : (
          <Tap style={styles.uploadSlot} onPress={appendFiles} testID="upload-slot" accessibilityLabel={t('addPhotoOrFiles')}>
            <Icon name="paperclip" size={28} color={C.muted} />
            <T style={{ color: C.muted, fontSize: 16 }}>{t('addPhotoOrFiles')}</T>
            <T style={{ color: C.muted, fontSize: 12 }}>{t('canPickSeveral')}</T>
          </Tap>
        )
      ) : null}
      {!textMode ? <AttachmentRows files={files} onRemove={(f) => setFiles((x) => x.filter((y) => y.id !== f.id))} /> : null}

      {textMode ? (
        <Field
          label={t('textCardLabel')}
          value={title}
          onChangeText={(v) => {
            setTitle(v);
            setError('');
          }}
          placeholder={t('textCardPlaceholder')}
          maxLength={TEXT_CARD_MAX}
          multiline
          autoCapitalize="characters"
          inputStyle={[styles.textCardInput, { fontSize: inputFit.fontSize, lineHeight: inputFit.lineHeight, height: inputHeight }]}
          grow={false}
          autoFocus={!task}
          testID="editor-title"
        />
      ) : (
        <View style={styles.field}>
          <T style={styles.fieldLabel}>{hasMedia ? t('titleOptional') : t('titleLabel')}</T>
          <TextInput
            ref={titleRef}
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              setError('');
            }}
            placeholder={t('titlePlaceholder')}
            placeholderTextColor={C.placeholder}
            maxLength={120}
            autoComplete="off"
            returnKeyType="done"
            style={[sans, styles.input]}
            accessibilityLabel={t('titleLabel')}
            testID="editor-title"
          />
        </View>
      )}
      {textMode ? (
        <View style={styles.textHint}>
          <T style={styles.textHintText}>{t('textCardHint')}</T>
          {title.length > TEXT_CARD_MAX - 60 ? <T style={styles.textHintText} testID="editor-count">{`${title.length} / ${TEXT_CARD_MAX}`}</T> : null}
        </View>
      ) : null}
      <Field label={t('noteLabel')} value={note} onChangeText={setNote} placeholder={t('notePlaceholder')} maxLength={3000} multiline testID="editor-note" />

      <FormRows>
        <FormRow icon="calendar" label={t('when')}>
          {due ? <DateField value={due} onChange={setDue} label={t('taskDate')} lang={lang} testID="editor-due" /> : <NoDateButton onPress={() => setDue(defaultDue(ui.period, ui.anchor, todayNoon()))} />}
        </FormRow>
        <ListPicker lists={app.data.lists} value={listId} onChange={setListId} label={t('taskList')} testID="editor-list" />
      </FormRows>
      {due ? (
        <View style={styles.dateQuick}>
          <Tap style={styles.chip} onPress={() => setDue('')} testID="editor-nodue">
            <T style={{ fontSize: 12 }}>{t('removeDate')}</T>
          </Tap>
        </View>
      ) : null}
      {error ? (
        <T style={styles.error} accessibilityRole="alert" testID="editor-error">
          {error}
        </T>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // .batch-strip{gap:10px;padding:2px 0 16px}  .batch-thumb{100×112;border-radius:15px;border:1px solid var(--line)}
  strip: { gap: 10, paddingHorizontal: 20, paddingTop: 2, paddingBottom: 16 },
  thumb: { width: 100, height: 112, borderRadius: 15, borderWidth: 1, borderColor: C.line, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 9, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%', borderRadius: 9 },
  thumbName: { fontSize: 11, lineHeight: 14, textAlign: 'center' },
  // .file-summary{font-size:13px;line-height:1.5;color:var(--muted);margin:0 0 14px}
  summary: { fontSize: 13, lineHeight: 19.5, color: C.muted, marginBottom: 14 },
  // .batch-join{font-size:13px;padding-top:14px;min-height:48px;text-decoration:underline;color:var(--muted)}
  join: { minHeight: 48, paddingTop: 14, alignItems: 'center' },
  joinText: { fontSize: 13, color: C.muted, textDecorationLine: 'underline' },
  noDate: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10, backgroundColor: C.soft, borderRadius: 9 },
  // .editor-nav{gap:10px;margin-bottom:20px}  h2{font-size:15px;font-weight:600}
  editorNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  editorTitle: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  textBtn: { minHeight: 44, justifyContent: 'center', paddingRight: 8 },
  // .save-btn{background:var(--ink);padding:10px 15px;border-radius:22px;min-height:44px;font-size:13px}
  saveBtn: { backgroundColor: C.ink, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 22, minHeight: 44, justifyContent: 'center' },
  saveText: { color: C.bg, fontSize: 13, fontWeight: '600' },
  // .editor-photo-remove{right:8px;top:8px;background:#fff}
  removeCover: { position: 'absolute', right: 8, top: 8, borderWidth: 0 },
  // .photo-actions{justify-content:space-between;margin:3px 0 17px}  button{min-height:44px;font-size:14px;gap:6px}
  photoActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3, marginBottom: 17, gap: 8 },
  photoAction: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  photoActionText: { fontSize: 14, color: C.muted },
  // .upload-slot{min-height:160px;border-radius:20px;border:1px dashed #bdb9ad;background:var(--soft);gap:10px;margin-bottom:18px}
  uploadSlot: { minHeight: 160, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: C.dashed, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 18 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, color: C.muted, marginHorizontal: 3, marginBottom: 7 },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 14, minHeight: 48, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: C.card, fontSize: 16, color: C.ink },
  // Text card input: looks like the card — Avenir capitals, centred, white, rounded like a card.
  textCardInput: { fontFamily: AVENIR, fontWeight: AVENIR_WEIGHT, textAlign: 'center', minHeight: 150, borderRadius: 20, paddingTop: 22, paddingBottom: 22, paddingHorizontal: 16 },
  textHint: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: -6, marginBottom: 14, marginHorizontal: 3 },
  textHintText: { fontSize: 12, lineHeight: 16, color: C.muted, flexShrink: 1 },
  // .date-quick{gap:8px;margin:12px 0 0}  button{font-size:12px;background:var(--soft);border-radius:9px;min-height:44px;padding:6px 11px}
  dateQuick: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: { backgroundColor: C.soft, borderRadius: 9, minHeight: 44, paddingVertical: 6, paddingHorizontal: 11, justifyContent: 'center' },
  // .form-error{font-size:13px;line-height:1.4;color:var(--danger);padding:8px 0}
  error: { fontSize: 13, lineHeight: 18, color: C.danger, paddingVertical: 8 },
});
