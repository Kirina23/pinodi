// The one-time discount screen (after 3 weeks without Pro): a year of Pro at a lower price for one
// hour. Full screen, but always closable (✕ top right). The countdown is real and never restarts
// (model/offer.ts); while it runs, the header button shows "Скидка · 52:13" and reopens this screen.
// The billed price is the largest number; the regular price is shown crossed out next to it.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Shine } from '../components/Shine';
import { Btn, IconButton, T, Tap, serif } from '../components/ui';
import { useScreen } from '../hooks/useScreen';
import { t } from '../i18n';
import { countdown } from '../i18n/format';
import { discountPercent, offerLeft } from '../model/offer';
import { PRIVACY_URL, PRODUCT_IDS, PRODUCT_YEARLY, PRODUCT_YEARLY_OFFER, TERMS_URL } from '../purchases/config';
import { activeIds, buy, loadProducts, restore, type Product } from '../purchases/store';
import { ProHero } from '../sheets/ProSheet';
import { useApp } from '../state/AppState';
import { useUI } from '../state/UI';
import { C } from '../theme/tokens';

/** Re-renders every second while `on`. */
export function useNow(on: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [on]);
  return now;
}

export function OfferHost() {
  const ui = useUI();
  const [shown, setShown] = useState(false);
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (ui.offer) {
      setShown(true);
      Animated.timing(a, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else if (shown) {
      Animated.timing(a, { toValue: 0, duration: 220, useNativeDriver: true }).start(({ finished }) => finished && setShown(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.offer]);
  if (!shown) return null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]} accessibilityViewIsModal testID="offer">
      <OfferScreen />
    </Animated.View>
  );
}

