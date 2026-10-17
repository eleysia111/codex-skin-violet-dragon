// 调 gpt-image-2 生成天空工坊素材。
// 用法: node gen_image2.mjs <job> [<job> ...]
// 环境变量:
//   OPENAI_BASE_URL  必填，OpenAI 兼容端点（示例: https://your-endpoint/v1）
//   OPENAI_API_KEY   必填，你的密钥；本脚本不含任何硬编码凭据
//   IMAGE_MODEL      可选，默认 gpt-image-2；可用 gpt-image-2-2K / gpt-image-2-pro 等
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUTDIR = join(HERE, "..", "assets-gen", "image2");
const BASE = (process.env.OPENAI_BASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.OPENAI_API_KEY ?? "";
const MODEL = process.env.IMAGE_MODEL ?? "gpt-image-2";

const STYLE =
  "palette strictly white #FFFFFF, pale lavender #E8E2FF, lavender #D9CFF7, amethyst #8B5CF6, " +
  "deep amethyst #5B3FB0, crystal highlight #C9B6FF, silver #C8C6D4; " +
  "material language: translucent crystal, faceted amethyst gems, thin silver filigree lines (never thick dark outlines), " +
  "holographic 01 binary data streams, soft volumetric glow, ultra clean tech-fantasy, " +
  "high detail, crisp edges, no text, no watermark, no logo";

const JOBS = {
  "palace-light": {
    size: "1536x1024",
    transparent: false,
    prompt:
      "A majestic futuristic palace interior hall for a UI wallpaper, bright and airy. " +
      "Vast symmetrical white marble-and-crystal architecture, arches of thin silver filigree, " +
      "amethyst crystal clusters growing along the walls and pillars, a glowing lavender dais in the far center, " +
      "floating holographic panels and vertical columns of falling 01 binary code, " +
      "volumetric light rays from a high skylight, faint lavender mist on the floor, " +
      "strong central perspective, deep clean negative space on the left for UI text panels, " +
      "wide establishing shot, no characters, no people, no text, no watermark, no logo. " +
      STYLE,
  },
  "palace-dark": {
    size: "1536x1024",
    transparent: false,
    prompt:
      "A majestic futuristic palace interior hall for a UI wallpaper, night version. " +
      "Deep violet-navy cathedral-like hall of dark crystal and polished obsidian, thin silver filigree arches, " +
      "large glowing amethyst crystal clusters as the only light sources, a radiant lavender dais in the far center, " +
      "dense vertical 01 binary code rain and holographic data ribbons drifting in the air, " +
      "cool rim light, volumetric god rays, subtle violet fog on the floor, " +
      "strong central perspective, deep clean negative space on the left for UI text panels, " +
      "wide establishing shot, no characters, no people, no text, no watermark, no logo. " +
      STYLE,
  },
  ribbon: {
    size: "1536x1024",
    transparent: true,
    prompt:
      "One single horizontal ornamental ribbon banner, centered, floating in empty space. " +
      "Glossy white and pale lavender satin ribbon with thin silver edge piping and a gentle S-curve fold, " +
      "glowing lavender data-stream lines flowing along its length, tiny 01 binary glyphs sparkling around it, " +
      "faceted amethyst gem clasps at both ends with small silver tassels, " +
      "isolated on a fully transparent background, PNG with alpha, product-style clean cut edges, " +
      "front view, no text, no watermark, no logo. " +
      STYLE,
  },
  lace: {
    size: "1536x1024",
    transparent: true,
    prompt:
      "One single horizontal crystal lace border strip, centered, floating in empty space. " +
      "Elegant geometric lace made of hexagonal crystal motifs and faceted amethyst gems joined by thin silver filigree, " +
      "translucent white and pale violet, symmetric scalloped repeating pattern like a trim edge, " +
      "soft inner glow, isolated on a fully transparent background, PNG with alpha, clean cut edges, " +
      "flat straight-on view, no text, no watermark, no logo. " +
      STYLE,
  },
  "flower-cluster": {
    size: "1024x1024",
    transparent: true,
    prompt:
      "One single CRYSTAL CLUSTER blossom, not a lotus, not a flower with round petals. " +
      "It is a shard bouquet: six to nine sharp angular amethyst crystal prisms of different lengths radiating outward and slightly upward, " +
      "like a natural mineral cluster bloom, each shard with crisp flat facets, transparent violet glass showing inner refraction and bloom, " +
      "strong white specular edges, a few smaller white-lavender quartz shards at the base, faint holographic 01 glyphs glinting inside the prisms, " +
      "low three-quarter side view so the shard tips point up and away, " +
      "isolated on a fully transparent background, PNG with alpha, clean cut edges, " +
      "no stem, no leaves, no round petals, no text, no watermark, no logo. " +
      STYLE,
  },  emblem: {
    size: "1024x1024",
    transparent: true,
    prompt:
      "One single circular heraldic emblem crest, centered, floating in empty space. " +
      "A stylized white dragon head in profile inside a circular medallion of thin silver filigree, " +
      "small faceted amethyst gems set around the ring, tiny 01 binary glyphs etched along the rim, " +
      "translucent white and pale lavender enamel, soft amethyst inner glow, " +
      "perfectly symmetric, flat front view, isolated on a fully transparent background, PNG with alpha, " +
      "clean cut edges, no text, no watermark, no logo. " +
      STYLE,
  },
};

async function generate(job, { transparent }) {
  const url = `${BASE}/images/generations`;
  const body = { model: MODEL, prompt: job.prompt, size: job.size, n: 1 };
  if (transparent) {
    body.background = "transparent";
    body.output_format = "png";
  }

  let res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify(body),
  });
  let text = await res.text();

  if (!res.ok && transparent) {
    console.log("    transparent params rejected, retrying without them...");
    delete body.background;
    delete body.output_format;
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
      body: JSON.stringify(body),
    });
    text = await res.text();
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);

  const json = JSON.parse(text);
  const item = json?.data?.[0];
  if (!item) throw new Error(`no data[0]: ${text.slice(0, 300)}`);

  let buf;
  if (item.b64_json) buf = Buffer.from(item.b64_json, "base64");
  else if (item.url) buf = Buffer.from(await (await fetch(item.url)).arrayBuffer());
  else throw new Error(`no b64_json/url: ${JSON.stringify(item).slice(0, 200)}`);
  return buf;
}

async function main() {
  const names = process.argv.slice(2);
  if (names.length === 0) {
    console.log("可用 job:", Object.keys(JOBS).join(", "));
    return;
  }
  if (!BASE || !KEY) {
    console.error("缺少 OPENAI_BASE_URL / OPENAI_API_KEY");
    process.exit(2);
  }
  mkdirSync(OUTDIR, { recursive: true });

  for (const name of names) {
    const job = JOBS[name];
    if (!job) {
      console.log(`  SKIP 未知 job: ${name}`);
      continue;
    }
    const started = Date.now();
    try {
      console.log(`  [${name}] model=${MODEL} size=${job.size} transparent=${Boolean(job.transparent)} ...`);
      const buf = await generate(job, { transparent: job.transparent });
      const png = job.transparent ? `${name}.png` : `${name}.png`;
      const out = join(OUTDIR, png);
      writeFileSync(out, buf);
      console.log(`  OK   ${png}  ${(buf.length / 1024).toFixed(0)} KB  ${((Date.now() - started) / 1000).toFixed(1)}s`);
    } catch (err) {
      console.log(`  FAIL ${name}: ${err.message}`);
    }
  }
}

await main();
