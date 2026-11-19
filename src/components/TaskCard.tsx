// .task — one card on the board: photo (or text), title, date, round check.
// In layout mode ("Размер карточек"): move handle, delete, − / +.
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View, type GestureResponderEvent, type GestureResponderHandlers } from 'react-native';
import { getLang, t } from '../i18n';
import { durationLabel } from '../i18n/format';
import { cardSubtitle, fileKindLabel } from '../model/logic';
import { TEXT_CARD, textCardBoxFor } from '../model/textFit';
import type { Task } from '../model/types';
import { mediaSource } from '../storage/media';
import { C } from '../theme/tokens';
import { Icon } from './Icon';
import { CardText } from './CardText';
import { T, Tap } from './ui';

export interface CardProps {
  task: Task;
  w: number;
  h: number;
  today: Date;
  layout: boolean;
  /** Check is playing its animation; the card shows the new state and fades out. */
  completing?: boolean;
  /** This card is being dragged (the board shows a ghost instead). */
  dragging?: boolean;
  /** Static copy (drag ghost / share picture): no buttons react. */
  ghost?: boolean;
  onOpen?: () => void;
  onLongPress?: () => void;
  onCheck?: () => void;
  onDelete?: () => void;
  onSize?: (step: number) => void;
  /** Two fingers are on the card (layout mode): the board stops scrolling meanwhile. */
  onPinch?: (active: boolean) => void;
  moveHandlers?: GestureResponderHandlers;
  onMoveAction?: (step: number) => void;
}

