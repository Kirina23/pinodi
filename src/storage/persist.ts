// Saves the whole plan as one JSON file in the app's Documents folder (backed up by iCloud).
// Writes go to a temp file first and are then moved over the old one, so a crash
// in the middle of a save can never leave a half-written file.
import { File, Paths } from 'expo-file-system';

const NAME = 'snapdo-data.json';

export async function loadRaw(): Promise<unknown> {
  const f = new File(Paths.document, NAME);
  if (!f.exists) return null;
  try {
    return JSON.parse(await f.text());
  } catch {
    // A broken file is kept aside for support instead of being overwritten silently.
    try {
      f.move(new File(Paths.document, `snapdo-data.broken-${Date.now()}.json`));
    } catch {}
    return null;
  }
}

export async function saveRaw(data: unknown): Promise<void> {
  const tmp = new File(Paths.document, NAME + '.tmp');
  if (tmp.exists) tmp.delete();
  tmp.create();
  tmp.write(JSON.stringify(data));
  tmp.move(new File(Paths.document, NAME), { overwrite: true });
}
