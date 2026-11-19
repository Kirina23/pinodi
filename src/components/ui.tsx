// Shared building blocks, each matching a CSS class from the prototype.
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, type PressableProps, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { C, SANS, SERIF } from '../theme/tokens';
import { Icon, type IconName } from './Icon';

export const sans: TextStyle = SANS ? { fontFamily: SANS } : {};
export const serif: TextStyle = { fontFamily: SERIF };

/** Text in the app's sans face. */
export function T({ style, ...p }: React.ComponentProps<typeof Text>) {
  return <Text {...p} style={[sans, { color: C.ink }, style]} maxFontSizeMultiplier={p.maxFontSizeMultiplier ?? 1.35} />;
}

/** button:active:not(:disabled){opacity:.72}  button:disabled{opacity:.38} */
export function Tap({ style, disabled, ...p }: PressableProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      {...p}
      disabled={disabled}
      style={({ pressed }) => [style, disabled ? { opacity: 0.38 } : pressed ? { opacity: 0.72 } : null]}
    />
  );
}

/** .icon-btn{width:44px;height:44px;border-radius:50%;background:var(--card);border:1px solid var(--line)} */
export function IconButton({ icon, label, onPress, plain, dark, size = 44, iconSize = 22, color, style, disabled, testID }: { icon: IconName; label: string; onPress?: () => void; plain?: boolean; dark?: boolean; size?: number; iconSize?: number; color?: string; style?: StyleProp<ViewStyle>; disabled?: boolean; testID?: string }) {
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel={label}
      disabled={disabled}
      testID={testID}
      hitSlop={size < 44 ? (44 - size) / 2 : undefined}
      style={[
        { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' },
        plain ? null : dark ? { backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' } : { backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
        style,
      ]}
    >
      <Icon name={icon} size={iconSize} color={color ?? (dark ? '#fff' : C.ink)} />
    </Tap>
  );
}

/** .btn / .btn.secondary / .btn.quiet */
export function Btn({ title, onPress, kind = 'primary', icon, disabled, style, testID }: { title: string; onPress?: () => void; kind?: 'primary' | 'secondary' | 'quiet'; icon?: IconName; disabled?: boolean; style?: StyleProp<ViewStyle>; testID?: string }) {
  const fg = kind === 'primary' ? C.bg : kind === 'quiet' ? C.muted : C.ink;
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityLabel={title}
      style={[s.btn, kind === 'secondary' && s.btnSecondary, kind === 'quiet' && s.btnQuiet, style]}
    >
      {icon ? <Icon name={icon} size={20} color={fg} /> : null}
      <T style={[s.btnText, { color: fg }, kind === 'quiet' && { fontWeight: '400' }]}>{title}</T>
    </Tap>
  );
}

/** .sheet-heading: serif 27px title + 44px close button */
export function SheetTitle({ title, onClose, closeLabel }: { title: string; onClose: () => void; closeLabel: string }) {
  return (
    <View style={s.heading}>
      <T style={s.headingText} accessibilityRole="header" numberOfLines={3}>
        {title}
      </T>
      <IconButton icon="close" label={closeLabel} onPress={onClose} iconSize={18} testID="sheet-close" />
    </View>
  );
}

/** .action-row: icon · label · small note (right), 60pt high, hairline on top. */
export function ActionRow({ icon, label, note, onPress, danger, first, right, testID, selected }: { icon: IconName; label: string; note?: string; onPress: () => void; danger?: boolean; first?: boolean; right?: React.ReactNode; testID?: string; selected?: boolean }) {
  const color = danger ? C.danger : C.ink;
  return (
    <Tap onPress={onPress} testID={testID} accessibilityLabel={note ? `${label}, ${note}` : label} accessibilityState={selected === undefined ? undefined : { selected }} style={[s.actionRow, first && { borderTopWidth: 0 }]}>
      <Icon name={icon} size={22} color={color} />
      <T style={[s.actionLabel, { color }]}>{label}</T>
      {note ? <T style={s.actionNote}>{note}</T> : null}
      {right}
    </Tap>
  );
}

/** .form-rows / .form-row */
export function FormRows({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[s.formRows, style]}>
      {items.map((c, i) => (
        <View key={i} style={i > 0 ? s.formSep : null}>
          {c}
        </View>
      ))}
    </View>
  );
}

