# Do two similar boxes (Search and Filter) confuse users?

Status: needs-triage

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
