import { useState } from "react";
import { apiDelete, isUnauthorizedError } from "@/lib/api-client";
import type { ApiErrorHandler } from "@/features/library/hooks/use-api-error-handler";

// Deleting takes two steps: requestDelete opens the confirm dialog for an
// item, confirmDelete removes it. The caller decides what else changes once
// it's gone (the item list, the Ask results) through onDeleted.
export function useDeleteItem(
  handleApiError: ApiErrorHandler,
  onDeleted: (id: string) => void,
) {
  // The item the dialog is asking about; null means the dialog is closed.
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function requestDelete(id: string) {
    setDeleteError(null);
    setPendingId(id);
  }

  function cancelDelete() {
    setPendingId(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!pendingId) return;
    // Copied so the request keeps its target even if the dialog closes meanwhile.
    const id = pendingId;

    setDeletingId(id);
    setDeleteError(null);

    try {
      await apiDelete(`/api/library-items/${id}`);
      onDeleted(id);
      setPendingId(null);
    } catch (error) {
      const message = handleApiError(error, "Could not delete this item");
      // A 401 is already sending the user to sign in; any other error is shown
      // in the dialog so they can retry or cancel.
      if (isUnauthorizedError(error)) setPendingId(null);
      else setDeleteError(message);
    } finally {
      setDeletingId(null);
    }
  }

  return {
    pendingId,
    deletingId,
    deleteError,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
