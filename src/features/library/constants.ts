export const CAPTURE_TYPES = ["link", "note", "image"] as const;

export const ALLOWED_IMAGE_TYPES: readonly string[] = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

// What the server accepts after the browser has resized and compressed the image.
export const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

// What the file picker accepts before compression (phone photos are often 5-12MB).
export const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;

export const LIMITS = {
  title: 200,
  description: 5000,
  source: 2048,
  query: 500,
} as const;
