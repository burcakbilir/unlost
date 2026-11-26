# Do two similar boxes (Search and Filter) confuse users?

Status: ready-for-human

## Problem

The dashboard has two text boxes that both look like "type a word, find items":

- **Search** ("Ask a question about what you saved"): runs on the server, ranks results
  into Strong and Possible matches, can produce an Answer. Without a Gemini key it matches
  on words only, which makes it look even more like Filter.
- **Filter** ("Filter your library by keyword"): narrows the visible Library instantly in
  the browser, combined with the type filter, no ranking.

A user may not understand which one to use or why the results differ. For example,
`wedding dress` finds "Red satin dress for the wedding" in Search but not in Filter.

## Open question

- Merge them into one box?
- Keep both but make the difference obvious (wording, placement, hints)?
- Leave as is?

Not decided yet. Grill this in a separate session before planning any change.

## Comments

- 2026-11-26: Prototyped four layouts on `/dashboard` (branch `prototype/search-vs-filter`,
  commit 90a58ab, not merged): A today's two boxes, B one box that filters as you type and
  searches on Enter, C one box with a Search/Filter mode switch, D Search leading the page
  with Filter moved into the list.
- Verdict: **D**. Each box sits where it belongs (Search is the page's main action, Filter
  is a tool of the list next to the type chips), so the difference shows without
  explanation. B mixes two behaviours in one box; C hides which mode you are in.
- Folded into the real code with three fixes over the prototype: a compact Search block on
  phones, one heading per section (the type title moved down to the list), and Filter on
  the same toolbar as the list's count and chips.
