(() => {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const out = {
    attrs: {
      skin: root.getAttribute("data-dream-skin"),
      wide: root.getAttribute("data-dream-art-wide"),
      shell: root.getAttribute("data-dream-shell"),
      safe: root.getAttribute("data-dream-art-safe"),
      taskMode: root.getAttribute("data-dream-task-mode"),
    },
    vars: {},
    adopted: 0,
    styleSheets: document.styleSheets.length,
    artOnBody: null,
  };
  for (const v of ["--dream-skin-art", "--ds-art-position", "--sky-figure", "--sky-chibi", "--sky-ring", "--dream-skin-name"]) {
    const val = cs.getPropertyValue(v).trim();
    out.vars[v] = val.length > 60 ? val.slice(0, 60) + "…(" + val.length + ")" : val;
  }
  out.adopted = (document.adoptedStyleSheets || []).length;
  const bodyCS = getComputedStyle(document.body);
  out.artOnBody = {
    bgImage: bodyCS.backgroundImage === "none" ? "none" : bodyCS.backgroundImage.slice(0, 40) + "…",
    bgSize: bodyCS.backgroundSize,
    bgAttachment: bodyCS.backgroundAttachment,
  };
  return out;
})()
