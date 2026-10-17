(() => {
  const hero = document.querySelector('[data-feature="game-source"]');
  if (!hero) return { error: "no hero" };
  const btns = [...hero.querySelectorAll("button, a")];
  const info = (el, which) => {
    if (!el) return null;
    const cs = getComputedStyle(el, which);
    const o = {
      tag: el.tagName,
      cls: String(el.className || "").slice(0, 110),
      txt: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 40),
    };
    if (which) {
      o.content = cs.content;
      o.display = cs.display;
      o.color = cs.color;
      o.fontSize = cs.fontSize;
      o.opacity = cs.opacity;
    } else {
      Object.assign(o, {
        display: cs.display,
        border: cs.border,
        borderRadius: cs.borderRadius,
        background: cs.backgroundColor,
        backgroundImage: cs.backgroundImage === "none" ? "none" : "short",
        padding: cs.padding,
        margin: cs.margin,
        textDecorationLine: cs.textDecorationLine,
        textDecorationStyle: cs.textDecorationStyle,
        textDecorationColor: cs.textDecorationColor,
        textUnderlineOffset: cs.textUnderlineOffset,
        boxShadow: cs.boxShadow === "none" ? "none" : cs.boxShadow.slice(0, 40),
        color: cs.color,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
      });
    }
    return o;
  };
  return {
    heroHtml: hero.innerHTML.slice(0, 700),
    buttons: btns.map((b) => ({
      self: info(b),
      before: info(b, "::before"),
      after: info(b, "::after"),
      children: [...b.querySelectorAll("*")].slice(0, 8).map((c) => info(c)),
    })),
  };
})()
