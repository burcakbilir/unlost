"use client";

import { Modal } from "@/components/modal";

type ConfirmDeleteDialogProps = {
  // The title of the item being deleted, or null when the dialog is closed.
  itemTitle: string | null;
  isDeleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDeleteDialog({ itemTitle, isDeleting, error, onConfirm, onCancel }: ConfirmDeleteDialogProps) {
  return (
    <Modal open={itemTitle !== null} onClose={onCancel} labelledBy="confirm-delete-title" size="sm">
      <h2 id="confirm-delete-title" className="font-display text-2xl">
        Delete this item?
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        <span className="font-medium text-foreground">{itemTitle}</span> will be removed from your
        library. This can&apos;t be undone.
      </p>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border px-5 py-2.5 font-medium transition-colors hover:bg-surface"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          data-autofocus
          className="rounded-xl bg-red-700 px-5 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </Modal>
  );
}