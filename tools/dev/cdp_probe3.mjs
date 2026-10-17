// 探针：找出侧栏里可做「胶囊」的节点（Codex 品牌按钮、各类行、按钮）
const PORT = process.argv[2] ?? "9335";

const EXPR = `(() => {
  const aside = document.querySelector('aside.app-shell-left-panel');
  if (!aside) return { error: "no aside" };
  const info = (el) => {
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName,
      tested: el.getAttribute("data-testid") || "",
      part: el.getAttribute("data-ds-part") || "",
      role: el.getAttribute("role") || "",
      cls: String(el.className || "").slice(0, 80),
      txt: (el.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 24),
      h: el.clientHeight,
      w: el.clientWidth,
      br: cs.borderRadius,
      bg: cs.backgroundColor,
    };
  };
  const out = { codex: [], items: [] };
  // 含 Codex 文本的最小元素及其两级祖先
  const walker = document.createTreeWalker(aside, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    if (n.textContent.trim() === "Codex") {
      let el = n.parentElement;
      for (let i = 0; i < 3 && el; i++) { out.codex.push({ lvl: i, ...info(el) }); el = el.parentElement; }
      break;
    }
  }
  // 侧栏内的可点行/按钮
  const cands = aside.querySelectorAll('button, a, [role="button"], [role="option"], [role="treeitem"], [role="menuitem"]');
  out.items = [...cands].slice(0, 22).map(info);
  return out;
})()`;

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const pages = targets.filter((t) => t.type === "page" && (t.url || "").includes("index.html"));
const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (m, p) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
await new Promise((r) => ws.addEventListener("open", r));
const out = await send("Runtime.evaluate", { expression: EXPR, returnByValue: true });
console.log(JSON.stringify(out?.result?.result?.value ?? out, null, 1));
ws.close();
