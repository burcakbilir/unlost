import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { apiPatch, apiPost } from "@/lib/api-client";
import { ALLOWED_IMAGE_TYPES, MAX_SOURCE_IMAGE_BYTES } from "@/features/library/constants";
import { compressImage } from "@/features/library/compress-image";
import { isCaptureType } from "@/features/library/capture-type";
import type { CaptureType, LibraryItem } from "@/features/library/types";
import type { ApiErrorHandler } from "@/features/library/hooks/use-api-error-handler";

type PickedImage = {
  dataUrl: string;
  base64: string;
  mimeType: string;
  fileName: string;
};

// The "Save something new" / "Edit item" form: whether it's open, which item
// it edits, the picked image, and saving. The caller decides what changes once
// an item is saved (the item list, filters, Ask results) through onSaved.
export function useItemComposer(
  handleApiError: ApiErrorHandler,
  onSaved: (item: LibraryItem, wasEditing: boolean) => void,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [type, setType] = useState<CaptureType>("note");
  const [imageFile, setImageFile] = useState<PickedImage | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    setImageError(null);

    if (!file) {
      setImageFile(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Image must be PNG, JPEG, or WebP");
      input.value = "";
      return;
    }

    if (file.size > MAX_SOURCE_IMAGE_BYTES) {
      setImageError("Image must be smaller than 20MB");
      input.value = "";
      return;
    }

    setIsProcessingImage(true);

    try {
      const compressed = await compressImage(file);
      setImageFile({ ...compressed, fileName: file.name });
    } catch (error) {
      setImageFile(null);
      setImageError(error instanceof Error ? error.message : "Could not read this file");
      input.value = "";
    } finally {
      setIsProcessingImage(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const source = String(formData.get("source") ?? "").trim();
    const rawType = String(formData.get("type") ?? "note");
    const itemType: CaptureType = isCaptureType(rawType) ? rawType : "note";
    const hasImage =
      type === "image" &&
      (Boolean(imageFile) || Boolean(editingItem?.imageMimeType));

    if (!title || (!description && !hasImage)) return;

    setIsSaving(true);
    setSaveError(null);

    // A picked image stays in state if the user then switches to note or link;
    // only image items send it (the API rejects an image on anything else).
    const image = imageFile && itemType === "image"
      ? { data: imageFile.base64, mimeType: imageFile.mimeType }
      : undefined;

    try {
      if (editingItem) {
        const { item } = await apiPatch<{ item: LibraryItem }>(
          `/api/library-items/${editingItem.id}`,
          { type: itemType, title, description, source, image },
        );
        onSaved(item, true);
      } else {
        const { item } = await apiPost<{ item: LibraryItem }>(
          "/api/library-items",
          { type: itemType, title, description, source, image },
        );
        onSaved(item, false);
      }

      setImageFile(null);
      setImageError(null);

      form.reset();
      setIsOpen(false);
      setEditingItem(null);
    } catch (error) {
      setSaveError(handleApiError(error, "Could not save this item"));
    } finally {
      setIsSaving(false);
    }
  }

  function openNew() {
    setEditingItem(null);
    setType("note");
    setSaveError(null);
    setImageFile(null);
    setImageError(null);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setEditingItem(null);
    setType("note");
    setImageFile(null);
    setImageError(null);
  }

  function openEdit(item: LibraryItem) {
    setEditingItem(item);
    setType(item.type);
    setSaveError(null);
    setImageFile(null);
    setImageError(null);
    setIsOpen(true);
  }

  return {
    isOpen,
    editingItem,
    type,
    setType,
    imageFile,
    imageError,
    isProcessingImage,
    isSaving,
    saveError,
    handleImageChange,
    handleSubmit,
    openNew,
    openEdit,
    close,
  };
}
