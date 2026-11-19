// Text-only cards: the text is set in capitals (Avenir Next Demi Bold) and the font size is
// picked so the whole text fits the card — short text is big, long text gets smaller.
// The lines are balanced (about the same length, like a poster) and the block sits exactly in
// the middle of the card. If even the smallest size does not fit, the card shows as many lines
// as fit and ends with "…" (the full text is one tap away, and a bigger card shows more). Pure and tested.

/** Where the text may go inside a text card (pt from the card edges). */
export const TEXT_CARD = {
  side: 16,
  /** Same room at the top (round check, 13…43 pt) and at the bottom (date line), so the text
   *  block is centred in the card itself, not in what is left between them. */
  inset: 44,
  /** Layout mode: move / delete handles on top, − / + along the bottom. */
  insetLayout: 50,
  /** A small card: room kept at the bottom for the date line (it sits 13 pt from the edge). */
  dateRoom: 28,
  min: 13,
  /** Only on a small card where 13 pt cannot show the text whole. */
  floor: 10,
  /** A text box narrower than this is a «small card» (iPhone Duo closed, 2 columns + side bar). */
  narrow: 120,
  max: 40,
  lineHeight: 1.12,
  tracking: 0.02,
  /** Lines are filled to 97 % of the box: room for kerning and rounding. */
  slack: 0.97,
} as const;

// Advance widths of the capitals, in em: for each character the wider of Avenir Next Demi Bold
// and Nunito Sans Bold (the web stand's stand-in), measured. Guessing a bit too wide only makes
// the text a point smaller; guessing too narrow would break a word in the middle.
const WIDTHS: [string, number][] = [
  ['\'', 0.24],
  ['.,:;!', 0.25],
  ['IІЇ', 0.28],
  ['/', 0.31],
  ['()', 0.36],
  ['-', 0.43],
  ['"', 0.45],
  ['?', 0.46],
  ['J', 0.47],
  ['«»', 0.49],
  ['–', 0.5],
  ['FLГҐ', 0.56],
  ['0123456789EZЕЁ+#', 0.6],
  ['TYТ', 0.62],
  ['SЗ', 0.63],
  ['PР', 0.65],
  ['KУ', 0.66],
  ['XБКХЬ', 0.67],
  ['Є', 0.68],
  ['BRВЭЯ', 0.69],
  ['CСЧ', 0.7],
  ['V', 0.71],
  ['&', 0.73],
  ['AUА', 0.74],
  ['NИЙЛ', 0.75],
  ['DG', 0.76],
  ['HНП', 0.77],
  ['OQДО', 0.8],
  ['ЦЪ', 0.81],
  ['MМ', 0.87],
  ['Ф', 0.88],
  ['Ы', 0.9],
  ['%', 0.94],
  ['@', 0.95],
  ['—', 1],
  ['Ж', 1.01],
  ['Ю', 1.05],
  ['Ш', 1.07],
  ['№', 1.1],
  ['WЩ', 1.11],
];
const TABLE = new Map<string, number>();
for (const [chars, em] of WIDTHS) for (const ch of Array.from(chars)) TABLE.set(ch, em);
const SPACE = 0.27;

const NBSP = '\u00A0';

export function charWidth(ch: string) {
  if (ch === ' ' || ch === '\t' || ch === NBSP) return SPACE;
  const known = TABLE.get(ch);
  if (known !== undefined) return known;
  // Emoji and other symbols: about one em; other letters: a wide capital.
  return (ch.codePointAt(0) ?? 0) > 0x2000 ? 1.1 : 0.8;
}

/** Width of `word` in em (capitals), including tracking. */
export function wordWidth(word: string, tracking: number = TEXT_CARD.tracking) {
  let w = 0;
  for (const ch of Array.from(word.toUpperCase())) w += charWidth(ch) + tracking;
  return w;
}

/** Width of a whole line in em (words joined by single spaces). */
export function lineWidth(line: string, tracking: number = TEXT_CARD.tracking) {
  const words = line.split(' ').filter(Boolean);
  return words.reduce((sum, w, i) => sum + wordWidth(w, tracking) + (i ? SPACE + tracking : 0), 0);
}

