export type CaptureType = "link" | "note" | "image";

export type LibraryItem = {
  id: string;
  type: CaptureType;
  title: string;
  description: string;
  source: string;
  tags: string[];
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
  updatedAt: string;
  similarity: number;
};

export type LibraryFilter = "all" | CaptureType;
