"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiPost } from "@/lib/api-client";
import {
  SETTINGS_TITLE_ID,
  SettingsPanel,
} from "@/features/settings/components/settings-panel";
import { Modal } from "@/components/modal";
import { DashboardSidebar } from "@/features/library/components/dashboard-sidebar";
import { AskSection } from "@/features/library/components/ask-section";
import { ItemComposer } from "@/features/library/components/item-composer";
import { ConfirmDeleteDialog } from "@/features/library/components/confirm-delete-dialog";
import { LibraryResults } from "@/features/library/components/library-results";
import { useGreeting } from "@/features/library/hooks/use-greeting";
import { useApiErrorHandler } from "@/features/library/hooks/use-api-error-handler";
import { useLibraryData } from "@/features/library/hooks/use-library-data";
import { useLibraryFilters } from "@/features/library/hooks/use-library-filters";
import { useAsk } from "@/features/library/hooks/use-ask";
import { useDeleteItem } from "@/features/library/hooks/use-delete-item";
import { useItemComposer } from "@/features/library/hooks/use-item-composer";

export function LibraryDashboard() {
  const router = useRouter();
  const greeting = useGreeting();
  const handleApiError = useApiErrorHandler();
  const {
    user,
    items,
    setItems,
    isLoading,
    loadError,
    geminiKey,
    setGeminiKey,
  } = useLibraryData(handleApiError);
  const {
    activeFilter,
    setActiveFilter,
    query,
    setQuery,
    filterCounts,
    visibleItems,
  } = useLibraryFilters(items);
  const ask = useAsk(handleApiError);
  const {
    pendingId,
    deletingId,
    deleteError,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useDeleteItem(handleApiError, (id) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    ask.syncItem(id, null);
  });
  // The dialog shows the item's title, looked up from the list it was clicked in.
  const pendingItem = pendingId
    ? items.find((item) => item.id === pendingId)
    : undefined;
  const composer = useItemComposer(handleApiError, (item, wasEditing) => {
    if (wasEditing) {
      setItems((currentItems) =>
        currentItems.map((current) =>
          current.id === item.id ? item : current,
        ),
      );
      ask.syncItem(item.id, item);
    } else {
      setItems((currentItems) => [item, ...currentItems]);
    }
    setActiveFilter("all");
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  async function handleSignOut() {
    try {
      await apiPost("/api/auth/logout", {});
    } catch {
      // Signing out is best-effort: go to the login page either way.
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <DashboardSidebar
        user={user}
        activeFilter={activeFilter}
        counts={filterCounts}
        onFilterChange={setActiveFilter}
        onNewItem={composer.openNew}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSignOut={() => void handleSignOut()}
      />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="min-h-5 text-sm text-muted">
            {greeting}
            {greeting && user ? `, ${user.name.split(" ")[0]}` : ""}
          </p>

          <div className="mt-3">
            <AskSection ask={ask} />
          </div>

          <Modal
            open={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            labelledBy={SETTINGS_TITLE_ID}
          >
            <SettingsPanel
              geminiKey={geminiKey}
              onGeminiKeyChange={setGeminiKey}
              onApiError={handleApiError}
              onClose={() => setIsSettingsOpen(false)}
              onAccountDeleted={() => {
                router.replace("/");
                router.refresh();
              }}
            />
          </Modal>

          <ItemComposer composer={composer} geminiKey={geminiKey} />
          <ConfirmDeleteDialog
            itemTitle={pendingItem?.title ?? null}
            isDeleting={deletingId !== null}
            error={deleteError}
            onConfirm={() => void confirmDelete()}
            onCancel={cancelDelete}
          />

          <LibraryResults
            activeFilter={activeFilter}
            counts={filterCounts}
            onFilterChange={setActiveFilter}
            filterQuery={query}
            onFilterQueryChange={setQuery}
            isLoading={isLoading}
            loadError={loadError}
            items={visibleItems}
            isLibraryEmpty={items.length === 0}
            deletingId={deletingId}
            onEdit={composer.openEdit}
            onDelete={requestDelete}
            onNewItem={composer.openNew}
            onClearFilters={() => {
              setQuery("");
              setActiveFilter("all");
            }}
          />
        </div>
      </main>
    </div>
  );
}
