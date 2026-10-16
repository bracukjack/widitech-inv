"use client";

/**
 * Loads an image file and redraws it on a canvas.
 * - "contain": fits inside width×height, keeping the aspect ratio (never upscales).
 * - "cover":   fills exactly width×height, cropping the overflow from the centre.
 */
export function resizeImageFile(
  file: File,
  opts: { width: number; height: number; mode: "contain" | "cover"; type?: "image/png" | "image/jpeg"; quality?: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const iw = img.naturalWidth || opts.width;
      const ih = img.naturalHeight || opts.height;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      if (opts.mode === "cover") {
        canvas.width = opts.width;
        canvas.height = opts.height;
        const scale = Math.max(opts.width / iw, opts.height / ih);
        const w = iw * scale;
        const h = ih * scale;
        if (opts.type === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, (opts.width - w) / 2, (opts.height - h) / 2, w, h);
      } else {
        const scale = Math.min(1, opts.width / iw, opts.height / ih);
        canvas.width = Math.round(iw * scale);
        canvas.height = Math.round(ih * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      resolve(canvas.toDataURL(opts.type ?? "image/png", opts.quality ?? 0.88));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gambar tidak bisa dibaca"));
    };
    img.src = url;
  });
}
