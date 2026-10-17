# -*- coding: utf-8 -*-
"""按 Codex Dream Skin 的 theme-package-validator 规则自检主题包。

规则来源：Fei-Away/Codex-Dream-Skin 的 runtime/theme-package-validator.mjs
（THEME_REQUIRED / THEME_OPTIONAL / COLOR_KEYS / THEME_ID_PATTERN / LIMITS）。
不依赖那个仓库，纯本地复现，用于提交前自检。
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

THEME_REQUIRED = ["schemaVersion", "id", "name", "image"]
# 与官方 preset 实际使用的键集合保持一致（该校验器对键集合是精确匹配）
THEME_ALLOWED = THEME_REQUIRED + [
    "brandSubtitle",
    "tagline",
    "projectPrefix",
    "projectLabel",
    "statusText",
    "quote",
    "promoTitle",
    "promoSub",
    "promoUrl",
    "appearance",
    "art",
    "colors",
]
COLOR_KEYS = [
    "background",
    "panel",
    "panelAlt",
    "accent",
    "accentAlt",
    "secondary",
    "highlight",
    "text",
    "muted",
    "line",
]
BACKGROUND_MEDIA = {"background.webp", "background.jpg", "background.png"}
THEME_ID_PATTERN = re.compile(r"^[a-z0-9]+(?:[.-][a-z0-9]+)*$")
APPEARANCE = {"auto", "light", "dark"}
IMAGE_MAX = 10_485_760

ok = True


def check(cond, msg):
    global ok
    print(("  PASS  " if cond else "  FAIL  ") + msg)
    if not cond:
        ok = False


def main():
    path = os.path.join(HERE, "theme.json")
    raw = open(path, encoding="utf-8").read()
    t = json.loads(raw)

    print("theme.json 结构")
    for k in THEME_REQUIRED:
        check(k in t, f"必填键 {k}")
    extra = [k for k in t if k not in THEME_ALLOWED]
    check(not extra, f"无非法键（多余: {extra}）")

    print("字段取值")
    check(t["schemaVersion"] == 1, "schemaVersion == 1")
    check(bool(THEME_ID_PATTERN.match(t["id"])) and 3 <= len(t["id"]) <= 64, f"id 合法: {t['id']}")
    check(1 <= len(t["name"]) <= 80, f"name 长度: {len(t['name'])}")
    check(t["image"] in BACKGROUND_MEDIA, f"image 是已登记背景: {t['image']}")
    if "appearance" in t:
        check(t["appearance"] in APPEARANCE, f"appearance 合法: {t['appearance']}")
    for k, v in t.items():
        if isinstance(v, str) and k not in ("promoUrl",) and len(v) > 120:
            check(False, f"{k} 超过 120 字符")

    print("colors")
    if "colors" in t:
        c = t["colors"]
        check(sorted(c.keys()) == sorted(COLOR_KEYS), "colors 恰好是 10 个规定键")
        bad = [k for k, v in c.items() if not isinstance(v, str) or not v.strip()]
        check(not bad, f"每个颜色都是非空字符串（异常: {bad}）")

    print("背景文件")
    img = os.path.join(HERE, t["image"])
    check(os.path.isfile(img), f"背景存在: {t['image']}")
    if os.path.isfile(img):
        size = os.path.getsize(img)
        check(0 < size <= IMAGE_MAX, f"背景大小 {size} bytes ≤ 10MB")
    check(len(raw.encode("utf-8")) <= 65536, f"theme.json 大小 {len(raw.encode('utf-8'))} bytes")

    print("包内文件")
    files = sorted(f for f in os.listdir(HERE) if os.path.isfile(os.path.join(HERE, f)))
    allowed_any = BACKGROUND_MEDIA | {"theme.json", "theme.css", "LICENSE.txt", "manifest.json", "manifest.sig"}
    unexpected = [f for f in files if f not in allowed_any and not f.endswith((".py", ".zip", ".md"))]
    check(not unexpected, f"根目录无意外文件（仅打包用: {unexpected}）")

    print()
    print("RESULT:", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
