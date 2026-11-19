// function seed(): the example plan a new user sees (can be removed with "Убрать примеры").
import { addDays, iso } from '../i18n/format';
import { t, type Lang, type StringKey } from '../i18n';
import type { AppData, CardSize, Media, Task } from './types';

export const DEMO_PHOTOS = ['brand', 'journal', 'interior', 'camera', 'paint'] as const;
export type DemoPhoto = (typeof DEMO_PHOTOS)[number];

// Pixel sizes of the bundled photos (assets/demo/*.jpg), so the preview knows their shape.
const DEMO_SIZE: Record<DemoPhoto, [number, number]> = {
  brand: [850, 569],
  journal: [850, 638],
  interior: [850, 448],
  camera: [850, 1063],
  paint: [850, 567],
};

export function demoMedia(key: DemoPhoto): Media {
  const [width, height] = DEMO_SIZE[key];
  return { id: `demo-photo-${key}`, name: `${key}.jpg`, kind: 'image', mime: 'image/jpeg', uri: `demo:${key}`, size: 0, width, height };
}

export function seedData(today: Date, lang: Lang): AppData {
  const mk = (id: string, title: StringKey, photo: DemoPhoto, offset: number | null, size: CardSize, listId: string, note?: StringKey): Task => ({
    id,
    title: t(title, undefined, lang),
    note: note ? t(note, undefined, lang) : '',
    due: offset === null ? '' : iso(addDays(today, offset)),
    listId,
    done: false,
    size,
    demo: true,
    cover: demoMedia(photo),
    files: [],
    createdAt: 0,
  });
  return {
    version: 1,
    lists: [
      { id: 'work', name: t('listWork', undefined, lang) },
      { id: 'personal', name: t('listPersonal', undefined, lang) },
    ],
    tasks: [
      // No dates on the examples: a date appears only when the person picks one.
      mk('demo-brand', 'demoBrand', 'brand', null, 1, 'work', 'demoBrandNote'),
      mk('demo-journal', 'demoJournal', 'journal', null, 0, 'personal', 'demoJournalNote'),
      mk('demo-interior', 'demoInterior', 'interior', null, 2, 'personal'),
      mk('demo-camera', 'demoCamera', 'camera', null, 1, 'work', 'demoCameraNote'),
      mk('demo-paint', 'demoPaint', 'paint', null, 0, 'personal'),
      mk('demo-month', 'demoPortfolio', 'journal', null, 2, 'work'),
    ],
    settings: {},
  };
}
