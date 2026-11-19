import sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

SRC, OUT = sys.argv[1], sys.argv[2]
rng = np.random.default_rng(7); random.seed(7)
W, H = 3000, 1000
BG = (12, 12, 13)
CREAM = (242, 238, 230)
RED = (206, 32, 42)
F_BLACK = "/usr/share/fonts/opentype/inter/Inter-BlackItalic.otf"
F_SEMI = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
F_MED = "/usr/share/fonts/opentype/inter/Inter-Medium.otf"
F_JP = "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf"

def streaks(w, h, sx=60, sy=3, seed=1):
    r = np.random.default_rng(seed)
    small = r.random((max(2, h // sy), max(2, w // sx)))
    img = Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    return np.asarray(img).astype(np.float32) / 255

def grain(w, h, seed=2, blur=1.2):
    r = np.random.default_rng(seed)
    img = Image.fromarray((r.random((h, w)) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur))
    a = np.asarray(img).astype(np.float32) / 255
    return (a - a.min()) / (a.max() - a.min() + 1e-6)

def brush(mask_img, seed, gap=0.30, rough=0.5, angle=-22):
    """Tukar topeng teks/bentuk jadi tekstur berus kering: calitan menyerong + tepi kasar."""
    m = np.asarray(mask_img).astype(np.float32) / 255
    h, w = m.shape
    big = streaks(int(w * 1.6), int(h * 1.6) + 400, 70, 2, seed)
    stimg = Image.fromarray((big * 255).astype(np.uint8)).rotate(angle, resample=Image.BICUBIC)
    cxs, cys = stimg.width // 2, stimg.height // 2
    st = np.asarray(stimg.crop((cxs - w // 2, cys - h // 2, cxs - w // 2 + w, cys - h // 2 + h))).astype(np.float32) / 255
    edge = np.asarray(mask_img.filter(ImageFilter.GaussianBlur(5))).astype(np.float32) / 255
    g = grain(w, h, seed + 9, 1.0)
    keep = (st > gap) | (m * edge > 0.97)            # bahagian tengah tebal kekal, tepi bercalit
    a = m * keep * (edge * (1 - rough) + rough * g + 0.25 > 0.62)
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))

canvas = Image.new("RGB", (W, H), BG)
# tekstur latar halus (grunge)
gr = grain(W, H, 3, 2.5)
tex = Image.fromarray((gr * 18).astype(np.uint8))
canvas = ImageChops.add(canvas, Image.merge("RGB", [tex, tex, tex]))

# --- emblem bulat di kiri (logo asal)
src = Image.open(SRC).convert("RGB")
cx, cy, R = 627, 627, 608
em = src.crop((cx - R, cy - R, cx + R, cy + R))
mask = Image.new("L", em.size, 0); ImageDraw.Draw(mask).ellipse((4, 4, 2 * R - 4, 2 * R - 4), fill=255)
# buang latar putih di luar cincin berus
arr = np.asarray(em).astype(np.int16)
white = ((arr[..., 0] > 236) & (arr[..., 1] > 236) & (arr[..., 2] > 236))
yy, xx = np.mgrid[0:2 * R, 0:2 * R]
outer = np.hypot(xx - R, yy - R) > R - 50
m2 = np.asarray(mask).copy(); m2[white & outer] = 0
mask = Image.fromarray(m2).filter(ImageFilter.GaussianBlur(1.2))
size = 900
em = em.resize((size, size), Image.LANCZOS); mask = mask.resize((size, size), Image.LANCZOS)
canvas.paste(em, (50, 50), mask)

# --- matahari merah bertekstur di belakang tulisan
sun_c, sun_r = (2160, 300), 260
sun = Image.new("L", (W, H), 0); ImageDraw.Draw(sun).ellipse((sun_c[0] - sun_r, sun_c[1] - sun_r, sun_c[0] + sun_r, sun_c[1] + sun_r), fill=255)
sun_a = np.asarray(sun).astype(np.float32) / 255 * (0.55 + 0.45 * grain(W, H, 11, 6))
canvas = Image.composite(Image.new("RGB", (W, H), (168, 22, 30)), canvas, Image.fromarray((sun_a * 235).astype(np.uint8)))

# --- tulisan EH NAKAMA gaya berus (huruf demi huruf, condong rawak = rasa buatan tangan)
f = ImageFont.truetype(F_BLACK, 250)
txt = Image.new("L", (W, H), 0)
x, y0 = 1015, 215
for ch in "EH NAKAMA":
    if ch == " ":
        x += 115; continue
    cw = int(ImageDraw.Draw(txt).textlength(ch, font=f))
    tile = Image.new("L", (cw + 120, 360), 0)
    ImageDraw.Draw(tile).text((50, 20), ch, font=f, fill=255)
    tile = tile.rotate(random.uniform(-6, 5), resample=Image.BICUBIC, expand=False)
    txt.paste(tile, (x - 50, y0 + random.randint(-14, 14)), tile)
    x += cw - 6
bb = txt.getbbox()
word = brush(txt, 21, gap=0.22, rough=0.6)
# coretan berus kering keluar dari hujung huruf
tails = Image.new("L", (W, H), 0); td = ImageDraw.Draw(tails)
for i in range(18):
    y = random.randint(bb[1] + 10, bb[3] - 10); xx = random.randint(bb[0] - 40, bb[2] - 120)
    L = random.randint(80, 200); a2 = math.radians(-22); dx, dy = math.cos(a2) * L, math.sin(a2) * L
    td.polygon([(xx, y), (xx + dx, y + dy), (xx + dx + 4, y + dy + 3), (xx + 2, y + 9)], fill=255)
word = ImageChops.lighter(word, brush(tails, 5, gap=0.4, rough=0.7))
canvas.paste(Image.new("RGB", (W, H), CREAM), (0, 0), word)

# --- calitan merah menyerong (macam logo asal)
slash = Image.new("L", (W, H), 0); sd = ImageDraw.Draw(slash)
for (x, y, L, t) in [(1150, 380, 260, 9), (1700, 420, 330, 8), (2250, 330, 220, 7)]:
    a = math.radians(-24); dx, dy = math.cos(a) * L, math.sin(a) * L
    sd.polygon([(x, y), (x + dx, y + dy), (x + dx + 6, y + dy + t), (x + 4, y + t * 0.5)], fill=255)
canvas.paste(Image.new("RGB", (W, H), RED), (0, 0), brush(slash, 9, gap=0.25, rough=0.4))

# --- garis bawah berus merah
ul = Image.new("L", (W, H), 0); ImageDraw.Draw(ul).polygon([(bb[0] + 30, bb[3] + 42), (bb[2] - 40, bb[3] + 30), (bb[2], bb[3] + 38), (bb[0] + 110, bb[3] + 54)], fill=255)
canvas.paste(Image.new("RGB", (W, H), RED), (0, 0), brush(ul, 13, gap=0.2, rough=0.35))

# --- tagline + genre (huruf dijarakkan)
def spaced(draw, xy, text, font, fill, track):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + track
    return x
dc = ImageDraw.Draw(canvas)
spaced(dc, (bb[0] + 30, bb[3] + 95), "DIFFERENT STORIES. SAME NAKAMA.", ImageFont.truetype(F_SEMI, 64), CREAM, 14)
x = bb[0] + 32; fg = ImageFont.truetype(F_MED, 44)
for i, g in enumerate(["ANIME", "MANGA", "MANHWA", "GAMING", "BEYOND"]):
    x = spaced(dc, (x, bb[3] + 205), g, fg, (220, 216, 210), 9)
    if i < 4:
        dc.ellipse((x + 22, bb[3] + 225, x + 34, bb[3] + 237), fill=RED); x += 58

# --- cop merah 仲間
sx, sy, sw, sh = bb[2] + 70, bb[1] - 10, 160, 312
seal = Image.new("L", (W, H), 0); sdd = ImageDraw.Draw(seal)
sdd.rounded_rectangle((sx, sy, sx + sw, sy + sh), radius=14, outline=255, width=12)
sdd.rounded_rectangle((sx + 20, sy + 20, sx + sw - 20, sy + sh - 20), radius=8, outline=255, width=4)
fj = ImageFont.truetype(F_JP, 110)
for k, ch in enumerate("仲間"):
    w_ = sdd.textlength(ch, font=fj); sdd.text((sx + (sw - w_) / 2, sy + 28 + k * 130), ch, font=fj, fill=255)
canvas.paste(Image.new("RGB", (W, H), (214, 36, 44)), (0, 0), brush(seal, 31, gap=0.12, rough=0.25))

# --- kelopak sakura merah bertaburan
pet = Image.new("L", (W, H), 0)
for i in range(22):
    x = random.choice([random.randint(950, 1100), random.randint(2600, 2980), random.randint(1100, 2900)])
    y = random.randint(40, 960)
    if 520 < y < 830 and 1000 < x < 2650: continue
    p = Image.new("L", (60, 60), 0); ImageDraw.Draw(p).ellipse((14, 22, 46, 38), fill=255)
    p = p.rotate(random.randint(0, 180)).resize((random.randint(26, 54),) * 2)
    pet.paste(p, (x, y), p)
canvas.paste(Image.new("RGB", (W, H), RED), (0, 0), pet)

canvas.save(OUT, optimize=True)
print("siap", canvas.size, bb)