export function TaskCard(p: CardProps) {
  const { task, layout } = p;
  const lang = getLang();
  const name = task.title || t('untitled');
  const cover = task.cover;
  const img = cover ? mediaSource(cover.kind === 'video' ? cover.poster : cover.uri) : null;
  const textOnly = !cover;
  const sub = cardSubtitle(task, p.today, lang);
  const shownDone = p.completing ? !task.done : task.done;

  // .task.completing{opacity:0;transform:scale(.96);transition:opacity .3s ease .65s,transform .3s ease .65s}
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (p.completing) {
      Animated.timing(fade, { toValue: 0, duration: 300, delay: 650, useNativeDriver: true }).start();
    } else fade.setValue(1);
  }, [p.completing, fade]);

  // ── Size with two fingers (unlocked / layout mode) ──
  // Spread the fingers → one size larger, pinch → one size smaller (again for every further 30 %).
  const pinch = useRef<number | null>(null);
  const spread = (e: GestureResponderEvent) => {
    const tt = e.nativeEvent.touches;
    return tt.length >= 2 ? Math.hypot(tt[0].pageX - tt[1].pageX, tt[0].pageY - tt[1].pageY) : 0;
  };
  const endPinch = (e: GestureResponderEvent) => {
    if (pinch.current !== null && e.nativeEvent.touches.length < 2) {
      pinch.current = null;
      p.onPinch?.(false);
    }
  };
  const pinchProps =
    layout && !p.ghost
      ? {
          onTouchStart: (e: GestureResponderEvent) => {
            const d = spread(e);
            if (d && pinch.current === null) {
              pinch.current = d;
              p.onPinch?.(true);
            }
          },
          onTouchMove: (e: GestureResponderEvent) => {
            const d = spread(e);
            if (!d || pinch.current === null) return;
            const r = d / pinch.current;
            if (r > 1.3 || r < 0.77) {
              p.onSize?.(r > 1 ? 1 : -1);
              pinch.current = d;
            }
          },
          onTouchEnd: endPinch,
          onTouchCancel: endPinch,
        }
      : {};

  // Computer (web stand): a trackpad pinch (⌃/⌘ + wheel) resizes in layout mode, right click opens
  // the card menu (as a long press does on the phone).
  const webRef = useRef<any>(null); // a DOM node on the web stand
  const live = useRef(p);
  live.current = p;
  useEffect(() => {
    if (Platform.OS !== 'web' || p.ghost) return;
    const el = webRef.current as unknown as HTMLElement | null;
    if (!el?.addEventListener) return;
    let acc = 0;
    const wheel = (e: WheelEvent) => {
      if (!live.current.layout || !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      acc -= e.deltaY;
      if (Math.abs(acc) > 40) {
        live.current.onSize?.(acc > 0 ? 1 : -1);
        acc = 0;
      }
    };
    const menu = (e: MouseEvent) => {
      if (live.current.layout || !live.current.onLongPress) return;
      e.preventDefault();
      live.current.onLongPress();
    };
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('contextmenu', menu);
    return () => {
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('contextmenu', menu);
    };
  }, [p.ghost]);

  // The text card has a 1 pt border: its content box is 2 pt smaller each way.
  const box = textOnly ? textCardBoxFor(name, p.w - 2, p.h - 2, { layout, date: !!sub }) : null;

  return (
    <Animated.View
      ref={webRef}
      {...pinchProps}
      style={[
        styles.card,
        { width: p.w, height: p.h, opacity: p.dragging ? 0.18 : fade, transform: [{ scale: fade.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] },
        textOnly && styles.textCard,
      ]}
      pointerEvents={p.ghost ? 'none' : p.completing ? 'none' : 'auto'}
    >
      <Pressable
        style={({ pressed }) => [StyleSheet.absoluteFill, pressed && !layout && styles.pressed]}
        onPress={layout ? undefined : p.onOpen}
        onLongPress={layout ? undefined : p.onLongPress}
        delayLongPress={Platform.OS === 'web' ? 550 : 380}
        disabled={layout || p.ghost}
        accessibilityRole="button"
        accessibilityLabel={t('openTask', { name })}
        accessibilityHint={sub || undefined}
        testID={`card-${task.id}`}
      >
        {img ? <Image source={img} style={[StyleSheet.absoluteFill, shownDone && { opacity: 0.85 }]} contentFit="cover" transition={120} recyclingKey={task.id} /> : null}
        {/* A video without a frame to show (it could not be read): a dark card with a play sign, never an empty one. */}
        {cover?.kind === 'video' && !img ? (
          <View style={styles.noPoster} pointerEvents="none">
            <Icon name="play" size={26} color="rgba(255,255,255,0.86)" />
          </View>
        ) : null}
        {textOnly && task.files.length && !layout ? <T style={styles.fileKind}>{fileKindLabel(task.files[0], lang)}</T> : null}
        {cover?.kind === 'video' && img && !layout ? (
          <View style={styles.videoBadge}>
            <Icon name="play" size={12} color="#fff" />
            {cover.duration && cover.duration >= 1 ? <T style={styles.videoText}>{durationLabel(cover.duration)}</T> : null}
          </View>
        ) : null}
        {/* Darkening only under text: a photo without a caption stays clean. */}
        {img && (task.title || (sub && !layout)) ? <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.53)']} style={styles.shade} pointerEvents="none" /> : null}
        {textOnly && box && (!layout || box.height >= TEXT_CARD.floor * 2) ? (
          // Text card: capitals, centred, the size picked to fit (model/textFit). A very small card
          // in «Изм.» mode has no room left between the handles and − / +: the text waits until «Готово».
          <View style={[styles.textBox, { top: box.top, bottom: box.bottom }, shownDone && { opacity: 0.75 }]} pointerEvents="none">
            <CardText text={name} width={box.width} height={box.height} done={shownDone} testID={`cardtext-${task.id}`} />
          </View>
        ) : null}
        {textOnly && sub && !layout ? (
          <T style={styles.textSub} numberOfLines={1} maxFontSizeMultiplier={1.2}>
            {sub}
          </T>
        ) : null}
        {!textOnly && (task.title || (sub && !layout)) ? (
          <View style={[styles.copy, layout && { bottom: 54 }, shownDone && { opacity: 0.75 }]} pointerEvents="none">
            {task.title ? (
              <T numberOfLines={layout ? 1 : 2} style={[styles.title, shownDone && styles.strike]} maxFontSizeMultiplier={1.2}>
                {task.title}
              </T>
            ) : null}
            {sub && !layout ? (
              <T style={styles.small} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                {sub}
              </T>
            ) : null}
          </View>
        ) : null}
      </Pressable>

      {!layout ? (
        <Tap
          style={styles.check}
          onPress={p.onCheck}
          disabled={p.ghost}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: shownDone }}
          accessibilityLabel={shownDone ? t('restoreNamed', { name }) : t('completeNamed', { name })}
          testID={`check-${task.id}`}
        >
          <View style={[styles.checkInner, shownDone && styles.checkInnerDone]}>
            {shownDone ? <Icon name="check" size={16} color="#fff" weight="bold" bounceKey={p.completing ? task.id : undefined} /> : <View style={styles.ring} />}
          </View>
        </Tap>
      ) : (
        <>
          <View pointerEvents="none" style={styles.layoutOutline} />
          <View
            {...p.moveHandlers}
            style={styles.moveHandle}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={t('moveNamed', { name })}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(e) => p.onMoveAction?.(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
            testID={`move-${task.id}`}
          >
            <View style={styles.handleDot}>
              <Icon name="move" size={18} />
            </View>
          </View>
          <Tap style={styles.deleteBtn} onPress={p.onDelete} accessibilityLabel={t('deleteNamed', { name })} testID={`delete-${task.id}`}>
            <View style={styles.deleteDot}>
              <Icon name="trash" size={16} color={C.danger} />
            </View>
          </Tap>
          <View style={styles.sizeTools}>
            <View style={styles.sizeSteps}>
              <Tap style={styles.sizeBtn} disabled={task.size === 0} onPress={() => p.onSize?.(-1)} accessibilityLabel={t('smaller')} testID={`smaller-${task.id}`}>
                <Icon name="minus" size={17} />
              </Tap>
              <Tap style={styles.sizeBtn} disabled={task.size === 3} onPress={() => p.onSize?.(1)} accessibilityLabel={t('larger')} testID={`larger-${task.id}`}>
                <Icon name="plus" size={17} />
              </Tap>
            </View>
          </View>
        </>
      )}
    </Animated.View>
  );
}

