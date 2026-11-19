// iPhone/iPad: real Apple SF Symbols.
import { SymbolView } from 'expo-symbols';
import { C } from '../theme/tokens';
import { SF, type IconProps } from './iconNames';

export type { IconName, IconWeight } from './iconNames';

export function Icon({ name, size = 22, color = C.ink, weight = 'regular', bounceKey }: IconProps) {
  return (
    <SymbolView
      key={bounceKey ? String(bounceKey) : undefined}
      name={SF[name]}
      size={size}
      tintColor={color}
      weight={weight}
      resizeMode="scaleAspectFit"
      animationSpec={bounceKey ? { effect: { type: 'bounce', wholeSymbol: true }, repeating: false } : undefined}
      style={{ width: size, height: size }}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
