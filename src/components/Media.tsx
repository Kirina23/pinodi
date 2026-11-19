// Photo / video previews and the attachment list (.photo-preview, .detail-photo, .attachment-list).
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { getLang, t } from '../i18n';
import { fileKindLabel } from '../model/logic';
import type { Media } from '../model/types';
import { mediaSource } from '../storage/media';
import { C } from '../theme/tokens';
import { Icon } from './Icon';
import { IconButton, T, Tap } from './ui';

/** Height for a media item shown at `width`, capped at `maxH` (object-fit: contain). */
export function fitHeight(m: Media, width: number, maxH: number) {
  const w = m.width || 4;
  const h = m.height || 3;
  return Math.min(maxH, Math.round((width * h) / w));
}

export function VideoPlayer({ media, style }: { media: Media; style?: StyleProp<ViewStyle> }) {
  const player = useVideoPlayer(mediaSource(media.uri), (p) => {
    p.loop = false;
  });
  return (
    <View style={[styles.video, style]} testID="video-player">
      <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls contentFit="contain" fullscreenOptions={{ enable: true }} accessibilityLabel={media.name || t('videoOfTask')} />
    </View>
  );
}

/** Photo shown whole (contain) on the soft background, with rounded corners. */
export function PhotoView({ media, height, radius = 18, onPress, label, testID }: { media: Media; height: number; radius?: number; onPress?: () => void; label?: string; testID?: string }) {
  const src = mediaSource(media.uri);
  const img = <Image source={src} style={{ width: '100%', height, borderRadius: radius, backgroundColor: C.soft }} contentFit="contain" transition={120} accessibilityIgnoresInvertColors />;
  if (!onPress) return <View testID={testID}>{img}</View>;
  return (
    <Tap onPress={onPress} accessibilityLabel={label} testID={testID}>
      {img}
    </Tap>
  );
}

/** .attachment-list — rows with a thumbnail, name and kind; remove (editing) or open. */
export function AttachmentRows({ files, onOpen, onRemove }: { files: Media[]; onOpen?: (f: Media) => void; onRemove?: (f: Media) => void }) {
  const lang = getLang();
  if (!files.length) return null;
  return (
    <View style={styles.list}>
      {files.map((f, i) => {
        const thumb = f.kind === 'image' ? f.uri : f.kind === 'video' ? f.poster : undefined;
        const body = (
          <>
            {thumb ? <Image source={mediaSource(thumb)} style={styles.thumb} contentFit="cover" /> : <View style={styles.thumbIcon}><Icon name={f.kind === 'video' ? 'video' : 'file'} size={20} color={C.muted} /></View>}
            <View style={styles.info}>
              <T style={styles.name} numberOfLines={1}>
                {f.name}
              </T>
              <T style={styles.kind}>{fileKindLabel(f, lang)}</T>
            </View>
          </>
        );
        return (
          <View key={f.id} style={[styles.row, i > 0 && styles.sep]}>
            {onRemove ? (
              <>
                {body}
                <IconButton icon="close" plain label={t('removeFileNamed', { name: f.name })} onPress={() => onRemove(f)} iconSize={17} testID={`remove-file-${i}`} />
              </>
            ) : (
              <Tap style={styles.openRow} onPress={() => onOpen?.(f)} accessibilityLabel={f.name} testID={`file-${i}`}>
                {body}
                <Icon name={f.kind === 'file' ? 'share' : 'right'} size={17} color={C.muted} />
              </Tap>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // video.detail-photo{background:#101010;object-fit:contain;border-radius:18px}
  video: { width: '100%', borderRadius: 18, overflow: 'hidden', backgroundColor: '#101010' },
  // .attachment-list{margin:14px 0;border:1px solid var(--line);border-radius:16px;background:var(--card)}
  list: { marginVertical: 14, borderWidth: 1, borderColor: C.line, borderRadius: 16, backgroundColor: C.card, overflow: 'hidden' },
  // .attachment-row{min-height:62px;padding:8px 11px;gap:10px}
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 62, paddingVertical: 8, paddingLeft: 11, paddingRight: 4 },
  sep: { borderTopWidth: 1, borderTopColor: C.line },
  openRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingRight: 8 },
  // .attachment-row>img{width:43px;height:43px;border-radius:8px}
  thumb: { width: 43, height: 43, borderRadius: 8, backgroundColor: C.soft },
  thumbIcon: { width: 43, height: 43, borderRadius: 8, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, minWidth: 0, gap: 4, justifyContent: 'center' },
  // .attachment-info b{font-size:13px;font-weight:500}  small{font-size:11px}
  name: { fontSize: 13, fontWeight: '500' },
  kind: { fontSize: 11, color: C.muted },
});
