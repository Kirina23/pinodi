// "Поделиться": a picture of the plan (makeBoard() from the prototype, drawn with views
// and captured as PNG) or the plan as text.
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Platform, Share, StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { Icon } from '../components/Icon';
import { CardText } from '../components/CardText';
import { Btn, SheetTitle, T, serif } from '../components/ui';
import { useScreen } from '../hooks/useScreen';
import { getLang, t } from '../i18n';
import { boardHeight, cardLayout } from '../model/layout';
import { dateLabel, rangeText, todayNoon } from '../model/logic';
import { shareText } from '../model/share';
import type { Task } from '../model/types';
import { mediaSource } from '../storage/media';
import { useApp } from '../state/AppState';
import { useUI } from '../state/UI';
import { C } from '../theme/tokens';

const W = 360; // logical width; captured at 1080 px like the prototype's canvas
const K = W / 1080;
// Text cards on the picture: room for the check (top) and the date (bottom).
const TEXT_SIDE = 22 * K;
// Same room above and below, so the text block sits in the middle of the card.
const TEXT_INSET = 64 * K;

function boardGeometry(items: Task[]) {
  const pad = 48 * K;
  const gap = 28 * K;
  const top = 190 * K;
  const boxes = cardLayout(items, W - 2 * pad, gap);
  const height = Math.max(420 * K, boardHeight(boxes)) + top + 90 * K;
  return { pad, top, boxes, height };
}

export function ShareBoard({ items, title, range, onImagesReady }: { items: Task[]; title: string; range: string; onImagesReady?: () => void }) {
  const lang = getLang();
  const today = todayNoon();
  const { pad, top, boxes, height } = useMemo(() => boardGeometry(items), [items]);
  const withImages = items.filter((x) => x.cover).length;
  const loaded = useRef(0);
  useEffect(() => {
    if (!withImages) onImagesReady?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withImages]);
  return (
    <View style={{ width: W, height, backgroundColor: C.bg }} collapsable={false}>
      <T style={[styles.title, { left: pad, right: pad }]} numberOfLines={1} maxFontSizeMultiplier={1}>
        {title}
      </T>
      <T style={[styles.range, { left: pad }]} maxFontSizeMultiplier={1}>
        {range}
      </T>
      {items.map((task, i) => {
        const b = boxes[i];
        const src = task.cover ? mediaSource(task.cover.kind === 'video' ? task.cover.poster : task.cover.uri) : null;
        return (
          <View key={task.id} style={[styles.card, !src && task.cover?.kind !== 'video' && styles.textCard, { left: pad + b.x, top: top + b.y, width: b.w, height: b.h }]}>
            {src ? (
              <Image
                source={src}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                onLoad={() => {
                  loaded.current++;
                  if (loaded.current >= withImages) onImagesReady?.();
                }}
                onError={() => {
                  loaded.current++;
                  if (loaded.current >= withImages) onImagesReady?.();
                }}
              />
            ) : null}
            {src && (task.title || task.due) ? <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.73)']} style={styles.shade} /> : null}
            {src ? (
              <View style={styles.copy}>
                {task.title ? (
                  <T style={styles.cardTitle} numberOfLines={2} maxFontSizeMultiplier={1}>
                    {task.title}
                  </T>
                ) : null}
                {task.due ? (
                  <T style={styles.due} maxFontSizeMultiplier={1}>
                    {dateLabel(task.due, today, lang)}
                  </T>
                ) : null}
              </View>
            ) : task.cover?.kind === 'video' ? (
              // A video without a frame: dark with a play sign, as on the board.
              <View style={[StyleSheet.absoluteFill, { backgroundColor: '#22231f', alignItems: 'center', justifyContent: 'center' }]}>
                <Icon name="play" size={18} color="rgba(255,255,255,0.86)" />
              </View>
            ) : (
              // Text card: capitals, centred, sized to fit — as on the board.
              <>
                <View style={[styles.textBox, { top: TEXT_INSET, bottom: TEXT_INSET }]}>
                  <CardText text={task.title || t('untitled')} width={b.w - 2 * TEXT_SIDE} height={b.h - 2 * TEXT_INSET} done={task.done} min={8} max={28} />
                </View>
                {task.due ? (
                  <T style={styles.textDue} maxFontSizeMultiplier={1}>
                    {dateLabel(task.due, today, lang)}
                  </T>
                ) : null}
              </>
            )}
            <View style={styles.check}>
              <View style={[styles.ring, task.done && styles.ringDone]}>{task.done ? <Icon name="check" size={9} color="#fff" weight="bold" /> : null}</View>
            </View>
          </View>
        );
      })}
      <T style={[styles.footer, { left: pad }]} maxFontSizeMultiplier={1}>
        {t('boardFooter')}
      </T>
    </View>
  );
}

