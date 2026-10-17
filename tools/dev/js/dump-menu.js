(() => {
  const out = [];
  const pops = document.querySelectorAll('[role="menu"], [role="dialog"], [role="listbox"], [data-radix-popper-content-wrapper]');
  out.push({ popups: pops.length, roles: [...pops].map((p) => (p.getAttribute("role") || p.tagName) + "." + String(p.className || "").slice(0, 40)) });
  const items = [];
  for (const p of pops) {
    for (const el of p.querySelectorAll("button, [role='option'], [role='menuitem']")) {
      const t = (el.innerText || "").replace(/\s+/g, " ").trim();
      if (!t) continue;
      items.push({
        tag: el.tagName,
        role: el.getAttribute("role") || "",
        cls: String(el.className || "").slice(0, 50),
        txt: t.slice(0, 30),
      });
    }
  }
  out.push({ itemCount: items.length, items: items.slice(0, 20) });
  return out;
})()
