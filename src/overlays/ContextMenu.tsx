// Long press on a card → iOS-style preview: the whole photo, blurred background,
// and a menu with the card's actions (complete, edit, share, size & order, delete).
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { Icon, type IconName } from '../components/Icon';
import { CardText } from '../components/CardText';
import { T, Tap } from '../components/ui';
import { textCardBox } from '../model/textFit';
import { useScreen } from '../hooks/useScreen';
import { getLang, t } from '../i18n';
import { cardSubtitle, todayNoon } from '../model/logic';
import { mediaSource } from '../storage/media';
import { useApp } from '../state/AppState';
import { useActions } from '../state/actions';
import { useUI, type CtxMenuState } from '../state/UI';
import { C } from '../theme/tokens';

const MENU_W = 250;
const ROW_H = 46;

export function ContextMenuHost() {
  const ui = useUI();
  const app = useApp();
  const act = useActions();
  const scr = useScreen();
  const lang = getLang();
  const a = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState<CtxMenuState | null>(ui.ctx);

  useEffect(() => {
    if (ui.ctx) {
      setShown(ui.ctx);
      a.setValue(0);
      Animated.timing(a, { toValue: 1, duration: 230, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }).start();
    } else if (shown) Animated.timing(a, { toValue: 0, duration: 150, useNativeDriver: true }).start(({ finished }) => finished && setShown(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.ctx]);

  if (!shown) return null;
  const task = app.data.tasks.find((x) => x.id === shown.id);
  if (!task) return null;
  const name = task.title || t('untitled');
  const close = ui.closeCtx;
  const run = (fn: () => void) => () => {
    close();
    setTimeout(fn, 120);
  };

  const items: { icon: IconName; label: string; onPress: () => void; danger?: boolean; testID: string }[] = [
    { icon: task.done ? 'undo' : 'done', label: task.done ? t('ctxRestore') : t('ctxComplete'), onPress: run(() => act.toggleDone(task.id)), testID: 'ctx-done' },
    { icon: 'pencil', label: t('edit'), onPress: run(() => (cover || task.files.length ? ui.openSheet({ name: 'editor', id: task.id }) : act.openTask(task.id))), testID: 'ctx-edit' },
    { icon: 'share', label: t('ctxShare'), onPress: run(() => act.shareTasks([task], name)), testID: 'ctx-share' },
    { icon: 'resize', label: t('ctxArrange'), onPress: run(() => ui.setLayout(true)), testID: 'ctx-arrange' },
    { icon: 'trash', label: t('ctxDelete'), onPress: run(() => act.deleteTask(task.id)), danger: true, testID: 'ctx-delete' },
  ];

  // Preview size: the photo's own shape (not the card's crop), within the screen.
  const book = scr.fold?.dir === 'vertical' ? scr.fold : null;
  const laptop = scr.fold?.dir === 'horizontal' ? scr.fold : null;
  // Stay in the half of the screen the card is in (iPhone Duo).
  const right = book && shown.rect.x >= book.x;
  const areaX = right ? book.x + book.width : scr.insets.left;
  const areaW = book ? (right ? scr.width - areaX - scr.insets.right : book.x - scr.insets.left) : scr.width - scr.insets.left - scr.insets.right;
  const areaY = laptop && shown.rect.y >= laptop.y ? laptop.y + laptop.height : scr.insets.top;
  const areaH = laptop ? (shown.rect.y >= laptop.y ? scr.height - areaY - scr.insets.bottom : laptop.y - scr.insets.top) : scr.height - scr.insets.top - scr.insets.bottom;
  const menuH = items.length * ROW_H;
  const maxW = Math.min(areaW - 48, 380);
  const maxH = Math.max(120, areaH - menuH - 72);
  const cover = task.cover;
  const ratio = cover?.width && cover?.height ? cover.height / cover.width : shown.rect.height / shown.rect.width;
  let pw = maxW;
  let ph = pw * ratio;
  if (ph > maxH) {
    ph = maxH;
    pw = ph / ratio;
  }
  if (!cover) {
    // Text card: the card's own shape, a bit bigger than on the board.
    pw = Math.min(maxW, 300);
    ph = Math.min(maxH, pw * ratio);
  }
  const groupH = ph + 14 + menuH;
  const top = areaY + Math.max(16, (areaH - groupH) / 2);
  const left = areaX + (areaW - pw) / 2;
  const menuLeft = Math.min(Math.max(areaX + 16, left + (pw - MENU_W) / 2), areaX + areaW - MENU_W - 16);
  const src = cover ? mediaSource(cover.kind === 'video' ? cover.poster : cover.uri) : null;
  const sub = cardSubtitle(task, todayNoon(), lang);
  const tbox = textCardBox(pw, ph, { layout: false });
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

  return (
    <View style={StyleSheet.absoluteFill} testID="ctx-menu">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: a }]}>
        <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(23,23,19,0.18)' }]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityRole="button" accessibilityLabel={t('close')} testID="ctx-backdrop" />
      </Animated.View>
      <Animated.View style={[styles.preview, { left, top, width: pw, height: ph, opacity: a, transform: [{ scale }] }]}>
        <Tap
          style={StyleSheet.absoluteFill}
          onPress={run(() => act.openTask(task.id))}
          accessibilityLabel={t('openTask', { name })}
          testID="ctx-preview"
        >
          {src ? (
            <Image source={src} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : cover?.kind === 'video' ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#22231f', alignItems: 'center', justifyContent: 'center' }]}>
              <Icon name="play" size={30} color="rgba(255,255,255,0.86)" />
            </View>
          ) : (
            <View style={styles.textPreview}>
              <View style={[styles.textPreviewBox, { top: tbox.top, bottom: tbox.bottom }]}>
                <CardText text={name} width={tbox.width} height={tbox.height} done={task.done} />
              </View>
              {sub ? <T style={styles.textSub}>{sub}</T> : null}
            </View>
          )}
        </Tap>
      </Animated.View>
      <Animated.View style={[styles.menu, { left: menuLeft, top: top + ph + 14, opacity: a, transform: [{ scale }] }]} accessibilityRole="menu">
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
        {items.map((it, i) => (
          <Tap key={it.testID} style={[styles.row, i > 0 && styles.sep]} onPress={it.onPress} accessibilityRole="menuitem" accessibilityLabel={it.label} testID={it.testID}>
            <T style={[styles.rowText, it.danger && { color: C.danger }]}>{it.label}</T>
            <Icon name={it.icon} size={19} color={it.danger ? C.danger : C.ink} />
          </Tap>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { position: 'absolute', borderRadius: 20, overflow: 'hidden', backgroundColor: C.soft, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 30, shadowOffset: { width: 0, height: 14 } },
  textPreview: { flex: 1, backgroundColor: C.card },
  textPreviewBox: { position: 'absolute', left: 16, right: 16, alignItems: 'center', justifyContent: 'center' },
  textSub: { position: 'absolute', left: 16, right: 16, bottom: 13, textAlign: 'center', fontSize: 12, lineHeight: 15, color: C.muted },
  // iOS context menu: 250 wide, 13pt radius, translucent white, hairline separators.
  menu: { position: 'absolute', width: MENU_W, borderRadius: 14, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.72)', shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
  row: { height: ROW_H, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(60,60,67,0.29)' },
  rowText: { fontSize: 17, letterSpacing: -0.4 },
});
