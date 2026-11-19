// Things that happen around the board, not on it:
//  • reminders are re-planned on launch, when the app goes to the background and when tasks or
//    settings change (so the "come back" message always counts from the last visit);
//  • after the first own task, one gentle question about reminders (once);
//  • after 3 weeks without Pro, the one-time discount screen (once; the hour never restarts).
import { useEffect, useRef } from 'react';
import { AppState as RNAppState } from 'react-native';
import { getLang } from '../i18n';
import { offerState } from '../model/offer';
import { DEFAULT_NOTIFY, planReminders } from '../model/reminders';
import { notifyStatus, scheduleReminders } from '../notify/notify';
import { useApp } from './AppState';
import { useUI } from './UI';

export function useEngagement() {
  const app = useApp();
  const ui = useUI();
  const dataRef = useRef(app.data);
  dataRef.current = app.data;
  const uiRef = useRef(ui);
  uiRef.current = ui;
  const proRef = useRef(app.pro);
  proRef.current = app.pro;
  const appRef = useRef(app);
  appRef.current = app;

  // ── Reminders
  const replan = useRef(async () => {
    if ((await notifyStatus()) !== 'granted') return;
    const d = dataRef.current;
    const items = planReminders(d, new Date(), getLang(), d.settings.notify ?? DEFAULT_NOTIFY);
    await scheduleReminders(items.map(({ id, title, body, at }) => ({ id, title, body, at })));
  }).current;

  useEffect(() => {
    if (!app.ready) return;
    const timer = setTimeout(replan, 1500);
    return () => clearTimeout(timer);
  }, [app.ready, app.data.tasks, app.data.settings.notify, replan]);

  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (state) => {
      if (state === 'background') replan();
      if (state === 'active') setTimeout(checkOffer, 800);
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── One gentle question after the first own task
  const own = app.data.tasks.filter((x) => !x.demo).length;
  const prevOwn = useRef<number | null>(null);
  useEffect(() => {
    if (!app.ready) return;
    const before = prevOwn.current;
    prevOwn.current = own;
    if (before === null || own <= before || dataRef.current.settings.notifyAsked) return;
    notifyStatus().then((st) => {
      if (st !== 'undetermined') {
        appRef.current.updateSettings({ notifyAsked: true });
        return;
      }
      // After the "Task added" toast, when nothing else is open.
      setTimeout(() => {
        const u = uiRef.current;
        if (!u.sheet && !u.offer && !u.ctx && !dataRef.current.settings.notifyAsked) u.openSheet({ name: 'notifyAsk' });
      }, 1300);
    });
  }, [own, app.ready]);

  // ── One-time offer after 3 weeks without Pro
  const checkOffer = () => {
    const u = uiRef.current;
    if (u.sheet || u.ctx || u.viewer || u.offer || u.layout) return;
    if (offerState(dataRef.current.settings, proRef.current, Date.now()) !== 'eligible') return;
    appRef.current.updateSettings({ offerStartedAt: Date.now() });
    u.openOffer();
  };
  useEffect(() => {
    if (!app.ready) return;
    const timer = setTimeout(checkOffer, 1800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.ready]);
}