export function ShareSheet({ ids, title }: { ids: string[]; title: string }) {
  const ui = useUI();
  const app = useApp();
  const scr = useScreen();
  const lang = getLang();
  const items = useMemo(() => ids.map((id) => app.data.tasks.find((x) => x.id === id)).filter(Boolean) as Task[], [ids, app.data.tasks]);
  const range = rangeText(ui.period, ui.anchor, lang);
  const boardRef = useRef<ComponentRef<typeof View>>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  // Images may never report (e.g. offline poster); don't block sharing for more than 2.5 s.
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(id);
  }, []);

  const { height } = useMemo(() => boardGeometry(items), [items]);
  const boxW = Math.min(scr.width, 560) - 40;
  const boxH = scr.height * 0.43;
  const scale = Math.min(boxW / W, boxH / height, 1.6);

  const shareImage = async () => {
    setBusy(true);
    try {
      const uri = await captureRef(boardRef, { format: 'png', quality: 1, result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile', width: 1080, height: Math.round((1080 * height) / W) });
      if (Platform.OS === 'web') {
        const a = document.createElement('a');
        a.href = uri;
        a.download = 'Pinodi.png';
        a.click();
      } else await Share.share({ url: uri, title });
    } catch (e) {
      if (String((e as Error)?.message || '').toLowerCase().includes('cancel')) return;
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const shareAsText = async () => {
    const text = shareText(items, title, range, todayNoon(), lang);
    try {
      await Share.share({ message: text, title });
    } catch {
      try {
        await (globalThis as { navigator?: { clipboard?: { writeText(s: string): Promise<void> } } }).navigator?.clipboard?.writeText(text);
        ui.toast(t('textCopied'));
      } catch {
        ui.toast(t('shareFailed'));
      }
    }
  };

  return (
    <View>
      <SheetTitle title={t('share')} onClose={ui.closeSheet} closeLabel={t('close')} />
      <View style={[styles.preview, { height: height * scale + 0 }]} accessibilityLabel={t('planPreview')} accessible testID="share-preview">
        <View style={{ width: W * scale, height: height * scale, overflow: 'hidden', borderRadius: 13 }}>
          <View style={{ width: W, height, transform: [{ scale }], transformOrigin: 'top left' }}>
            <View ref={boardRef} collapsable={false}>
              <ShareBoard items={items} title={title} range={range} onImagesReady={() => setReady(true)} />
            </View>
          </View>
        </View>
      </View>
      {failed ? <T style={styles.failed}>{t('imageFailed')}</T> : null}
      <View style={{ gap: 10 }}>
        <Btn icon="share" title={ready ? t('shareImage') : t('preparingImage')} onPress={shareImage} disabled={!ready || busy} testID="share-image" />
        <Btn kind="secondary" icon="text" title={t('shareText')} onPress={shareAsText} testID="share-text" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // .share-preview{max-height:43dvh;object-fit:contain;border-radius:13px;background:var(--soft);margin-bottom:16px}
  preview: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.soft, borderRadius: 13, marginBottom: 16, overflow: 'hidden' },
  failed: { fontSize: 13, color: C.muted, marginBottom: 12, textAlign: 'center' },
  title: { ...serif, position: 'absolute', top: 34 * K, fontSize: 52 * K, lineHeight: 60 * K, color: C.ink },
  range: { position: 'absolute', top: 108 * K, fontSize: 24 * K, lineHeight: 30 * K, color: '#79786f' },
  card: { position: 'absolute', borderRadius: 26 * K, overflow: 'hidden', backgroundColor: C.soft },
  textCard: { backgroundColor: C.card, borderWidth: 2 * K, borderColor: C.line },
  textBox: { position: 'absolute', left: TEXT_SIDE, right: TEXT_SIDE, alignItems: 'center', justifyContent: 'center' },
  textDue: { position: 'absolute', left: TEXT_SIDE, right: TEXT_SIDE, bottom: 20 * K, textAlign: 'center', color: '#79786f', fontSize: 22 * K, lineHeight: 28 * K },
  // createLinearGradient(0, y+h*.4, 0, y+h): #0000 → #000b
  shade: { position: 'absolute', left: 0, right: 0, top: '40%', bottom: 0 },
  copy: { position: 'absolute', left: 25 * K, right: 25 * K, bottom: 20 * K },
  cardTitle: { color: '#fff', fontSize: 30 * K, lineHeight: 34 * K, fontWeight: '500' },
  due: { color: 'rgba(255,255,255,0.87)', fontSize: 22 * K, lineHeight: 28 * K, marginTop: 4 * K },
  check: { position: 'absolute', top: 16 * K, right: 16 * K, width: 42 * K, height: 42 * K, borderRadius: 21 * K, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  ring: { width: 28 * K, height: 28 * K, borderRadius: 14 * K, borderWidth: 2 * K, borderColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  ringDone: { backgroundColor: C.ink },
  footer: { position: 'absolute', bottom: 24 * K, fontSize: 20 * K, lineHeight: 26 * K, color: '#79786f' },
});
