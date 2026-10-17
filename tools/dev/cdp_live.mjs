// 实时试验台：往运行中的 Codex 页面里注入 / 替换候选 CSS、点击、截图、求值。
// 目的：避免「改 engine-patch.css → 完整重启 Codex」的慢循环。
// 定稿后再烤进 engine-patch.css 走正式流程。
//
// 用法（按出现顺序执行）：
//   node cdp_live.mjs --css 候选.css --shot 出图.png --wait 600
//   node cdp_live.mjs --click "document.querySelector('[aria-label=\"选择项目\"]')" --shot 菜单.png
//   node cdp_live.mjs --eval "document.body.innerText.slice(0,200)"
//   node cdp_live.mjs --clearcss --shot 原样.png
import { readFileSync, writeFileSync } from "node:fs";

const argv = process.argv.slice(2);
const ops = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--css") ops.push({ op: "css", value: argv[++i] });
  else if (a === "--shot") ops.push({ op: "shot", value: argv[++i] });
  else if (a === "--eval") ops.push({ op: "eval", value: argv[++i] });
  else if (a === "--evalfile") ops.push({ op: "eval", value: "FILE:" + argv[++i] });
  else if (a === "--click") ops.push({ op: "click", value: argv[++i] });
  else if (a === "--clickfile") ops.push({ op: "click", value: "FILE:" + argv[++i] });
  else if (a === "--wait") ops.push({ op: "wait", value: Number(argv[++i]) });
  else if (a === "--clearcss") ops.push({ op: "clearcss" });
  else if (a === "--reload") ops.push({ op: "reload" });
  else if (a === "--port") ops.push({ op: "port", value: argv[++i] });
  else if (/^\d+$/.test(a)) ops.push({ op: "port", value: a });
}
const PORT = (ops.find((o) => o.op === "port")?.value) ?? "9335";
const STYLE_ID = "sky-live-preview";

// 表达式可以从文件读：绕开 PowerShell 传多行 / 中文参数的引号地狱
const resolveExpr = (v) => (v.startsWith("FILE:") ? readFileSync(v.slice(5), "utf8") : v);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = targets.find((t) => t.type === "page" && (t.url || "").includes("index.html"));
if (!page) { console.error("找不到 index.html 页面"); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params) =>
  new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await new Promise((r) => ws.addEventListener("open", r));

const evalJs = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r?.result?.exceptionDetails) {
    console.error("EXCEPTION:", JSON.stringify(r.result.exceptionDetails).slice(0, 500));
    return undefined;
  }
  return r?.result?.result?.value;
};

for (const o of ops) {
  if (o.op === "port") continue;

  if (o.op === "css") {
    const css = readFileSync(o.value, "utf8");
    // 关键：引擎自己的样式表是以 adoptedStyleSheets 注入的，而 adopted 排在 document 样式之后。
    // 所以预览也走 adopted（追加到末尾）才能压过引擎的 !important。
    const n = await evalJs(`(() => {
      window.__skyPreviewSheets = window.__skyPreviewSheets || [];
      for (const s of window.__skyPreviewSheets) {
        document.adoptedStyleSheets = document.adoptedStyleSheets.filter((x) => x !== s);
      }
      const old = document.getElementById(${JSON.stringify(STYLE_ID)});
      if (old) old.remove();
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(${JSON.stringify(css)});
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      window.__skyPreviewSheets = [sheet];
      return sheet.cssRules.length;
    })()`);
    console.log(`[css] 注入 ${o.value} -> ${n} 条规则（adopted，排在引擎之后）`);
  }

  if (o.op === "clearcss") {
    await evalJs(`(() => {
      const arr = window.__skyPreviewSheets || [];
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter((x) => !arr.includes(x));
      window.__skyPreviewSheets = [];
      const o = document.getElementById(${JSON.stringify(STYLE_ID)});
      if (o) o.remove();
      return document.adoptedStyleSheets.length;
    })()`);
    console.log("[css] 已移除预览样式");
  }

  if (o.op === "click") {
    const expr = resolveExpr(o.value);
    const r = await evalJs(`(() => {
      const el = (${expr});
      if (!el) return "NOT_FOUND";
      const rect = el.getBoundingClientRect();
      el.focus && el.focus();
      el.click();
      return "clicked @ " + Math.round(rect.x + rect.width / 2) + "," + Math.round(rect.y + rect.height / 2);
    })()`);
    console.log("[click]", r);
  }

  if (o.op === "eval") {
    const r = await evalJs(resolveExpr(o.value));
    console.log("[eval]", typeof r === "string" ? r : JSON.stringify(r, null, 1));
  }

  if (o.op === "reload") {
    await send("Page.reload", { ignoreCache: true });
    console.log("[reload] 已请求整页重载（ignoreCache）");
    await sleep(4000);
  }

  if (o.op === "wait") { await sleep(o.value); }

  if (o.op === "shot") {
    const s = await send("Page.captureScreenshot", { format: "png" });
    const b64 = s?.result?.data;
    if (b64) { writeFileSync(o.value, Buffer.from(b64, "base64")); console.log("[shot]", o.value); }
    else console.log("[shot] FAILED");
  }
}

ws.close();
