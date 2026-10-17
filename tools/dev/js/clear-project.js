// 清掉 composer footer 里已选中的项目（回到「选择项目」空状态）
(() => {
  const b = document.querySelector('[class*="ActiveProjectSelectorTriggerClearButton"]');
  return b || null;
})()