/** Greedy wrap into lines of at most `lineEm` em (hard line breaks kept; a word longer than a line is split by letters). */
export function wrapLines(text: string, lineEm: number, tracking: number = TEXT_CARD.tracking): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    const words = para.split(/[ \t]+/).filter(Boolean);
    if (!words.length) {
      out.push('');
      continue;
    }
    let line = '';
    let used = 0;
    for (const word of words) {
      const w = wordWidth(word, tracking);
      const space = used > 0 ? SPACE + tracking : 0;
      if (used + space + w <= lineEm) {
        line = line ? `${line} ${word}` : word;
        used += space + w;
        continue;
      }
      if (line) out.push(line);
      line = '';
      used = 0;
      if (w <= lineEm) {
        line = word;
        used = w;
      } else {
        // A word longer than the line is broken by letters.
        let part = '';
        let pw = 0;
        for (const ch of Array.from(word)) {
          const cw = charWidth(ch.toUpperCase()) + tracking;
          if (pw + cw > lineEm && part) {
            out.push(part);
            part = '';
            pw = 0;
          }
          part += ch;
          pw += cw;
        }
        line = part;
        used = pw;
      }
    }
    out.push(line);
  }
  return out;
}

/** How many lines `text` takes when wrapped greedily into `lineEm` em per line. */
export function countLines(text: string, lineEm: number, tracking: number = TEXT_CARD.tracking) {
  if (lineEm <= 0) return Infinity;
  return wrapLines(text, lineEm, tracking).length;
}

/**
 * Same number of lines as the greedy wrap, but the lines as even as possible: the narrowest
 * width that still gives that many lines (like CSS text-wrap: balance). No word is split.
 */
export function balanceLines(text: string, lineEm: number, tracking: number = TEXT_CARD.tracking): string[] {
  const greedy = wrapLines(text, lineEm, tracking);
  const n = greedy.length;
  if (n < 2) return greedy;
  let lo = Math.max(...text.split(/[ \t\n]+/).filter(Boolean).map((w) => wordWidth(w, tracking)));
  let hi = lineEm;
  if (lo > hi) return greedy;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (wrapLines(text, mid, tracking).length <= n) hi = mid;
    else lo = mid;
  }
  const lines = wrapLines(text, hi, tracking);
  return lines.length === n ? lines : greedy;
}

export interface TextFit {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  /** numberOfLines for the Text: all lines when it fits, otherwise as many as the box holds. */
  lines: number;
  /** false → even the smallest size is too big; the text ends with "…". */
  fits: boolean;
  /** What to draw: balanced lines joined by line breaks when it fits, else the text as typed. */
  text: string;
}

const LETTER = /[A-Za-zА-Яа-яЁёІіЇїЄєҐґ]/;
/**
 * Short words (1–2 letters: «в», «к», «и», «на», «до», "a", "to"…) stay with the next word,
 * so no line ends with a hanging preposition — the usual rule of Russian typography.
 */
export function glueShortWords(text: string) {
  return text
    .split('\n')
    .map((para) => {
      const words = para.split(/[ \t]+/).filter(Boolean);
      let out = '';
      words.forEach((w, i) => {
        if (i === 0) out = w;
        else out += (Array.from(words[i - 1]).length <= 2 && LETTER.test(words[i - 1]) ? NBSP : ' ') + w;
      });
      return out;
    })
    .join('\n');
}

/** Moves a short word left hanging at a line end («… и») to the next line, where it still fits. */
export function unhang(lines: string[], lineEm: number): string[] {
  const out = lines.slice();
  for (let i = 0; i < out.length - 1; i++) {
    const words = out[i].split(' ');
    const last = words[words.length - 1];
    if (words.length < 2 || Array.from(last).length > 2 || !LETTER.test(last) || !out[i + 1]) continue;
    const next = `${last} ${out[i + 1]}`;
    if (lineWidth(next) <= lineEm) {
      out[i] = words.slice(0, -1).join(' ');
      out[i + 1] = next;
    }
  }
  return out;
}

