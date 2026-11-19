# Pinodi: Photo To-Do List

Store name: «Pinodi: Photo To-Do List» / «Pinodi: список задач по фото». On the home screen: «Pinodi».
The internal project name stays Snapdo (Xcode project and scheme, modules, storage keys) — users never see it; the app was called Snapdo and then Pushpin before it became Pinodi (18.11.2026). Bundle id `com.slay.pinodi` (same prefix as Slay: `com.slay.teleprompter`), product ids `com.slay.pinodi.pro.*`.

Expo SDK 58 · React Native 0.88 (New Architecture) · TypeScript strict · bare workflow with a
committed `ios/` folder · built by Codemagic (`codemagic.yaml`) → TestFlight.

The approved design is the HTML prototype `Photo_Plans_iPhone.html`; CSS values are quoted
next to the styles they became (search for `// .task{…}`).

## Layout
- `App.tsx` — providers, main screen, overlay layers (sheet, long-press menu, viewer, toast)
- `src/screens/Main.tsx` — header (title · Upgrade · Share · ☰), masonry board, floating «+»; lists and settings live in the ☰ sheet (`src/sheets/MenuSheets.tsx`)
- `modules/snapdo-notify` + `src/model/reminders.ts` — rare local reminders; `src/model/offer.ts` + `src/overlays/Offer.tsx` — one-time discount after 3 weeks
- `src/sheets/*` — every bottom sheet of the prototype
- `src/model/*` — pure logic (layout, periods, limits, share text) → `tests/*.test.ts`
- `src/storage/*` — JSON file in Documents + media files in Documents/media (`*.web.ts` = stand)
- `src/purchases/*` + `modules/snapdo-store` — StoreKit 2 subscriptions (Swift Expo module)
- `src/components/Icon.ios.tsx` — Apple SF Symbols; `Icon.tsx` — SVG look-alikes for the web stand
- `design/app-icon` — icon sources and the two alternative icons

## Checks (no Mac needed)
```bash
npm ci
npx tsc --noEmit -p .
npm test
EXPO_OFFLINE=1 npx expo export --platform ios --output-dir /tmp/export-ios
```

Never commit secrets: `*.p8`, `*.p12`, `*.pem`, `credentials.json` are git-ignored.
`DEMO_PRO_ENABLED` in `src/purchases/config.ts` must stay `false`.
