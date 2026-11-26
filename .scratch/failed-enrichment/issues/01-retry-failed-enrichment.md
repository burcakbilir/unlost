# An Item whose Enrichment failed stays un-enriched for good

Status: needs-triage

## Problem

Enrichment runs once, in the background, right after an Item is saved
(`scheduleEnrichment` → `enrichLibraryItem` in `src/lib/library-enrichment.ts`). If the
analysis or the embedding call fails, the error is only logged. The Item is saved without
Tags, Search keywords or an embedding, and nothing tries again unless the user edits it.

The user gets no sign of this. Search still finds the Item by its words (the keyword half of
Search covers Items without an embedding), but not by meaning, and it has no Tags.

The Gemini retry (`.scratch/gemini-overload-retry/issues/01-retry-gemini-503.md`) hides short
outages, but a longer outage, a used-up quota or a key error still leaves Items like this.

## Open questions

- How does the app know an Item still needs Enrichment: a stored state, or "has no
  embedding" as the signal?
- When does it try again: on a schedule (cron), on the next Search or page load, or when the
  user adds or fixes their Gemini key?
- Should the user see it ("not enriched yet"), and can they start it themselves?
- Same question for Items saved before the user added a Gemini key at all.

## Comments
