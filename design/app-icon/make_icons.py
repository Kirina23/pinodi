import asyncio
from playwright.async_api import async_playwright

def check(cx, cy, r, ring='#ffffff', fill='#151513', mark='#ffffff'):
    s = r / 118
    return f'''
    <g filter="url(#badgeShadow)">
      <circle cx="{cx}" cy="{cy}" r="{r}" fill="{ring}"/>
      <circle cx="{cx}" cy="{cy}" r="{r-20*s}" fill="{fill}"/>
      <path d="M{cx-44*s} {cy+2*s} L{cx-12*s} {cy+34*s} L{cx+48*s} {cy-36*s}" fill="none" stroke="{mark}" stroke-width="{27*s}" stroke-linecap="round" stroke-linejoin="round"/>
    </g>'''

def photo_scene(x, y, w, h, rx, dark=False):
    sky1, sky2 = ('#a9bcae', '#869d8f') if not dark else ('#5f7266', '#46574d')
    sun = '#f4ecd8' if not dark else '#c9bfa6'
    h1, h2 = ('#6d8877', '#3d5447') if not dark else ('#3f5246', '#26332b')
    return f'''
    <clipPath id="pc{x}{y}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"/></clipPath>
    <g clip-path="url(#pc{x}{y})">
      <rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#sky{'D' if dark else ''})"/>
      <circle cx="{x+w*0.30}" cy="{y+h*0.30}" r="{w*0.11}" fill="{sun}"/>
      <path d="M{x-10} {y+h*0.66} C {x+w*0.22} {y+h*0.50}, {x+w*0.42} {y+h*0.52}, {x+w*0.62} {y+h*0.62} S {x+w*0.92} {y+h*0.56}, {x+w+10} {y+h*0.50} L {x+w+10} {y+h+10} L {x-10} {y+h+10} Z" fill="{h1}"/>
      <path d="M{x-10} {y+h*0.80} C {x+w*0.30} {y+h*0.66}, {x+w*0.62} {y+h*0.74}, {x+w+10} {y+h*0.68} L {x+w+10} {y+h+10} L {x-10} {y+h+10} Z" fill="{h2}"/>
      <rect x="{x}" y="{y+h*0.55}" width="{w}" height="{h*0.45}" fill="url(#shade)"/>
      <rect x="{x+w*0.11}" y="{y+h*0.79}" width="{w*0.50}" height="{h*0.052}" rx="{h*0.026}" fill="#ffffff" opacity=".95"/>
      <rect x="{x+w*0.11}" y="{y+h*0.875}" width="{w*0.28}" height="{h*0.036}" rx="{h*0.018}" fill="#ffffff" opacity=".7"/>
    </g>'''

DEFS = '''
<defs>
  <linearGradient id="bgLight" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fcfbf7"/><stop offset="1" stop-color="#e6e1d5"/></linearGradient>
  <linearGradient id="bgDark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2a26"/><stop offset="1" stop-color="#0d0d0c"/></linearGradient>
  <linearGradient id="bgInk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b2a26"/><stop offset="1" stop-color="#121210"/></linearGradient>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9c9bc"/><stop offset="1" stop-color="#8ea596"/></linearGradient>
  <linearGradient id="skyD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#66796c"/><stop offset="1" stop-color="#4a5c51"/></linearGradient>
  <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
  <radialGradient id="glow" cx=".3" cy=".18" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <filter id="cardShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="26" stdDeviation="30" flood-color="#2a2720" flood-opacity=".22"/></filter>
  <filter id="cardShadowDark" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="26" stdDeviation="30" flood-color="#000" flood-opacity=".55"/></filter>
  <filter id="badgeShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#1b1a16" flood-opacity=".28"/></filter>
</defs>'''

