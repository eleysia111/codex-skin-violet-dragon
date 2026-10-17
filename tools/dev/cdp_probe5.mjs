// 探针 5：定位 composer footer 里的项目 chip（当前版本的「选择项目」）与 hero 内可能的内联 chip
// 用法: node cdp_probe5.mjs [port]
const PORT = process.argv[2] ?? "9335";

const EXPR = `(() => {
  const info = (el, which) => {
    if (!el) return null;
    const cs = getComputedStyle(el, which);
    return {
      tag: el.tagName,
      cls: String(el.className || "").slice(0, 100),
      testid: el.getAttribute("data-testid") || "",
      aria: el.getAttribute("aria-label") || "",
      txt: (el.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 40),
      display: cs.display,
      border: cs.border,
      borderBottom: cs.borderBottom,
      borderRadius: cs.borderRadius,
      background: cs.backgroundColor,
      padding: cs.padding,
      margin: cs.margin,
      textDecoration: cs.textDecorationLine + " / " + cs.textDecorationStyle + " / " + cs.textDecorationColor,
      boxShadow: cs.boxShadow === "none" ? "none" : cs.boxShadow.slice(0, 40),
      content: which ? cs.content : undefined,
      color: cs.color,
    };
  };
  const out = {};

  // 1) composer footer 容器及其内部可点元素
  const foot = document.querySelector('[class*="_ComposerFooter_"]');
  out.footerFound = !!foot;
  if (foot) {
    out.footer = [];
    const walk = (el, d) => {
      if (d > 3) return;
      out.footer.push({ d, ...info(el) });
      for (const c of el.children) walk(c, d + 1);
    };
    walk(foot, 0);
    out.footerButtons = [...foot.querySelectorAll("button, a, [role=\\"button\\"]")].map((b) => ({
      ...info(b),
      before: info(b, "::before"),
      after: info(b, "::after"),
    }));
  }

  // 2) hero 内是否有 button（旧版内联 chip 形态）
  const hero = document.querySelector('[data-feature="game-source"]');
  out.heroButtons = hero ? [...hero.querySelectorAll("button, a")].map((b) => ({
    ...info(b),
    before: info(b, "::before"),
  })) : null;

  // 3) 全文找带 project-selector 类名的元素（新旧两版类名都可能变）
  out.projectSelectorish = [...document.querySelectorAll('[class*="project-selector"], [class*="ProjectSelector"]')].map(info);

  // 4) 找所有带虚线下划线（dashed）的元素
  out.dashed = [...document.querySelectorAll("*")].filter((el) => {
    const cs = getComputedStyle(el);
    return cs.textDecorationStyle === "dashed" || /dashed/.test(cs.borderStyle);
  }).slice(0, 12).map((el) => {
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName,
      cls: String(el.className || "").slice(0, 70),
      txt: (el.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 30),
      td: cs.textDecorationLine + " " + cs.textDecorationStyle,
      bs: cs.borderStyle,
      border: cs.border,
    };
  });
  return out;
})()`;

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = targets.find((t) => t.type === "page" && (t.url || "").includes("index.html"));
if (!page) { console.error("no index.html page"); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (m, p) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
await new Promise((r) => ws.addEventListener("open", r));
const out = await send("Runtime.evaluate", { expression: EXPR, returnByValue: true });
console.log(JSON.stringify(out?.result?.result?.value ?? out, null, 1));
ws.close();