function OfferScreen() {
  const ui = useUI();
  const app = useApp();
  const scr = useScreen();
  const now = useNow(true);
  const left = offerLeft(app.data.settings, now);
  const over = left <= 0;
  const [products, setProducts] = useState<Product[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    setProducts(null);
    try {
      const list = await loadProducts([PRODUCT_YEARLY, PRODUCT_YEARLY_OFFER]);
      setProducts(list);
      if (!list.some((p) => p.id === PRODUCT_YEARLY_OFFER)) setFailed(true);
    } catch {
      setProducts([]);
      setFailed(true);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const regular = products?.find((p) => p.id === PRODUCT_YEARLY);
  const offer = products?.find((p) => p.id === PRODUCT_YEARLY_OFFER);
  const pct = regular && offer ? discountPercent(regular.price, offer.price) : 0;

  const purchase = async () => {
    if (!offer || over) return;
    setBusy(true);
    try {
      const r = await buy(offer.id);
      if (r === 'purchased') {
        app.setPro(await activeIds());
        ui.closeOffer();
        ui.toast(t('proThanks'));
      } else if (r === 'pending') ui.toast(t('purchasePending'));
      else if (r === 'unverified') ui.toast(t('purchaseFailed'));
    } catch {
      ui.toast(t('purchaseFailed'));
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async () => {
    setBusy(true);
    try {
      const ids = await restore();
      app.setPro(ids);
      const ok = ids.some((id) => PRODUCT_IDS.includes(id));
      ui.toast(ok ? t('purchasesRestored') : t('nothingToRestore'));
      if (ok) ui.closeOffer();
    } catch {
      ui.toast(t('purchaseFailed'));
    } finally {
      setBusy(false);
    }
  };

  const [mm, ss] = countdown(left).split(':');
  const book = scr.fold?.dir === 'vertical' ? scr.fold : null;
  const side = 20; // inside the safe area (the outer view already keeps clear of the camera strip)

  return (
    // iPhone Duo as a book: the whole offer lives in the right half, never on the fold.
    <View style={{ flex: 1, paddingTop: scr.insets.top, paddingBottom: scr.insets.bottom, paddingLeft: book ? book.x + book.width + 8 : Math.max(0, scr.insets.left), paddingRight: Math.max(0, scr.insets.right) }}>
      <View style={[styles.top, { paddingHorizontal: side - 8 }]}>
        <T style={styles.brand}>{t('proName')}</T>
        <IconButton icon="close" label={t('close')} onPress={ui.closeOffer} iconSize={18} testID="offer-close" />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingHorizontal: side }]} showsVerticalScrollIndicator={false}>
        <View style={styles.column}>
          <ProHero compact={scr.height < 760} />
          <T style={styles.title} accessibilityRole="header">
            {pct ? t('offerTitle', { n: pct }) : t('offerTitleNoPct')}
          </T>
          <T style={styles.text}>{t('offerText')}</T>

          <T style={styles.ends}>{over ? t('offerOver') : t('offerEnds')}</T>
          <View style={styles.timer} accessible accessibilityLabel={`${t('offerEnds')} ${countdown(left)}`} testID="offer-timer">
            <View style={styles.digits}>
              <T style={styles.digitText} maxFontSizeMultiplier={1}>
                {mm}
              </T>
              <T style={styles.unit}>{t('minutesShort')}</T>
            </View>
            <T style={styles.colon}>:</T>
            <View style={styles.digits}>
              <T style={styles.digitText} maxFontSizeMultiplier={1}>
                {ss}
              </T>
              <T style={styles.unit}>{t('secondsShort')}</T>
            </View>
          </View>

          {products === null ? (
            <View style={styles.loading}>
              <ActivityIndicator color={C.muted} />
              <T style={styles.small}>{t('pricesLoading')}</T>
            </View>
          ) : failed || !offer ? (
            <View style={styles.loading}>
              <T style={[styles.small, { textAlign: 'center' }]}>{t('pricesFailed')}</T>
              <Btn kind="secondary" title={t('retry')} onPress={load} style={{ alignSelf: 'center', paddingHorizontal: 24 }} testID="offer-retry" />
            </View>
          ) : (
            <View style={styles.price} testID="offer-price">
              <View style={{ flex: 1 }}>
                <T style={styles.planName}>{t('planYear')}</T>
                {offer.monthlyPrice ? <T style={styles.small}>{t('perMonthShort', { price: offer.monthlyPrice })}</T> : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {regular ? (
                  <T style={styles.old} accessibilityLabel={`${regular.displayPrice}`}>
                    {regular.displayPrice}
                  </T>
                ) : null}
                <T style={styles.newPrice}>{offer.displayPrice}</T>
                <T style={styles.small}>{t('perYearWord')}</T>
              </View>
              {pct ? (
                <View style={styles.badge}>
                  <T style={styles.badgeText}>{`−${pct}%`}</T>
                </View>
              ) : null}
            </View>
          )}

          <View style={styles.cta}>
            <Btn title={t('offerCta')} onPress={purchase} disabled={!offer || busy || over} style={styles.ctaBtn} testID="offer-buy" />
            {offer && !busy && !over ? <Shine radius={18} /> : null}
          </View>
          {offer ? <T style={[styles.small, { textAlign: 'center', marginTop: 9 }]}>{`${t('perYear', { price: offer.displayPrice })}. ${t('cancelAnytime')}`}</T> : null}
          <T style={styles.legal}>{t('offerOnce')}</T>
          <T style={styles.legal}>{t('autoRenew')}</T>
          <View style={styles.links}>
            <Tap onPress={() => Linking.openURL(TERMS_URL)} hitSlop={10} testID="offer-terms">
              <T style={styles.link}>{t('terms')}</T>
            </Tap>
            <T style={styles.dot}>·</T>
            <Tap onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={10} testID="offer-privacy">
              <T style={styles.link}>{t('privacy')}</T>
            </Tap>
            <T style={styles.dot}>·</T>
            <Tap onPress={doRestore} disabled={busy} hitSlop={10} testID="offer-restore">
              <T style={styles.link}>{t('restorePurchases')}</T>
            </Tap>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: C.bg, zIndex: 50 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56 },
  brand: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3, paddingLeft: 8 },
  scroll: { paddingBottom: 30, alignItems: 'center' },
  column: { width: '100%', maxWidth: 520 },
  title: { ...serif, fontSize: 30, lineHeight: 35, letterSpacing: -0.6, textAlign: 'center', marginTop: 18 },
  text: { color: C.muted, fontSize: 14, lineHeight: 20.5, textAlign: 'center', marginTop: 8, paddingHorizontal: 6 },
  ends: { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 20, textTransform: 'uppercase', letterSpacing: 0.8 },
  timer: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 8, marginTop: 10 },
  digits: { minWidth: 86, paddingTop: 10, paddingBottom: 8, borderRadius: 16, backgroundColor: C.ink, alignItems: 'center' },
  digitText: { color: C.bg, fontSize: 40, lineHeight: 46, fontWeight: '600', fontVariant: ['tabular-nums'], letterSpacing: 1 },
  unit: { color: 'rgba(247,246,242,0.6)', fontSize: 11, marginTop: 1 },
  colon: { fontSize: 36, lineHeight: 64, fontWeight: '600', color: C.ink },
  price: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22, padding: 16, borderRadius: 18, borderWidth: 2, borderColor: C.ink, backgroundColor: C.card },
  planName: { fontSize: 16, fontWeight: '600', marginBottom: 3 },
  old: { fontSize: 14, color: C.muted, textDecorationLine: 'line-through' },
  newPrice: { fontSize: 28, lineHeight: 33, fontWeight: '700', letterSpacing: -0.5 },
  badge: { position: 'absolute', top: -11, left: 14, backgroundColor: C.ink, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#f0cf86', fontSize: 11, fontWeight: '700' },
  cta: { marginTop: 16, borderRadius: 18, overflow: 'hidden' },
  ctaBtn: { minHeight: 56, borderRadius: 18 },
  loading: { alignItems: 'center', gap: 10, paddingVertical: 18 },
  small: { fontSize: 12, lineHeight: 17, color: C.muted },
  legal: { fontSize: 11, lineHeight: 16, color: C.muted, textAlign: 'center', marginTop: 10 },
  links: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  link: { fontSize: 12, color: C.muted, textDecorationLine: 'underline', paddingVertical: 6 },
  dot: { fontSize: 12, color: C.faint },
});