def concept_a(mode='light'):
    dark = mode == 'dark'
    bg = 'url(#bgDark)' if dark else 'url(#bgLight)'
    back = '#3a3934' if dark else '#d8d2c4'
    sh = 'cardShadowDark' if dark else 'cardShadow'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">{DEFS}
    <rect width="1024" height="1024" fill="{bg}"/>
    {'' if dark else '<rect width="1024" height="1024" fill="url(#glow)"/>'}
    <g transform="rotate(9 520 540)" filter="url(#{sh})"><rect x="262" y="236" width="520" height="610" rx="70" fill="{back}"/></g>
    <g transform="rotate(-6 500 540)" filter="url(#{sh})">
      <rect x="226" y="206" width="560" height="660" rx="78" fill="{'#2d2c28' if dark else '#ffffff'}"/>
      {photo_scene(246, 226, 520, 620, 62, dark)}
    </g>
    {check(724, 300, 122, ring='#f7f6f2' if not dark else '#e9e6dd', fill='#151513', mark='#ffffff')}
    </svg>'''

def concept_b(mode='light'):
    # Ink background, cream photo card, cream check — bold like the "+" button.
    dark = mode == 'dark'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">{DEFS}
    <rect width="1024" height="1024" fill="url(#bgInk)"/>
    <g transform="rotate(-6 512 530)" filter="url(#cardShadowDark)">
      <rect x="232" y="214" width="560" height="660" rx="80" fill="#f7f6f2"/>
      {photo_scene(262, 244, 500, 600, 58, dark)}
    </g>
    {check(730, 300, 122, ring='#121210', fill='#f7f6f2', mark='#121210')}
    </svg>'''

def concept_c(mode='light'):
    # The board: masonry tiles in photo colours, the last one completed.
    dark = mode == 'dark'
    bg = 'url(#bgDark)' if dark else 'url(#bgLight)'
    sh = 'cardShadowDark' if dark else 'cardShadow'
    L, R, W, G = 190, 534, 300, 34
    g = f'''
    <clipPath id="t1"><rect x="{L}" y="190" width="{W}" height="390" rx="58"/></clipPath>
    <g filter="url(#{sh})"><rect x="{L}" y="190" width="{W}" height="390" rx="58" fill="url(#sky)"/></g>
    <g clip-path="url(#t1)"><circle cx="{L+92}" cy="300" r="40" fill="#f4ecd8"/>
      <path d="M{L-10} 470 C {L+90} 420, {L+190} 440, {L+W+10} 455 L {L+W+10} 600 L {L-10} 600 Z" fill="#5f7a6a"/>
      <path d="M{L-10} 520 C {L+120} 490, {L+220} 515, {L+W+10} 500 L {L+W+10} 600 L {L-10} 600 Z" fill="#3d5447"/></g>
    <g filter="url(#{sh})"><rect x="{L}" y="{190+390+G}" width="{W}" height="220" rx="58" fill="#3a3935"/></g>
    <circle cx="{L+W/2}" cy="{190+390+G+110}" r="62" fill="none" stroke="#6b6a63" stroke-width="16"/>
    <g filter="url(#{sh})"><rect x="{R}" y="190" width="{W}" height="236" rx="58" fill="#d9b48f"/></g>
    <rect x="{R+60}" y="250" width="180" height="20" rx="10" fill="#fff" opacity=".55"/>
    <rect x="{R+60}" y="290" width="110" height="20" rx="10" fill="#fff" opacity=".4"/>
    <g filter="url(#{sh})"><rect x="{R}" y="{190+236+G}" width="{W}" height="374" rx="58" fill="#b9694a"/></g>
    '''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">{DEFS}
    <rect width="1024" height="1024" fill="{bg}"/>
    {'' if dark else '<rect width="1024" height="1024" fill="url(#glow)"/>'}
    {g}
    {check(R + W/2, 190+236+G+187, 104, ring='#ffffff', fill='#151513', mark='#ffffff')}
    </svg>'''

def glyph_a():
    # Concept A without background (splash screen).
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">{DEFS}
    <g transform="rotate(9 520 540)" filter="url(#cardShadow)"><rect x="262" y="236" width="520" height="610" rx="70" fill="#d8d2c4"/></g>
    <g transform="rotate(-6 500 540)" filter="url(#cardShadow)">
      <rect x="226" y="206" width="560" height="660" rx="78" fill="#ffffff"/>
      {photo_scene(246, 226, 520, 620, 62)}
    </g>
    {check(724, 300, 122, ring='#f7f6f2', fill='#151513', mark='#ffffff')}
    </svg>'''

async def render(svg, path, transparent=False):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1024, 'height': 1024})
        await pg.set_content(f'<html><body style="margin:0;background:transparent">{svg}</body></html>')
        await pg.screenshot(path=path, clip={'x': 0, 'y': 0, 'width': 1024, 'height': 1024}, omit_background=transparent)
        await b.close()

async def main():
    for name, fn in [('A', concept_a), ('B', concept_b), ('C', concept_c)]:
        for mode in ('light', 'dark'):
            await render(fn(mode), f'{name}_{mode}.png')
    await render(glyph_a(), 'A_glyph.png', transparent=True)
asyncio.run(main())
