// The text of a text-only card: capitals, Avenir Next Demi Bold, centred, sized to fit, lines balanced (see model/textFit).
// Used by the board card, the long-press preview, the share picture and the editor preview.
import { useMemo } from 'react';
import { Platform, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { fitCardText } from '../model/textFit';
import { AVENIR, AVENIR_WEIGHT, C } from '../theme/tokens';
import { T } from './ui';

export function CardText({ text, width, height, done, min, max, style, testID }: { text: string; width: number; height: number; done?: boolean; min?: number; max?: number; style?: StyleProp<TextStyle>; testID?: string }) {
  const fit = useMemo(() => fitCardText(text, width, height, { min, max }), [text, width, height, min, max]);
  return (
    <T
      numberOfLines={fit.lines}
      ellipsizeMode="tail"
      // Safety net on iPhone: if our estimate was a bit narrow, iOS shrinks a little instead of cutting.
      adjustsFontSizeToFit={Platform.OS === 'ios'}
      minimumFontScale={0.85}
      maxFontSizeMultiplier={1}
      style={[styles.caps, { fontSize: fit.fontSize, lineHeight: fit.lineHeight, letterSpacing: fit.letterSpacing, maxWidth: width }, done && styles.done, style]}
      testID={testID}
      accessibilityLabel={text}
    >
      {fit.text}
    </T>
  );
}

const styles = StyleSheet.create({
  caps: { fontFamily: AVENIR, fontWeight: AVENIR_WEIGHT, textTransform: 'uppercase', textAlign: 'center', color: C.ink },
  done: { textDecorationLine: 'line-through', color: C.muted },
});
