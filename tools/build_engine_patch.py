# -*- coding: utf-8 -*-
"""生成「引擎 CSS 补丁」：立绘 / Q 版 / 顶边花边 / 纹章 都变成独立图层。

要点（都是踩坑换来的）：
  1. **立绘**挂在主题图同一背景栈上（body / ::before），fixed + contain + 右下锚点
     → 窗口缩放只等比、不裁切。
  2. **Q 版和纹章**必须挂在 `aside.app-shell-left-panel` 自己身上 ——
     左栏是不透明面板，挂在 body 背景层会被盖住（实测彻底看不见）。
  3. **顶边花边**挂在 `header` 底边，repeat-x 平铺。
  4. 只抓「从第 0 列开始的完整规则」，绝不接受多行选择器续行；
     两个 data URI 用 CSS 变量只写一次，避免体积爆炸。
"""
import base64
import io
import os
import re

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.normpath(os.path.join(HERE, ".."))
IN = os.path.join(PROJ, "assets-in")
IMG2 = os.path.join(PROJ, "assets-gen", "image2")
OUT = os.path.join(PROJ, "engine-patch.css")

BEGIN = "/* >>> SKY-ATELIER PATCH BEGIN (generated) >>> */"
END = "/* <<< SKY-ATELIER PATCH END <<< */"

ENGINE = os.path.join(os.environ["LOCALAPPDATA"], "CodexDreamSkin", "engine")
CSS_PATH = os.path.join(ENGINE, "assets", "dream-skin.css")

SIDEBAR = 'html[data-dream-skin="active"] aside.app-shell-left-panel {'
HEADER = ('html[data-dream-skin="active"] '
          'header:is(.app-header-tint, [data-app-shell-header-edge-scroll], [class*="_Header_"]) {')


def uri(path, height=None, width=None, quality=84, trim=False):
    img = Image.open(path).convert("RGBA")
    if trim:
        box = img.getbbox()
        if box:
            img = img.crop(box)
    if height:
        w = max(1, int(img.width * height / img.height))
        img = img.resize((w, height), Image.LANCZOS)
    elif width:
        h = max(1, int(img.height * width / img.width))
        img = img.resize((width, h), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "WEBP", quality=quality, method=6)
    raw = buf.getvalue()
    print(f"    {os.path.basename(path)} -> {img.width}x{img.height} webp {len(raw) / 1024:.0f} KB")
    return "data:image/webp;base64," + base64.b64encode(raw).decode()


def block_start(lines, idx):
    j = idx
    while j >= 0 and not lines[j].rstrip().endswith("{"):
        j -= 1
    if j < 0:
        return None, None
    start = j
    while start - 1 >= 0:
        prev = lines[start - 1].rstrip()
        if not prev or prev.endswith(";") or prev.endswith("}") or prev.endswith("{"):
            break
        start -= 1
    raw = "\n".join(lines[start:j + 1])
    # 关键：剥掉夹带的注释块，否则注释里的 { } 会破坏花括号平衡（会被安全校验拦下）
    selector = re.sub(r"/\*.*?\*/", "", raw, flags=re.S).strip()
    return start, (selector or None)


def main():
    print("1) 准备图层")
    figure = uri(os.path.join(IN, "gptq-fullbody.jpg"), height=1500)
    chibi = uri(os.path.join(IN, "gptq-chibi.png"), height=560, trim=True)
    lace_path = os.path.join(IMG2, "lace.png")
    trim_uri = uri(lace_path, height=120, trim=True) if os.path.isfile(lace_path) else None
    emblem_path = os.path.join(IMG2, "emblem.png")
    emblem_uri = uri(emblem_path, height=260, trim=True) if os.path.isfile(emblem_path) else None

    with open(CSS_PATH, encoding="utf-8") as fh:
        lines = fh.read().split("\n")

    print("2) 提取画主题图的完整规则（只取 body / ::before）")
    picked = []
    for i, line in enumerate(lines):
        if "var(--dream-skin-art)" not in line or "background-image" not in line:
            continue
        start, selector = block_start(lines, i)
        if selector is None or lines[start][:1].isspace() or "\n" in selector:
            continue
        if "}" in selector or "/*" in selector:
            continue
        is_before = "::before" in selector
        if "body" not in selector and not is_before:
            continue
        if selector.replace("\n", " ") in [p[0].replace("\n", " ") for p in picked]:
            continue
        picked.append((selector, is_before))
        print(f"   + {selector.replace(chr(10), ' ')[:96]}")

    out = [BEGIN,
           "/* 由 tools/build_engine_patch.py 生成，勿手改；回滚用 patch-engine-css.ps1 -Action revert */",
           'html[data-dream-skin="active"] body {',
           f'  --sky-figure: url("{figure}");',
           f'  --sky-chibi: url("{chibi}");']
    if trim_uri:
        out.append(f'  --sky-trim: url("{trim_uri}");')
    if emblem_uri:
        out.append(f'  --sky-emblem: url("{emblem_uri}");')
    out += ["}", ""]

    print("3) 立绘层（追加到主题图背景栈）")
    for selector, is_before in picked:
        out += [
            selector,
            "  background-image: var(--dream-skin-art) !important;",
            "  background-position: var(--ds-art-position) !important;",
            "  background-size: cover !important;",
            "  background-repeat: no-repeat !important;",
        ]
        if not is_before:
            out.append("  background-attachment: fixed, fixed !important;")
        out += ["}", ""]

    print("4) 左侧栏：Q 版在底部、纹章在顶部（挂 aside::after，避免被引擎背景覆盖）")
    side_images = ["var(--sky-emblem)", "var(--sky-chibi)"] if emblem_uri else ["var(--sky-chibi)"]
    side_pos = ["100% 56px", "bottom center"] if emblem_uri else ["bottom center"]
    side_size = ["72px auto", "150px auto"] if emblem_uri else ["150px auto"]
    out += [
        'html[data-dream-skin="active"] aside.app-shell-left-panel::before {',
        '  content: "";',
        "  position: absolute;",
        "  inset: 0;",
        "  pointer-events: none;",
        "  opacity: 0.9;",
        "  z-index: -1;",
        "  background-image: " + ", ".join(side_images) + ";",
        "  background-position: " + ", ".join(side_pos) + ";",
        "  background-size: " + ", ".join(side_size) + ";",
        "  background-repeat: " + ", ".join(["no-repeat"] * len(side_images)) + ";",
        "}",
        "",
    ]

    if trim_uri:
        print("5) 顶栏：底部一条冰晶花边，横向平铺")
        out += [
            HEADER,
            "  background-image: var(--sky-trim) !important;",
            "  background-position: bottom center !important;",
            "  background-size: auto 22px !important;",
            "  background-repeat: repeat-x !important;",
            "}",
            "",
        ]

    out.append(END)

    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(out) + "\n")

    bad = [f"{n + 1}: {l.strip()[:70]}" for n, l in enumerate(out)
           if l[:1].isspace() and l.rstrip().endswith("{") and not l.strip().startswith(("--", "}"))]
    if bad:
        os.remove(OUT)
        raise SystemExit("自检失败（疑似续行选择器）：\n  " + "\n  ".join(bad))

    print(f"6) 已写出 {OUT}  ({os.path.getsize(OUT) / 1024:.0f} KB)  自检通过")


if __name__ == "__main__":
    main()
