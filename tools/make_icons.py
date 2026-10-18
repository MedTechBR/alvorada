# Gera os ícones do PWA (amanhecer sobre os campos + Poké Bola). Uso: python3 tools/make_icons.py
from PIL import Image, ImageDraw, ImageFilter
import os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'icons')
os.makedirs(OUT, exist_ok=True)

def icon(S, maskable=False):
    im = Image.new('RGB', (S, S))
    d = ImageDraw.Draw(im)
    top, mid, low = (42, 42, 106), (240, 128, 106), (255, 216, 140)
    for y in range(S):
        k = y / S
        if k < 0.55: a, b, t = top, mid, k / 0.55
        else: a, b, t = mid, low, (k - 0.55) / 0.45
        d.line([(0, y), (S, y)], fill=tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3)))
    # sol nascendo
    glow = Image.new('L', (S, S), 0); g = ImageDraw.Draw(glow)
    cx, cy, r = S * 0.5, S * 0.66, S * 0.30
    g.ellipse([cx - r * 1.5, cy - r * 1.5, cx + r * 1.5, cy + r * 1.5], fill=120)
    glow = glow.filter(ImageFilter.GaussianBlur(S * 0.06))
    im.paste((255, 232, 160), (0, 0), glow)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 214, 96))
    # colinas
    d.ellipse([-S * 0.3, S * 0.70, S * 0.9, S * 1.4], fill=(63, 138, 74))
    d.ellipse([S * 0.25, S * 0.76, S * 1.4, S * 1.5], fill=(47, 106, 58))
    # Poké Bola
    s = 0.62 if maskable else 0.78
    br = S * 0.20 * s / 0.78; bx, by = S * 0.5, S * 0.47
    w = max(2, int(S * 0.028))
    d.pieslice([bx - br, by - br, bx + br, by + br], 180, 360, fill=(229, 56, 59))
    d.pieslice([bx - br, by - br, bx + br, by + br], 0, 180, fill=(255, 255, 255))
    d.ellipse([bx - br, by - br, bx + br, by + br], outline=(29, 35, 64), width=w)
    d.rectangle([bx - br, by - w / 2, bx + br, by + w / 2], fill=(29, 35, 64))
    d.ellipse([bx - br * 0.32, by - br * 0.32, bx + br * 0.32, by + br * 0.32], fill=(255, 255, 255), outline=(29, 35, 64), width=w)
    return im

icon(192).save(os.path.join(OUT, 'icon-192.png'))
icon(512).save(os.path.join(OUT, 'icon-512.png'))
icon(512, True).save(os.path.join(OUT, 'icon-maskable-512.png'))
icon(180).save(os.path.join(OUT, 'apple-touch-icon.png'))
print('ok')
