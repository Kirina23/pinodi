// The main screen: header (title · Upgrade · Поделиться · ☰), the board of cards, floating «+».
// No tab bar: the lists, renaming and settings live in the ☰ menu (same on iPhone, iPad and Duo).
// iPhone Duo: like Apple's own apps there, the buttons move into one vertical bar on the right
// (☰ · Share · Period at the top; Text · Photos · Camera · «+» at the bottom, under the thumb).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, LayoutAnimation, Platform, ScrollView, StyleSheet, View, type GestureResponderEvent, type ScrollViewInstance } from 'react-native';
import { Icon, type IconName } from '../components/Icon';
import { ProPill } from '../components/ProPill';
import { countdown } from '../i18n/format';
import { offerLeft, offerState } from '../model/offer';
import { useNow } from '../overlays/Offer';
import { TaskCard } from '../components/TaskCard';
import { Btn, IconButton, T, Tap, serif } from '../components/ui';
import { useScreen } from '../hooks/useScreen';
import { getLang, t } from '../i18n';
import { SIDEBAR, boardColumns, boardHeight, boardZones, cardLayout, hitCard, sideBarPlan, sideBarRight, visibleIds, type CardBox, type SidePlan } from '../model/layout';
import { allTitle, currentTasks, emptyKind, listCount, pageTitle, rangeText, todayNoon } from '../model/logic';
import { useApp } from '../state/AppState';
import { haptic, useActions } from '../state/actions';
import { useUI } from '../state/UI';
import { C } from '../theme/tokens';

const GAP = 12;

/** iPhone Duo side bar: what is in it, where it is, and how much room the header and board leave for it. */
function useSide() {
  const scr = useScreen();
  const headTop = (scr.short ? 12 : 8) + scr.insets.top;
  const top = headTop - SIDEBAR.pad;
  const bottom = Math.max(16, scr.insets.bottom + 8);
  // Apple: the inner display held upright (portrait) keeps the usual bars at the top and bottom.
  const vertical = scr.duo && !(scr.duoInner && scr.height > scr.width);
  const plan: SidePlan | null = vertical ? sideBarPlan(scr.height - top - bottom) : null;
  const edge = scr.insets.right - (scr.width - scr.appLeft - scr.appWidth);
  const right = sideBarRight(edge);
  const padRight = plan ? right + SIDEBAR.width + SIDEBAR.toBoard - (scr.width - scr.appLeft - scr.appWidth) : scr.padRight;
  return { plan, top, bottom, right, padRight, headTop };
}

function animateNext() {
  if (Platform.OS === 'ios') LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));
}

