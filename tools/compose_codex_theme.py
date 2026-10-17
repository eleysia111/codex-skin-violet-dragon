# -*- coding: utf-8 -*-
"""把 image2 生成的宫殿 / 流光带 / 花边 + 立绘 + Q 版合成成 2560x1600 主题背景。

- 明亮版：宫殿亮版 + 主立绘（右侧）
- 暗色版：宫殿暗版 + 副立绘（右侧）
- 两张都烤入：数据流光带（顶部）、水晶花边（右下）、Q 版（左下角）

用法: python compose_codex_theme.py
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 2560, 1600
HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.normpath(os.path.join(HERE, ".."))
GEN = os.path.join(PROJ, "assets-gen")
IMG2 = os.path.join(GEN, "image2")
IN = os.path.join(PROJ, "assets-in")

AMET = (139, 92, 246)


def cover(img, w, h):
    """等比缩放并居中裁切到目标尺寸。"""
    scale = max(w / img.width, h / img.height)
    nw, nh = int(img.width * scale + 0.5), int(img.height * scale + 0.5)
    img = img.resize((nw, nh), Image.LANCZOS)
    left = (nw - w) // 2
    top = (nh - h) // 2
    return img.crop((left, top, left + w, top + h))


def ensure_alpha(img, name=""):
    """没有真正透明通道时，用边缘泛洪把白底抠掉。"""
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    alpha = np.array(img.getchannel("A"))
    coverage = float((alpha > 8).mean())
    if coverage < 0.995:
        print(f"    {name}: 自带 alpha（不透明区 {coverage * 100:.1f}%）")
        return img
    print(f"    {name}: 无有效 alpha（{coverage * 100:.1f}%），执行边缘白底抠图")
    from PIL import ImageDraw as _D
    rgb = img.convert("RGB")
    work = rgb.copy()
    sentinel = (255, 0, 255)
    for pt in [(0, 0), (rgb.width - 1, 0), (0, rgb.height - 1), (rgb.width - 1, rgb.height - 1),
               (rgb.width // 2, 0), (rgb.width // 2, rgb.height - 1)]:
        try:
            _D.floodfill(work, pt, sentinel, thresh=34)
        except Exception:  # noqa: BLE001
            pass
    arr = np.array(work)
    bg = np.all(arr == np.array(sentinel, dtype=np.uint8), axis=-1)
    keep = (~bg).astype(np.uint8) * 255
    out = rgb.convert("RGBA")
    out.putalpha(Image.fromarray(keep, "L").filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.0)))
    return out


def trim(img):
    box = img.getbbox()
    return img.crop(box) if box else img


def place(canvas, layer, x, y, height=None, width=None, glow=0, glow_color=AMET):
    if height:
        w = max(1, int(layer.width * height / layer.height))
        layer = layer.resize((w, height), Image.LANCZOS)
    elif width:
        h = max(1, int(layer.height * width / layer.width))
        layer = layer.resize((width, h), Image.LANCZOS)
    if glow > 0:
        halo = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        mask = layer.getchannel("A")
        halo.paste(glow_color + (glow,), (x, y), mask)
        canvas = Image.alpha_composite(canvas, halo.filter(ImageFilter.GaussianBlur(38)))
    out = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    out.paste(layer, (x, y), layer)
    return Image.alpha_composite(canvas, out)


def add_vignette(img, strength=54):
    """左侧压暗/压白一点，保证 UI 文字可读。"""
    veil = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(veil)
    for x in range(W):
        a = int(strength * (1 - x / (W - 1)) ** 1.6)
        if a > 0:
            d.line([(x, 0), (x, H)], fill=AMET + (a >> 2,))
    return Image.alpha_composite(img, veil)


def build(theme):
    light = theme == "light"
    # NO_FIGURE=1 时不烤立绘/Q 版：改由引擎 CSS 的独立背景层承载（缩放不裁切）
    no_figure = os.environ.get("NO_FIGURE") == "1"
    palace = Image.open(os.path.join(IMG2, f"palace-{'light' if light else 'dark'}.png")).convert("RGB")
    canvas = cover(palace, W, H).convert("RGBA")
    print(f"  [{theme}] 宫殿底图 -> {canvas.size}  no_figure={no_figure}")

    ribbon = ensure_alpha(Image.open(os.path.join(IMG2, "ribbon.png")), "ribbon")
    lace = ensure_alpha(Image.open(os.path.join(IMG2, "lace.png")), "lace")
    ribbon, lace = trim(ribbon), trim(lace)

    # 顶部数据流光带：横跨主区，略偏右，避免压住左上文字区
    # 安全区：cover + focus 78% 时，窗口窄到 0.8 也只保证 x∈[39%,89%] 可见，
    # 所以所有装饰都尽量落在 [0.40, 0.90] 内，靠边的只当氛围（允许被裁）。
    rw = int(W * 0.52)
    canvas = place(canvas, ribbon, int(W * 0.42), -int(ribbon.height * (rw / ribbon.width) * 0.34),
                   width=rw, glow=60, glow_color=AMET)
    # 水晶花边：落在安全区内，贴在立绘脚下
    lw = int(W * 0.40)
    lh = int(lace.height * lw / lace.width)
    canvas = place(canvas, lace, int(W * 0.50), H - lh + int(lh * 0.12), width=lw, glow=40)

    # 立绘：亮版用主立绘，暗版用副立绘；高度按主人要求 ≈ 窗口一半（54%）
    fig_name = os.path.join(IN, "gptq-fullbody.jpg") if light else os.path.join(IN, "gptq-fullbody-2.png")
    fig = Image.open(fig_name).convert("RGBA")
    fig = ensure_alpha(trim(fig), "figure")
    fh = int(H * 0.70)
    fw = int(fig.width * fh / fig.height)
    canvas = place(canvas, fig, W - fw - 40, H - fh, height=fh,
                   glow=70, glow_color=AMET)

    canvas = add_vignette(canvas, 46 if light else 76)
    return canvas.convert("RGB")


def main():
    for theme in ("light", "dark"):
        out = build(theme)
        path = os.path.join(GEN, f"theme-bg-{theme}.png")
        out.save(path, "PNG", optimize=True)
        mb = os.path.getsize(path) / 1048576
        print(f"  -> {path}  {out.size[0]}x{out.size[1]}  {mb:.2f} MB  {'⚠ 超 10MB' if mb > 10 else 'OK'}")


if __name__ == "__main__":
    main()
