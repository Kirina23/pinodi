// function shareText(): the plain-text version of a plan.
import { fileCount } from '../i18n/format';
import { t, type Lang } from '../i18n';
import { allFiles, dateLabel } from './logic';
import type { Task } from './types';

export function shareText(items: Task[], title: string, range: string, today: Date, lang: Lang) {
  const lines = items.map((task) => {
    const n = allFiles(task).length;
    return (
      `${task.done ? '✓' : '○'} ${task.title || t('untitled', undefined, lang)}` +
      (task.due ? ' · ' + dateLabel(task.due, today, lang) : '') +
      (task.note ? '\n  ' + task.note : '') +
      (n > 1 ? '\n  ' + fileCount(n, lang) : '')
    );
  });
  return `${title}\n${range}\n\n${lines.join('\n')}`;
}
