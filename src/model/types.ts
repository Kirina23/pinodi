export type MediaKind = 'image' | 'video' | 'file';

/**
 * A file attached to a task. `uri` is never an absolute device path:
 *  - "demo:<key>"       bundled example photo/video
 *  - "media/<file>"     a file inside the app's Documents folder (resolved at runtime,
 *                       because iOS changes the container path between app updates)
 *  - "data:…" / "blob:…" only on the web stand
 */
export interface Media {
  id: string;
  name: string;
  kind: MediaKind;
  mime: string;
  uri: string;
  size: number;
  width?: number;
  height?: number;
  /** Seconds (video). */
  duration?: number;
  /** Poster frame for videos, same uri rules. */
  poster?: string;
}

export type CardSize = 0 | 1 | 2 | 3;

export interface Task {
  id: string;
  title: string;
  note: string;
  /** "YYYY-MM-DD" or "" for no date. */
  due: string;
  /** List id or "" for no list. */
  listId: string;
  done: boolean;
  size: CardSize;
  demo?: boolean;
  /** The picture on the card: an image, or a video (its poster is shown). */
  cover: Media | null;
  /** Other attachments. */
  files: Media[];
  createdAt: number;
}

export interface TaskList {
  id: string;
  name: string;
}

export interface AppData {
  version: 1;
  lists: TaskList[];
  tasks: Task[];
  settings: Settings;
}

export interface NotifySettings {
  /** Morning message on days that have tasks with that date. */
  today: boolean;
  /** One gentle "come back" message after 3 days without opening the app. */
  nudge: boolean;
  /** Sunday evening: the plan for the coming week. */
  weekly: boolean;
  /** Hour (0–23) of the morning message. */
  hour: number;
}

export interface Settings {
  /** Last known Pro state, so the app works offline right after launch. */
  proCache?: boolean;
  /** The main board's own name instead of "Задачи" (e.g. "Задачи на неделю"). */
  allTitle?: string;
  notify?: NotifySettings;
  /** The app already asked once whether to turn on reminders. */
  notifyAsked?: boolean;
  /** First launch (ms) — the discount offer comes after 3 weeks. */
  firstOpenAt?: number;
  /** When the one-hour discount offer started (ms). It is shown once and never restarts. */
  offerStartedAt?: number;
  /** The "these are example cards — remove them" tip was closed. */
  demoHintHidden?: boolean;
}

/** Which tasks the board shows. */
export type ListFilter = 'all' | 'done' | string;
export type Period = 'all' | 'week' | 'month';
