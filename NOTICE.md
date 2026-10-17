# 第三方声明 · Third-Party Notices

## 本仓库**不包含**的内容

明确说明，避免误解与纠纷：

| 内容 | 归属 | 说明 |
|---|---|---|
| **Codex / ChatGPT 桌面客户端** | OpenAI | 本项目仅为它做皮肤。未包含、未修改其安装包。 |
| **Codex Dream Skin 引擎** | Dream Skin 项目 | 注入引擎本体（`injector.mjs`、`dream-skin.css`、脚本等）**不随本仓库分发**，需用户自行安装。本仓库只提供**针对该引擎的样式覆盖块**与主题包。 |
| **Dream Skin 原始引擎样式表** | Dream Skin 项目 | `engine-backups/` 是用户本机 own 引擎的备份，已在 `.gitignore` 中排除，**不随仓库或发布包分发**。 |
| **启动动画播放器与其视频素材** | 第三方项目 / 其作者 | 本项目**不包含**任何启动动画相关的代码与视频文件。 |
| **其他皮肤的美术素材** | 各原作者 | 见下文「风格参考」。 |

## 角色美术素材

**主立绘、副立绘与 Q 版白龙形象由 [ZipZipPipe](https://www.pixiv.net/users/18604994) 创作**，
并非本项目生成。该系列形象采用 **CC BY-NC-SA 4.0** 协议——
须署名、**禁止商用**、衍生作品须以相同方式共享。

本项目自行生成的美术同样以 CC BY-NC-SA 4.0 发布，**两边协议一致**，
因此本项目作为衍生作品的共享要求天然满足。

它们出现在以下位置，使用时请注意：

| 位置 | 说明 |
|---|---|
| `assets-in/gptq-fullbody.jpg` | 主立绘原图 |
| `assets-in/gptq-fullbody-2.png` | 副立绘原图 |
| `assets-in/gptq-chibi.png` | Q 版原图 |
| `background.png` / `background-night.png` | 合成时**已把立绘烤进背景**，所以背景图包含该角色形象 |
| `engine-patch.css` | `--sky-figure` 与 `--sky-chibi` 两个变量把角色图内嵌成 data URI |
| `docs/screenshots/` | 预览截图里可见该角色 |

> **出处与许可**：上述角色素材来自社区公开分享，按其社区的**开源协议**使用；
> 本项目同样是**开源、非商业**用途，与其许可精神一致，未作商业利用。
> 详见下一节的署名链。

### 署名链 / Attribution chain

写法参照参考项目 `@smalltailqwq/dsh-client-ui-skin-maid-atelier` 的 `_NOTICE.txt`。

| 层级 | 作者 | 贡献 | 主页 |
|---|---|---|---|
| **角色形象与立绘素材** | **ZipZipPipe** | 白龙娘（GPT-Niang）系列形象：主立绘、副立绘、Q 版 | <https://www.pixiv.net/users/18604994> |
| **本皮肤** | eleysia111 | 背景底图、纹章 / 花边 / 流光带 / 晶簇花等装饰、引擎样式覆盖、全部代码 | 本仓库 |

### 素材使用条款

- **角色素材**：版权归 **ZipZipPipe**，协议 **CC BY-NC-SA 4.0**（署名 / 非商业 / 相同方式共享）。
- **本项目生成的美术**：同样以 CC BY-NC-SA 4.0 发布。
- **本项目的修改**（CC BY-NC-SA 要求「注明是否修改」）：对角色素材做了**抠图、等比缩放、
  裁剪、合成进背景**，并把其中两处**转码为 WebP 内嵌为 CSS data URI**。未改动角色设计本身。
- **署名要求**：转载或再分发时请保留上表完整署名，并附上
  <https://creativecommons.org/licenses/by-nc-sa/4.0/> 链接。
- **商用禁止**：包括售卖、付费订阅内容、广告变现、含内购的产品、商业定制交付。
- **本项目不对角色素材再授权**，也不能代替原作者向你授权。
- 若权利人认为此使用方式不妥，请联系，**会立即移除**。

它们出现在以下位置，使用时请注意：

| 位置 | 说明 |
|---|---|
| `assets-in/gptq-fullbody.jpg` | 主立绘原图 |
| `assets-in/gptq-fullbody-2.png` | 副立绘原图 |
| `assets-in/gptq-chibi.png` | Q 版原图 |
| `background.png` / `background-night.png` | 合成时**已把立绘烤进背景**，所以背景图包含该角色形象 |
| `engine-patch.css` | `--sky-figure` 与 `--sky-chibi` 两个变量把角色图内嵌成 data URI |
| `docs/screenshots/` | 预览截图里可见该角色 |

> **商用或再分发前，请自行确认角色素材的协议要求** ——
> 仅遵守本项目的 CC BY-NC-SA 美术许可是不够的。

## 本仓库自行生成的内容

以下为项目自行生成（`gpt-image-2` + 自写合成脚本），按 [LICENSE-ARTWORK.md](LICENSE-ARTWORK.md) 授权：

- 背景的宫殿 / 水晶 / 光带 / 云层 / 数据流等**底图部分**
- 龙形纹章、冰晶花边、晶体流光带、晶簇水晶花等装饰元素
- 界面截图中的排版与配色组合

## 商标 / Trademarks

"Codex"、"ChatGPT"、"OpenAI" 是 OpenAI 的商标。本项目是**非官方**的第三方皮肤，
与 OpenAI **没有任何隶属、赞助或背书关系**。文中提及这些名称仅用于说明适用对象
（合理使用 / nominative use）。

"Dream Skin" 是其各自所有者的名称，本项目与 Dream Skin 项目同样无隶属关系。

## 风格参考

本项目在设计阶段参考过若干公开皮肤作品的**配色思路与构图方式**：

- `@smalltailqwq/dsh-client-ui-skin-maid-atelier` —— 采用 **CC BY-NC-SA 4.0** 许可。
  本项目**未使用其任何图片素材**，仅参考了「如何为一个 AI 客户端做整体氛围改造」的思路。

本项目自行生成的只有背景底图与装饰元素（见上一节），
**角色形象为社区素材，版权归原作者**。
本项目生成部分的许可见 [LICENSE-ARTWORK.md](LICENSE-ARTWORK.md)。

## 代码依赖

运行 `tools\` 下的生成脚本需要以下第三方库（**不随本仓库分发**，请自行安装）：

- **Python 3** + **Pillow**（图像处理与 material 合成）
- **Node.js**（`gen_image2.mjs` 调图像 API、`validate_css.mjs`、`tools/dev/*` 的 CDP 探针）
- **ImageMagick**（可选，仅 `tools/contact_sheet.py` 生成联络表时用到）

## 生图服务

`tools/gen_image2.mjs` 通过 OpenAI 兼容的 `gpt-image-2` 接口生图，
**不包含任何 API key**。使用时请自备凭据并通过环境变量提供：

```powershell
$env:OPENAI_BASE_URL = 'https://your-endpoint/v1'
$env:OPENAI_API_KEY  = 'your-key'
```

请遵守你所使用的生图服务的条款。
