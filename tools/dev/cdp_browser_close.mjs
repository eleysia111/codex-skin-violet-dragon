// 通过 CDP 的 Browser.close 优雅关闭 Codex（等价于用户正常退出，不是 taskkill）。
// 用途：需要完整重启才能重读引擎样式表时，给 restore-dream-skin.ps1 铺路。
const PORT = process.argv[2] ?? "9335";

const ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
const url = ver.webSocketDebuggerUrl;
if (!url) { console.error("拿不到 browser websocket"); process.exit(1); }

const ws = new WebSocket(url);
await new Promise((r, j) => { ws.addEventListener("open", r); ws.addEventListener("error", j); });
console.log("[browser] 发送 Browser.close …");
ws.send(JSON.stringify({ id: 1, method: "Browser.close", params: {} }));
// 给浏览器 3 秒把进程和 CDP 连接收干净
await new Promise((r) => setTimeout(r, 3000));
try { ws.close(); } catch {}
console.log("[browser] 已请求关闭");
