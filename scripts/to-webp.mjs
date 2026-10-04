// Convert any PNG/JPG/JPEG in public/ to WebP (quality 88), then delete the source.
//
// Usage:
//   node scripts/to-webp.mjs                  # converts every PNG/JPG in /public
//   node scripts/to-webp.mjs file1 file2 ...  # converts only the listed files
//
// SPAL convention: all app images (backgrounds, hero illustrations, marketing PNGs)
// live as .webp. The ONLY exceptions are favicons + manifest/apple-touch icons —
// those must stay PNG because iOS and the PWA manifest spec require it.
//
// Drop a new PNG into /public, run this script, then reference it as /name.webp
// in your code.

import sharp from "sharp";
import { readdirSync, statSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, basename, extname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUB = join(__dirname, "..", "public");

// Paths we never auto-convert — these formats are required by their consumers.
const SKIP_NAMES = new Set([
  "favicon.png", "favicon-16.png", "favicon-32.png", "favicon-48.png",
  "favicon-96.png", "favicon-192.png",
]);
const SKIP_DIRS = new Set(["icons", "screenshots"]);

function shouldSkip(filePath, fileName) {
  if (SKIP_NAMES.has(fileName)) return true;
  for (const dir of SKIP_DIRS) {
    if (filePath.includes(`${dir}/`) || filePath.includes(`${dir}\\`)) return true;
  }
  return false;
}

function pngsInPublic() {
  const out = [];
  for (const f of readdirSync(PUB)) {
    const full = join(PUB, f);
    if (!statSync(full).isFile()) continue;
    const ext = extname(f).toLowerCase();
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") continue;
    if (shouldSkip(full, f)) continue;
    out.push(full);
  }
  return out;
}

const argv = process.argv.slice(2);
const targets = argv.length
  ? argv.map((p) => (p.startsWith(PUB) ? p : join(PUB, basename(p))))
  : pngsInPublic();

if (!targets.length) {
  console.log("Nothing to convert. (Skipped favicons/icons/screenshots by design.)");
  process.exit(0);
}

for (const src of targets) {
  const fname = basename(src);
  if (shouldSkip(src, fname)) {
    console.log("·", fname, "(skipped — required as PNG)");
    continue;
  }
  const stem = fname.replace(/\.(png|jpg|jpeg)$/i, "");
  const dest = join(PUB, `${stem}.webp`);
  try {
    await sharp(src).webp({ quality: 88 }).toFile(dest);
    unlinkSync(src);
    console.log("✓", `${stem}.webp`);
  } catch (e) {
    console.error("✗", fname, e.message);
  }
}

console.log("\nDone. Reference the new files as /<name>.webp in your code.");
