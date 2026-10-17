# -*- coding: utf-8 -*-
"""把白底立绘抠成透明 PNG。

要点：角色是白发白裙，**不能用白色键控**（会把裙子抠穿）。
改用「从四边泛洪」：只有与画布边缘连通的近白区域才算背景，
人物内部的白色因为被轮廓包住而不会被吃掉。

用法: python cutout.py <输入> <输出.png> [容差 默认26] [羽化 默认1.2]
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SENTINEL = (255, 0, 255)


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    src, dst = sys.argv[1], sys.argv[2]
    thresh = int(sys.argv[3]) if len(sys.argv) > 3 else 26
    feather = float(sys.argv[4]) if len(sys.argv) > 4 else 1.2

    im = Image.open(src).convert("RGB")
    w, h = im.size
    print(f"输入 {os.path.basename(src)}  {w}x{h}  容差={thresh} 羽化={feather}")

    work = im.copy()
    # 四角 + 四边中点各泛洪一次，避免单角被阴影挡住
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
             (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]
    for pt in seeds:
        try:
            ImageDraw.floodfill(work, pt, SENTINEL, thresh=thresh)
        except Exception as exc:  # noqa: BLE001
            print("  泛洪失败", pt, exc)

    arr = np.array(work)
    bg = np.all(arr == np.array(SENTINEL, dtype=np.uint8), axis=-1)
    keep = (~bg).astype(np.uint8) * 255
    covered = float(bg.mean())
    print(f"  背景占比 {covered * 100:.1f}%")

    alpha = Image.fromarray(keep, "L")
    # 轻微内缩 1px 去掉白边，再羽化
    alpha = alpha.filter(ImageFilter.MinFilter(3))
    if feather > 0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(feather))

    out = im.convert("RGBA")
    out.putalpha(alpha)

    # 把半透明的白边往淡紫方向拉一点，避免在浅紫背景上出现白圈
    a = np.array(out).astype(np.float32)
    edge = (a[..., 3] > 8) & (a[..., 3] < 245)
    tint = np.array([214, 203, 247], dtype=np.float32)  # #D6CBF7
    k = 0.55
    for c in range(3):
        a[..., c] = np.where(edge, a[..., c] * (1 - k) + tint[c] * k, a[..., c])
    out = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")

    out = out.crop(out.getbbox()) if out.getbbox() else out
    out.save(dst, "PNG", optimize=True)
    print(f"  输出 {dst}  {out.size[0]}x{out.size[1]}  {os.path.getsize(dst) / 1024:.0f} KB")

    # 预览：贴到淡紫底上，方便肉眼检查白边与断口
    prev = Image.new("RGB", (out.size[0] + 80, out.size[1] + 80), (232, 226, 255))
    prev.paste(out, (40, 40), out)
    prev_path = os.path.splitext(dst)[0] + "-on-lav.png"
    prev.save(prev_path, "PNG", optimize=True)
    print(f"  预览 {prev_path}")


if __name__ == "__main__":
    main()
