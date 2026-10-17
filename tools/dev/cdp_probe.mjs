// 通过 CDP 直接查 DOM：找出左侧栏 / 输入框里真正绘制背景的那一层。
// 用法: node cdp_probe.mjs [port]
const PORT = process.argv[2] ?? process.env.CDP_PORT ?? "9335";

const EXPR = `(() => {
  const pick = (el) => {
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName,
      cls: String(el.className || "").slice(0, 70),
      part: el.getAttribute("data-ds-part") || "",
      bgImage: cs.backgroundImage === "none" ? "none" : cs.backgroundImage.slice(0, 48),
      bgColor: cs.backgroundColor,
      pos: cs.position,
      z: cs.zIndex,
      overflow: cs.overflow,
      h: el.clientHeight,
      w: el.clientWidth,
    };
  };
  const walk = (el, d, out) => {
    if (d > 3) return;
    out.push({ depth: d, ...pick(el) });
    for (const c of el.children) walk(c, d + 1, out);
  };
  const aside = document.querySelector('aside.app-shell-left-panel');
  const composer = document.querySelector('[data-ds-part="composer"], :is(.composer-surface-chrome, [class*="_ComposerLayoutRoot_"])');
  const res = { url: location.href };
  if (aside) { const a = []; walk(aside, 0, a); res.aside = { root: pick(aside), tree: a.slice(0, 14) }; }
  if (composer) { const c = []; walk(composer, 0, c); res.composer = { root: pick(composer), tree: c.slice(0, 10) }; }
  res.header = (() => {
    const h = document.querySelector('header:is(.app-header-tint, [data-app-shell-header-edge-scroll], [class*="_Header_"])');
    return h ? pick(h) : null;
  })();
  return res;
})()`;

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const pages = targets.filter((t) => t.type === "page" && t.webSocketDebuggerUrl);
if (pages.length === 0) {
  console.error("找不到可调试页面");
  process.exit(1);
}
console.log("候选页面:", pages.map((p) => (p.url || "").slice(0, 70)));

async function probe(page) {
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (method, params) =>
    new Promise((resolve) => {
      const mid = ++id;
      pending.set(mid, resolve);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  await new Promise((r) => ws.addEventListener("open", r));
  const out = await send("Runtime.evaluate", { expression: EXPR, returnByValue: true, awaitPromise: false });
  ws.close();
  return out?.result?.result?.value;
}

for (const page of pages) {
  const value = await probe(page);
  if (value?.aside?.root) {
    console.log("命中页面:", (page.url || "").slice(0, 80));
    console.log(JSON.stringify(value, null, 2));
    process.exit(0);
  }
}
console.log("所有页面里都没有 aside.app-shell-left-panel");

