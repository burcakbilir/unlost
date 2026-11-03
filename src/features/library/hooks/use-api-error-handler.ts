import { useRouter } from "next/navigation";
import { isUnauthorizedError } from "@/lib/api-client";

export type ApiErrorHandler = (error: unknown, fallback: string) => string;

// An expired or revoked session surfaces as a 401 from any request. Send the
// user to sign in (and back here afterwards) instead of showing "Unauthorized".
export function useApiErrorHandler(): ApiErrorHandler {
  const router = useRouter();

  return function handleApiError(error, fallback) {
    if (isUnauthorizedError(error)) {
      router.replace("/login?next=/dashboard");
      return "Your session has expired. Redirecting to sign in...";
    }
    return error instanceof Error ? error.message : fallback;
  };
}
