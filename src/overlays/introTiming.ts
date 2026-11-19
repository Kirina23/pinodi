// Launch animation timing (LaunchIntro.tsx). Plain values, so tests can read them without React Native.
export const INTRO = {
  iconPt: 112, // same as expo-splash-screen imageWidth in app.json
  // 1) Pinodi says hi: the icon pops up a little and tilts
  popMs: 160,
  popScale: 1.1,
  popTiltDeg: -5,
  // 2) then we dive into the photo it holds: the photo grows (9×) and dissolves into the board
  zoomTo: 9,
  zoomMs: 460,
  /** Where the photo is, below the icon centre, as a share of the icon size (pinodi icon: photo centre at 85 %). */
  focusDy: 0.35,
  iconFadeDelayMs: 60,
  iconFadeMs: 260,
  bgFadeDelayMs: 120,
  bgFadeMs: 300,
  boardFrom: 0.96,
  reducedFadeMs: 200,
};
/** Whole animation, ms (a test keeps it under 0.8 s). */
export const INTRO_TOTAL_MS =
  INTRO.popMs + Math.max(INTRO.zoomMs, INTRO.iconFadeDelayMs + INTRO.iconFadeMs, INTRO.bgFadeDelayMs + INTRO.bgFadeMs);
