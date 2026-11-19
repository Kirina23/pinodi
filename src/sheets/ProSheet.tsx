// Snapdo Pro paywall: picture, why (limit / video / info), what you get, the two plans side by side,
// a button with a soft light sweep, then the legal lines Apple requires.
// Products are reloaded every time the sheet opens. Test builds show a one-line
// diagnostics row ("Store · 2/2 · Sandbox") so missing prices can be traced quickly.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { CardText } from '../components/CardText';
import { Icon, type IconName } from '../components/Icon';
import { Shine } from '../components/Shine';
import { Btn, IconButton, T, Tap, serif } from '../components/ui';
import { dayCount } from '../i18n/format';
import { getLang, t } from '../i18n';
import { FREE_CARD_LIMIT } from '../model/constants';
import { activeCount } from '../model/logic';
import { MANAGE_URL, PLAN_IDS, PRIVACY_URL, PRODUCT_IDS, PRODUCT_MONTHLY, PRODUCT_YEARLY, TERMS_URL } from '../purchases/config';
import { activeIds, buy, environment, loadProducts, restore, type Product } from '../purchases/store';
import { useScreen } from '../hooks/useScreen';
import { useApp } from '../state/AppState';
import { useUI, type ProReason } from '../state/UI';
import { C } from '../theme/tokens';
import { DEMO_ASSETS } from '../storage/demoAssets';

