# 技术文档 · 天空工坊皮肤是怎么实现的

> 这份文档记录机制与踩过的坑，改样式前请先读一遍，能省掉几个小时试错。
> 所有结论都经过实测验证。

---

## 一、两条完全不同的 CSS 通道

Codex Dream Skin 允许两种方式影响界面，它们的能力边界差别巨大：

| 通道 | 载体 | 限制 |
|---|---|---|
| **主题包安全 CSS** | 主题目录里的 `theme.css` | 受白名单校验，只能做描边、投影、圆角、颜色之类。**不能用 `background-image`、伪元素**。落地在 `@layer dreamskin-community`。 |
| **引擎样式表补丁** | 直接改引擎的 `engine\assets\dream-skin.css` | **不受白名单限制**，`background-image` / `::before` / `::after` / 渐变 / `filter` 全都能用 |

**本项目的精修效果（侧栏纹章、Q 版、顶栏花边、输入框流光环、首页排版）全部走第二条通道。**
只装主题包不打卡通补丁，得到的只是配色 + 背景图。

机制上：`injector.mjs` 在运行时读取 `engine\assets\dream-skin.css`，
由 `renderer-inject.js` 以 `adoptedStyleSheets` 注入到 `html[data-dream-skin="active"]`。

---

## 二、层叠关系（最容易踩的坑）

`adoptedStyleSheets` 按 CSSOM 规范**排在 document 样式之后**。这意味着：

- 在页面里加 `<style>` 去覆盖引擎规则，**压不过**引擎的 `!important`；
- 想压过它只有两条路：
  1. **写进引擎样式表本身**（本项目的 `patches\` 通道，追加在后面即可获胜）
  2. 用 adopted 方式追加注入（`tools\dev\cdp_live.mjs --css` 就是这么做实时预览的）

这也是为什么 `patches\*.css` 里的每条规则都带 `!important`，且选择器必须与引擎规则**同级或更强**。

---

## 三、什么时候才会重新读取样式表

`loadPayload()` 每次调用都会重读 `dream-skin.css`，**但是**注入器只在
「主题指纹变化」时才会重新 `loadPayload`。所以：

- **只改 `dream-skin.css` 不会热更新** → 必须完整重启 Codex；
- **绝对不要用页面刷新（F5 / `Page.reload()`）来刷新皮肤**：
  注入器对每个页面 target **只注入一次**，刷新后 `data-dream-skin` 变 `null`，
  皮肤会直接消失成原生外观，而且不会自己回来（日志里是
  `original CDP browser identity closed; watcher is stopping instead of reconnecting`）。

调样式阶段的正确姿势是用 `tools\dev\cdp_live.mjs` 做实时预览，定稿后再 `apply` + 重启。

---

## 四、`patches\` 通道（手写规则放这里）

`engine-patch.css` 是**生成物**，由 `tools\build_engine_patch.py` 从零重写。
手写规则如果直接写在里面，一次重建就全丢了。

所以手写规则一律放 `patches\*.css`，由 `patch-engine-css.ps1 -Action apply`
按文件名顺序**定点注入到 END 标记之前**（幂等：重复 apply 不会叠加）。

```
patches\30-manual-blocks.css    菜单托盘 / 分组标题金胶囊 / 导航行金胶囊
patches\40-hero-fixes.css       首页文案与排版修整（5 项）
```

完整重建顺序：

```powershell
python .\tools\build_engine_patch.py      # 重写 engine-patch.css 主干
python .\tools\gen_composer_ring.py       # 追加 composer-art（插在 END 前）
python .\tools\gen_capsule_css.py         # 追加 capsule-art（插在 END 前）
powershell -ExecutionPolicy Bypass -File .\patch-engine-css.ps1 -Action apply
```

验证「搬动/重建没丢内容」：

```powershell
python .\tools\dev\verify_patch_equals.py <旧的已打补丁文件>
# 期望输出：新 = 旧 + 增量 ? True
```

---

## 五、已确认的 DOM 节点

| 目标 | 选择器 |
|---|---|
| 侧栏根 | `aside.app-shell-left-panel`（`position: relative; z-index: 40`），其上已有引擎的渐变背景 |
| 侧栏伪元素 | `::before` **空闲**（本项目用），`::after` 已被引擎占用 |
| 输入框根 | `[data-ds-part="composer"]`（`_ComposerLayoutRoot_`），`::before` 与 `::after` 都空闲 |
| Codex 标题 | 胶囊底 `span[class*="h-lh"][class*="w-max"]`；金字 `span[class*="text-heading-sm"]` |
| 侧栏图标按钮 | `button[class*="_Button_"]` |
| 分组标题（项目/最近） | `button[class*="group/section-toggle"]` 内的 `span.min-w-0.truncate` |
| 导航行（新聊天/会话） | `[class*="group/nav-list"] button`，文字 `span[class*="text-fade-truncate"]` |
| 首页 hero 标题 | `[data-feature="game-source"]`，内含 `span.group/title`，父级 `div.flex.flex-col.items-center.gap-6` |
| 首页 logo | `[data-testid="home-icon"]`，`div.relative.size-14`（56px）+ 内层 SVG。**引擎默认把它 `display:none` 藏掉**，原生 `opacity:.3` |
| 首页项目 chip | hero 内 `button`（`class` 含 `align-baseline`），父 `SPAN.group/title`。**只在已选中项目时存在** |
| 项目选择器（新版排版） | composer footer 的 `[class*="_ComposerFooter_"] button`；旧的 `.group/project-selector` 在 Codex 26.1013 已不存在 |

---

## 六、输入框装饰的几何推导（别再重推）

```css
[data-ds-part="composer"] { position: relative; overflow: visible; }

