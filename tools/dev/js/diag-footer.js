(() => {
  const foot = document.querySelector('[class*="_ComposerFooter_"]');
  const diag = {
    footer: !!foot,
    buttons: foot ? [...foot.querySelectorAll("button")].map((b) => ({
      aria: b.getAttribute("aria-label") || "",
      expanded: b.getAttribute("aria-expanded") || "",
      txt: (b.innerText || "").replace(/\s+/g, " ").trim().slice(0, 24),
      cls: String(b.className || "").slice(0, 40),
    })) : [],
  };
  return diag;
})()