export function Main() {
  const ui = useUI();
  const app = useApp();
  const act = useActions();
  const scr = useScreen();
  const side = useSide();
  const lang = getLang();
  const { data } = app;
  const title = pageTitle(data, ui.list, lang);
  const showContext = ui.period !== 'all' && ui.list !== 'done';
  // Free plan: "Улучшить ›" / "Upgrade ›" in the header row, left of Share and ☰.
  // After buying, the same place says "Pro".
  const showPill = !ui.layout;
  // While the one-time offer runs, the same button shows its countdown and reopens it.
  const offerMaybe = !!data.settings.offerStartedAt && !app.pro;
  const now = useNow(offerMaybe);
  const offerOn = offerMaybe && offerState(data.settings, app.pro, now) === 'active';
  const openPro = () => (offerOn ? ui.openOffer() : ui.openSheet({ name: 'pro', reason: 'info' }));

  // ── Header ───────────────────────────────────────────────────────────
  // Like iOS (Phone, Telegram): a bar row with «Изм.» / «Edit» on the left and the buttons on the
  // right, the large title under it with the whole width. «Изм.» unlocks the cards (size with − / +
  // or two fingers, order with the arrows); it turns into «Готово». On a low screen (landscape
  // phone, Duo lying down) everything stays in one row: title, then «Изм.» and the buttons; there
  // the title shrinks to fit (down to 24 pt) or, if still too long, moves to its own line.
  const headTop = side.headTop;
  const padRight = side.padRight;
  const oneRow = scr.short;
  const [titleNatural, setTitleNatural] = useState(0);
  const [actionsW, setActionsW] = useState(0);
  const baseSize = scr.short || scr.narrow ? 30 : 36;
  const MIN_TITLE = 24;
  const contentW = scr.appWidth - scr.padLeft - padRight;
  const sizeFor = (room: number) => (titleNatural ? Math.floor((baseSize * (room - 4)) / titleNatural) : baseSize);
  const rowRoom = oneRow ? contentW - actionsW - 12 : contentW;
  const twoRows = oneRow && titleNatural > 0 && actionsW > 0 && sizeFor(rowRoom) < MIN_TITLE;
  const titleSize = Math.max(MIN_TITLE, Math.min(baseSize, sizeFor(twoRows ? contentW : rowRoom)));
  const titleStyle = [styles.h1, { fontSize: titleSize, lineHeight: Math.round(titleSize * 1.12), letterSpacing: titleSize >= 33 ? -1 : -0.7 }];
  const titleNode = (
    <T style={titleStyle} numberOfLines={1} accessibilityRole="header" maxFontSizeMultiplier={1.15} testID="title">
      {title}
    </T>
  );
  const editButton = <EditButton />;
  const actions = ui.layout ? null : (
    <>
      {showPill ? <ProPill onPress={openPro} compact={scr.narrow} pro={app.pro} timer={offerOn ? countdown(offerLeft(data.settings, now)) : undefined} /> : null}
      {side.plan?.top.includes('share') ? null : <IconButton icon="share" label={t('sharePlan')} onPress={() => act.shareTasks(currentTasks(data, ui.list, ui.period, ui.anchor), title)} testID="share" />}
      {/* ☰ — lists, renaming, period, card size, reminders, Pro (on iPhone Duo: in the side bar) */}
      {side.plan ? null : <IconButton icon="menu" label={t('menu')} onPress={() => ui.openSheet({ name: 'menu' })} testID="more" />}
    </>
  );
  const header = (
    <View style={{ paddingTop: headTop, paddingBottom: showContext ? 0 : scr.short ? 12 : 18, paddingLeft: scr.padLeft, paddingRight: padRight }}>
      <View style={styles.titleMeasure} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
        <T style={[styles.h1, { fontSize: baseSize, lineHeight: Math.round(baseSize * 1.12), letterSpacing: baseSize >= 33 ? -1 : -0.7 }]} numberOfLines={1} maxFontSizeMultiplier={1.15} onLayout={(e) => setTitleNatural(e.nativeEvent.layout.width)}>
          {title}
        </T>
      </View>
      {oneRow ? (
        <>
          <View style={styles.head}>
            <View style={styles.titleArea}>{!twoRows ? titleNode : null}</View>
            <View style={[styles.headActions, scr.narrow && { gap: 6 }]} onLayout={(e) => setActionsW(Math.round(e.nativeEvent.layout.width))}>
              {editButton}
              {actions}
            </View>
          </View>
          {twoRows ? <View style={styles.titleRow}>{titleNode}</View> : null}
        </>
      ) : (
        <>
          <View style={styles.head}>
            {editButton}
            <View style={[styles.headActions, scr.narrow && { gap: 6 }]}>{actions}</View>
          </View>
          <View style={styles.titleRow}>{titleNode}</View>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      {app.saveFailed ? (
        <View style={[styles.storageAlert, { paddingTop: 8 + scr.insets.top }]} accessibilityRole="alert">
          <T style={styles.storageText}>{t('storageAlert')}</T>
        </View>
      ) : null}
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: scr.appLeft, width: scr.appWidth }}>
        {header}
        {showContext ? (
          // The period («Ноябрь 2026») sits right under the title, like a subtitle (44 pt to tap,
          // the text itself 4 pt below the title).
          <View style={{ paddingLeft: scr.padLeft, paddingRight: padRight, paddingBottom: scr.short ? 6 : 10, marginTop: -9 }}>
            <Tap style={styles.periodCaption} onPress={() => ui.openSheet({ name: 'period' })} accessibilityLabel={`${t('choosePeriod')}: ${rangeText(ui.period, ui.anchor, lang)}`} testID="period-caption">
              <T style={styles.periodText}>{rangeText(ui.period, ui.anchor, lang)}</T>
              <Icon name="down" size={13} color={C.muted} weight="medium" />
            </Tap>
          </View>
        ) : null}
        <Board />
      </View>
      {side.plan ? <SideBar plan={side.plan} top={side.top} bottom={side.bottom} right={side.right} title={title} /> : <Fab />}
    </View>
  );
}

