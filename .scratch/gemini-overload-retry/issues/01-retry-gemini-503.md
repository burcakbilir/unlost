# Retry Gemini calls briefly when the model is overloaded

Status: ready-for-agent

## Problem

Gemini sometimes answers `503 UNAVAILABLE` ("This model is currently experiencing high
demand... Please try again later."). It's temporary and usually clears within a minute or two.
Seen on 2026-11-26: two "Answer with AI" clicks in a row failed this way while Search itself
kept working (the embedding model was fine).

Today `callGemini` in `src/lib/gemini.ts` makes one request and throws on any non-OK status.
Only 429 (quota) and 401/403/invalid key get their own error classes; a 503 becomes a generic
error, so the user sees "Couldn't write an answer right now. Your matches are still listed."
(`src/app/api/search/answer/route.ts`). The same single-shot call is behind Search's
embedding and Enrichment, so they can hit the same short outages.

## Idea

Retry a 503 (and maybe 500/504) once or twice with a short wait before giving up, so
short overloads never reach the user. Don't retry 429 (quota): retrying spends the user's
quota for nothing. Don't retry 4xx key errors.

## Decisions (grilling, 2026-11-26)

- **Where**: the retry lives in `callGemini` in `src/lib/gemini.ts`, so Search's embedding,
  the Answer and Enrichment all get it. Each caller passes its own retry budget.
- **Which failures**: retry only 500, 503 and 504. Never retry 429 (spends the user's quota
  for nothing), 4xx key errors (won't change) or a timeout (the user has already waited
  10-20 s).
- **Budgets** (waits between tries, fixed, no jitter: each call runs on one user's own key,
  so there is no crowd of clients retrying in sync, and fixed waits keep tests simple):

  | Caller | Retries | Waits | Worst extra wait |
  |---|---|---|---|
  | Search (query embedding) | 1 | 1 s | ~1 s |
  | Answer | 2 | 1 s, 3 s | ~4 s |
  | Enrichment (analyze + embed) | 3 | 2 s, 5 s, 15 s | ~22 s per call |

  Search retries least: the user is waiting, and it already falls back to word-only matching.
  Enrichment runs in `after()`; its worst case (~80 s) is well inside Vercel's default
  300 s function limit.
- **After the last retry**: 500/503/504 throw a new `GeminiUnavailableError` (next to
  `GeminiKeyError` and `GeminiQuotaError`). Messages:
  - Answer: "Gemini isn't available right now. Try again in a minute. Your matches are still listed."
  - Search notice: "Gemini isn't available right now, so this is a keyword search."
- **UI**: no new "retrying…" state. The existing loading state covers the few extra seconds.
- **Out of scope**: an Enrichment that still fails after retries leaves the Item without Tags
  or an embedding. Filed separately as `.scratch/failed-enrichment/issues/01-retry-failed-enrichment.md`.

## Acceptance

- Unit tests in `src/lib/gemini.test.ts` (mocked `fetch`, waits injected or faked so tests
  don't sleep): a 503 then 200 succeeds; 503 on every try throws `GeminiUnavailableError`
  after exactly budget + 1 requests; 429, 401/403 and a timeout make exactly one request.
- Answer and Search routes show the messages above for `GeminiUnavailableError`.

## Comments
