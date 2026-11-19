// "Upgrade ›" — a small dark pill in the header, next to Share and ☰ (same English word in every language).
// After the purchase it becomes "Pro" (no light sweep) and opens the Pro sheet with the subscription.
// One short word so it never wraps; while the one-time offer runs it shows its countdown.
import { StyleSheet, View } from 'react-native';
import { t } from '../i18n';
import { C } from '../theme/tokens';
import { Icon } from './Icon';
import { Shine } from './Shine';
import { T, Tap } from './ui';

export function ProPill({ onPress, compact, timer, pro }: { onPress: () => void; compact?: boolean; /** "52:13" while the one-time offer runs */ timer?: string; /** bought: shows "Pro" */ pro?: boolean }) {
  const label = pro ? t('proBadge') : timer ? t('offerPill', { time: timer }) : t('upgradeNow');
  return (
    <Tap onPress={onPress} style={styles.hit} accessibilityRole="button" accessibilityLabel={pro ? t('proBadgeLabel') : timer ? t('offerPillLabel', { time: timer }) : t('upgradeNow')} accessibilityHint={timer || pro ? undefined : t('upgradeHint')} testID="pro-pill">
      <View style={[styles.pill, compact && styles.pillCompact]}>
        <T style={[styles.text, compact && { fontSize: 13 }, !!timer && styles.timer]} maxFontSizeMultiplier={1.2} numberOfLines={1}>
          {label}
        </T>
        <Icon name="right" size={12} color={C.bg} weight="bold" />
        {pro ? null : <Shine radius={17} />}
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  // 44 pt touch target around a 34 pt pill.
  hit: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 34, paddingLeft: 14, paddingRight: 12, borderRadius: 17, backgroundColor: C.ink, overflow: 'hidden' },
  pillCompact: { paddingLeft: 12, paddingRight: 10, gap: 4 },
  text: { color: C.bg, fontSize: 14, fontWeight: '600', letterSpacing: -0.1 },
  timer: { fontVariant: ['tabular-nums'] },
});
