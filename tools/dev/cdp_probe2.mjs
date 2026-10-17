// 第二轮探针：确认伪元素占用情况、body 背景尺寸的真实生效值、输入框结构
const PORT = process.argv[2] ?? "9335";

const EXPR = `(() => {
  const cs = (el, pseudo) => getComputedStyle(el, pseudo || null);
  const ps = (el, name) => {
    const s = cs(el, name);
    const c = s.content;
    return {
      content: c,
      used: c !== "none" && c !== "normal",
      bgImage: s.backgroundImage === "none" ? "none" : s.backgroundImage.slice(0, 40),
      bgSize: s.backgroundSize,
      bgPos: s.backgroundPosition,
    };
  };
  const aside = document.querySelector('aside.app-shell-left-panel');
  const body = document.body;
  const bcs = cs(body);
  const composer = document.querySelector('[data-ds-part="composer"]');
  const r = {
    htmlAttrs: [...document.documentElement.attributes].map(a => a.name + "=" + String(a.value).slice(0, 24)),
    body: {
      bgImage: bcs.backgroundImage.replace(/url\\([^)]*\\)/g, "url(…)").slice(0, 90),
      bgSize: bcs.backgroundSize,
      bgPos: bcs.backgroundPosition,
      bgAttach: bcs.backgroundAttachment,
    },
  };
  if (aside) {
    r.aside = {
      cls: String(aside.className).slice(0, 60),
      before: ps(aside, "::before"),
      after: ps(aside, "::after"),
      firstChild: aside.firstElementChild ? {
        tag: aside.firstElementChild.tagName,
        cls: String(aside.firstElementChild.className).slice(0, 50),
        before: ps(aside.firstElementChild, "::before"),
        after: ps(aside.firstElementChild, "::after"),
      } : null,
    };
  }
  if (composer) {
    r.composer = {
      tag: composer.tagName,
      cls: String(composer.className).slice(0, 60),
      part: composer.getAttribute("data-ds-part"),
      bgImage: cs(composer).backgroundImage.replace(/url\\([^)]*\\)/g, "url(…)").slice(0, 70),
      before: ps(composer, "::before"),
      after: ps(composer, "::after"),
    };
  } else { r.composer = "no [data-ds-part=composer]"; }
  return r;
})()`;

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const pages = targets.filter((t) => t.type === "page" && t.webSocketDebuggerUrl && (t.url || "").includes("index.html"));
if (!pages.length) { console.error("没有 index.html 页面"); process.exit(1); }

const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (m, p) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
await new Promise((r) => ws.addEventListener("open", r));
const out = await send("Runtime.evaluate", { expression: EXPR, returnByValue: true });
console.log(JSON.stringify(out?.result?.result?.value ?? out, null, 2));
ws.close();
