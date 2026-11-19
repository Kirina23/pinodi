// Launch animation (archive №19). iOS shows the launch screen as a still picture: the Pinodi icon (112 pt) in
// the middle of the board colour. This overlay starts as an exact copy of it and hides the system splash.
// Then Pinodi says hi (a small pop and tilt), and we dive into the photo the monkey holds: the photo grows and
// dissolves while the board behind it settles from 96 % to full size — the photo becomes your board.
// ≈ 0.6 s in all. With Reduce Motion on — only a short fade.
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { C } from '../theme/tokens';

import { INTRO, INTRO_TOTAL_MS } from './introTiming';
export { INTRO, INTRO_TOTAL_MS };

// Drawn 4× larger and scaled down at the start, so the icon stays sharp while it grows.
const DRAW = INTRO.iconPt * 4;
const S0 = 0.25;
const S1 = S0 * INTRO.zoomTo;
const icon = require('../../assets/splash-icon.png');

/** `board` drives the scale of the board behind (0 → 1 = boardFrom → 100 %). */
export function LaunchIntro({ board, onDone }: { board: Animated.Value; onDone: () => void }) {
  const zoom = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const tilt = useRef(new Animated.Value(0)).current;
  const iconOp = useRef(new Animated.Value(1)).current;
  const bgOp = useRef(new Animated.Value(1)).current;
  const started = useRef(false);
  const finished = useRef(false);

  const done = () => {
    if (finished.current) return;
    finished.current = true;
    onDone();
  };

  const start = () => {
    if (started.current) return; // onLayout and the safety timer may both call this
    started.current = true;
    SplashScreen.hideAsync().catch(() => {});
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        // one frame later: the system splash is gone and our copy of it is on screen
        requestAnimationFrame(() => {
          const t = (v: Animated.Value, toValue: number, duration: number, delay = 0, easing = Easing.out(Easing.cubic)) =>
            Animated.timing(v, { toValue, duration, delay, easing, useNativeDriver: true });
          const anim = reduce
            ? Animated.parallel([t(bgOp, 0, INTRO.reducedFadeMs), t(iconOp, 0, INTRO.reducedFadeMs), t(board, 1, 0)])
            : Animated.sequence([
                Animated.parallel([t(pop, 1, INTRO.popMs, 0, Easing.out(Easing.quad)), t(tilt, 1, INTRO.popMs, 0, Easing.out(Easing.quad))]),
                Animated.parallel([
                  t(zoom, 1, INTRO.zoomMs, 0, Easing.in(Easing.quad)),
                  t(tilt, 0, Math.round(INTRO.zoomMs * 0.6)),
                  t(iconOp, 0, INTRO.iconFadeMs, INTRO.iconFadeDelayMs, Easing.in(Easing.quad)),
                  t(bgOp, 0, INTRO.bgFadeMs, INTRO.bgFadeDelayMs),
                  t(board, 1, INTRO.bgFadeMs, INTRO.bgFadeDelayMs),
                ]),
              ]);
          anim.start(done);
        });
      });
  };

  // safety: never keep the board covered (e.g. if layout never fires)
  useEffect(() => {
    const id = setTimeout(start, 400);
    const end = setTimeout(done, 400 + INTRO_TOTAL_MS + 600);
    return () => {
      clearTimeout(id);
      clearTimeout(end);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // total scale = dive × pop; the photo (focusDy below the centre) stays where it is while everything grows
  // around it, so we fly into the photo rather than into the monkey's nose.
  const dive = zoom.interpolate({ inputRange: [0, 1], outputRange: [S0, S1] });
  const scale = Animated.multiply(dive, pop.interpolate({ inputRange: [0, 1], outputRange: [1, INTRO.popScale] }));
  const f = INTRO.focusDy * DRAW;
  const translateY = scale.interpolate({ inputRange: [S0, S1 * INTRO.popScale], outputRange: [0, -(S1 * INTRO.popScale - S0) * f] });
  const rotate = tilt.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${INTRO.popTiltDeg}deg`] });
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={start} testID="launch-intro">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: C.bg, opacity: bgOp }]} />
      <View style={styles.center}>
        <Animated.Image source={icon} style={[styles.icon, { opacity: iconOp, transform: [{ translateY }, { scale }, { rotate }] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  icon: { width: DRAW, height: DRAW },
});
