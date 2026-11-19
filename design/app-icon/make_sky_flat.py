# Liza's icon (06.11.2026, second version): flat sky mosaic, no shadows, rounder tiles,
# a black done tile with a white check (18.11.2026; before: graphite #606672 → sky_flat_light_graphite.png).
# Redrawn as vector from her picture (1080 grid → 1024 PNG).  python3 make_sky_flat.py → sky_flat_{light,dark,tinted}.png
import asyncio, sys
sys.path.insert(0, '.')
from icons_lib import render

MODES = {
    #          bg gradient             tiles      done tile  check
    'light':  (('#b3d0ee', '#72a0d2'), '#f7faff', '#16171a', '#ffffff'),  # black done tile (18.11.2026); graphite was #606672
    'dark':   (('#22272e', '#0c0e11'), '#8fb5e3', '#f7faff', '#3a404b'),
    'tinted': (('#1c1c1c', '#000000'), '#7a7a7a', '#f0f0f0', '#000000'),
}

def icon(mode):
    g, tile, done, check = MODES[mode]
    r = 89
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1080 1080">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{g[0]}"/><stop offset="1" stop-color="{g[1]}"/></linearGradient></defs>
    <rect width="1080" height="1080" fill="url(#bg)"/>
    <rect x="176" y="179" width="349" height="415" rx="{r}" fill="{tile}"/>
    <rect x="555" y="179" width="348" height="257" rx="{r}" fill="{tile}"/>
    <rect x="176" y="624" width="349" height="276" rx="{r}" fill="{tile}"/>
    <rect x="555" y="466" width="348" height="432" rx="{r}" fill="{done}"/>
    <path d="M643 680 L701 738 L813 626" fill="none" stroke="{check}" stroke-width="37" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>'''

async def main():
    for m in MODES:
        await render(icon(m), f'sky_flat_{m}.png')

if __name__ == '__main__':
    asyncio.run(main())
