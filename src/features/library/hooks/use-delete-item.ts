import { useState } from "react";
import { apiDelete, isUnauthorizedError } from "@/lib/api-client";
import type { ApiErrorHandler } from "@/features/library/hooks/use-api-error-handler";

// Deletes one item after a confirm. The caller decides what else changes once
// it's gone (the item list, the Ask results) through onDeleted.
export function useDeleteItem(handleApiError: ApiErrorHandler, onDeleted: (id: string) => void) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this item? This can't be undone.")) return;

    setDeletingId(id);

    try {
      await apiDelete(`/api/library-items/${id}`);
      onDeleted(id);
    } catch (error) {
      const message = handleApiError(error, "Could not delete this item");
      if (!isUnauthorizedError(error)) window.alert(message);
    } finally {
      setDeletingId(null);
    }
  }

  return { deletingId, handleDelete };
}