export function FormRow({ icon, label, children }: { icon: IconName; label: string; children: React.ReactNode }) {
  return (
    <View style={s.formRow}>
      <Icon name={icon} size={20} />
      <T style={s.formLabel}>{label}</T>
      {children}
    </View>
  );
}

/** .field + .field-label + .input */
/** Height for a multiline input that grows with its text (on iPhone and in the browser alike). */
export function useGrow(min: number) {
  const [h, setH] = useState(0);
  const onContentSizeChange = (e: { nativeEvent: { contentSize: { height: number } } }) => {
    // iOS reports the text's own size (+2 for the 1 pt border); the browser reports scrollHeight,
    // which already equals the box once the box is big enough — adding anything there would grow forever.
    const next = Math.min(4000, Math.ceil(e.nativeEvent.contentSize.height) + (Platform.OS === 'web' ? 0 : 2));
    // In the browser the box can only grow (scrollHeight never reports less than the box), and
    // tiny differences are ignored, so the height can never ping-pong between two values.
    setH((prev) => (Platform.OS === 'web' ? (next > prev + 2 ? next : prev) : Math.abs(prev - next) > 2 ? next : prev));
  };
  return { onContentSizeChange, style: { height: Math.max(min, h) } };
}

export function Field({ label, style, multiline, inputStyle, grow: growOn = true, ...p }: TextInputProps & { label: string; inputStyle?: StyleProp<TextStyle>; /** false: the caller sets the height */ grow?: boolean }) {
  // Multiline fields grow with the text (the sheet scrolls), instead of scrolling inside a small box.
  const flat = StyleSheet.flatten([s.textarea, inputStyle]) as TextStyle;
  const grow = useGrow(typeof flat.minHeight === 'number' ? flat.minHeight : 65);
  return (
    <View style={[s.field, style as StyleProp<ViewStyle>]}>
      <T style={s.fieldLabel}>{label}</T>
      <TextInput
        placeholderTextColor={C.placeholder}
        multiline={multiline}
        accessibilityLabel={label}
        scrollEnabled={!multiline}
        onContentSizeChange={multiline && growOn ? grow.onContentSizeChange : undefined}
        {...p}
        style={[sans, s.input, multiline && s.textarea, inputStyle, multiline && growOn && grow.style]}
        maxFontSizeMultiplier={1.4}
      />
    </View>
  );
}

export const s = StyleSheet.create({
  // .btn{min-height:51px;padding:13px 17px;border-radius:16px;background:var(--ink);font-weight:550;font-size:15px;gap:10px}
  btn: { minHeight: 51, paddingVertical: 13, paddingHorizontal: 17, borderRadius: 16, backgroundColor: C.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, alignSelf: 'stretch' },
  btnSecondary: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  btnQuiet: { backgroundColor: 'transparent' },
  btnText: { fontSize: 15, fontWeight: '600' },
  // .sheet-heading{margin:4px 0 17px;gap:12px}  h2{font:400 27px/1.2 serif;letter-spacing:-.7px}
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4, marginBottom: 17 },
  headingText: { ...serif, flex: 1, fontSize: 27, lineHeight: 32, letterSpacing: -0.7 },
  // .action-row{min-height:60px;gap:15px;border-top:1px solid var(--line);padding:12px 6px}
  actionRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 15, borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: C.line, paddingVertical: 12, paddingHorizontal: 6 },
  actionLabel: { flex: 1, fontSize: 16 },
  actionNote: { fontSize: 12, color: C.muted },
  // .form-rows{border:1px solid var(--line);border-radius:16px;background:var(--card);margin-top:16px}
  formRows: { borderWidth: 1, borderColor: C.line, borderRadius: 16, backgroundColor: C.card, marginTop: 16, overflow: 'hidden' },
  formSep: { borderTopWidth: 1, borderTopColor: C.line },
  // .form-row{padding:5px 14px;min-height:55px;gap:12px}  >span{font-size:14px}
  formRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 5, paddingHorizontal: 14, minHeight: 55 },
  formLabel: { fontSize: 14, flex: 1 },
  // .field{margin-bottom:14px}  .field-label{font-size:12px;color:var(--muted);margin:0 3px 7px}
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, color: C.muted, marginHorizontal: 3, marginBottom: 7 },
  // .input{border:1px solid var(--line);border-radius:14px;min-height:48px;padding:12px 14px;background:var(--card)}
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 14, minHeight: 48, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: C.card, fontSize: 16, color: C.ink, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null) },
  textarea: { minHeight: 65, lineHeight: 23, textAlignVertical: 'top' },
});
