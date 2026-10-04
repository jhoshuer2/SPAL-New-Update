/**
 * Generates simple placeholder PWA icons using Canvas API (Node.js)
 * Run: node scripts/generate-icons.mjs
 *
 * Creates green SPAL icons in public/icons/
 */

import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "../public/icons");

mkdirSync(iconsDir, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background: SPAL Green
  ctx.fillStyle = "#22C55E";
  ctx.beginPath();
  const r = size * 0.22;
  ctx.roundRect(0, 0, size, size, r);
  ctx.fill();

  // Letter "S" in white
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${size * 0.52}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("S", size / 2, size / 2 + size * 0.02);

  const buffer = canvas.toBuffer("image/png");
  writeFileSync(join(iconsDir, `icon-${size}.png`), buffer);
  console.log(`✓ icon-${size}.png`);
}

// Maskable icon (more padding)
const canvas = createCanvas(512, 512);
const ctx = canvas.getContext("2d");
ctx.fillStyle = "#22C55E";
ctx.fillRect(0, 0, 512, 512);
ctx.fillStyle = "#FFFFFF";
ctx.font = "bold 240px Arial";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("S", 256, 260);
writeFileSync(join(iconsDir, "icon-512-maskable.png"), canvas.toBuffer("image/png"));
console.log("✓ icon-512-maskable.png");

// Apple touch icon (180x180)
const aCanvas = createCanvas(180, 180);
const aCtx = aCanvas.getContext("2d");
aCtx.fillStyle = "#22C55E";
aCtx.beginPath();
aCtx.roundRect(0, 0, 180, 180, 40);
aCtx.fill();
aCtx.fillStyle = "#FFFFFF";
aCtx.font = "bold 90px Arial";
aCtx.textAlign = "center";
aCtx.textBaseline = "middle";
aCtx.fillText("S", 90, 92);
writeFileSync(join(iconsDir, "apple-touch-icon.png"), aCanvas.toBuffer("image/png"));
console.log("✓ apple-touch-icon.png");

console.log("\nAll icons generated in public/icons/");