export function ProSheet({ reason }: { reason: ProReason }) {
  const ui = useUI();
  const app = useApp();
  const scr = useScreen();
  const lang = getLang();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [env, setEnv] = useState('');
  const [selected, setSelected] = useState(PRODUCT_YEARLY);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoadFailed(false);
    setProducts(null);
    try {
      const list = await loadProducts(PLAN_IDS);
      setProducts(list);
      if (!list.length) setLoadFailed(true);
    } catch {
      setProducts([]);
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    if (!app.pro) load();
    environment().then(setEnv).catch(() => setEnv('unknown'));
  }, [app.pro, load]);

  const heading = app.pro ? t('proHeadActive') : reason === 'storage' ? t('proHeadStorage') : reason === 'limit' ? t('proHeadLimit') : reason === 'video' ? t('proHeadVideo') : t('proHeadInfo');
  const copy = app.pro
    ? t('proCopyActive')
    : reason === 'video'
      ? t('proCopyVideo')
      : reason === 'storage'
        ? t('proCopyStorage')
        : reason === 'limit'
          ? t('proCopyLimit', { limit: FREE_CARD_LIMIT, n: activeCount(app.data) })
          : t('proCopyInfo', { limit: FREE_CARD_LIMIT });

  const yearly = products?.find((p) => p.id === PRODUCT_YEARLY);
  const monthly = products?.find((p) => p.id === PRODUCT_MONTHLY);
  const chosen = products?.find((p) => p.id === selected) || yearly || monthly;
  const savePct = yearly && monthly && monthly.price > 0 ? Math.round((1 - yearly.price / (monthly.price * 12)) * 100) : 0;

  const purchase = async () => {
    if (!chosen) return;
    setBusy(true);
    try {
      const r = await buy(chosen.id);
      if (r === 'purchased') {
        app.setPro(await activeIds());
        ui.toast(t('proThanks'));
        ui.closeSheet();
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
      ui.toast(ids.some((id) => PRODUCT_IDS.includes(id)) ? t('purchasesRestored') : t('nothingToRestore'));
    } catch {
      ui.toast(t('purchaseFailed'));
    } finally {
      setBusy(false);
    }
  };

  const used = activeCount(app.data);
  const features: [IconName, string, string][] = [
    ['infinity', t('proUnlimited'), app.pro ? '' : t('proUsage', { n: used, limit: FREE_CARD_LIMIT })],
    ['video', t('proVideo'), t('proVideoNote')],
    // Snapdo has no ads in the free version either: this is a promise, not a difference.
    ['noAds', t('proNoAds'), t('proNoAdsNote')],
  ];
  const hasDemo = app.data.tasks.some((x) => x.demo);

  // Two plans side by side. The billed price is the biggest number on the tile (App Store rule);
  // "≈ per month" and the trial are smaller.
  const plan = (p: Product | undefined, label: string) => {
    if (!p) return null;
    const on = chosen?.id === p.id;
    const isYear = p.id === PRODUCT_YEARLY;
    return (
      <Tap key={p.id} style={[styles.plan, on && styles.planOn]} onPress={() => setSelected(p.id)} accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={`${label}, ${t(isYear ? 'perYear' : 'perMonth', { price: p.displayPrice })}${isYear && p.trialDays ? `, ${t('trialDays', { days: dayCount(p.trialDays, lang) })}` : ''}`} testID={`plan-${isYear ? 'year' : 'month'}`}>
        <View style={styles.planTop}>
          <T style={styles.planName}>{label}</T>
          <View style={[styles.radio, on && styles.radioOn]}>{on ? <Icon name="check" size={12} color="#fff" weight="bold" /> : null}</View>
        </View>
        <T style={styles.planPrice} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {p.displayPrice}
        </T>
        <T style={styles.planPer}>{t(isYear ? 'perYearWord' : 'perMonthWord')}</T>
        {isYear && p.monthlyPrice ? <T style={styles.planSub}>{t('perMonthShort', { price: p.monthlyPrice })}</T> : null}
        {isYear && p.trialDays ? (
          <View style={styles.trialChip}>
            <T style={styles.trialText}>{t('trialDays', { days: dayCount(p.trialDays, lang) })}</T>
          </View>
        ) : null}
        {isYear && savePct > 0 ? (
          <View style={styles.badge}>
            <T style={styles.badgeText}>{t('saveBadge', { n: savePct })}</T>
          </View>
        ) : null}
      </Tap>
    );
  };

  const trial = chosen?.trialDays;
  const showDiag = !!env && env !== 'Production' && env !== 'none';
  const chosenPrice = chosen ? t(chosen.id === PRODUCT_YEARLY ? 'perYear' : 'perMonth', { price: chosen.displayPrice }) : '';

  return (
    <View>
      <View style={styles.topRow}>
        <T style={styles.brandText}>{t('proName')}</T>
        <IconButton icon="close" label={t('close')} onPress={ui.closeSheet} iconSize={18} testID="sheet-close" />
      </View>

      <ProHero compact={scr.height < 900} />

      <T style={styles.intro} accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {heading}
      </T>
      <T style={styles.copy}>{copy}</T>

      <View style={styles.features}>
        {features.map(([icon, label, note]) => (
          <View key={label} style={styles.feature}>
            <View style={styles.featureIcon}>
              <Icon name={icon} size={19} />
            </View>
            <View style={{ flex: 1 }}>
              <T style={styles.featureLabel}>{label}</T>
              {note ? <T style={styles.featureNote}>{note}</T> : null}
            </View>
            <Icon name="check" size={16} color={C.muted} weight="semibold" />
          </View>
        ))}
      </View>
      {hasDemo && !app.pro ? (
        // Tip: the example cards can go right away (they don't count, but they fill the board).
        <Tap
          style={styles.demoTip}
          onPress={() => {
            const undo = app.clearExamples();
            ui.closeAll();
            ui.toast(t('examplesRemoved'), { label: t('bringBack'), run: undo });
          }}
          accessibilityRole="button"
          testID="pro-clear-demo"
        >
          <Icon name="trash" size={16} color={C.muted} />
          <T style={styles.demoTipText}>{t('proClearDemo')}</T>
          <T style={styles.demoTipAction}>{t('demoClear')}</T>
        </Tap>
      ) : null}

      {app.pro ? (
        <View style={{ gap: 10, marginTop: 18 }}>
          <Btn kind="secondary" title={t('manageSub')} onPress={() => Linking.openURL(MANAGE_URL)} testID="pro-manage" />
          <Btn title={t('gotIt')} onPress={ui.closeSheet} testID="pro-ok" />
        </View>
      ) : (
        <>
          {products === null ? (
            <View style={styles.loading}>
              <ActivityIndicator color={C.muted} />
              <T style={styles.small}>{t('pricesLoading')}</T>
            </View>
          ) : loadFailed ? (
            <View style={styles.loading}>
              <T style={[styles.small, { textAlign: 'center' }]}>{t('pricesFailed')}</T>
              <Btn kind="secondary" title={t('retry')} onPress={load} style={{ alignSelf: 'center', paddingHorizontal: 24 }} testID="pro-retry" />
            </View>
          ) : (
            <View style={styles.plans} accessibilityRole="radiogroup">
              {plan(yearly, t('planYear'))}
              {plan(monthly, t('planMonth'))}
            </View>
          )}
          <View style={styles.cta}>
            <Btn title={trial ? t('tryFreeDays', { days: dayCount(trial, lang) }) : t('subscribe')} onPress={purchase} disabled={!chosen || busy} style={styles.ctaBtn} testID="pro-buy" />
            {chosen && !busy ? <Shine radius={18} /> : null}
          </View>
          {chosen ? (
            <T style={[styles.small, { textAlign: 'center', marginTop: 9 }]} testID="pro-then">
              {trial ? `${t('thenPrice', { price: chosenPrice })} ${t('cancelAnytime')}` : `${chosenPrice}. ${t('cancelAnytime')}`}
            </T>
          ) : null}
          <T style={styles.legal}>{t('autoRenew')}</T>
          <View style={styles.links}>
            <Tap onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8} testID="pro-terms">
              <T style={styles.link}>{t('terms')}</T>
            </Tap>
            <T style={styles.dot}>·</T>
            <Tap onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8} testID="pro-privacy">
              <T style={styles.link}>{t('privacy')}</T>
            </Tap>
            <T style={styles.dot}>·</T>
            <Tap onPress={doRestore} disabled={busy} hitSlop={8} testID="pro-restore">
              <T style={styles.link}>{t('restorePurchases')}</T>
            </Tap>
          </View>
        </>
      )}
      <Btn
        kind="quiet"
        icon="play"
        title={t('proPreviewVideo')}
        onPress={() =>
          ui.openSheet({
            name: 'video',
            title: t('videoExampleTitle'),
            media: { id: 'pro-video-example', name: t('videoExampleName'), kind: 'video', mime: 'video/mp4', uri: 'demo:example', size: 0, width: 640, height: 360, duration: 4, poster: DEMO_ASSETS.brand ? 'demo:brand' : undefined },
            back: { name: 'pro', reason },
          })
        }
        style={{ marginTop: 6 }}
        testID="pro-video-example"
      />
      {showDiag ? (
        <T style={styles.diag} testID="pro-diag">
          Store · {products?.length ?? 0}/{PLAN_IDS.length} · {env}
        </T>
      ) : null}
    </View>
  );
}

