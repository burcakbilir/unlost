import "server-only";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/features/library/constants";

export type ImageUpload = {
  data: string;
  mimeType: string;
  bytes: Uint8Array<ArrayBuffer>;
};

type ValidationResult =
  | { ok: true; value: ImageUpload }
  | { ok: false; error: string };

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

// The client-declared mimeType is only trusted if the file's own header agrees.
function sniffImageType(bytes: Uint8Array): string | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return "image/webp";
  }
  return null;
}

export function validateImageUpload(image: {
  data: string;
  mimeType: string;
}): ValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(image.mimeType)) {
    return { ok: false, error: "Image must be PNG, JPEG, or WebP" };
  }

  if (Buffer.byteLength(image.data, "base64") > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image must be smaller than 1.5MB" };
  }

  const bytes = new Uint8Array(
    Buffer.from(image.data, "base64"),
  ) as Uint8Array<ArrayBuffer>;

  if (sniffImageType(bytes) !== image.mimeType) {
    return { ok: false, error: "File contents don't match its image type" };
  }

  return { ok: true, value: { data: image.data, mimeType: image.mimeType, bytes } };
}
