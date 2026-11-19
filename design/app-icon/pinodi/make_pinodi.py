# Pinodi app icon (18.11.2026): Liza's monkey with a photo (her picture, "02 · Фото"), traced to vector
# (traced.svg from liza_monkey_photo_original.png, 4 flat colours), then recoloured per iOS appearance.
# python3 make_pinodi.py → pinodi_{light,dark,tinted}.svg + .png (1024, RGB, no alpha)
import re, asyncio
from render import render

SRC = open('traced.svg').read()
PATHS = re.findall(r'<path d="([^"]*)" fill="(#[0-9A-Fa-f]{6})" transform="([^"]*)"/>', SRC)
assert len(PATHS) == 12 and PATHS[0][1].upper() == '#6AB9EA', 'unexpected trace'
SKY_INDEX = 3  # the blue sky inside the photo (same colour as the background in the light icon)
BLUE, INK, CREAM, RED = '#6AB9EA', '#242426', '#FCF1E2', '#FD5C51'

VARIANTS = {
    #          background (top, bottom)   sky        ink        cream      red
    'light':  (('#6AB9EA', '#6AB9EA'), '#6AB9EA', '#242426', '#FCF1E2', '#FD5C51'),
    'dark':   (('#1b3b5f', '#0c1b2d'), '#3f86c4', '#0b0b0d', '#f3e8d9', '#fd5c51'),
    'tinted': (('#1c1c1c', '#000000'), '#2f2f2f', '#5e5e5e', '#f2f2f2', '#a8a8a8'),
}
SCALE = 0.95  # a little air above the red tuft; scaled about the bottom centre, so the photo still meets the edge

def build(name):
    (top, bottom), sky, ink, cream, red = VARIANTS[name]
    colour = {BLUE: sky, INK: ink, CREAM: cream, RED: red}
    body = []
    for i, (d, fill, tr) in enumerate(PATHS[1:], start=1):
        f = sky if i == SKY_INDEX else colour[fill.upper()]
        body.append(f'<path d="{d}" fill="{f}" transform="{tr}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2508 2508" width="1024" height="1024">'
            f'<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient></defs>'
            f'<rect width="2508" height="2508" fill="url(#bg)"/>'
            f'<g transform="translate(1254 2508) scale({SCALE}) translate(-1254 -2508)">{"".join(body)}</g></svg>')

if __name__ == '__main__':
    import sys
    names = sys.argv[1:] or ['light', 'dark', 'tinted']
    pairs = []
    for n in names:
        open(f'pinodi_{n}.svg', 'w').write(build(n))
        pairs.append((f'pinodi_{n}.svg', f'pinodi_{n}.png'))
    asyncio.run(render(pairs))
    from PIL import Image
    for _, png in pairs:
        Image.open(png).convert('RGB').save(png)  # no alpha channel
