import { CAPTURE_TYPES } from "@/features/library/constants";

export type CaptureType = (typeof CAPTURE_TYPES)[number];

export type LibraryItem = {
  id: string;
  type: CaptureType;
  title: string;
  description: string;
  source: string;
  tags: string[];
  imageMimeType: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SearchMatch = {
  id: string;
  type: CaptureType;
  title: string;
  description: string;
  source: string;
  tags: string[];
  imageMimeType: string | null;
  updatedAt: string;
  // Null for keyword matches.
  similarity: number | null;
  // "possible" matches are weaker signals; the UI folds them away.
  confidence: "strong" | "possible";
};

export type SearchResponse = {
  mode: "semantic" | "keyword";
  notice: string | null;
  canAnswer: boolean;
  matches: SearchMatch[];
};

export type LibraryFilter = "all" | CaptureType;
