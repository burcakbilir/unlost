import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";
import type { LibraryItem } from "@/features/library/types";
import type { GeminiKeyStatus } from "@/features/settings/components/settings-panel";
import type { ApiErrorHandler } from "@/features/library/hooks/use-api-error-handler";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

// Loads what the dashboard needs when it opens: who is signed in, whether they
// saved a Gemini key, and their items. setItems and setGeminiKey are returned
// too, because adding, editing, deleting and the settings panel change them.
export function useLibraryData(handleApiError: ApiErrorHandler) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [geminiKey, setGeminiKey] = useState<GeminiKeyStatus>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [meResponse, itemsResponse] = await Promise.all([
          apiGet<{ user: CurrentUser; geminiKey: GeminiKeyStatus }>("/api/auth/me"),
          apiGet<{ items: LibraryItem[] }>("/api/library-items"),
        ]);

        if (isMounted) {
          setUser(meResponse.user);
          setGeminiKey(meResponse.geminiKey);
          setItems(itemsResponse.items);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(handleApiError(error, "Could not load your library"));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
    // Runs once on mount; handleApiError only uses the stable router.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, items, setItems, isLoading, loadError, geminiKey, setGeminiKey };
}