[data-ds-part="composer"]::after {
  content: "";
  position: absolute;
  inset: -100px -18px -24px -18px;          /* 顶部多扩 100px 给花留位置 */
  pointer-events: none;
  background-image: var(--sky-flower), var(--sky-ring);
  background-position: center top, center bottom;
  background-size: 92px auto, 100% calc(100% - 76px);
  background-repeat: no-repeat, no-repeat;
}
```

- 环图 1500×340，飘带位于图像高度 **4%–16%** 区间
- `calc(100% - 76px)` 让环高 = 输入框高 + 48，底部锚定 → 上下各留 24px → **飘带下缘正好贴输入框顶边**
- **水晶花必须放在 `::after` 的背景栈里**；放 `::before` 实测不生效
- 盒子必须扩到 `-100px`，否则花的上半部分会被裁掉

### 背景绘制位置

宽幅主题（`data-dream-art-wide=true`）下主题图painted 在 **`body`** 上：
`background-attachment: fixed` + `cover` + `background-position: focusX% focusY%`（本项目 78% 42%）。

> 注意：`cover` + 右锚点意味着**窗口变窄时先裁左边**，这就是「左侧元素会被裁」的根因，
> 所以所有装饰元素都尽量布在归一化 x ∈ [0.40, 0.90] 的安全区内。

---

## 七、首页那三处文案：**不在 DOM 里**

这是最容易走弯路的地方。用 `document.querySelectorAll('*')` 搜「天空工坊」「循此苦旅」**永远搜不到**，
也不必去穿 Shadow DOM —— 它们是引擎样式表里伪元素的 `content`：

| 文案 | 真实来源 | 变量 | 为什么改 theme.json 没用 |
|---|---|---|---|
| 副标题「天空工坊 · 白色龙娘」 | `[data-feature="game-source"]::before` | `--dream-skin-name` | 它读的是 theme.json 的 **`name`**，不是 `brandSubtitle`；`brandSubtitle` 注入的 `--dream-skin-brand-subtitle` 在整个样式表里**一次都没被用到** |
| tagline「循此苦旅，直抵群星。」 | 同一个 `::after` | `--dream-skin-tagline` | 能改文案，但颜色是 `color: currentColor; opacity: .76`，所以永远跟着正文色偏灰 |
| 项目前缀「选择项目 · 」 | `button::before` | `--dream-skin-project-prefix` | `renderer-inject.js` 里写的是 `THEME.projectPrefix \|\| "选择项目 · "`，**空串被 `\|\|` 吃掉**回退默认值 → 设 `""` 必然无效 |

变量注入见 `renderer-inject.js:460-468`；伪元素规则见 `dream-skin.css` 里
`::before` / `::after` / `button::before` 三处。

### 本项目怎么改的

全部在 `patches\40-hero-fixes.css`：

1. 副标题：`::before { content: none; display: none; }`
2. tagline：`::after { color: #8B5CF6; opacity: 1; font-size: 15px; }` + 同色辉光
3. 项目 chip：关掉前缀 `::before`；边框/圆角/底色/阴影/下划线全拆；只留 `#5B3FB0` 加粗 + 辉光，hover 才浮现点状下划线
4. 恢复 logo：`[data-testid="home-icon"] { display: block; color: #8B5CF6; opacity: .55; }`（原生 56px，引擎原本藏掉了）
5. 标题字号：`font-size: clamp(24px, 2.4vw, 32px)` + `text-align: center`
   （引擎原本 `clamp(19px, 1.85vw, 27px)`，1126px 窗口实测只有 **20.8px**，比原生 heading-xl 约 **26px** 小一圈）

---

## 八、陷阱清单

1. **绝对不要强杀 Codex 来刷样式**。直接 `taskkill` 会让注入器的会话记录（`state.json`）与真实浏览器不一致，
   引擎会保守拒绝注入 → 皮肤消失。要退出就用托盘退出，或用引擎自带的
   `restore-dream-skin.ps1`。
2. **`-RestartExisting` 不会真正重启页面**，它只重新拉起进程。读完新样式表仍然需要完整重启。
3. **重建 `engine-patch.css` 会覆盖手写区块** —— 所以手写规则必须放 `patches\`（见第四节）。
4. **不要用 `background-clip: text` 做烫金**。Codex 标题那个 span 带 `truncate`（`overflow:hidden`），
   裁字背景框高度会被算成 0 → 字变透明且背景没铺上 = **文字直接消失**。
   改用实心金 `#A9762F` + `text-shadow` 高光。
5. **PowerShell 脚本存 UTF-8 带 BOM**（PS 5.1 否则按 GBK 读中文，满屏 `Unexpected token`）。
   仓库里已有的 `.ps1` 都是带 BOM 的，改完记得保持。
6. **`python -c` 内联会丢引号**，一律写脚本文件再跑。

---

## 九、校验与回滚

```powershell
# 主题包校验（推荐入口）：自动把明/暗两套整理成干净目录再验
powershell -ExecutionPolicy Bypass -File .\tools\validate-package.ps1

# 安全 CSS 校验：必须传入引擎自带的校验器路径
node .\tools\validate_css.mjs `
  "$env:LOCALAPPDATA\CodexDreamSkin\engine\assets\safe-css-validator.mjs" `
  .\theme.css

# 补丁状态（大小 / SHA256 / 花括号平衡 / 注入块 / 备份列表）
powershell -ExecutionPolicy Bypass -File .\patch-engine-css.ps1 -Action status

# 完全回滚引擎样式表
powershell -ExecutionPolicy Bypass -File .\patch-engine-css.ps1 -Action revert
```

> ⚠ `validate_theme.py` 复刻的是**主题包目录**规则：只允许 `theme.json` + 一张
> `background.(png|jpg|webp)`（可选 `theme.css`），**出现任何多余文件即判失败**。
> 所以它必须在干净的主题包目录里运行，直接对着仓库根目录跑必然 FAIL。

`apply` 内置三重保护：首次自动备份原始样式表、写入前做花括号平衡校验、
写入后校验 BEGIN/END 标记数量，失败自动回滚。
