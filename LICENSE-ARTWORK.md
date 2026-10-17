# 美术素材许可 · Artwork License

本仓库中的**美术素材**采用 **Creative Commons Attribution-NonCommercial-ShareAlike 4.0
International（CC BY-NC-SA 4.0）** 许可。

The artwork in this repository is licensed under **CC BY-NC-SA 4.0**.

完整的法律文本请见官方地址：
<https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode>

---

## 为什么不是「最宽松」的许可？

本项目刻意对齐参考项目 `@smalltailqwq/dsh-client-ui-skin-maid-atelier` 的做法：
**代码 MIT + 美术 CC BY-NC-SA 4.0 + 完整署名链**。理由有三个：

1. **含角色的成品无法放宽。** `background*.png` 与 `engine-patch.css` 里都内嵌了
   第三方角色形象；对这些文件发「可商用」等于拿别人的作品给第三方授权，既无权也无效。
2. **可能受上游 ShareAlike 约束。** 若角色素材本身是「相同方式共享」类协议，
   含角色的合成图作为衍生作品**必须**延续同协议。
3. **「最宽松」与「非商用」互相矛盾。** CC0 的定义就是允许商用，两者不可能同时成立。

如果你确实需要可商用的素材，可行的做法是使用**不含角色立绘**的版本
（`tools/compose_codex_theme.py` 支持 `NO_FIGURE=1`，补丁也可去掉
`--sky-figure` / `--sky-chibi`）——那部分完全由本项目生成，可单独以更宽松的协议授权。

---

## 适用范围 / Scope

以下内容适用本许可（**本项目自行生成**的部分）：

| 路径 | 内容 |
|---|---|
| `background.png` | 明版主题背景的**背景底图部分**（宫殿、水晶、光带、花边）※ 见下方排除说明 |
| `background-night.png` | 夜版主题背景的**背景底图部分** ※ 见下方排除说明 |
| `assets-gen/image2/` | gpt-image-2 生成的宫殿、流光带、花边、纹章、晶簇花等装饰元素 |
| `docs/screenshots/` | 预览截图（其中出现的角色形象仍属原作者） |

**不适用**本许可的内容：

- 源码（`*.py` / `*.mjs` / `*.ps1` 等）→ 见 [LICENSE](LICENSE)（MIT）
- **角色立绘与 Q 版白龙形象**（`assets-in/` 中的主立绘、副立绘、Q 版；
  以及 `background*.png` 中被合成的角色、`engine-patch.css` 里 `--sky-figure` /
  `--sky-chibi` 两个 data URI）→ **第三方社区素材，版权归原作者，本项目不持有权利、
  也未对其再许可**。详见 [NOTICE.md](NOTICE.md)。
- 任何**不属于本仓库**的其他第三方内容 → 见 [NOTICE.md](NOTICE.md)

> ⚠ 因此，如果你要商用或再分发 `background*.png`，请注意其中**包含第三方角色形象**，
> 你需要**另行取得角色素材权利人的许可**，仅遵守 CC BY-NC-SA 并不足够。

---

## 这意味着什么 / What this means

你可以：

- **共享**：以任何媒介或格式复制、再分发这些素材
- **演绎**：修改、转换，或基于素材创作
- 用于个人、学习、非商业的皮肤 / 同人用途

你必须：

- **署名（BY）**：注明来源为本项目「天空工坊 · Sky Atelier」，并附上本许可的链接，同时说明是否做过修改
- **非商业（NC）**：**不得用于商业目的**。包括但不限于：付费售卖、付费订阅内容、广告变现、含内购的产品、商业客户的定制交付
- **相同方式共享（SA）**：若你修改或基于素材创作，你的衍生作品必须采用**同样的 CC BY-NC-SA 4.0** 许可发布

你不得：

- 附加法律条款或技术措施（如 DRM），限制他人按本许可使用这些素材
- 暗示原作者为你或你的使用背书

---

## 署名示例 / Attribution example

```
基于「天空工坊 · Sky Atelier」（作者：Sky Atelier contributors）的素材创作，
原始许可：CC BY-NC-SA 4.0 — https://creativecommons.org/licenses/by-nc-sa/4.0/
已做修改：调整了背景的色调与构图。
```

---

## 说明 / Notes

- 本项目中**属于我们生成的**素材（背景底图、纹章、花边、流光带、晶簇花等）均为自行生成
  （`gpt-image-2` + 自写合成脚本），未复制任何第三方皮肤的图片。
  风格上参考过若干公开皮肤的配色与构图思路，但**没有复制其素材**。
- **但角色形象不是我们生成的**：主立绘、副立绘与 Q 版白龙均来自社区既有素材。
  它们的版权与许可不属于本文件，也不在本项目可授权的范围内。
- 本许可仅覆盖由本项目产出的素材。若你在自己的衍生作品里使用了第三方素材，
  那部分仍受其原始许可约束。