// ── Board ──────────────────────────────────────────────────────────────

function Board() {
  const ui = useUI();
  const app = useApp();
  const act = useActions();
  const scr = useScreen();
  const side = useSide();
  const padRight = side.padRight;
  const today = todayNoon();
  const items = useMemo(() => currentTasks(app.data, ui.list, ui.period, ui.anchor), [app.data, ui.list, ui.period, ui.anchor]);

  const width = Math.max(100, scr.appWidth - scr.padLeft - padRight);
  const book = scr.fold?.dir === 'vertical' ? scr.fold : null;
  const zones = useMemo(() => boardZones(width, book ? { x: book.x - (scr.appLeft + scr.padLeft), width: book.width } : null, GAP), [width, book, scr.appLeft, scr.padLeft]);
  // iPad / Duo: ~230 pt per column (even on Duo landscape). iPhone in landscape: 4 instead of 3,
  // so more than one row fits on the short screen. iPhone portrait: the prototype's rule.
  const columns = zones.length > 1 ? undefined : scr.board ? boardColumns(width, scr.duoInner && scr.width > scr.height) : scr.short && width >= 700 ? 4 : undefined;
  const boxes = useMemo(() => cardLayout(items, width, GAP, zones, columns), [items, width, zones, columns]);
  const byId = useMemo(() => new Map(boxes.map((b) => [b.id, b])), [boxes]);
  const height = boardHeight(boxes);

  // Only render cards near the screen (boards can hold 2000 cards).
  const scrollRef = useRef<ScrollViewInstance>(null);
  const scrollY = useRef(0);
  const [win, setWin] = useState(0);
  const viewport = useRef({ top: 0, height: scr.height });
  const boardY = useRef(0);
  const visible = useMemo(() => visibleIds(boxes, win - 400, win + scr.height + 400), [boxes, win, scr.height]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    scrollY.current = 0;
    setWin(0);
  }, [ui.list, ui.period, ui.anchor]);

  // ── Drag to reorder (layout mode) ──
  const [dragId, setDragId] = useState<string | null>(null);
  // Two fingers on a card (resizing): the board does not scroll meanwhile.
  const [pinching, setPinching] = useState(false);
  useEffect(() => {
    if (!ui.layout) setPinching(false);
  }, [ui.layout]);
  const ghost = useRef(new Animated.ValueXY()).current;
  const [ghostRect, setGhostRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const drag = useRef<{ id: string; sx: number; sy: number; px: number; py: number; sScroll: number; over: string | null; raf: number } | null>(null);
  const boxesRef = useRef<CardBox[]>(boxes);
  boxesRef.current = boxes;
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const boardLeftWin = scr.appLeft + scr.padLeft;
  const toWindow = useCallback((b: CardBox) => ({ x: boardLeftWin + b.x, y: viewport.current.top + boardY.current + b.y - scrollY.current, w: b.w, h: b.h }), [boardLeftWin]);

  const step = useCallback(() => {
    const d = drag.current;
    if (!d) return;
    const vp = viewport.current;
    const edge = 65;
    let dy = 0;
    if (d.py < vp.top + edge) dy = -Math.min(12, (vp.top + edge - d.py) / 5);
    else if (d.py > vp.top + vp.height - edge) dy = Math.min(12, (d.py - (vp.top + vp.height - edge)) / 5);
    if (dy) {
      const max = Math.max(0, boardY.current + boardHeight(boxesRef.current) + 140 - vp.height);
      const y = Math.max(0, Math.min(max, scrollY.current + dy));
      if (y !== scrollY.current) {
        scrollY.current = y;
        scrollRef.current?.scrollTo({ y, animated: false });
      }
    }
    // Pointer in board coordinates → card under it.
    const bx = d.px - boardLeftWin;
    const by = d.py - vp.top - boardY.current + scrollY.current;
    const hit = hitCard(boxesRef.current, bx, by, d.id);
    if (hit && hit.id !== d.over) {
      d.over = hit.id;
      const list = itemsRef.current;
      const after = list.findIndex((x) => x.id === d.id) < list.findIndex((x) => x.id === hit.id);
      animateNext();
      app.moveTask(d.id, hit.id, after);
      haptic('select');
    } else if (!hit) d.over = null;
    d.raf = requestAnimationFrame(step);
  }, [app, boardLeftWin]);

  const moveHandlers = (id: string) => ({
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderTerminationRequest: () => false,
    onResponderGrant: (e: GestureResponderEvent) => {
      const b = byId.get(id);
      if (!b || drag.current) return;
      const { pageX, pageY } = e.nativeEvent;
      drag.current = { id, sx: pageX, sy: pageY, px: pageX, py: pageY, sScroll: scrollY.current, over: null, raf: 0 };
      ghost.setValue({ x: 0, y: 0 });
      setGhostRect(toWindow(b));
      setDragId(id);
      haptic('medium');
      drag.current.raf = requestAnimationFrame(step);
    },
    onResponderMove: (e: GestureResponderEvent) => {
      const d = drag.current;
      if (!d) return;
      d.px = e.nativeEvent.pageX;
      d.py = e.nativeEvent.pageY;
      ghost.setValue({ x: d.px - d.sx, y: d.py - d.sy });
    },
    onResponderRelease: () => endDrag(),
    onResponderTerminate: () => endDrag(),
  });

  const endDrag = () => {
    const d = drag.current;
    if (!d) return;
    cancelAnimationFrame(d.raf);
    drag.current = null;
    const b = boxesRef.current.find((x) => x.id === d.id);
    const start = ghostRect;
    const finish = () => {
      setDragId(null);
      setGhostRect(null);
    };
    if (!b || !start) return finish();
    const target = toWindow(b);
    Animated.timing(ghost, { toValue: { x: target.x - start.x, y: target.y - start.y }, duration: 220, easing: Easing.bezier(0.22, 0.8, 0.3, 1), useNativeDriver: true }).start(finish);
  };

  const moveByStep = (id: string, n: number) => {
    const i = items.findIndex((x) => x.id === id);
    const target = items[i + n];
    if (!target) return;
    animateNext();
    app.moveTask(id, target.id, n > 0);
  };

  const openCtx = (id: string) => {
    const b = byId.get(id);
    if (!b) return;
    haptic('medium');
    const r = toWindow(b);
    ui.openCtx({ id, rect: { x: r.x, y: r.y, width: r.w, height: r.h } });
  };

  const kind = items.length ? null : emptyKind(app.data, ui.list, ui.period);

  return (
    <View style={{ flex: 1 }} onLayout={(e) => (viewport.current.height = e.nativeEvent.layout.height)}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingLeft: scr.padLeft, paddingRight: padRight, paddingBottom: (side.plan ? 40 : 110) + scr.insets.bottom, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!dragId && !pinching}
        scrollEventThrottle={16}
        onLayout={() => scrollRef.current?.measureInWindow((_x, y, _w, h) => (viewport.current = { top: y, height: h }))}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          scrollY.current = y;
          if (Math.abs(y - win) > 300) setWin(y);
        }}
        testID="board-scroll"
      >
        {ui.layout ? <T style={styles.hint}>{t('layoutHint')}</T> : null}
        {!ui.layout && ui.list === 'all' && !app.data.settings.demoHintHidden && items.some((x) => x.demo) && !app.data.tasks.some((x) => !x.demo) ? (
          // New users see 6 example cards: one tap clears them (with "Вернуть" in the toast).
          // Once the person has added a card of their own, the tip is gone (examples stay until
          // removed in ☰ → «Убрать примеры» or from the Pro sheet; they never count toward the limit).
          <View style={styles.demoHint} testID="demo-hint">
            <T style={styles.demoHintText}>{t('demoHint')}</T>
            <Tap
              style={styles.demoHintBtn}
              onPress={() => {
                const undo = app.clearExamples();
                ui.toast(t('examplesRemoved'), { label: t('bringBack'), run: undo });
              }}
              testID="demo-clear"
            >
              <T style={styles.demoHintBtnText}>{t('demoClear')}</T>
            </Tap>
            <IconButton icon="close" label={t('hideHint')} plain iconSize={15} onPress={() => app.updateSettings({ demoHintHidden: true })} testID="demo-hint-close" />
          </View>
        ) : null}
        <View style={{ height, position: 'relative' }} onLayout={(e) => (boardY.current = e.nativeEvent.layout.y)} testID="board">
          {items.map((task) => {
            const b = byId.get(task.id);
            if (!b || (!visible.has(task.id) && task.id !== dragId)) return null;
            return (
              <View key={task.id} style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h }}>
                <TaskCard
                  task={task}
                  w={b.w}
                  h={b.h}
                  today={today}
                  layout={ui.layout}
                  completing={ui.completing.has(task.id)}
                  dragging={dragId === task.id}
                  onOpen={() => act.openTask(task.id)}
                  onLongPress={() => openCtx(task.id)}
                  onCheck={() => act.toggleDone(task.id)}
                  onDelete={() => act.deleteTask(task.id)}
                  onSize={(n) => {
                    animateNext();
                    app.sizeTask(task.id, n);
                    haptic('select');
                  }}
                  onPinch={setPinching}
                  moveHandlers={moveHandlers(task.id)}
                  onMoveAction={(n) => moveByStep(task.id, n)}
                />
              </View>
            );
          })}
        </View>
        {kind ? <Empty kind={kind} onAdd={() => act.openAdd()} /> : null}
      </ScrollView>
      {dragId && ghostRect ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.ghost, { left: ghostRect.x - scr.appLeft, top: ghostRect.y - viewport.current.top, width: ghostRect.w, height: ghostRect.h, transform: [{ translateX: ghost.x }, { translateY: ghost.y }, { scale: 1.025 }] }]}
        >
          {(() => {
            const task = app.data.tasks.find((x) => x.id === dragId);
            return task ? <TaskCard task={task} w={ghostRect.w} h={ghostRect.h} today={today} layout ghost /> : null;
          })()}
        </Animated.View>
      ) : null}
    </View>
  );
}

