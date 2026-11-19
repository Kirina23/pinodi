// #toast — dark pill above the tab bar, optional "Undo" button.
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useScreen } from '../hooks/useScreen';
import { useUI, type ToastState } from '../state/UI';
import { C } from '../theme/tokens';
import { T, Tap } from './ui';

export function ToastHost() {
  const { toastState, hideToast } = useUI();
  const scr = useScreen();
  const [shown, setShown] = useState<ToastState | null>(toastState);
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toastState) {
      setShown(toastState);
      Animated.timing(a, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      Animated.timing(a, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => finished && setShown(null));
    }
  }, [toastState, a]);

  if (!shown) return null;
  // Just above the floating "+" (there is no tab bar any more).
  const bottom = Math.max(24, scr.insets.bottom + 10) + 64 + 14;
  // iPhone Duo as a book: in the right (trailing) half, like system alerts — never on the fold.
  const book = scr.fold?.dir === 'vertical' ? scr.fold : null;
  const left = book ? book.x + book.width + 16 : 16 + scr.insets.left;
  const right = 16 + scr.insets.right;
  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', alignItems: 'center', paddingBottom: bottom, paddingLeft: left, paddingRight: right }]}>
      <Animated.View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        testID="toast"
        style={[styles.toast, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] }]}
      >
        <T style={styles.text}>{shown.message}</T>
        {shown.action ? (
          <Tap
            testID="toast-action"
            onPress={() => {
              shown.action?.run();
              hideToast();
            }}
            hitSlop={10}
          >
            <T style={styles.action}>{shown.action.label}</T>
          </Tap>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // #toast{background:#1c1c19;padding:13px 18px;border-radius:17px;gap:15px;font-size:13px;line-height:1.35}
  toast: { backgroundColor: C.toast, flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 13, paddingHorizontal: 18, borderRadius: 17, maxWidth: 520, shadowColor: '#000', shadowOpacity: 0.13, shadowRadius: 17, shadowOffset: { width: 0, height: 10 } },
  text: { color: '#fff', fontSize: 13, lineHeight: 18, flexShrink: 1 },
  action: { color: '#fff', fontSize: 12, textDecorationLine: 'underline', paddingVertical: 6 },
});
