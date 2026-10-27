import { z } from "zod";
import { isSafeHttpUrl } from "@/lib/safe-url";
import { CAPTURE_TYPES, LIMITS } from "@/features/library/constants";

const fields = {
  type: z.enum(CAPTURE_TYPES),
  title: z.string().trim().min(1, "Title is required").max(LIMITS.title),
  description: z.string().trim().max(LIMITS.description),
  source: z
    .string()
    .trim()
    .max(LIMITS.source)
    .refine((value) => value === "" || isSafeHttpUrl(value), {
      message: "Link must be a valid http(s) URL",
    }),
  image: z.object({ data: z.string(), mimeType: z.string() }),
};

export const createItemSchema = z.object({
  ...fields,
  type: fields.type.default("note"),
  description: fields.description.default(""),
  source: fields.source.default(""),
  image: fields.image.optional(),
});

// Built from `fields`, not createItemSchema.partial(): in Zod 4 defaults still
// apply inside optional fields, so a PATCH would silently reset `type` to "note".
export const updateItemSchema = z.object(fields).partial();

export const searchSchema = z.object({
  query: z.string().trim().min(1, "Query is required").max(LIMITS.query),
});

export const answerSchema = searchSchema.extend({
  itemIds: z.array(z.string().min(1).max(40)).min(1).max(8),
});

export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid request";
}

export const itemSelect = {
  id: true,
  type: true,
  title: true,
  description: true,
  source: true,
  tags: true,
  imageMimeType: true,
  createdAt: true,
  updatedAt: true,
} as const;
