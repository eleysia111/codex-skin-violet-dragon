# 美术素材许可 · Artwork License

本仓库中的**全部美术素材**采用 **Creative Commons Attribution-NonCommercial-ShareAlike 4.0
International（CC BY-NC-SA 4.0）** 许可，其中包括：

- **本项目生成**的背景底图、纹章、花边、流光带、晶簇花等装饰，以及叠加合成的背景成品
- **ZipZipPipe** 创作的白龙娘角色立绘（[主页](https://www.pixiv.net/users/18604994)）
  —— 版权归原作者，本项目**沿用同一协议**发布，共享要求天然满足

All artwork in this repository is licensed under **CC BY-NC-SA 4.0**,
including the ZipZipPipe character illustrations (© ZipZipPipe) which are
redistributed here under the same license.

完整的法律文本请见官方地址：
<https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode>

---

## 为什么是 CC BY-NC-SA 4.0 而不是更宽松的许可？

1. **上游就是 NC-SA。** 角色立绘由 **ZipZipPipe** 创作，协议为 **CC BY-NC-SA 4.0**。
   本项目把立绘合成进背景、转码为内嵌 data URI，属于**衍生作品**，
   按 ShareAlike 要求**必须**以相同协议提供 —— 这一点没有商量余地。
2. **「最宽松」与「非商用」互相矛盾。** CC0 的定义就是允许商用，两者不可能同时成立。
3. **与生态一致。** 参考项目 `@smalltailqwq/dsh-client-ui-skin-maid-atelier`
   同样是「代码 MIT + 美术 CC BY-NC-SA 4.0 + 完整署名链」。保持一致，使用者也少踩坑。

如果你确实需要可商用的素材，可行的做法是使用**不含角色立绘**的版本
（`tools/compose_codex_theme.py` 支持 `NO_FIGURE=1`，补丁也可去掉
`--sky-figure` / `--sky-chibi`）——那部分完全由本项目生成，可单独以更宽松的协议授权。

---

## 适用范围 / Scope

| 路径 | 内容 | 版权 |
|---|---|---|
| `background.png` / `background-night.png` | 主题背景成品（本项目合成，**含角色立绘**） | 制作 © eleysia111，角色 © ZipZipPipe |
| `assets-gen/image2/` | gpt-image-2 生成的宫殿、流光带、花边、纹章、晶簇花 | © eleysia111 |
| `assets-in/` | 角色原图：主立绘、副立绘、Q 版 | **© ZipZipPipe** |
| `engine-patch.css` | 内嵌的角色 data URI（`--sky-figure` / `--sky-chibi`）与本项目规则 | 角色 © ZipZipPipe，其余 © eleysia111 |
| `docs/screenshots/` | 预览截图 | 角色 © ZipZipPipe，截图 © eleysia111 |

**不适用**本许可的内容：

- 源码（`*.py` / `*.mjs` / `*.ps1` 等）→ 见 [LICENSE](LICENSE)（MIT）
- 任何**不属于本仓库**的其他第三方内容 → 见 [NOTICE.md](NOTICE.md)

> 商用前请注意：本仓库**全部美术**都带 **NC（非商业）** 限制，
> 且角色形象的版权属于 ZipZipPipe。**商业使用请另行取得原作者许可。**

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
本作品基于以下素材创作：
- 「天空工坊 · Sky Atelier」（作者：eleysia111）— 背景底图与装饰，
  CC BY-NC-SA 4.0 — https://creativecommons.org/licenses/by-nc-sa/4.0/
- 白龙娘角色形象（作者：ZipZipPipe — https://www.pixiv.net/users/18604994），
  CC BY-NC-SA 4.0 — https://creativecommons.org/licenses/by-nc-sa/4.0/
已做修改：调整了背景色调与构图，并对角色立绘做了裁切与合成。
```

> CC BY-NC-SA 要求「注明是否修改」。上例最后一行就是干这个的，转载时别漏。

---

## 说明 / Notes

- 本项目生成的素材（背景底图、纹章、花边、流光带、晶簇花等）均为自行生成
  （`gpt-image-2` + 自写合成脚本），未复制任何第三方皮肤的图片。
  风格上参考过若干公开皮肤的配色与构图思路，但**没有复制其素材**。
- **角色形象由 ZipZipPipe 创作**，协议同为 CC BY-NC-SA 4.0，
  本仓库在**同一协议**下分发，属于合规的衍生共享；角色形象的**版权仍归 ZipZipPipe**。
- 本许可覆盖本仓库全部美术素材。若你在自己的衍生作品里再次使用，
  请**同时保留两位作者（ZipZipPipe 与本项目）的署名**。
