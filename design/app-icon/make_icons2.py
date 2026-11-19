# Six more app-icon directions for Snapdo (Г–И). Same 1024 canvas, light / dark / tinted.
import asyncio, sys
sys.path.insert(0, '.')
from icons_lib import DEFS, photo_scene, check, render

EXTRA = '''
<defs>
  <linearGradient id="pinkBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe9e7"/><stop offset="1" stop-color="#f1cfcb"/></linearGradient>
  <linearGradient id="pinkBgD" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a2427"/><stop offset="1" stop-color="#1b1213"/></linearGradient>
  <linearGradient id="hot" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7aa8"/><stop offset="1" stop-color="#d93a73"/></linearGradient>
  <linearGradient id="hotD" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a2147"/><stop offset="1" stop-color="#3a0f22"/></linearGradient>
  <radialGradient id="b1" cx=".25" cy=".25" r=".6"><stop offset="0" stop-color="#9fc2a8"/><stop offset="1" stop-color="#9fc2a8" stop-opacity="0"/></radialGradient>
  <radialGradient id="b2" cx=".8" cy=".3" r=".6"><stop offset="0" stop-color="#f3b58f"/><stop offset="1" stop-color="#f3b58f" stop-opacity="0"/></radialGradient>
  <radialGradient id="b3" cx=".55" cy=".9" r=".7"><stop offset="0" stop-color="#e98aa8"/><stop offset="1" stop-color="#e98aa8" stop-opacity="0"/></radialGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".62"/><stop offset="1" stop-color="#ffffff" stop-opacity=".30"/></linearGradient>
  <linearGradient id="glassD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".22"/><stop offset="1" stop-color="#ffffff" stop-opacity=".08"/></linearGradient>
  <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".5" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#fff" stop-opacity=".6"/></linearGradient>
  <filter id="blur40" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="40"/></filter>
  <linearGradient id="cream" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfaf6"/><stop offset="1" stop-color="#e9e4d8"/></linearGradient>
  <linearGradient id="sage" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b7cbbb"/><stop offset="1" stop-color="#7f998a"/></linearGradient>
  <linearGradient id="sageD" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#46584c"/><stop offset="1" stop-color="#1f2a23"/></linearGradient>
</defs>'''

