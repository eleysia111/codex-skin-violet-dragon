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

## 商标 / Trademarks

"Codex"、"ChatGPT"、"OpenAI" 是 OpenAI 的商标。本项目是**非官方**的第三方皮肤，
与 OpenAI **没有任何隶属、赞助或背书关系**。文中提及这些名称仅用于说明适用对象
（合理使用 / nominative use）。

"Dream Skin" 是其各自所有者的名称，本项目与 Dream Skin 项目同样无隶属关系。

## 风格参考

本项目在设计阶段参考过若干公开皮肤作品的**配色思路与构图方式**：

- `@smalltailqwq/dsh-client-ui-skin-maid-atelier` —— 采用 **CC BY-NC-SA 4.0** 许可。
  本项目**未使用其任何图片素材**，仅参考了「如何为一个 AI 客户端做整体氛围改造」的思路。

本项目所有美术素材均为自行生成（`gpt-image-2` + 自写合成脚本），
见 [LICENSE-ARTWORK.md](LICENSE-ARTWORK.md)。

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
