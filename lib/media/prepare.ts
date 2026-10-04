// Photos are re-drawn before upload: that drops EXIF (including GPS location), caps size at 1600px and keeps files small (spec §13).
export const MAX_EDGE = 1600;
export const MAX_BYTES = 1024 * 1024; // matches /api/upload

/** Scale (w, h) to fit inside max x max without ever enlarging. */
export function fitWithin(w: number, h: number, max = MAX_EDGE): { w: number; h: number } {
  const k = Math.min(1, max / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}

/** Browser only. Returns a JPEG under 1MB with no metadata. */
export async function preparePhoto(file: File): Promise<File> {
  const bmp = await createImageBitmap(file);
  let { w, h } = fitWithin(bmp.width, bmp.height);
  const canvas = document.createElement("canvas");
  const encode = (q: number) => new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", q));
  for (let attempt = 0; attempt < 5; attempt++) {
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser can't prepare photos.");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); // flatten transparency
    ctx.drawImage(bmp, 0, 0, w, h);
    for (const q of [0.85, 0.7, 0.55]) {
      const blob = await encode(q);
      if (blob && blob.size <= MAX_BYTES) { bmp.close(); return new File([blob], "photo.jpg", { type: "image/jpeg" }); }
    }
    w = Math.round(w * 0.8); h = Math.round(h * 0.8); // still too big: shrink and retry
  }
  bmp.close();
  throw new Error("That photo is too large. Try a smaller one.");
}
