// A soft light sweep across a button every few seconds (the "Upgrade ›" pill and the paywall button).
// Off when the person turned on Reduce Motion in iOS settings.
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';

export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduce(!!v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setReduce(!!v));
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return reduce;
}

export function Shine({ radius = 0, every = 3800, sweep = 1000, delay = 700, color = 'rgba(255,255,255,0.34)' }: { radius?: number; every?: number; sweep?: number; delay?: number; color?: string }) {
  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const reduce = useReduceMotion();

  useEffect(() => {
    if (!w || reduce) return;
    x.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(x, { toValue: 1, duration: sweep, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(Math.max(0, every - sweep - delay)),
        Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [w, reduce, x, every, sweep, delay]);

  const band = 64;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
      {w && !reduce ? (
        <Animated.View
          style={[
            styles.band,
            { width: band, transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-band * 1.6, w + band * 0.6] }) }, { rotate: '16deg' }] },
          ]}
        >
          <LinearGradient colors={['rgba(255,255,255,0)', color, 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  band: { position: 'absolute', top: -24, bottom: -24, left: 0 },
});
