# Rename the "Summarize with AI" button to match Answer

Status: ready-for-agent

## Problem

The glossary calls the AI-written, cited reply to a Search an **Answer** (and avoids
"AI summary" / "summary"). The button that produces it still says "Summarize with AI",
while its loading state already says "Writing answer...". The two words describe the same
thing and pull the product's language in different directions.

## What to do

- Change the button label to use "Answer" (for example "Answer with AI").
- Check nearby UI text, the landing page and the README for "summary" / "summarize" used
  in the same sense, and align it with **Answer**.
- No behaviour change: only wording.

## Done when

- No user-facing text calls an Answer a "summary".
- `npm run check` passes and the dashboard is checked in the preview browser.

## Comments

- 2026-11-25: Button renamed to "Answer with AI"; the privacy page and README now say
  "AI answer" instead of "AI summary". The Gemini prompt in `src/lib/gemini.ts` still
  says "summarize" on purpose: it tells the model what to do and isn't shown to users.
