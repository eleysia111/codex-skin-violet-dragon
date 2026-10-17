// 用 Dream Skin 官方的 safe-css 校验器在本地验证 theme.css。
// 用法: node validate_css.mjs <safe-css-validator.mjs> <theme.css>
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const [, , validatorPath, cssPath] = process.argv;
if (!validatorPath || !cssPath) {
  console.error("用法: node validate_css.mjs <safe-css-validator.mjs> <theme.css>");
  process.exit(2);
}

const mod = await import(pathToFileURL(validatorPath).href);
const css = readFileSync(cssPath, "utf8");

console.log("导出的能力:", Object.keys(mod).join(", "));

try {
  const out = mod.validateSafeCss(css, {});
  console.log("RESULT: PASS");
  if (typeof out === "string") {
    console.log("编译产物长度:", out.length);
    console.log(out.slice(0, 600));
  } else if (out) {
    console.log("返回:", JSON.stringify(out).slice(0, 600));
  }
} catch (err) {
  console.log("RESULT: FAIL");
  console.log("  name:", err?.name);
  console.log("  code:", err?.code);
  console.log("  message:", err?.message);
  if (err?.offset !== undefined) console.log("  offset:", err.offset);
  process.exitCode = 1;
}
