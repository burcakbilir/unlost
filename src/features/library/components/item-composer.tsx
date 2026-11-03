"use client";

import { useRef } from "react";
import { itemImageUrl } from "@/features/library/image-url";
import type { CaptureType } from "@/features/library/types";
import type { GeminiKeyStatus } from "@/features/settings/components/settings-panel";
import { Modal } from "@/components/modal";
import type { useItemComposer } from "@/features/library/hooks/use-item-composer";

type ItemComposerProps = {
  composer: ReturnType<typeof useItemComposer>;
  // Only changes the description placeholder: with a key, AI can describe an image.
  geminiKey: GeminiKeyStatus;
};

// The add/edit form, in a modal. State and saving live in useItemComposer.
export function ItemComposer({ composer, geminiKey }: ItemComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // closedBy="closerequest": Esc closes it, but a stray click outside
  // doesn't throw away a half-written item.
  return (
    <Modal
      open={composer.isOpen}
      onClose={composer.close}
      labelledBy="capture-composer-title"
      closedBy="closerequest"
    >
      <h2 id="capture-composer-title" className="font-display text-3xl">
        {composer.editingItem ? "Edit item" : "Save something new"}
      </h2>
      <form
        key={composer.editingItem?.id ?? "new"}
        onSubmit={(event) => void composer.handleSubmit(event)}
        className="mt-6 grid gap-5 lg:grid-cols-2"
      >
        <label className="grid gap-2 text-sm font-medium">
          Title
          <input
            name="title"
            required
            data-autofocus
            defaultValue={composer.editingItem?.title}
            className="min-h-12 rounded-xl border border-border px-4 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            placeholder="What do you want to remember?"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Type
          <select
            name="type"
            value={composer.type}
            onChange={(event) =>
              composer.setType(event.target.value as CaptureType)
            }
            className="min-h-12 rounded-xl border border-border px-4 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
          >
            <option value="note">Note</option>
            <option value="link">Link</option>
            <option value="image">Image</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium lg:col-span-2">
          {composer.type === "link" ? "Link" : "Link (optional)"}
          <input
            name="source"
            type="url"
            required={composer.type === "link"}
            defaultValue={composer.editingItem?.source}
            className="min-h-12 rounded-xl border border-border px-4 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            placeholder="https://..."
          />
        </label>
        {composer.type === "image" && (
          <>
            <div className="grid gap-2 text-sm font-medium lg:col-span-2">
              <span>Image (optional)</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-border px-4 py-3 font-medium hover:bg-surface"
                >
                  Choose file
                </button>
                <span className="truncate text-sm text-muted">
                  {composer.imageFile?.fileName ??
                    (composer.editingItem?.imageMimeType
                      ? "Current image on file"
                      : "No file chosen")}
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                name="image"
                accept="image/png,image/jpeg,image/webp"
                onChange={composer.handleImageChange}
                className="hidden"
              />
            </div>
            {composer.isProcessingImage ? (
              <p role="status" className="text-sm text-muted lg:col-span-2">
                Optimizing image...
              </p>
            ) : null}
            {composer.imageError ? (
              <p role="alert" className="text-sm text-red-600 lg:col-span-2">
                {composer.imageError}
              </p>
            ) : null}
            {composer.imageFile ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={composer.imageFile.dataUrl}
                alt="Preview of the selected image"
                className="max-h-48 w-auto border border-border object-contain lg:col-span-2"
              />
            ) : composer.editingItem?.imageMimeType ? (
              <div className="lg:col-span-2">
                <p className="text-xs text-muted">
                  Current image — choose a new file to replace it
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={itemImageUrl(composer.editingItem)}
                  alt={`Current image for ${composer.editingItem.title}`}
                  className="mt-1 max-h-48 w-auto border border-border object-contain"
                />
              </div>
            ) : null}
          </>
        )}
        <label className="grid gap-2 text-sm font-medium lg:col-span-2">
          Description
          <textarea
            name="description"
            required={
              !(composer.type === "image" && (composer.imageFile || composer.editingItem?.imageMimeType))
            }
            rows={4}
            defaultValue={composer.editingItem?.description}
            className="resize-y rounded-xl border border-border px-4 py-3 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            placeholder={
              composer.type === "image" && geminiKey
                ? "Why do you want to keep this? (leave blank to let AI describe the image)"
                : "Why do you want to keep this?"
            }
          />
        </label>

        {composer.saveError ? (
          <p role="alert" className="text-sm text-red-600 lg:col-span-2">
            {composer.saveError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3 lg:col-span-2">
          <button
            type="submit"
            disabled={composer.isSaving || composer.isProcessingImage}
            className="bg-foreground px-6 py-3 text-background disabled:opacity-60 rounded-xl"
          >
            {composer.isSaving ? "Saving..." : composer.editingItem ? "Update" : "Save"}
          </button>
          <button
            type="button"
            onClick={composer.close}
            className="border border-border px-6 py-3 rounded-xl"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
