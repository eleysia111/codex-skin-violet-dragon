# -*- coding: utf-8 -*-
"""校验：新引擎样式表 == 原版 + 旧补丁块 + 新增 hero 修整（忽略注释与空白差异）。

用来证明「把三块手工覆盖搬到 patches\\ 后，层叠顺序和内容都没有变，只是多了新规则」。
用法：python tools/verify_patch_equals.py <旧的已打补丁文件> [新的已打补丁文件]
"""
import re
import sys
import os

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.normpath(os.path.join(HERE, ".."))
ENGINE = os.path.join(os.environ["LOCALAPPDATA"], "CodexDreamSkin", "engine", "assets", "dream-skin.css")

BEGIN = "/* >>> SKY-ATELIER PATCH BEGIN (generated) >>> */"
END = "/* <<< SKY-ATELIER PATCH END <<< */"


def read(p):
    with open(p, encoding="utf-8") as fh:
        return fh.read()


def patch_block(text):
    i = text.find(BEGIN)
    j = text.find(END)
    if i < 0 or j < 0:
        raise SystemExit("找不到补丁块标记")
    return text[i:j]


def norm(text):
    """去掉注释、把连续空白压成单空格 —— 只看规则本体。"""
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    return re.sub(r"\s+", " ", text).strip()


def main():
    old_path = sys.argv[1]
    new_path = sys.argv[2] if len(sys.argv) > 2 else ENGINE

    old = norm(patch_block(read(old_path)))
    new = norm(patch_block(read(new_path)))

    print(f"旧补丁块（归一化）: {len(old)} 字符")
    print(f"新补丁块（归一化）: {len(new)} 字符")
    print(f"新 = 旧 + 增量 ?     {new.startswith(old)}")

    if new.startswith(old):
        delta = new[len(old):].strip()
        print(f"增量长度: {len(delta)} 字符")
        print("---- 增量内容 ----")
        print(delta)
    else:
        # 找出第一个分歧点，方便定位
        k = 0
        while k < min(len(old), len(new)) and old[k] == new[k]:
            k += 1
        lo = max(0, k - 160)
        print(f"！！在偏移 {k} 处开始分歧")
        print("旧 ...", old[lo:k + 160].replace("\n", " "))
        print("新 ...", new[lo:k + 160].replace("\n", " "))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
