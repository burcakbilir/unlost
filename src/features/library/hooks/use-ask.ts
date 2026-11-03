import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { apiPost } from "@/lib/api-client";
import type { LibraryItem, SearchResponse } from "@/features/library/types";
import type { ApiErrorHandler } from "@/features/library/hooks/use-api-error-handler";

// "Ask your library": the search request, its results, and the optional AI
// answer written from the strong matches.
export function useAsk(handleApiError: ApiErrorHandler) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<
    (SearchResponse & { query: string }) | null
  >(null);
  const [isAsking, setIsAsking] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const requestId = useRef(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);

  const strongMatches = result?.matches.filter((match) => match.confidence === "strong") ?? [];
  const weakMatches = result?.matches.filter((match) => match.confidence === "possible") ?? [];

  function reset() {
    requestId.current++;
    setResult(null);
    setSearchError(null);
    setAnswer(null);
    setAnswerError(null);
    setIsAsking(false);
    setIsAnswering(false);
  }

  function changeQuery(value: string) {
    setQuery(value);
    if (!value.trim()) reset();
  }

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const currentRequestId = ++requestId.current;

    setIsAsking(true);
    setSearchError(null);
    setAnswer(null);
    setAnswerError(null);
    setIsAnswering(false);

    try {
      const response = await apiPost<SearchResponse>("/api/search", {
        query: trimmedQuery,
      });

      if (currentRequestId !== requestId.current) return;

      setResult({ ...response, query: trimmedQuery });
    } catch (error) {
      if (currentRequestId !== requestId.current) return;

      setResult(null);
      setSearchError(handleApiError(error, "Could not search your library"));
    } finally {
      if (currentRequestId === requestId.current) {
        setIsAsking(false);
      }
    }
  }

  // Opt-in: the only search step that spends generation quota.
  async function handleAnswer() {
    if (!result || strongMatches.length === 0) return;

    const currentRequestId = requestId.current;

    setIsAnswering(true);
    setAnswerError(null);

    try {
      const { answer } = await apiPost<{ answer: string }>("/api/search/answer", {
        query: result.query,
        // Same order as the numbered list, so [1], [2] in the answer line up.
        itemIds: strongMatches.map((match) => match.id),
      });

      if (currentRequestId !== requestId.current) return;
      setAnswer(answer);
    } catch (error) {
      if (currentRequestId !== requestId.current) return;
      setAnswerError(handleApiError(error, "Could not write an answer"));
    } finally {
      if (currentRequestId === requestId.current) {
        setIsAnswering(false);
      }
    }
  }

  // Ask results are a snapshot from search time. Keep them in step with edits
  // and deletes, so a deleted item doesn't linger with a broken image. The AI
  // answer cites items by position and quotes their old text, so it's dropped.
  function syncItem(id: string, updated: LibraryItem | null) {
    if (!result?.matches.some((match) => match.id === id)) return;

    setResult({
      ...result,
      matches: updated
        ? result.matches.map((match) => (match.id === id ? { ...match, ...updated } : match))
        : result.matches.filter((match) => match.id !== id),
    });
    setAnswer(null);
    setAnswerError(null);
  }

  return {
    query,
    changeQuery,
    result,
    isAsking,
    error: searchError,
    strongMatches,
    weakMatches,
    answer,
    isAnswering,
    answerError,
    handleAsk,
    handleAnswer,
    syncItem,
  };
}
