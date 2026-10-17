# -*- coding: utf-8 -*-
"""给 Codex 各节点套「同款胶囊」：品牌标题渐变胶囊 + 烫金字，侧栏按钮/行胶囊化。

幂等：把 /* capsule-art */ 区块插在 engine-patch.css 的 END 标记之前，重复运行会先剥旧块。
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.normpath(os.path.join(HERE, ".."))
PATCH = os.path.join(PROJ, "engine-patch.css")
MARK = "/* <<< SKY-ATELIER PATCH END <<< */"
TAG = "/* capsule-art */"

BLOCK = f"""{TAG}
html[data-dream-skin="active"] aside.app-shell-left-panel span[class*="h-lh"][class*="w-max"] {{
  padding: 2px 12px;
  border-radius: 999px;
  background-image: linear-gradient(135deg, #FFFFFF 0%, #F1ECFF 48%, #DCCFFB 100%);
  border: 1px solid rgba(139, 92, 246, .30);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .95), 0 2px 10px rgba(139, 92, 246, .20);
}}

html[data-dream-skin="active"] aside.app-shell-left-panel span[class*="text-heading-sm"] {{
  background-image: linear-gradient(100deg, #B98B47 0%, #F1DCA6 28%, #FFF7E0 46%, #E3C476 64%, #A9762F 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: #A9762F;
  -webkit-text-fill-color: #A9762F;
  text-shadow: 0 1px 0 #FFF7E0, 0 0 6px rgba(241, 220, 166, .55);
  letter-spacing: .03em;
}}

html[data-dream-skin="active"] aside.app-shell-left-panel button[class*="_Button_"] {{
  border-radius: 999px !important;
  background-image: linear-gradient(150deg, rgba(255, 255, 255, .92), rgba(232, 226, 255, .80)) !important;
  border: 1px solid rgba(139, 92, 246, .22) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .9), 0 1px 6px rgba(139, 92, 246, .14) !important;
}}

html[data-dream-skin="active"] aside.app-shell-left-panel button[class*="_Button_"]:hover {{
  background-image: linear-gradient(150deg, #FFFFFF, #E4DAFF) !important;
  border-color: rgba(139, 92, 246, .45) !important;
}}

/* 侧栏里的文字行（新对话 / 项目 / 会话）—— 淡胶囊，靠 hover 显形 */
html[data-dream-skin="active"] aside.app-shell-left-panel a,
html[data-dream-skin="active"] aside.app-shell-left-panel [role="button"],
html[data-dream-skin="active"] aside.app-shell-left-panel [role="treeitem"] {{
  border-radius: 999px;
}}

html[data-dream-skin="active"] aside.app-shell-left-panel a:hover,
html[data-dream-skin="active"] aside.app-shell-left-panel [role="button"]:hover,
html[data-dream-skin="active"] aside.app-shell-left-panel [role="treeitem"]:hover {{
  background-image: linear-gradient(120deg, rgba(255, 255, 255, .95), rgba(226, 234, 255, .78));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .9);
}}

"""

with open(PATCH, encoding="utf-8") as fh:
    text = fh.read()

if TAG in text:
    text = text[:text.index(TAG)] + text[text.index(MARK):]
if MARK not in text:
    raise SystemExit("找不到 END 标记")
text = text.replace(MARK, BLOCK + MARK)

with open(PATCH, "w", encoding="utf-8") as fh:
    fh.write(text)

o, c = text.count("{"), text.count("}")
print(f"  已注入胶囊区块；花括号 {o}/{c} {'平衡' if o == c else '不平衡'}")
print(f"  文件 {os.path.getsize(PATCH)/1024:.0f} KB")