// Empty board: the whole empty area adds a task ("Нажми на любое пустое место…").
function Empty({ kind, onAdd }: { kind: NonNullable<ReturnType<typeof emptyKind>>; onAdd: () => void }) {
  const ui = useUI();
  const map: Record<typeof kind, { title: string; text: string; icon: IconName }> = {
    list: { title: t('emptyListTitle'), text: t('emptyListText'), icon: 'emptyPhoto' },
    done: { title: t('emptyDoneTitle'), text: t('emptyDoneText'), icon: 'done' },
    first: { title: t('emptyFirstTitle'), text: t('emptyFirstText'), icon: 'emptyPhoto' },
    allDone: { title: t('emptyAllDoneTitle'), text: t('emptyAllDoneText'), icon: 'done' },
    period: { title: t('emptyPeriodTitle'), text: t('emptyPeriodText'), icon: 'emptyPhoto' },
  };
  const m = map[kind];
  const content = (
    <>
      <Icon name={m.icon} size={76} color={C.faint} weight="thin" />
      <T style={styles.emptyTitle} accessibilityRole="header">
        {m.title}
      </T>
      <T style={styles.emptyText}>{m.text}</T>
      {kind === 'period' ? <Btn kind="secondary" title={t('allPlans')} onPress={() => ui.setPeriod('all')} style={{ marginTop: 20, alignSelf: 'center', paddingHorizontal: 24 }} testID="show-all" /> : null}
    </>
  );
  if (kind === 'done') {
    return (
      <View style={styles.empty} testID={`empty-${kind}`}>
        {content}
      </View>
    );
  }
  return (
    <Tap style={styles.empty} onPress={onAdd} accessibilityRole="button" accessibilityLabel={`${m.title}. ${t('addByTap')}`} testID={`empty-${kind}`}>
      {content}
    </Tap>
  );
}