const shadowText = { textShadowColor: 'rgba(0,0,0,0.2)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 1 } };

const styles = StyleSheet.create({
  // .task{border-radius:20px;background:var(--soft);box-shadow:0 1px 2px #00000007}
  card: { borderRadius: 20, overflow: 'hidden', backgroundColor: C.soft, userSelect: 'none' },
  // .task.text-only{background:var(--card);border:1px solid var(--line)}
  textCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  // .task .shade{inset:35% 0 0;background:linear-gradient(transparent,#0008)}
  shade: { position: 'absolute', left: 0, right: 0, top: '35%', bottom: 0 },
  // .task-copy{bottom:14px;left:13px;right:12px;color:#fff}
  copy: { position: 'absolute', left: 13, right: 12, bottom: 14 },
  // Text card: the text block is centred between the check button and the date line.
  textBox: { position: 'absolute', left: TEXT_CARD.side, right: TEXT_CARD.side, alignItems: 'center', justifyContent: 'center' },
  textSub: { position: 'absolute', left: TEXT_CARD.side, right: TEXT_CARD.side, bottom: 13, textAlign: 'center', fontSize: 12, lineHeight: 15, color: C.muted },
  // .task-copy b{font-size:15px;font-weight:550;line-height:1.22;letter-spacing:-.2px}
  title: { color: '#fff', fontSize: 15, fontWeight: '600', lineHeight: 18.3, letterSpacing: -0.2, ...shadowText },
  strike: { textDecorationLine: 'line-through' },
  // .task-copy small{font-size:12px;line-height:1.25;margin-top:5px;opacity:.87}
  small: { color: '#fff', fontSize: 12, lineHeight: 15, marginTop: 5, opacity: 0.87, ...shadowText },
  // .task .file-kind — top-left, clear of the check button.
  fileKind: { position: 'absolute', left: 16, top: 20, right: 56, fontSize: 11, fontWeight: '600', color: C.muted, letterSpacing: 0.55 },
  // .check{top:6px;right:6px;width:44px;height:44px} .check-inner{30px white circle, shadow 0 1px 7px #0001}
  check: { position: 'absolute', top: 6, right: 6, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  checkInner: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 3.5, shadowOffset: { width: 0, height: 1 } },
  // .check.checked .check-inner{background:#151513;border:4px solid #fff}
  checkInnerDone: { backgroundColor: C.checkDone, borderWidth: 4, borderColor: '#fff' },
  // .check-inner:before{width:20px;height:20px;border:1.5px solid #181818;border-radius:50%}
  ring: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: C.checkInk },
  // .video-badge{left:12px;top:12px;background:#1818169e;border-radius:10px;padding:5px 7px;font-size:12px}
  noPoster: { ...StyleSheet.absoluteFill, backgroundColor: '#22231f', alignItems: 'center', justifyContent: 'center' },
  videoBadge: { position: 'absolute', left: 12, top: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(24,24,22,0.62)', borderRadius: 10, paddingVertical: 5, paddingHorizontal: 7 },
  videoText: { color: '#fff', fontSize: 12, lineHeight: 16 },
  // .layout-mode .task{outline:1px solid #fff7}
  // Feedback while the card is pressed (most visible with a mouse).
  pressed: { opacity: 0.86 },
  layoutOutline: { ...StyleSheet.absoluteFill, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.47)' },
  // .move-handle{left:5px;top:5px;44px} span{32px white circle, shadow 0 1px 8px #0002}
  moveHandle: { position: 'absolute', left: 5, top: 5, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  handleDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.13, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  // .card-delete{right:6px;top:6px} span{30px white circle; color:var(--danger)}
  deleteBtn: { position: 'absolute', right: 6, top: 6, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  deleteDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 3.5, shadowOffset: { width: 0, height: 1 } },
  // .size-tools{bottom:5px;left:7px;right:5px}  .size-steps{background:#fffc;border-radius:12px}
  sizeTools: { position: 'absolute', left: 7, right: 5, bottom: 5, flexDirection: 'row' },
  sizeSteps: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 12 },
  sizeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
