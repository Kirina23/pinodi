# Icon И "мозаика" in different colours (Liza: "мозаика, но другой цвет").
# Same layout as И: three light tiles + one dark tile with a check. Renders 1024×1024 PNGs.
#   python3 make_mosaic.py            → mosaic_<key>_light.png for every colour (the option sheet)
#   python3 make_mosaic.py <key>      → light / dark / tinted of one colour, ready for assets/ and AppIcon
import asyncio, sys
sys.path.insert(0, '.')
from icons_lib import DEFS, render

# key: (name, light gradient top-left → bottom-right, dark gradient (old, unused: dark icons are near-black), tile colour, check-tile colour, check colour)
COLOURS = {
    'sage':       ('шалфей (как было)',  ('#b7cbbb', '#7f998a'), ('#46584c', '#1f2a23'), '#f7f6f2', '#151513', '#ffffff'),
    'terracotta': ('терракота',          ('#eaa07c', '#c4643f'), ('#5a3122', '#2a1810'), '#fbf6f1', '#151513', '#ffffff'),
    'rose':       ('пудровая роза',      ('#f4c9cc', '#d98e99'), ('#5a3238', '#2a171a'), '#fff8f8', '#151513', '#ffffff'),
    'sky':        ('небо',               ('#b6d3f0', '#6f9fd2'), ('#2c4565', '#141f2f'), '#f7fbff', '#151513', '#ffffff'),
    'lavender':   ('лаванда',            ('#d6cdf3', '#9a8bd3'), ('#3f3766', '#1d1930'), '#fbfaff', '#151513', '#ffffff'),
    'butter':     ('сливочно-жёлтый',    ('#f8de8a', '#e8b14a'), ('#5b4618', '#2a200b'), '#fffdf6', '#151513', '#ffffff'),
    'ink':        ('чёрный',             ('#34332f', '#121210'), ('#2a2926', '#0d0d0c'), '#3a3934', '#f7f6f2', '#151513'),
    'cream':      ('молочный',           ('#fdfcf8', '#e8e2d4'), ('#2c2b27', '#141412'), '#d9d3c4', '#151513', '#ffffff'),
}

def mark(cx, cy, s, color, w=26):
    return f'<path d="M{cx-48*s} {cy+2*s} L{cx-14*s} {cy+36*s} L{cx+52*s} {cy-38*s}" fill="none" stroke="{color}" stroke-width="{w*s}" stroke-linecap="round" stroke-linejoin="round"/>'

def mosaic(key, mode='light'):
    name, light, dark, tile, ctile, cmark = COLOURS[key]
    g = light
    if mode == 'dark':
        # iOS dark icons: dark background, the colour moves onto the tiles, the done tile turns cream.
        g, tile, ctile, cmark = ('#292624', '#0d0c0b'), light[1] if key not in ('ink', 'cream') else '#4a4842', '#f7f6f2', '#151513'
    elif mode == 'tinted':
        # iOS "tinted": greyscale on black; iOS colours it with the person's tint (brighter = more tint).
        g, tile, ctile, cmark = ('#1c1c1c', '#000000'), '#6b6b6b', '#f2f2f2', '#000000'
    sh = 'cardShadow' if mode == 'light' else 'cardShadowDark'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">{DEFS}
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{g[0]}"/><stop offset="1" stop-color="{g[1]}"/></linearGradient></defs>
    <rect width="1024" height="1024" fill="url(#bg)"/>
    <g filter="url(#{sh})">
      <rect x="214" y="214" width="282" height="352" rx="60" fill="{tile}"/>
      <rect x="528" y="214" width="282" height="230" rx="60" fill="{tile}"/>
      <rect x="214" y="598" width="282" height="212" rx="60" fill="{tile}"/>
      <rect x="528" y="476" width="282" height="334" rx="60" fill="{ctile}"/>
    </g>
    {mark(669, 643, 1.45, cmark)}</svg>'''

async def main():
    if len(sys.argv) > 1:
        key = sys.argv[1]
        for mode in ('light', 'dark', 'tinted'):
            await render(mosaic(key, mode), f'mosaic_{key}_{mode}.png')
    else:
        for key in COLOURS:
            await render(mosaic(key), f'mosaic_{key}_light.png')

if __name__ == '__main__':
    asyncio.run(main())
