# -*- coding: utf-8 -*-
"""列出目录下所有图片的尺寸、体积、是否带透明通道。"""
import glob
import os
import sys

from PIL import Image

EXTS = (".webp", ".png", ".jpg", ".jpeg", ".gif", ".avif", ".ico", ".bmp")


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    rows = []
    for p in sorted(glob.glob(os.path.join(root, "**", "*"), recursive=True)):
        if not p.lower().endswith(EXTS) or not os.path.isfile(p):
            continue
        try:
            with Image.open(p) as im:
                w, h = im.size
                alpha = "alpha" if (im.mode in ("RGBA", "LA", "PA") or "transparency" in im.info) else "-"
                rows.append((os.path.getsize(p), w, h, alpha, os.path.relpath(p, root)))
        except Exception as exc:  # noqa: BLE001
            rows.append((-1, 0, 0, "ERR", f"{os.path.relpath(p, root)}  ({exc})"))
    rows.sort(reverse=True)
    print(f"{'bytes':>10}  {'size':>11}  {'alpha':5}  file")
    for size, w, h, alpha, rel in rows:
        print(f"{size:>10,}  {w:>5}x{h:<5}  {alpha:5}  {rel}")
    print(f"\ntotal {len(rows)} images under {root}")


if __name__ == "__main__":
    main()
