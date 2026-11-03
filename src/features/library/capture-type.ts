import type { CaptureType } from "@/features/library/types";

export function isCaptureType(value: string): value is CaptureType {
  return value === "link" || value === "note" || value === "image";
}
