export type CaptureType = "link" | "note" | "image";

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
  similarity: number;
};

export type LibraryFilter = "all" | CaptureType;
