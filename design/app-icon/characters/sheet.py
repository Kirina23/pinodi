import asyncio, base64
from playwright.async_api import async_playwright
F='/home/claude/aso/web/fonts'
OPTS=[
 ('pushpin_mosaic','1','Pushpin','Pushpin','Мозаика + кнопка','Наша иконка и красная кнопка. Самый маленький шаг.'),
 ('pushpin_photo','2','Pushpin','Pushpin','Фото на кнопке','Сразу видно, что делает приложение: прикрепил фото — это задача.'),
 ('pushpin_mascot','3','Pushpin','Pushpin','Пин с глазами','Свой персонаж-кнопка. Можно оживлять в приложении.'),
 ('kit_whale','4','Kit','Кит','Кит с галочкой','Фонтан — галочка. Kit по-английски «набор», по-русски «кит».'),
 ('pinguin','5','Pinguin','Пингвин','Пингвин с карточкой','Pin-guin: игра слов с «pin». Добрый и узнаваемый.'),
 ('honeydo','6','Bee','Пчёлка','Соты и пчела','Соты — это доска задач. Тёплый цвет, которого нет у соседей.'),
]
def b64(p): return base64.b64encode(open(p,'rb').read()).decode()
cards=''
for f,n,en,ru,title,idea in OPTS:
    img=f'data:image/png;base64,{b64(f+".png")}'
    cards+=f'''<div class="card"><div class="top"><img class="big" src="{img}"><div class="txt"><div class="n">{n}</div><div class="t">{title}</div><div class="nm">{en}: Photo To-Do List<br><span>{ru}: список задач по фото</span></div></div></div>
    <div class="idea">{idea}</div>
    <div class="row"><img class="sm" src="{img}"><div class="rt"><b>{en}: Photo To-Do…</b><i>Производительность</i></div><div class="get">Загрузить</div></div></div>'''
html=f'''<html><head><style>
@font-face{{font-family:I;src:url(file://{F}/inter-latin-500.woff2)}}@font-face{{font-family:I;src:url(file://{F}/inter-cyrillic-500.woff2);unicode-range:U+0400-04FF}}
@font-face{{font-family:I;font-weight:700;src:url(file://{F}/inter-latin-700.woff2)}}@font-face{{font-family:I;font-weight:700;src:url(file://{F}/inter-cyrillic-700.woff2);unicode-range:U+0400-04FF}}
*{{box-sizing:border-box}}body{{margin:0;background:#f7f6f2;font-family:I;color:#121210;width:1080px}}
h1{{font-size:46px;margin:44px 40px 6px;font-weight:700}} .sub{{margin:0 40px 26px;font-size:26px;color:#706e65}}
.grid{{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;padding:0 40px 44px}}
.card{{background:#fff;border-radius:34px;padding:26px}}
.top{{display:flex;gap:20px;align-items:center}}
.big{{width:200px;height:200px;border-radius:46px}}
.n{{font-size:26px;color:#706e65;font-weight:700}} .t{{font-size:30px;font-weight:700;margin:4px 0 10px;line-height:1.15}}
.nm{{font-size:19px;line-height:1.35}} .nm span{{color:#706e65}}
.idea{{font-size:22px;line-height:1.35;margin:18px 2px 18px;color:#2b2a26;min-height:60px}}
.row{{background:#000;border-radius:22px;padding:16px;display:flex;align-items:center;gap:14px}}
.sm{{width:66px;height:66px;border-radius:15px}} .rt{{flex:1;color:#fff;font-size:19px;display:flex;flex-direction:column;gap:3px;min-width:0}}
.rt b{{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}} .rt i{{font-style:normal;color:#8e8e93;font-size:17px}}
.get{{background:#1c1c1e;color:#3d8bff;font-weight:700;font-size:18px;padding:10px 16px;border-radius:20px}}
</style></head><body><h1>Иконка и имя: 6 вариантов</h1><div class="sub">Внизу каждой карточки — как это выглядит в поиске App Store</div><div class="grid">{cards}</div></body></html>'''
open('sheet.html','w').write(html)
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(); p=await b.new_page(viewport={'width':1080,'height':800},device_scale_factor=1.5)
        await p.goto('file:///home/claude/snapdo/design/app-icon/characters/sheet.html'); await p.wait_for_timeout(500)
        await p.screenshot(path='Варианты-иконки-и-имени.png',full_page=True); await b.close()
asyncio.run(main())
