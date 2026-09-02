export type CaptureType = "link" | "note" | "image";

export type LibraryItem = {
  id: string;
  type: CaptureType;
  title: string;
  description: string;
  source: string;
  savedAt: string;
};

export type LibraryFilter = "all" | CaptureType;
