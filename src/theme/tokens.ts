// Design tokens copied 1:1 from the approved prototype (Photo_Plans_iPhone.html).
// :root{--bg:#f7f6f2;--card:#fff;--ink:#121210;--muted:#706e65;--line:#e7e5de;
//        --soft:#eeede7;--danger:#ae3630;--serif:Georgia,"Times New Roman",serif}
import { Platform } from 'react-native';

export const C = {
  bg: '#f7f6f2',
  card: '#ffffff',
  ink: '#121210',
  muted: '#706e65',
  line: '#e7e5de',
  soft: '#eeede7',
  danger: '#ae3630',
  // .empty-icon{color:#aaa69a}  .list-row .chev{color:#a8a599}
  faint: '#aaa69a',
  chevron: '#a8a599',
  // .grabber{background:#d6d3ca}  .upload-slot{border:1px dashed #bdb9ad}
  grabber: '#d6d3ca',
  dashed: '#bdb9ad',
  placeholder: '#a6a299',
  // #toast{background:#1c1c19}
  toast: '#1c1c19',
  // #viewer{background:#0b0b0b}
  viewer: '#0b0b0b',
  // dialog::backdrop{background:#17171366}
  backdrop: 'rgba(23,23,19,0.4)',
  checkInk: '#181818',
  checkDone: '#151513',
} as const;

// --serif: Georgia. Georgia ships with iOS, so the iPhone shows exactly the prototype's face.
export const SERIF = Platform.select({ ios: 'Georgia', default: 'Georgia, "Times New Roman", serif' });
// --sans: -apple-system → San Francisco on iOS.
export const SANS = Platform.select({ ios: undefined, default: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' });

// Text cards: Avenir Next Demi Bold in capitals. Avenir Next is built into iOS, so the app uses it
// for free (nothing is bundled). The web stand tries the real font first (Mac/iPhone browsers have it),
// otherwise shows the look-alike Nunito Sans.
export const AVENIR = Platform.select({ ios: 'Avenir Next', default: 'SnapdoAvenir, "Avenir Next", Avenir, sans-serif' });
export const AVENIR_WEIGHT = '600' as const;

export { CARD_RATIOS, FREE_CARD_LIMIT, PRO_CARD_LIMIT, MAX_FILE_MB } from '../model/constants';
