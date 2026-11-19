// Pure constants (no React Native imports, so tests can load them).

// Card aspect ratios per size step: cardLayout() [.78, 1.12, 1.6, .64]
export const CARD_RATIOS = [0.78, 1.12, 1.6, 0.64] as const;

// Free plan: 10 active cards. Pro: up to 2000 cards on the device.
export const FREE_CARD_LIMIT = 10;
export const PRO_CARD_LIMIT = 2000;

// Largest single file we accept. The web prototype used 35 MB because it kept files as text;
// the app keeps real files on disk, so a larger limit is safe.
export const MAX_FILE_MB = 200;

// Picking more than this many files at once is refused (prototype: "Выбери до 40 файлов за раз").
export const MAX_PICK = 40;
/** Text cards: up to 200 characters (the card shrinks the font; the rest is one tap away). */
export const TEXT_CARD_MAX = 200;
