const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export type ImageUpload = {
  data: string;
  mimeType: string;
};

type ValidationResult =
  | { ok: true; value: ImageUpload }
  | { ok: false; error: string };

export function validateImageUpload(image: unknown): ValidationResult {
  if (
    typeof image !== "object" ||
    image === null ||
    typeof (image as ImageUpload).data !== "string" ||
    typeof (image as ImageUpload).mimeType !== "string"
  ) {
    return { ok: false, error: "Invalid image payload" };
  }

  const { data, mimeType } = image as ImageUpload;

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { ok: false, error: "Image must be PNG, JPEG, or WebP" };
  }

  if (Buffer.byteLength(data, "base64") > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image must be smaller than 3MB" };
  }

  return { ok: true, value: { data, mimeType } };
}
