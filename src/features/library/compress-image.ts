import { MAX_IMAGE_BYTES } from "@/features/library/constants";

const MAX_DIMENSION = 1600;
const QUALITIES = [0.82, 0.7, 0.55];

export type CompressedImage = {
  dataUrl: string;
  base64: string;
  mimeType: string;
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image"));
    };
    image.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read this image"));
    reader.readAsDataURL(blob);
  });
}

// Resizes to at most 1600px on the long side and re-encodes as WebP in the
// browser. A typical phone screenshot drops from several MB to ~150-400KB,
// which keeps uploads fast, the free database tier from filling up, and the
// image Gemini receives (and bills tokens for) small.
export async function compressImage(file: File): Promise<CompressedImage> {
  const image = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not process this image");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  for (const quality of QUALITIES) {
    const blob = await toBlob(canvas, quality);
    // Some browsers can't encode WebP and silently return PNG instead.
    if (!blob || blob.type !== "image/webp") break;

    if (blob.size <= MAX_IMAGE_BYTES) {
      const dataUrl = await readAsDataUrl(blob);
      return { dataUrl, base64: dataUrl.split(",")[1] ?? "", mimeType: "image/webp" };
    }
  }

  // Fallback: keep the original file if it already fits.
  if (file.size <= MAX_IMAGE_BYTES) {
    const dataUrl = await readAsDataUrl(file);
    return { dataUrl, base64: dataUrl.split(",")[1] ?? "", mimeType: file.type };
  }

  throw new Error("This image is too large even after compressing it. Try a smaller one.");
}
