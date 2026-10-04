/**
 * Fallback icon generator using Jimp (pure JS — no native deps)
 * Run: node scripts/generate-icons-jimp.mjs
 */

import { Jimp } from "jimp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "../public/icons");
mkdirSync(iconsDir, { recursive: true });

const SPAL_GREEN = 0x22C55EFF;
const WHITE     = 0xFFFFFFFF;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  const img = new Jimp({ width: size, height: size, color: SPAL_GREEN });

  // Draw a white square in the center (letter proxy)
  const sq = Math.floor(size * 0.38);
  const off = Math.floor((size - sq) / 2);
  for (let y = off; y < off + sq; y++) {
    for (let x = off; x < off + sq; x++) {
      img.setPixelColor(WHITE, x, y);
    }
  }

  await img.write(join(iconsDir, `icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
}

// Maskable (full bleed green with white square)
const maskable = new Jimp({ width: 512, height: 512, color: SPAL_GREEN });
const sq = 200; const off = 156;
for (let y = off; y < off + sq; y++) {
  for (let x = off; x < off + sq; x++) {
    maskable.setPixelColor(WHITE, x, y);
  }
}
await maskable.write(join(iconsDir, "icon-512-maskable.png"));
console.log("✓ icon-512-maskable.png");

// Apple touch icon 180x180
const apple = new Jimp({ width: 180, height: 180, color: SPAL_GREEN });
const asq = 68; const aoff = 56;
for (let y = aoff; y < aoff + asq; y++) {
  for (let x = aoff; x < aoff + asq; x++) {
    apple.setPixelColor(WHITE, x, y);
  }
}
await apple.write(join(iconsDir, "apple-touch-icon.png"));
console.log("✓ apple-touch-icon.png\n\nAll icons generated!");
