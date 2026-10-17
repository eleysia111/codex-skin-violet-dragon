# -*- coding: utf-8 -*-
"""把一堆图片拼成带编号的缩略总览图，方便一眼看清素材构成。

用法: python contact_sheet.py <目录> <输出.png> [每行格数] [格子像素]
"""
import glob
import os
import sys

from PIL import Image, ImageDraw, ImageFont

EXTS = (".webp", ".png", ".jpg", ".jpeg", ".gif")
BG = (28, 30, 36)
FG = (240, 240, 245)
DIM = (150, 155, 165)


def load_font(size):
    for cand in (r"C:\Windows\Fonts\msyh.ttc", r"C:\Windows\Fonts\arial.ttf"):
        if os.path.isfile(cand):
            try:
                return ImageFont.truetype(cand, size)
            except Exception:  # noqa: BLE001
                pass
    return ImageFont.load_default()


def main():
    root = sys.argv[1]
    out = sys.argv[2]
    cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
    cell = int(sys.argv[4]) if len(sys.argv) > 4 else 230

    files = []
    for p in sorted(glob.glob(os.path.join(root, "**", "*"), recursive=True)):
        if p.lower().endswith(EXTS) and os.path.isfile(p):
            files.append(p)
    # 按体积从大到小排，重要的（大图）排前面
    files.sort(key=os.path.getsize, reverse=True)

    rows = (len(files) + cols - 1) // cols
    label_h = 42
    sheet = Image.new("RGB", (cols * cell, rows * (cell + label_h)), BG)
    d = ImageDraw.Draw(sheet)
    f_idx = load_font(20)
    f_meta = load_font(15)

    for i, p in enumerate(files):
        cx = (i % cols) * cell
        cy = (i // cols) * (cell + label_h)
        try:
            with Image.open(p) as im:
                w, h = im.size
                thumb = im.convert("RGBA")
                thumb.thumbnail((cell - 16, cell - 16), Image.LANCZOS)
                # 棋盘格底，透明区域才看得见
                board = Image.new("RGB", thumb.size, (60, 62, 70))
                for bx in range(0, thumb.size[0], 16):
                    for by in range(0, thumb.size[1], 16):
                        if (bx // 16 + by // 16) % 2 == 0:
                            ImageDraw.Draw(board).rectangle([bx, by, bx + 15, by + 15], fill=(74, 76, 86))
                ox = cx + (cell - thumb.size[0]) // 2
                oy = cy + label_h + (cell - thumb.size[1]) // 2
                board.paste(thumb, ((thumb.size[0] - thumb.size[0]) // 2, 0), thumb)
                sheet.paste(board, (ox, oy))
            d.text((cx + 8, cy + 6), f"#{i + 1}", font=f_idx, fill=FG)
            d.text((cx + 8, cy + 24), f"{w}x{h}  {os.path.getsize(p) / 1024:.0f}KB", font=f_meta, fill=DIM)
            d.text((cx + 8, cy + cell + label_h - 18), os.path.basename(p)[:14], font=f_meta, fill=DIM)
        except Exception as exc:  # noqa: BLE001
            d.text((cx + 8, cy + 6), f"#{i + 1} ERR", font=f_idx, fill=(255, 120, 120))
            d.text((cx + 8, cy + 24), str(exc)[:26], font=f_meta, fill=DIM)

    sheet.save(out, "PNG", optimize=True)
    print(f"{len(files)} images -> {out}  ({os.path.getsize(out) / 1024:.0f} KB, {sheet.size[0]}x{sheet.size[1]})")
    for i, p in enumerate(files):
        with Image.open(p) as im:
            print(f"  #{i + 1:<3} {im.size[0]:>5}x{im.size[1]:<5} {os.path.getsize(p) / 1024:>8.0f}KB  {os.path.basename(p)}  {os.path.relpath(p, root)}")


if __name__ == "__main__":
    main()
