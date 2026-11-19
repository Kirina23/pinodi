# Character icon concepts (18.11.2026). 1080 grid. python3 icons.py → sheet + 1024 PNGs
BLUE = '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b3d0ee"/><stop offset="1" stop-color="#72a0d2"/></linearGradient>'
INK = '#16171a'
RED, RED_D, RED_L = '#e5483b', '#c4362b', '#f26b5e'

def svg(defs, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1024" height="1024"><defs>{defs}</defs>{body}</svg>'

def check(x, y, s=1, color='#ffffff', w=37):
    return f'<path d="M{x} {y} l{58*s} {58*s} l{112*s} {-112*s}" fill="none" stroke="{color}" stroke-width="{w*s}" stroke-linecap="round" stroke-linejoin="round"/>'

def pin_side(scale=1, eyes=False):
    # upright pushpin, origin = where the needle enters
    s = scale
    e = ''
    if eyes:
        e = (f'<ellipse cx="{-34*s}" cy="{-150*s}" rx="{22*s}" ry="{28*s}" fill="#fff"/><ellipse cx="{34*s}" cy="{-150*s}" rx="{22*s}" ry="{28*s}" fill="#fff"/>'
             f'<circle cx="{-30*s}" cy="{-144*s}" r="{11*s}" fill="{INK}"/><circle cx="{38*s}" cy="{-144*s}" r="{11*s}" fill="{INK}"/>')
    return (f'<line x1="0" y1="{-30*s}" x2="0" y2="{60*s}" stroke="#9aa3ad" stroke-width="{16*s}" stroke-linecap="round"/>'
            f'<ellipse cx="0" cy="{-40*s}" rx="{118*s}" ry="{34*s}" fill="{RED_D}"/>'
            f'<path d="M{-70*s} {-44*s} L{-54*s} {-200*s} L{54*s} {-200*s} L{70*s} {-44*s} Z" fill="{RED}"/>'
            f'<ellipse cx="0" cy="{-52*s}" rx="{118*s}" ry="{30*s}" fill="{RED}"/>'
            f'<ellipse cx="0" cy="{-205*s}" rx="{100*s}" ry="{32*s}" fill="{RED_L}"/>' + e)

def mosaic_pin():
    tiles = ''.join(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="89" fill="#f7faff"/>' for x, y, w, h in
                    [(176, 179, 349, 415), (555, 179, 348, 257), (176, 624, 349, 276)])
    return svg(BLUE, f'<rect width="1080" height="1080" fill="url(#g)"/>{tiles}'
               f'<rect x="555" y="466" width="348" height="432" rx="89" fill="{INK}"/>{check(643, 680)}'
               f'<circle cx="368" cy="268" r="66" fill="#000" opacity=".16"/>'
               f'<circle cx="350" cy="250" r="66" fill="{RED}"/><circle cx="330" cy="230" r="24" fill="{RED_L}"/>')

def pin_photo():
    photo = ('<g transform="rotate(-7 540 600)">'
             '<rect x="250" y="300" width="580" height="640" rx="56" fill="#ffffff"/>'
             '<clipPath id="ph"><rect x="290" y="340" width="500" height="460" rx="30"/></clipPath>'
             '<g clip-path="url(#ph)"><rect x="290" y="340" width="500" height="460" fill="#9cc6ec"/>'
             '<circle cx="660" cy="450" r="56" fill="#fff1c2"/>'
             '<path d="M270 700 C 400 600 520 610 640 680 S 780 660 820 640 L 820 820 L 270 820 Z" fill="#6f9c7c"/>'
             '<path d="M270 760 C 420 700 600 740 820 710 L 820 820 L 270 820 Z" fill="#4a7a5d"/></g>'
             '<rect x="300" y="842" width="230" height="30" rx="15" fill="#d9dde3"/></g>')
    return svg(BLUE, f'<rect width="1080" height="1080" fill="url(#g)"/>{photo}'
               f'<g transform="translate(548 352) rotate(16)">{pin_side(1.05)}</g>')

def whale():
    sky = '<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9dcf7"/><stop offset="1" stop-color="#6aa6e3"/></linearGradient>'
    body = ('M190 650 C190 515 315 440 480 440 C640 440 735 515 790 610 C805 640 835 648 858 628 '
            'L915 560 C928 545 950 552 946 572 L928 655 C962 682 968 716 942 732 C915 748 882 735 858 712 '
            'C800 792 680 835 515 835 C320 835 190 775 190 650 Z')
    return svg(sky + f'<clipPath id="wb"><path d="{body}"/></clipPath>',
               f'<rect width="1080" height="1080" fill="url(#g)"/><g transform="translate(0 40)">'
               f'<path d="{body}" fill="{INK}"/>'
               f'<g clip-path="url(#wb)"><ellipse cx="470" cy="850" rx="330" ry="130" fill="#f7faff"/></g>'
               f'<circle cx="320" cy="600" r="19" fill="#ffffff"/>'
               f'{check(318, 300, 1.05)}</g>')

def penguin():
    sky = '<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7ecfb"/><stop offset="1" stop-color="#8fc0ec"/></linearGradient>'
    return svg(sky, f'<rect width="1080" height="1080" fill="url(#g)"/>'
               f'<ellipse cx="470" cy="905" rx="70" ry="30" fill="#f2a33a"/><ellipse cx="610" cy="905" rx="70" ry="30" fill="#f2a33a"/>'
               f'<path d="M540 230 C 720 230 780 420 780 620 C 780 820 690 900 540 900 C 390 900 300 820 300 620 C 300 420 360 230 540 230 Z" fill="{INK}"/>'
               f'<path d="M540 380 C 650 380 690 480 690 640 C 690 800 630 860 540 860 C 450 860 390 800 390 640 C 390 480 430 380 540 380 Z" fill="#f7faff"/>'
               f'<ellipse cx="540" cy="420" rx="150" ry="105" fill="#f7faff"/>'
               f'<circle cx="485" cy="410" r="24" fill="{INK}"/><circle cx="595" cy="410" r="24" fill="{INK}"/>'
               f'<path d="M505 460 L575 460 L540 505 Z" fill="#f2a33a" stroke="#f2a33a" stroke-width="16" stroke-linejoin="round"/>'
               f'<g transform="rotate(9 745 650)"><rect x="630" y="545" width="230" height="210" rx="34" fill="#ffffff"/>{check(682, 640, 0.75, INK, 40)}</g>'
               f'<ellipse cx="672" cy="745" rx="40" ry="88" fill="{INK}" transform="rotate(-55 672 745)"/>'
               f'<ellipse cx="318" cy="640" rx="42" ry="120" fill="{INK}" transform="rotate(18 318 640)"/>')

def hexagon(cx, cy, r, fill):
    import math
    pts = ' '.join(f'{cx + r*math.cos(math.radians(60*i-30)):.1f},{cy + r*math.sin(math.radians(60*i-30)):.1f}' for i in range(6))
    return f'<polygon points="{pts}" fill="{fill}" stroke="{fill}" stroke-width="34" stroke-linejoin="round"/>'

def honey():
    g = '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd977"/><stop offset="1" stop-color="#f4a62a"/></linearGradient>'
    import math
    r = 145
    dx = r*math.sqrt(3) + 62
    dy = dx*0.866
    cells = [(540, 540-dy, '#fff7e0'), (540-dx/2, 540, '#fff7e0'), (540+dx/2, 540, INK), (540, 540+dy, '#fff7e0')]
    body = ''.join(hexagon(x, y, r, f) for x, y, f in cells)
    bee = ('<g transform="translate(820 250) rotate(-18)">'
           '<ellipse cx="-20" cy="-62" rx="46" ry="30" fill="#ffffff" opacity=".9" transform="rotate(-25 -20 -62)"/>'
           '<ellipse cx="28" cy="-66" rx="46" ry="30" fill="#ffffff" opacity=".9" transform="rotate(25 28 -66)"/>'
           '<ellipse cx="0" cy="0" rx="92" ry="62" fill="#ffd34d"/>'
           '<clipPath id="bb"><ellipse cx="0" cy="0" rx="92" ry="62"/></clipPath>'
           f'<g clip-path="url(#bb)"><rect x="-30" y="-70" width="30" height="140" fill="{INK}"/><rect x="30" y="-70" width="30" height="140" fill="{INK}"/></g>'
           f'<circle cx="-62" cy="-10" r="10" fill="{INK}"/></g>')
    return svg(g, f'<rect width="1080" height="1080" fill="url(#g)"/>{body}{check(540+dx/2-80, 540+5, 0.85)}{bee}')

def pin_mascot():
    return svg(BLUE, f'<rect width="1080" height="1080" fill="url(#g)"/>'
               f'<ellipse cx="560" cy="880" rx="230" ry="44" fill="#000" opacity=".14"/>'
               f'<g transform="translate(540 790)">{pin_side(2.3, eyes=True)}</g>')

ICONS = {
    'pushpin_mosaic': mosaic_pin, 'pushpin_photo': pin_photo, 'pushpin_mascot': pin_mascot,
    'kit_whale': whale, 'pinguin': penguin, 'honeydo': honey,
}

if __name__ == '__main__':
    import asyncio
    from playwright.async_api import async_playwright
    async def main():
        async with async_playwright() as pw:
            b = await pw.chromium.launch()
            p = await b.new_page(viewport={'width': 1024, 'height': 1024})
            for k, f in ICONS.items():
                await p.set_content(f'<html><body style="margin:0">{f()}</body></html>')
                await p.screenshot(path=f'{k}.png', clip={'x': 0, 'y': 0, 'width': 1024, 'height': 1024})
            await b.close()
    asyncio.run(main())