// ── Lists ──────────────────────────────────────────────────────────────

/** The list groups (.list-group) — at the top of the ☰ menu. */
export function ListGroups({ onPick, current }: { onPick: (id: string) => void; current?: string }) {
  const ui = useUI();
  const app = useApp();
  const { data } = app;
  const row = (id: string, name: string, icon: IconName, first: boolean) => (
    <Tap key={id} style={[styles.listRow, !first && styles.listSep]} onPress={() => onPick(id)} accessibilityLabel={`${name}, ${listCount(data, id)}`} accessibilityState={current ? { selected: current === id } : undefined} testID={`list-${id}`}>
      <Icon name={icon} size={22} />
      <T style={styles.listName} numberOfLines={1}>
        {name}
      </T>
      <T style={styles.listCount}>{listCount(data, id)}</T>
      {current === id ? <Icon name="check" size={15} color={C.ink} weight="semibold" /> : <Icon name="right" size={14} color={C.chevron} weight="semibold" />}
    </Tap>
  );
  return (
    <>
      <View style={styles.listGroup}>
        {row('all', allTitle(data, getLang()), 'tasks', true)}
        {data.lists.map((l) => row(l.id, l.name, l.id === 'personal' ? 'person' : 'folder', false))}
      </View>
      <View style={styles.listGroup}>{row('done', t('done'), 'done', true)}</View>
      <Tap style={styles.newList} onPress={() => ui.openSheet({ name: 'listForm' })} testID="new-list" accessibilityLabel={t('newList')}>
        <Icon name="plus" size={18} color={C.muted} />
        <T style={{ color: C.muted, fontSize: 16 }}>{t('newList')}</T>
      </Tap>
    </>
  );
}

