// 点开 composer footer 的项目选择器：按 aria-label 精确匹配「选择项目」。
// 注意 aria-label 会随状态变化（选中项目后可能变成项目名），所以按「第一个非纯图标按钮」兜底。
(() => {
  const foot = document.querySelector('[class*="_ComposerFooter_"]');
  if (!foot) return null;
  const btns = [...foot.querySelectorAll("button")];
  const byLabel = btns.find((b) => {
    const a = b.getAttribute("aria-label") || "";
    return a === "选择项目" || a.includes("选择项目") || /project/i.test(a);
  });
  if (byLabel) return byLabel;
  // 兜底：footer 里第一个带文字内容的 button
  return btns.find((b) => (b.innerText || "").trim().length > 0) || null;
})()
