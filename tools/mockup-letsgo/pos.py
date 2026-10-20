# Pós: bloom + tilt-shift + leve saturação/vinheta, depois monta a comparação lado a lado
import sys, numpy as np
from PIL import Image, ImageFilter, ImageEnhance
src, out, out2, ref = sys.argv[1:5]
im = Image.open(src).convert('RGB'); W, H = im.size
a = np.asarray(im).astype(np.float32) / 255
lum = a.max(axis=2); hi = np.clip((lum - .72) / .28, 0, 1)[..., None] * a
bl = np.asarray(Image.fromarray((hi * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(22))).astype(np.float32) / 255
bl2 = np.asarray(Image.fromarray((hi * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(7))).astype(np.float32) / 255
a = 1 - (1 - a) * (1 - bl * .55) * (1 - bl2 * .25)
base = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
b1 = np.asarray(base.filter(ImageFilter.GaussianBlur(3.5))).astype(np.float32); b2 = np.asarray(base.filter(ImageFilter.GaussianBlur(2))).astype(np.float32); o = np.asarray(base).astype(np.float32)
y = np.linspace(0, 1, H)[:, None, None]
w1 = np.clip((0.1 - y) / 0.1, 0, 1) + np.clip((y - 0.9) / 0.1, 0, 1); w2 = np.clip(1 - np.abs(y - .5) / .5, 0, 1) * 0
w1 = np.clip(w1, 0, 1); wm = np.clip((0.2 - y) / 0.12, 0, 1) * (1 - w1) + np.clip((y - 0.8) / 0.12, 0, 1) * (1 - w1)
res = o * (1 - w1 - np.clip(wm, 0, 1) * (1 - w1)) + b1 * w1 + b2 * np.clip(wm, 0, 1) * (1 - w1)
res = Image.fromarray(np.clip(res, 0, 255).astype(np.uint8))
res = ImageEnhance.Color(res).enhance(1.12); res = ImageEnhance.Contrast(res).enhance(1.03)
v = 1 - .22 * (np.linspace(-1, 1, W)[None, :] ** 2 + np.linspace(-1, 1, H)[:, None] ** 2) / 2
res = Image.fromarray((np.asarray(res).astype(np.float32) * v[..., None]).clip(0, 255).astype(np.uint8))
res.save(out, quality=92)
r = Image.open(ref).convert('RGB').resize((W, H), Image.LANCZOS)
gap = 24; S = Image.new('RGB', (W * 2 + gap, H + 70), (24, 24, 30)); S.paste(r, (0, 70)); S.paste(res, (W + gap, 70))
from PIL import ImageDraw, ImageFont
d = ImageDraw.Draw(S)
try: f = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 34)
except Exception: f = None
d.text((20, 16), 'Jogo atual (voxel 2D/3D)', fill='white', font=f); d.text((W + gap + 20, 16), "Mockup: estilo Let's Go (mesmos sprites)", fill='white', font=f)
S.save(out2, quality=92)