// ── «+» ────────────────────────────────────────────────────────────────

function AddButton({ onPress, size = 64, floating }: { onPress: () => void; size?: number; floating?: boolean }) {
  return (
    <Tap style={[styles.addMain, floating && styles.fab, { width: size, height: size, borderRadius: size / 2 }]} onPress={onPress} accessibilityLabel={t('addTask')} testID="add">
      <Icon name="plus" size={size > 50 ? 29 : 22} color={C.bg} weight="medium" />
    </Tap>
  );
}

// "+" floats bottom-right, where the thumb is — on iPhone, iPad and iPhone Duo alike
// (Apple: on iPhone Duo controls go along the side, never in the centre where the fold is).
function Fab() {
  const act = useActions();
  const scr = useScreen();
  const right = scr.width - (scr.appLeft + scr.appWidth) + scr.padRight;
  const bottom = Math.max(24, scr.insets.bottom + 10);
  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill]}>
      <View style={{ position: 'absolute', right, bottom }}>
        <AddButton onPress={act.openAdd} size={64} floating />
      </View>
    </View>
  );
}

// «Изм.» / «Edit» (as in the iOS Phone app): unlocks the cards — − / +, two fingers, the move
// arrows. While they are unlocked it says «Готово» (filled) and locks them again.
function EditButton() {
  const ui = useUI();
  const on = ui.layout;
  return (
    <Tap
      style={[styles.editButton, on && styles.editOn]}
      onPress={() => {
        haptic('select');
        ui.setLayout(!on);
      }}
      accessibilityLabel={on ? t('finish') : t('editCardsLabel')}
      testID={on ? 'layout-done' : 'edit'}
    >
      <T style={[styles.editText, on && styles.editTextOn]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
        {on ? t('finish') : t('editCards')}
      </T>
    </Tap>
  );
}

// ── iPhone Duo side bar ───────────────────────────────────────────────
// Apple, iPhone Duo: bars become one vertical bar on the side of the screen, so content gets the
// full height and every button is under the thumb. Top: ☰, Share, Period. Bottom: quick add —
// a text card, photos, the camera — and the big «+» (all ways to add, incl. video and files).
function SideBar({ plan, top, bottom, right, title }: { plan: SidePlan; top: number; bottom: number; right: number; title: string }) {
  const ui = useUI();
  const app = useApp();
  const act = useActions();
  const quick = (run: () => void) => () => {
    if (!act.requireSpace()) return;
    ui.setLayout(false);
    run();
  };
  const topButtons: Record<SidePlan['top'][number], { icon: IconName; label: string; run: () => void; testID: string; on?: boolean }> = {
    menu: { icon: 'menu', label: t('menu'), run: () => ui.openSheet({ name: 'menu' }), testID: 'more' },
    share: { icon: 'share', label: t('sharePlan'), run: () => act.shareTasks(currentTasks(app.data, ui.list, ui.period, ui.anchor), title), testID: 'share' },
    period: { icon: 'calendar', label: t('choosePeriod'), run: () => ui.openSheet({ name: 'period' }), testID: 'side-period' },
  };
  const quickButtons: Record<SidePlan['quick'][number], { icon: IconName; label: string; run: () => void; testID: string }> = {
    text: { icon: 'text', label: t('textCard'), run: quick(() => ui.openSheet({ name: 'editor', text: true })), testID: 'side-text' },
    photos: { icon: 'photos', label: t('choosePhoto'), run: quick(() => act.pickFiles('photos', act.newFiles)), testID: 'side-photos' },
    camera: { icon: 'camera', label: t('takePhoto'), run: quick(() => act.pickFiles('camera', act.newFiles)), testID: 'side-camera' },
  };
  const group = (items: { icon: IconName; label: string; run: () => void; testID: string; on?: boolean }[]) => (
    <View style={styles.sideGroup}>
      {items.map((b) => (
        <Tap key={b.testID} style={[styles.sideButton, b.on && styles.lockOn]} onPress={b.run} accessibilityLabel={b.label} accessibilityState={b.on === undefined ? undefined : { selected: b.on }} testID={b.testID}>
          <Icon name={b.icon} size={21} color={b.on ? C.bg : undefined} />
        </Tap>
      ))}
    </View>
  );
  return (
    <View pointerEvents="box-none" style={[styles.side, { top, bottom, right, width: SIDEBAR.width }]} testID="sidebar">
      {group(plan.top.map((k) => topButtons[k]))}
      <View style={{ alignItems: 'center', gap: SIDEBAR.margin }}>
        {group(plan.quick.map((k) => quickButtons[k]))}
        <AddButton onPress={act.openAdd} size={SIDEBAR.plus} floating />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  side: { position: 'absolute', justifyContent: 'space-between', alignItems: 'center' },
  // Like the system vertical bar: one rounded column of plain icon buttons.
  sideGroup: { width: SIDEBAR.width, alignItems: 'center', gap: SIDEBAR.gap, paddingVertical: SIDEBAR.pad, borderRadius: SIDEBAR.width / 2, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  // «Изм.» — a pill like the iOS bar buttons; «Готово» — filled.
  editButton: { minHeight: 44, minWidth: 64, paddingHorizontal: 16, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  editOn: { backgroundColor: C.ink, borderColor: C.ink },
  editText: { fontSize: 15, fontWeight: '600', color: C.ink },
  editTextOn: { color: C.bg },
  lockOn: { backgroundColor: C.ink, borderColor: C.ink },
  sideButton: { width: SIDEBAR.button, height: SIDEBAR.button, borderRadius: SIDEBAR.button / 2, alignItems: 'center', justifyContent: 'center' },
  root: { flex: 1, backgroundColor: C.bg },
  // .head{padding:calc(25px + safe-top) 20px 20px;gap:12px}
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headTitle: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1, minWidth: 0 },
  // Everything left of the buttons belongs to the title.
  titleArea: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 5 },
  // Long title on a small screen: its own line under the buttons.
  titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  // Invisible copy of the title at full size, laid out without a width limit, to know its natural width.
  titleMeasure: { position: 'absolute', left: 0, top: -400, width: 4000, alignItems: 'flex-start', opacity: 0 },
  // .head h1{font:400 36px/1.12 var(--serif);letter-spacing:-1px}
  h1: { ...serif, fontSize: 36, lineHeight: 40.3, letterSpacing: -1, flexShrink: 1 },
  headActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // .done-button{min-height:44px;padding:10px 17px;border-radius:23px;background:var(--ink);font-size:14px;font-weight:550}
  doneButton: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 17, borderRadius: 23, backgroundColor: C.ink, justifyContent: 'center' },
  doneText: { color: C.bg, fontSize: 14, fontWeight: '600' },
  // .period-caption{min-height:44px;gap:5px;color:var(--muted);font-size:13px}
  periodCaption: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44, alignSelf: 'flex-start' },
  periodText: { color: C.muted, fontSize: 13 },
  // .hint{font-size:12px;line-height:1.5;color:var(--muted);padding:0 0 15px}
  hint: { fontSize: 12, lineHeight: 18, color: C.muted, paddingBottom: 15 },
  ghost: { position: 'absolute', shadowColor: '#000', shadowOpacity: 0.33, shadowRadius: 22, shadowOffset: { width: 0, height: 20 }, borderRadius: 20 },
  // .empty{min-height:360px;padding:30px 18px}
  demoHint: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.soft, borderRadius: 16, paddingLeft: 14, paddingVertical: 4, paddingRight: 2, marginBottom: 12 },
  demoHintText: { flex: 1, fontSize: 13, lineHeight: 18, color: C.muted, paddingVertical: 8 },
  demoHintBtn: { minHeight: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: C.ink, justifyContent: 'center' },
  demoHintBtnText: { color: C.bg, fontSize: 13, fontWeight: '600' },
  empty: { flexGrow: 1, minHeight: 360, alignItems: 'center', justifyContent: 'center', paddingVertical: 30, paddingHorizontal: 18 },
  // .empty h2{font:400 27px/1.15 var(--serif);letter-spacing:-.7px;max-width:330px}  icon margin-bottom:22px
  emptyTitle: { ...serif, fontSize: 27, lineHeight: 31, letterSpacing: -0.7, maxWidth: 330, textAlign: 'center', marginTop: 22 },
  // .empty p{color:var(--muted);font-size:14px;line-height:1.6;max-width:290px;margin-top:12px}
  emptyText: { color: C.muted, fontSize: 14, lineHeight: 22.4, maxWidth: 290, textAlign: 'center', marginTop: 12 },
  // .list-group{border-radius:20px;background:var(--card);border:1px solid var(--line);margin-bottom:17px}
  listGroup: { borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, marginBottom: 17, overflow: 'hidden' },
  // .list-row{min-height:64px;padding:16px 18px;gap:14px}
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, paddingVertical: 16, paddingHorizontal: 18 },
  listSep: { borderTopWidth: 1, borderTopColor: C.line },
  listName: { flex: 1, fontSize: 16 },
  listCount: { fontSize: 15, color: C.muted },
  // .new-list{min-height:48px;gap:9px;color:var(--muted);padding:4px 17px}
  newList: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 48, paddingVertical: 4, paddingHorizontal: 17, alignSelf: 'flex-start' },
  // .nav{min-height:105px;padding:20px 18px calc(16px + safe-bottom);background:linear-gradient(transparent,var(--bg) 20%)}
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, justifyContent: 'center' },
  navRow: { flexDirection: 'row', alignItems: 'center' },
  // .nav-item{width:90px;min-height:54px;gap:5px;font-size:12px;line-height:15px;color:var(--muted)}
  navItem: { width: 90, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 5 },
  navText: { fontSize: 12, lineHeight: 15, color: C.muted },
  navTextActive: { color: C.ink, fontWeight: '600' },
  // .add-main{64px;border-radius:50%;background:var(--ink);box-shadow:0 6px 16px #0000000d}
  addMain: { backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 6 } },
  // floating "+" over photos needs a clearer shadow than the tab-bar one
  fab: { shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  // .storage-alert{background:#fff1cc;font-size:12px;padding:8px 20px;color:#5e4c24}
  storageAlert: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: '#fff1cc', paddingHorizontal: 20, paddingBottom: 8 },
  storageText: { fontSize: 12, lineHeight: 17, color: '#5e4c24' },
  titleChevron: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center', marginLeft: 4, marginTop: 4 },
});
