# Retry Gemini calls briefly when the model is overloaded

Status: needs-triage

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

## Open questions

- Which calls get retries: only the Answer, or also Search's embedding and Enrichment?
  Search is interactive, so every retry adds wait time; Enrichment runs in the background,
  so it can afford to wait longer.
- How many tries and how long to wait, given the existing per-call timeouts.
- Should a 503 that still fails after retries get its own clearer message
  ("Gemini is busy right now, try again in a minute")?

## Comments
