# -*- coding: utf-8 -*-
"""输入框「紫色 01 飘带流光」边框 + 晶簇水晶花，重写 engine-patch.css 的 composer 区块。

参考效果：多条发光细丝沿边框缠绕流动、丝上点缀 01 字符，基调紫，飘带要够粗。
花放在顶边之上（大部分在框外），不遮挡输入区。
"""
import base64
import io
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.normpath(os.path.join(HERE, ".."))
IMG2 = os.path.join(PROJ, "assets-gen", "image2")
PATCH = os.path.join(PROJ, "engine-patch.css")
MARK = "/* <<< SKY-ATELIER PATCH END <<< */"
TAG = "/* composer-art */"

W, H = 1500, 340
R = 60
PAD = 34          # 飘带带宽（粗一些才协调）
SS = 2            # 超采样


def path_points(w, h, pad, r, steps_per_edge=140):
    """圆角矩形路径采样点 + 法线方向。"""
    pts = []
    x0, y0, x1, y1 = pad, pad, w - pad, h - pad
    # 上边 + 下边 + 左右边 + 四角圆弧
    edges = []
    edges.append(("top", [(x0 + r + (x1 - x0 - 2 * r) * i / steps_per_edge, y0) for i in range(steps_per_edge + 1)]))
    edges.append(("right", [((x1), y0 + r + (y1 - y0 - 2 * r) * i / steps_per_edge) for i in range(steps_per_edge + 1)]))
    edges.append(("bottom", [(x1 - r - (x1 - x0 - 2 * r) * i / steps_per_edge, y1) for i in range(steps_per_edge + 1)]))
    edges.append(("left", [(x0, y1 - r - (y1 - y0 - 2 * r) * i / steps_per_edge) for i in range(steps_per_edge + 1)]))
    for name, pl in edges:
        for (x, y) in pl:
            if name in ("top", "bottom"):
                n = (0.0, -1.0 if name == "top" else 1.0)
            else:
                n = (-1.0 if name == "left" else 1.0, 0.0)
            pts.append((x, y, n[0], n[1]))
    # 四角圆弧
    for cx, cy, a0 in [(x0 + r, y0 + r, 180), (x1 - r, y0 + r, 270), (x1 - r, y1 - r, 0), (x0 + r, y1 - r, 90)]:
        for i in range(0, 31):
            a = math.radians(a0 + 90 * i / 30)
            x, y = cx + r * math.cos(a), cy + r * math.sin(a)
            pts.append((x, y, math.cos(a), math.sin(a)))
    return pts


def build():
    w, h = W * SS, H * SS
    pts = path_points(w, h, PAD * SS, R * SS)
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)
    random.seed(20260216)

    # 底层柔光带：沿路径铺一条淡紫宽带
    for (x, y, nx, ny) in pts[::2]:
        rr = PAD * SS * 0.55
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=(139, 92, 246, 26))

    # 缠绕发光细丝
    filaments = 7
    for f in range(filaments):
        amp = (6 + f * 3.2) * SS
        freq = 2.2 + f * 0.7
        phase = random.uniform(0, 6.28)
        col = [(201, 182, 255), (255, 255, 255), (167, 139, 250), (139, 92, 246)][f % 4]
        alpha = 150 + f * 12
        prev = None
        for i, (x, y, nx, ny) in enumerate(pts):
            t = i / len(pts) * math.tau
            off = amp * math.sin(t * freq + phase)
            px, py = x + nx * off, y + ny * off
            if prev:
                d.line([prev, (px, py)], fill=col + (min(255, alpha),), width=max(1, SS))
            prev = (px, py)

    # 01 字符点缀（细竖条模拟）
    for _ in range(1400):
        x, y, nx, ny = pts[random.randrange(len(pts))]
        amp = random.uniform(-PAD * SS * 0.85, PAD * SS * 0.85)
        px, py = x + nx * amp, y + ny * amp
        bh = random.randint(3 * SS, 9 * SS)
        t = random.random()
        col = (255, 255, 255, 210) if t < 0.5 else ((201, 182, 255, 220) if t < 0.85 else (139, 92, 246, 230))
        d.rectangle([px, py, px + max(1, SS), py + bh], fill=col)

    # 发光
    glow = canvas.filter(ImageFilter.GaussianBlur(6 * SS))
    out = Image.alpha_composite(glow, canvas)
    out = out.filter(ImageFilter.GaussianBlur(0.6 * SS))
    return out.resize((W, H), Image.LANCZOS)


def to_uri(img, q=88):
    buf = io.BytesIO()
    img.save(buf, "WEBP", quality=q, method=6)
    raw = buf.getvalue()
    print(f"    ring -> {img.width}x{img.height} webp {len(raw)/1024:.0f} KB")
    return "data:image/webp;base64," + base64.b64encode(raw).decode()


def main():
    ring = to_uri(build())

    fp = os.path.join(IMG2, "flower-cluster.png")
    if not os.path.isfile(fp):
        raise SystemExit("缺少 flower-cluster.png（先跑 image2 生成晶簇水晶花）")
    fl = Image.open(fp).convert("RGBA")
    box = fl.getbbox()
    if box:
        fl = fl.crop(box)
    fh = 460
    fl = fl.resize((max(1, int(fl.width * fh / fl.height)), fh), Image.LANCZOS)
    buf = io.BytesIO()
    fl.save(buf, "WEBP", quality=88, method=6)
    flower = "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()
    print(f"    flower -> {fl.width}x{fl.height} webp {len(buf.getvalue())/1024:.0f} KB")

    block = f"""{TAG}
html[data-dream-skin="active"] body {{
  --sky-ring: url("{ring}");
  --sky-flower: url("{flower}");
}}

html[data-dream-skin="active"] [data-ds-part="composer"] {{ position: relative; overflow: visible; }}
html[data-dream-skin="active"] [data-ds-part="composer"]::before {{
  content: "";
  position: absolute;
  left: 50%;
  top: -66px;
  transform: translateX(-50%);
  width: 92px;
  height: 92px;
  pointer-events: none;
  z-index: 1;
  display: none;
  background-image: var(--sky-flower);
  background-size: contain;
  background-repeat: no-repeat, no-repeat;
  background-position: center bottom;
}}

html[data-dream-skin="active"] [data-ds-part="composer"]::after {{
  content: "";
  position: absolute;
  inset: -100px -18px -24px -18px;
  pointer-events: none;
  z-index: 0;
  background-image: var(--sky-flower), var(--sky-ring);
  background-position: center top, center bottom;
  background-size: 92px auto, 100% calc(100% - 76px);
  background-repeat: no-repeat, no-repeat;
}}

"""
    with open(PATCH, encoding="utf-8") as fh:
        text = fh.read()
    if TAG in text:
        text = text[:text.index(TAG)] + text[text.index(MARK):]
    if MARK not in text:
        raise SystemExit("找不到 END 标记")
    text = text.replace(MARK, block + MARK)
    with open(PATCH, "w", encoding="utf-8") as fh:
        fh.write(text)
    print("    composer 区块已重写（飘带流光 + 花上移出框）")


if __name__ == "__main__":
    main()
