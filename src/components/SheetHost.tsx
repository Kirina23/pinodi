// Bottom sheet like the prototype's <dialog class="sheet">: slides up, dims the app,
// closes on backdrop tap or by dragging the grabber down. On iPad it is a centred card.
// iPhone Duo: never on the fold — bottom half when standing ("laptop"), right half as a book.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, LayoutAnimation, PanResponder, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useScreen } from '../hooks/useScreen';
import { useUI, type SheetRoute } from '../state/UI';
import { C } from '../theme/tokens';
import { t } from '../i18n';

export function routeKey(r: SheetRoute) {
  const id = 'id' in r ? r.id ?? '' : '';
  return `${r.name}:${id}:${'text' in r && r.text ? 't' : ''}`;
}

export function SheetHost({ render }: { render: (r: SheetRoute) => React.ReactNode }) {
  const ui = useUI();
  const scr = useScreen();
  const [route, setRoute] = useState<SheetRoute | null>(ui.sheet);
  const shown = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);

  useEffect(() => {
    if (ui.sheet) {
      closing.current = false;
      if (!route) {
        drag.setValue(0);
        setRoute(ui.sheet);
        Animated.timing(shown, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      } else {
        if (Platform.OS === 'ios') LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));
        drag.setValue(0);
        setRoute(ui.sheet);
      }
    } else if (route && !closing.current) {
      closing.current = true;
      Animated.timing(shown, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
        if (finished && closing.current) setRoute(null);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.sheet]);

  // Drag the grabber down to close (like an iOS sheet).
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 4,
      onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 110 || g.vy > 1.1) ui.closeSheet();
        else Animated.spring(drag, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
      },
      onPanResponderTerminate: () => Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start(),
    }),
  ).current;

  if (!route) return null;

  const { insets, wide, short, fold, width, height } = scr;
  const book = fold?.dir === 'vertical' ? fold : null;
  const laptop = fold?.dir === 'horizontal' ? fold : null;
  const centred = wide && !laptop;

  // Where the sheet may live.
  const areaTop = laptop ? laptop.y + laptop.height + 8 : short ? Math.max(8, insets.top + 8) : insets.top + 24;
  // Safe areas one edge at a time (iPhone Duo outer screen: 84 pt camera strip on the right).
  const areaLeft = book ? book.x + book.width + 16 : insets.left;
  const areaRight = book ? Math.max(16, insets.right + 12) : insets.right;
  const areaBottom = centred ? Math.max(22, insets.bottom + 12) : 0;

  const translateY = Animated.add(shown.interpolate({ inputRange: [0, 1], outputRange: [centred ? 40 : Math.min(700, height), 0] }), drag);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: C.backdrop, opacity: shown }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={ui.closeSheet} accessibilityLabel={t('close')} accessibilityRole="button" testID="sheet-backdrop" />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[StyleSheet.absoluteFill, { paddingTop: areaTop, paddingLeft: areaLeft, paddingRight: areaRight, paddingBottom: areaBottom, justifyContent: centred && !book ? 'center' : 'flex-end', alignItems: 'center' }]}
        pointerEvents="box-none"
      >
        <Animated.View
          accessibilityViewIsModal
          testID="sheet"
          style={[
            styles.sheet,
            { width: Math.min(560, width - areaLeft - areaRight), transform: [{ translateY }] },
            centred || book ? styles.sheetCard : null,
            centred && !book ? { opacity: shown } : null,
          ]}
        >
          <View {...pan.panHandlers} style={styles.grabZone} testID="sheet-grabber">
            <View style={styles.grabber} />
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingHorizontal: scr.narrow ? 15 : 20, paddingBottom: 26 + (centred || book ? 0 : insets.bottom) }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            bounces
          >
            <React.Fragment key={routeKey(route)}>{render(route)}</React.Fragment>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  // .sheet{max-width:560px;background:var(--bg);border-radius:28px 28px 0 0;padding:12px 20px calc(26px + safe-bottom);box-shadow:0 -10px 70px #0002}
  sheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flexShrink: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 35,
    shadowOffset: { width: 0, height: -10 },
  },
  sheetCard: { borderRadius: 28 },
  scroll: { flexGrow: 0, flexShrink: 1 },
  // .grabber{width:35px;height:4px;border-radius:9px;background:#d6d3ca;margin:0 auto 16px}
  grabZone: { paddingTop: 12, paddingBottom: 16, alignItems: 'center' },
  grabber: { width: 35, height: 4, borderRadius: 9, backgroundColor: C.grabber },
});
