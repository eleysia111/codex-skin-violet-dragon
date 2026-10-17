// 探针 4：定位首页 hero 三处「伪元素文案」的真实节点 + 截图
// 结论先行：副标题 / tagline / 项目前缀 都不在 DOM 里，是 dream-skin.css 里
// [data-feature="game-source"]::before / ::after 与 button::before 的 content。
// 本探针把它们的选择器、content、color 全 dump 出来，便于写精准覆盖。
// 用法: node cdp_probe4.mjs [port] [--shot out.png]
import { writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const PORT = args.find((a) => /^\d+$/.test(a)) ?? "9335";
const shotIdx = args.indexOf("--shot");
const SHOT = shotIdx >= 0 ? args[shotIdx + 1] : null;

const EXPR = `(() => {
  const hero = document.querySelector('[data-feature="game-source"]');
  const pick = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName,
      cls: String(el.className || "").slice(0, 90),
      txt: (el.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 60),
      rect: (() => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })(),
      display: cs.display,
      color: cs.color,
      fontSize: cs.fontSize,
      border: cs.border,
      borderRadius: cs.borderRadius,
      background: cs.backgroundColor,
      backgroundImage: cs.backgroundImage === "none" ? "none" : cs.backgroundImage.slice(0, 60),
      textDecoration: cs.textDecorationLine + " " + cs.textDecorationColor,
      boxShadow: cs.boxShadow === "none" ? "none" : cs.boxShadow.slice(0, 50),
    };
  };
  const pseudo = (el, which) => {
    if (!el) return null;
    const cs = getComputedStyle(el, which);
    return {
      which,
      content: cs.content,
      display: cs.display,
      color: cs.color,
      opacity: cs.opacity,
      fontSize: cs.fontSize,
      marginTop: cs.marginTop,
      marginBottom: cs.marginBottom,
      textShadow: cs.textShadow === "none" ? "none" : cs.textShadow.slice(0, 40),
    };
  };
  const out = { url: location.href, title: document.title };

  // 根上的主题变量
  const rootCS = getComputedStyle(document.documentElement);
  out.vars = {};
  for (const v of ["--dream-skin-name", "--dream-skin-tagline", "--dream-skin-quote",
                   "--dream-skin-brand-subtitle", "--dream-skin-status",
                   "--dream-skin-project-prefix", "--dream-skin-project-label"]) {
    out.vars[v] = rootCS.getPropertyValue(v).trim();
  }
  out.htmlAttrs = {
    "data-dream-skin": document.documentElement.getAttribute("data-dream-skin"),
    "data-dream-art-wide": document.documentElement.getAttribute("data-dream-art-wide"),
    "data-dream-shell": document.documentElement.getAttribute("data-dream-shell"),
    "data-dream-art-safe": document.documentElement.getAttribute("data-dream-art-safe"),
  };

  out.hero = pick(hero);
  out.heroBefore = pseudo(hero, "::before");
  out.heroAfter = pseudo(hero, "::after");

  if (hero) {
    // hero 的内部结构：找到那个项目名 chip
    const all = [...hero.querySelectorAll("button, a")];
    out.heroButtons = all.slice(0, 6).map((b) => ({
      ...pick(b),
      before: pseudo(b, "::before"),
    }));
    // 任意后代里带「sakura」或斜体/下划线的
    out.heroDesc = [...hero.querySelectorAll("*")].slice(0, 24).map((e) => ({
      tag: e.tagName,
      cls: String(e.className || "").slice(0, 60),
      txt: (e.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 30),
    }));
  }

  // 项目选择器那一条（另一个「选择项目」label 的宿主）
  const ps = document.querySelector(".group\\\\/project-selector");
  out.projectSelector = pick(ps);
  out.projectSelectorHost = ps ? pick(ps.parentElement) : null;
  out.projectSelectorHostBefore = ps && ps.parentElement ? pseudo(ps.parentElement, "::before") : null;
  out.fadeWrap = (() => {
    const w = document.querySelector(".horizontal-scroll-fade-mask");
    return w ? { ...pick(w), parent: pick(w.parentElement), parentBefore: pseudo(w.parentElement, "::before") } : null;
  })();

  // 兜底：全文搜一下目标文本到底在不在 light DOM
  const bodyTxt = document.body.innerText || "";
  out.textSearch = {
    "天空工坊": bodyTxt.includes("天空工坊"),
    "循此苦旅": bodyTxt.includes("循此苦旅"),
    "选择项目": bodyTxt.includes("选择项目"),
    "sakura": bodyTxt.includes("sakura"),
  };
  out.shadowRootCount = (() => {
    let n = 0;
    const walk = (root) => { for (const el of root.querySelectorAll("*")) { if (el.shadowRoot) { n++; walk(el.shadowRoot); } } };
    walk(document);
    return n;
  })();
  return out;
})()`;

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const pages = targets.filter((t) => t.type === "page" && t.webSocketDebuggerUrl);
console.log("pages:", pages.map((p) => (p.url || "").slice(0, 80)));

function connect(page) {
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  });
  const send = (method, params) =>
    new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ready = new Promise((r) => ws.addEventListener("open", r));
  return { ws, send, ready };
}

let found = null;
for (const page of pages) {
  const c = connect(page);
  await c.ready;
  const r = await c.send("Runtime.evaluate", { expression: "!!document.querySelector('[data-feature=\\\"game-source\\\"]')", returnByValue: true });
  if (r?.result?.result?.value === true) { found = { page, ...c }; break; }
  c.ws.close();
}

if (!found) {
  console.log("没有页面含 [data-feature=\"game-source\"]（可能不在首页）");
  process.exit(1);
}

console.log("命中页面:", found.page.url);
const out = await found.send("Runtime.evaluate", { expression: EXPR, returnByValue: true });
console.log(JSON.stringify(out?.result?.result?.value ?? out, null, 2));

if (SHOT) {
  const shot = await found.send("Page.captureScreenshot", { format: "png" });
  const b64 = shot?.result?.data;
  if (b64) { writeFileSync(SHOT, Buffer.from(b64, "base64")); console.log("screenshot ->", SHOT); }
  else console.log("screenshot FAILED");
}
found.ws.close();