// Three little cards fanned out: a photo, a text card, a video — what Pro lets you keep without limits.
export function ProHero({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.hero, compact && styles.heroCompact]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient colors={['#efe6d1', '#f6f1e5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.heroRow, compact && { transform: [{ scale: 0.78 }] }]}>
        <View style={[styles.mini, { transform: [{ rotate: '-9deg' }, { translateY: 8 }] }]}>
          <Image source={DEMO_ASSETS.journal} style={StyleSheet.absoluteFill} contentFit="cover" />
          <MiniCheck />
        </View>
        <View style={[styles.mini, styles.miniText, { zIndex: 2 }]}>
          <View style={styles.miniTextBox}>
            <CardText text={t('proHeroCard')} width={70} height={60} min={11} max={17} />
          </View>
          <MiniCheck />
        </View>
        <View style={[styles.mini, { transform: [{ rotate: '8deg' }, { translateY: 10 }] }]}>
          <Image source={DEMO_ASSETS.interior} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={styles.miniPlay}>
            <Icon name="play" size={9} color="#fff" />
          </View>
          <MiniCheck />
        </View>
      </View>
    </View>
  );
}

function MiniCheck() {
  return (
    <View style={styles.miniCheck}>
      <View style={styles.miniRing} />
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -2, marginBottom: 10 },
  brandText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3, color: C.ink },
  hero: { height: 132, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  heroCompact: { height: 100 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  mini: { marginHorizontal: -5, width: 78, height: 98, borderRadius: 15, overflow: 'hidden', backgroundColor: C.soft, borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  miniText: { backgroundColor: C.card, width: 86, height: 106, borderColor: C.line, borderWidth: 1 },
  miniTextBox: { position: 'absolute', left: 8, right: 8, top: 30, bottom: 12, alignItems: 'center', justifyContent: 'center' },
  miniCheck: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  miniRing: { width: 11, height: 11, borderRadius: 6, borderWidth: 1, borderColor: C.checkInk },
  miniPlay: { position: 'absolute', left: 6, top: 6, width: 20, height: 16, borderRadius: 6, backgroundColor: 'rgba(24,24,22,0.62)', alignItems: 'center', justifyContent: 'center' },
  // .pro-intro{font:400 33px/1.1 var(--serif)} — centred on the paywall
  intro: { ...serif, fontSize: 30, lineHeight: 34, letterSpacing: -0.6, textAlign: 'center', marginTop: 14, marginBottom: 6 },
  copy: { color: C.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 14, paddingHorizontal: 6 },
  features: { borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, paddingHorizontal: 14 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, minHeight: 52 },
  featureIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
  featureLabel: { fontSize: 15, fontWeight: '600' },
  featureNote: { fontSize: 12, lineHeight: 16, color: C.muted, marginTop: 2 },
  demoTip: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, marginTop: 4, paddingHorizontal: 4 },
  demoTipText: { flex: 1, fontSize: 12, lineHeight: 16, color: C.muted },
  demoTipAction: { fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  plans: { flexDirection: 'row', gap: 10, marginTop: 18, alignItems: 'stretch' },
  plan: { flex: 1, minHeight: 132, paddingTop: 14, paddingBottom: 12, paddingHorizontal: 13, borderRadius: 18, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.card },
  planOn: { borderColor: C.ink, borderWidth: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  planTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  planName: { fontSize: 15, fontWeight: '600' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: C.faint, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: C.ink, backgroundColor: C.ink },
  planPrice: { fontSize: 24, lineHeight: 29, fontWeight: '700', letterSpacing: -0.5 },
  planPer: { fontSize: 13, color: C.muted, marginTop: -1 },
  planSub: { fontSize: 12, color: C.muted, marginTop: 6 },
  trialChip: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: C.soft, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  trialText: { fontSize: 11, fontWeight: '600' },
  badge: { position: 'absolute', top: -11, left: 12, backgroundColor: C.ink, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#f0cf86', fontSize: 11, fontWeight: '700' },
  cta: { marginTop: 16, borderRadius: 18, overflow: 'hidden' },
  ctaBtn: { minHeight: 56, borderRadius: 18 },
  loading: { alignItems: 'center', gap: 10, paddingVertical: 18 },
  small: { fontSize: 12, lineHeight: 17, color: C.muted },
  legal: { fontSize: 11, lineHeight: 16, color: C.muted, textAlign: 'center', marginTop: 12 },
  links: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  link: { fontSize: 12, color: C.muted, textDecorationLine: 'underline', paddingVertical: 6 },
  dot: { fontSize: 12, color: C.faint },
  diag: { fontSize: 10, color: C.faint, textAlign: 'center', marginTop: 10 },
});
