import asyncio, sys, re
from playwright.async_api import async_playwright
async def render(pairs, size=1024):
    async with async_playwright() as pw:
        b = await pw.chromium.launch(); p = await b.new_page(viewport={'width': size, 'height': size})
        for svg_path, out in pairs:
            s = open(svg_path).read()
            s = re.sub(r'<svg([^>]*?) width="\d+" height="\d+"', lambda m: f'<svg{m.group(1)} viewBox="0 0 2508 2508" width="{size}" height="{size}"' if 'viewBox' not in m.group(0) else m.group(0), s, count=1)
            await p.set_content(f'<html><body style="margin:0;background:#fff">{s}</body></html>')
            await p.screenshot(path=out, clip={'x': 0, 'y': 0, 'width': size, 'height': size})
        await b.close()
if __name__ == '__main__':
    args = sys.argv[1:]
    asyncio.run(render([(args[i], args[i+1]) for i in range(0, len(args), 2)]))