/** Biggest font size (min…max, whole points) at which `text` fits a box of `width` × `height`. */
export function fitCardText(text: string, width: number, height: number, opts: { min?: number; max?: number } = {}): TextFit {
  const min = opts.min ?? TEXT_CARD.min;
  // Never more than ~1/4.6 of the box width, so one short word does not shout.
  const max = Math.max(min, Math.min(opts.max ?? TEXT_CARD.max, Math.floor(width / 4.6)));
  const clean = text.replace(/\r/g, '').trim() || ' ';
  const make = (size: number, lines: number, fits: boolean, shown: string): TextFit => ({
    fontSize: size,
    lineHeight: Math.round(size * TEXT_CARD.lineHeight),
    letterSpacing: Math.round(size * TEXT_CARD.tracking * 10) / 10,
    lines: Math.max(1, lines),
    fits,
    text: shown,
  });
  const attempt = (src: string, lo: number = min): TextFit | null => {
    // Never break a word in the middle when a smaller size would keep it whole.
    const longest = Math.max(0, ...src.split(/[ \t\n]+/).map((w) => wordWidth(w)));
    const wholeWords = longest > 0 ? Math.floor((width * TEXT_CARD.slack) / longest) : max;
    if (wholeWords < lo) return null;
    const top = Math.min(max, wholeWords);
    for (let size = top; size >= lo; size--) {
      const lh = Math.round(size * TEXT_CARD.lineHeight);
      const room = Math.floor(height / lh);
      if (room < 1) continue;
      const lineEm = (width * TEXT_CARD.slack) / size;
      const need = countLines(src, lineEm);
      if (need <= room) return make(size, need, true, unhang(balanceLines(src, lineEm), lineEm).join('\n').split(NBSP).join(' '));
    }
    return null;
  };
  // Prefer keeping short words with the next one; if that cannot fit, try without.
  const fit = attempt(glueShortWords(clean)) ?? attempt(clean);
  if (fit) return fit;
  // Does not fit at the usual smallest size (a long text on a small card, e.g. iPhone Duo closed):
  // first try a little smaller (down to 10 pt) with whole words; if still too long, show as many
  // whole lines as there is room for and end the last one with «…» after a whole word.
  // (Below 13 pt only on narrow cards: on a normal card a long text stays readable and gets «…».)
  const FLOOR = width < TEXT_CARD.narrow ? TEXT_CARD.floor : min;
  const small = attempt(glueShortWords(clean), FLOOR) ?? attempt(clean, FLOOR);
  if (small) return small;
  const size = FLOOR;
  const lh = Math.round(size * TEXT_CARD.lineHeight);
  const room = Math.max(1, Math.floor(height / lh));
  const lineEm = (width * TEXT_CARD.slack) / size;
  const lines: string[] = [];
  for (const word of clean.split(/[ \t\n]+/).filter(Boolean)) {
    const cur = lines[lines.length - 1];
    if (cur !== undefined && lineWidth(cur + ' ' + word) <= lineEm) lines[lines.length - 1] = cur + ' ' + word;
    else lines.push(word);
  }
  const shown = lines.slice(0, room);
  if (lines.length > room) {
    let last = shown[room - 1];
    while (last.includes(' ') && lineWidth(last + '…') > lineEm) last = last.slice(0, last.lastIndexOf(' '));
    shown[room - 1] = last.replace(/[\s,.:;—-]+$/, '') + '…';
  }
  return make(size, shown.length, false, shown.join('\n'));
}

/** The text box of a card of w × h: the same inset at the top and the bottom, so it is centred. */
export function textCardBox(w: number, h: number, opts: { date?: boolean; layout: boolean }) {
  const inset = opts.layout ? TEXT_CARD.insetLayout : TEXT_CARD.inset;
  return { width: Math.max(10, w - TEXT_CARD.side * 2), height: Math.max(10, h - inset * 2), top: inset, bottom: inset };
}

/** The box for a given text: centred if the text fits that way; on a narrow card (narrow columns,
 *  e.g. iPhone Duo closed with its side bar) where it would not, the bottom room shrinks to what
 *  the date line needs (or almost nothing without a date) — the text stays clear of the check at
 *  the top and is shown whole instead of «ХЛЕБ И МОЛ…». */
export function textCardBoxFor(text: string, w: number, h: number, opts: { date: boolean; layout: boolean }) {
  const box = textCardBox(w, h, opts);
  const f = fitCardText(text, box.width, box.height);
  if (opts.layout || (f.fits && f.fontSize >= TEXT_CARD.min)) return box;
  const bottom = opts.date ? TEXT_CARD.dateRoom : TEXT_CARD.side;
  const compact = { ...box, height: Math.max(10, h - box.top - bottom), bottom };
  // Only on a narrow card: on a normal card (iPhone, iPad) the text always stays centred, and a text
  // too long for it ends with «…» after a whole word.
  return box.width < TEXT_CARD.narrow ? compact : box;
}
