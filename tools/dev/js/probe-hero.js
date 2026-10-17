(() => {
  const hero = document.querySelector('[data-feature="game-source"]');
  const icon = document.querySelector('[data-testid="home-icon"]');
  const pick = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName,
      cls: String(el.className || "").slice(0, 140),
      display: cs.display,
      visibility: cs.visibility,
      opacity: cs.opacity,
      w: Math.round(r.width),
      h: Math.round(r.height),
      color: cs.color,
      fontSize: cs.fontSize,
      margin: cs.margin,
      inlineStyle: el.getAttribute("style") || "",
      childTags: [...el.children].map((c) => c.tagName + "." + String(c.className || "").slice(0, 24)),
      html: el.innerHTML.slice(0, 240),
    };
  };
  const out = {
    url: location.href,
    skin: document.documentElement.getAttribute("data-dream-skin"),
    hero: pick(hero),
    heroFontSize: hero ? getComputedStyle(hero).fontSize : null,
    heroLineHeight: hero ? getComputedStyle(hero).lineHeight : null,
    heroFontWeight: hero ? getComputedStyle(hero).fontWeight : null,
    heroCls: hero ? String(hero.className).slice(0, 160) : null,
    icon: pick(icon),
    iconParent: icon ? pick(icon.parentElement) : null,
  };
  // 主标题内层（真正的文字节点容器）
  if (hero) {
    const inner = hero.querySelector("span");
    out.heroInner = pick(inner);
  }
  // 参考：侧栏 Codex 标题、tagline 的字号，便于定标
  const aside = document.querySelector("aside.app-shell-left-panel");
  if (aside) {
    const t = aside.querySelector('span[class*="text-heading-sm"]');
    out.asideTitle = t ? { fontSize: getComputedStyle(t).fontSize, txt: (t.innerText || "").trim() } : null;
  }
  const after = hero ? getComputedStyle(hero, "::after") : null;
  if (after) out.tagline = { fontSize: after.fontSize, color: after.color, content: after.content };
  return out;
})()
