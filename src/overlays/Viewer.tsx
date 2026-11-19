// #viewer — the whole photo on black, pinch / double-tap zoom, − 100% + buttons, share.
// iPhone uses UIScrollView's native zoom (smooth, with bounce); the web stand scales by transform.
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, Share, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';
import { Icon } from '../components/Icon';
import { IconButton, T, Tap } from '../components/ui';
import { useScreen } from '../hooks/useScreen';
import { t } from '../i18n';
import { mediaSource, shareableUri } from '../storage/media';
import { useUI } from '../state/UI';
import { C } from '../theme/tokens';

const MAX = 5;

export function ViewerHost() {
  const ui = useUI();
  const scr = useScreen();
  const v = ui.viewer;
  const fade = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(v);
  const [scale, setScale] = useState(1);
  const [stage, setStage] = useState({ w: scr.width, h: scr.height - 200 });
  const scroll = useRef<ScrollViewInstance>(null);
  const offset = useRef({ x: 0, y: 0 });
  const lastTap = useRef(0);

  useEffect(() => {
    if (v) {
      setShown(v);
      setScale(1);
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    } else if (shown) Animated.timing(fade, { toValue: 0, duration: 160, useNativeDriver: true }).start(({ finished }) => finished && setShown(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);

  if (!shown) return null;
  const src = mediaSource(shown.media.uri);
  const ios = Platform.OS === 'ios';

  const zoomTo = (next: number, cx?: number, cy?: number) => {
    const s = Math.max(1, Math.min(MAX, next));
    if (ios && scroll.current) {
      // Rect (in content coordinates at scale 1) that should fill the stage.
      const cur = scale || 1;
      const centerX = cx ?? (offset.current.x + stage.w / 2) / cur;
      const centerY = cy ?? (offset.current.y + stage.h / 2) / cur;
      const w = stage.w / s;
      const h = stage.h / s;
      scroll.current.scrollResponderZoomTo({ x: centerX - w / 2, y: centerY - h / 2, width: w, height: h, animated: true });
    }
    setScale(s);
  };

  const onTap = (x: number, y: number) => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      lastTap.current = 0;
      zoomTo(scale > 1 ? 1 : 2.5, x, y);
    } else lastTap.current = now;
  };

  const share = async () => {
    try {
      const url = await shareableUri(shown.media.uri);
      if (url) await Share.share({ url, title: shown.title });
      else ui.toast(t('shareFailed'));
    } catch {
      ui.toast(t('shareFailed'));
    }
  };

  const image = <Image source={src} style={{ width: stage.w, height: stage.h }} contentFit="contain" accessibilityLabel={shown.title} />;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: fade }]} accessibilityViewIsModal testID="viewer">
      <StatusBar style="light" />
      <View style={[styles.top, { paddingTop: 13 + scr.insets.top, paddingLeft: 15 + scr.insets.left, paddingRight: 15 + scr.insets.right }]}>
        <IconButton icon="close" dark label={t('closePhoto')} onPress={ui.closeViewer} iconSize={18} testID="viewer-close" />
        <T style={styles.title} numberOfLines={1}>
          {shown.title}
        </T>
        <IconButton icon="share" dark label={t('sharePhoto')} onPress={share} testID="viewer-share" />
      </View>
      <View style={{ flex: 1 }} onLayout={(e) => setStage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {ios ? (
          <ScrollView
            ref={scroll}
            style={{ flex: 1 }}
            maximumZoomScale={MAX}
            minimumZoomScale={1}
            centerContent
            bouncesZoom
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={32}
            onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
              offset.current = e.nativeEvent.contentOffset;
              const z = e.nativeEvent.zoomScale;
              if (z && Math.abs(z - scale) > 0.01) setScale(z);
            }}
          >
            <Pressable onPress={(e) => onTap(e.nativeEvent.locationX, e.nativeEvent.locationY)}>{image}</Pressable>
          </ScrollView>
        ) : (
          <Pressable style={{ flex: 1, overflow: 'hidden' }} onPress={(e) => onTap(e.nativeEvent.locationX, e.nativeEvent.locationY)}>
            <View style={{ transform: [{ scale }] }}>{image}</View>
          </Pressable>
        )}
      </View>
      <T style={styles.hint}>{t('viewerHint')}</T>
      <View style={[styles.tools, { paddingBottom: 24 + scr.insets.bottom }]}>
        <Tap style={styles.zoomBtn} onPress={() => zoomTo(scale / 1.35)} accessibilityLabel={t('zoomOut')} testID="zoom-out">
          <Icon name="minus" size={20} color="#deded7" />
        </Tap>
        <Tap style={[styles.zoomBtn, styles.reset]} onPress={() => zoomTo(1)} accessibilityLabel={t('resetZoom')} testID="zoom-reset">
          <T style={{ color: '#deded7', fontSize: 12 }}>{Math.round(scale * 100)}%</T>
        </Tap>
        <Tap style={styles.zoomBtn} onPress={() => zoomTo(scale * 1.35)} accessibilityLabel={t('zoomIn')} testID="zoom-in">
          <Icon name="plus" size={20} color="#deded7" />
        </Tap>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: C.viewer, zIndex: 30 },
  // .viewer-top{padding:calc(13px + safe-top) 15px 10px;gap:8px}  span{font-size:13px;max-width:60%}
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingBottom: 10 },
  title: { color: '#fff', fontSize: 13, maxWidth: '60%' },
  // .viewer-hint{color:#888;font-size:11px;padding:7px 20px 0}
  hint: { color: '#888', fontSize: 11, textAlign: 'center', paddingTop: 7, paddingHorizontal: 20 },
  // .zoom-tools{padding:15px 20px calc(24px + safe-bottom);gap:22px}  button{44px;background:#ffffff12;border-radius:50%}
  tools: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22, paddingTop: 15, paddingHorizontal: 20 },
  zoomBtn: { minWidth: 44, minHeight: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  reset: { width: 76, borderRadius: 20 },
});
