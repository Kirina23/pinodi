**In the app since archive №19 (18.11.2026): Pinodi — Liza's monkey holding a photo** (her picture «02 · Фото», `pinodi/liza_monkey_photo_original.png`).
`pinodi/traced.svg` is a 4-colour vector trace of it; `pinodi/make_pinodi.py` recolours it into `pinodi_light/dark/tinted` (1024, RGB, no alpha):
light = her colours (sky #6AB9EA, ink #242426, cream #FCF1E2, red #FD5C51); dark = deep blue background #1b3b5f→#0c1b2d, black fur;
tinted = greys on black. The artwork is scaled to 95 % about the bottom centre so the red tuft has air and the photo still meets the bottom edge.
Copies: `assets/icon*.png`, `AppIcon.appiconset`, `assets/splash-icon.png` (rounded, RGBA), `SplashScreenLogo.imageset`, `assets/favicon.png`.
Everything below is history (Snapdo / Pushpin icons, archives №1–№18).

# App icon

In the app (archive №18): **Liza's flat sky mosaic, v2 with a black done tile** (#16171a; `make_sky_flat.py`: no shadows, rounder tiles, white check; №10–№17 had a graphite #606672 done tile → `sky_flat_light_graphite.png`; №9 had a light-blue done tile) — before it №8 «Мозаика», sky (небо) — `assets/icon.png`, `icon-dark.png`, `icon-tinted.png`,
the same three in `ios/Snapdo/Images.xcassets/AppIcon.appiconset/`, plus the splash logo
(`assets/splash-icon.png`, `SplashScreenLogo.imageset`) and `assets/favicon.png` — the icon with iOS-rounded corners.

Here:
- `sky_flat_{light,dark,tinted}.png` — what is in the app now (`python3 make_sky_flat.py`).
- `mosaic_sky_{light,dark,tinted}.png` — №8, with shadows and a black done tile.
- `mosaic-colors.jpg` — the mosaic in 8 colours (1 sage … 8 cream), with home-screen previews.
- `A_{light,dark,tinted}.png` — the previous icon (A «Карточка с галочкой»), to go back.
- `B…I_light.png`, `options.jpg`, `options-2.jpg` — the earlier directions.

Scripts (need Playwright): `make_icons.py` (A–C), `make_icons2.py` (D–I),
`make_mosaic.py` (mosaic colours: `python3 make_mosaic.py` → all colours, light;
`python3 make_mosaic.py sky` → light / dark / tinted of one colour; keys: sage, terracotta, rose, sky,
lavender, butter, ink, cream).

To switch the icon: replace the three PNGs in `assets/` and in `AppIcon.appiconset/` (RGB, 1024×1024, no
transparency — App Store requirement), and regenerate the splash logo (112/224/336 px, rounded) and favicon (48 px).

Letters in the Russian review sheets: А=A, Б=B, В=C, Г=D, Д=E, Е=F, Ж=G, З=H, И=I.