def svg(body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">{DEFS}{EXTRA}{body}</svg>'

def mark(cx, cy, s, color, w=30):
    return f'<path d="M{cx-48*s} {cy+2*s} L{cx-14*s} {cy+36*s} L{cx+52*s} {cy-38*s}" fill="none" stroke="{color}" stroke-width="{w*s}" stroke-linecap="round" stroke-linejoin="round"/>'

def polaroid(mode):  # Г
    d = mode == 'dark'
    return svg(f'''
    <rect width="1024" height="1024" fill="url(#{'pinkBgD' if d else 'pinkBg'})"/>
    <g transform="rotate(-7 512 520)" filter="url(#{'cardShadowDark' if d else 'cardShadow'})">
      <rect x="232" y="176" width="560" height="672" rx="40" fill="{'#2b2a27' if d else '#ffffff'}"/>
      {photo_scene(272, 216, 480, 470, 14, d).replace('<rect x="' + str(272 + 480 * 0.11), '<rect data-x="').replace('opacity=".95"', 'opacity="0"').replace('opacity=".7"', 'opacity="0"')}
      <g transform="translate(512 768)"><circle r="56" fill="{'#f1ede4' if d else '#151513'}"/>{mark(0, 0, 0.62, '#151513' if d else '#ffffff', 34)}</g>
    </g>''')

def glass(mode):  # Д
    d = mode == 'dark'
    return svg(f'''
    <rect width="1024" height="1024" fill="{'#121614' if d else '#eef2ec'}"/>
    <g filter="url(#blur40)" opacity="{'.75' if d else '1'}">
      <rect width="1024" height="1024" fill="url(#b1)"/><rect width="1024" height="1024" fill="url(#b2)"/><rect width="1024" height="1024" fill="url(#b3)"/>
    </g>
    <g filter="url(#{'cardShadowDark' if d else 'cardShadow'})">
      <rect x="222" y="222" width="580" height="580" rx="150" fill="url(#{'glassD' if d else 'glass'})"/>
    </g>
    <rect x="224" y="224" width="576" height="576" rx="148" fill="none" stroke="url(#rim)" stroke-width="5" opacity="{'.5' if d else '.9'}"/>
    {mark(512, 512, 2.6, '#ffffff' if d else '#151513', 26)}''')

def pink(mode):  # Е
    d = mode == 'dark'
    return svg(f'''
    <rect width="1024" height="1024" fill="url(#{'hotD' if d else 'hot'})"/>
    <g transform="rotate(-6 512 520)" filter="url(#cardShadowDark)">
      <rect x="236" y="206" width="552" height="652" rx="80" fill="#ffffff"/>
      {photo_scene(258, 228, 508, 608, 62, d)}
    </g>
    {check(722, 296, 122, ring='#ffffff', fill='#151513', mark='#ffffff')}''')

def camera(mode):  # Ж
    d = mode == 'dark'
    body = '#f4f1ea' if not d else '#e8e4da'
    return svg(f'''
    <rect width="1024" height="1024" fill="url(#bgInk)"/>
    <g filter="url(#cardShadowDark)">
      <path d="M262 380 a70 70 0 0 1 70 -70 h80 l38 -60 h124 l38 60 h80 a70 70 0 0 1 70 70 v330 a70 70 0 0 1 -70 70 h-360 a70 70 0 0 1 -70 -70 z" fill="{body}"/>
    </g>
    <circle cx="700" cy="372" r="16" fill="#d6336c"/>
    <circle cx="512" cy="545" r="150" fill="#151513"/>
    <circle cx="512" cy="545" r="150" fill="none" stroke="#2c2b28" stroke-width="16"/>
    {mark(512, 545, 1.55, '#ffffff', 26)}''')

def fan(mode):  # З
    d = mode == 'dark'
    sh = 'cardShadowDark' if d else 'cardShadow'
    return svg(f'''
    <rect width="1024" height="1024" fill="url(#{'bgDark' if d else 'bgLight'})"/>
    <g transform="rotate(-16 512 700)" filter="url(#{sh})"><rect x="292" y="250" width="440" height="540" rx="64" fill="#c9805e"/></g>
    <g transform="rotate(14 512 700)" filter="url(#{sh})"><rect x="292" y="250" width="440" height="540" rx="64" fill="#d8b68f"/></g>
    <g filter="url(#{sh})"><rect x="292" y="236" width="440" height="556" rx="64" fill="#fff"/>{photo_scene(306, 250, 412, 528, 52, d)}</g>
    {check(700, 290, 104, ring='#ffffff', fill='#151513', mark='#ffffff')}''')

def mosaic(mode):  # И
    d = mode == 'dark'
    tile = '#f7f6f2' if not d else '#2a2d2a'
    return svg(f'''
    <rect width="1024" height="1024" fill="url(#{'sageD' if d else 'sage'})"/>
    <g filter="url(#{'cardShadowDark' if d else 'cardShadow'})">
      <rect x="214" y="214" width="282" height="352" rx="60" fill="{tile}"/>
      <rect x="528" y="214" width="282" height="230" rx="60" fill="{tile}"/>
      <rect x="214" y="598" width="282" height="212" rx="60" fill="{tile}"/>
      <rect x="528" y="476" width="282" height="334" rx="60" fill="#151513"/>
    </g>
    {mark(669, 643, 1.45, '#ffffff', 26)}''')

CONCEPTS = [('D', polaroid), ('E', glass), ('F', pink), ('G', camera), ('H', fan), ('I', mosaic)]

async def main():
    for n, fn in CONCEPTS:
        for mode in ('light', 'dark'):
            await render(fn(mode), f'{n}_{mode}.png')
asyncio.run(main())
