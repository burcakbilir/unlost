# Retake the README screenshots after the Search-first dashboard

Status: ready-for-human

## Problem

PR #18 changed the dashboard layout (Search leads the page, Filter moved into the list), but
the README still shows the old layout in `docs/screenshots/unlost-dashboard.jpg` and
`docs/screenshots/unlost-ask-library.jpg`. `unlost-landing.jpg` is unaffected.

## What to do

- Use the local demo account "Test User" (11 Items, has a Gemini key). Never a real person's
  account or data.
- Dashboard: the top of `/dashboard` on a wide screen.
- Search: run "what was that present idea for my mother", then "Answer with AI", and capture
  the Search block with the Answer and the cited match.
- Keep the old size where possible (2560px wide, retina) so the images stay sharp.
- Hide Next's dev "N" button before capturing; it sits over the user avatar.
- Replace the two files under the same names, so the README needs no change except
  possibly the alt text of the Search image, which still says "Ask your library".

## Notes

- 2026-11-26: Tried with the Chrome extension: images came out 1280px wide with the mouse
  cursor in them. macOS `screencapture` from the terminal lacked Screen Recording permission.
  Most reliable: take them by hand with ⌘⇧4. If "Answer with AI" returns 503, Gemini is
  overloaded; wait and retry (see `.scratch/gemini-overload-retry`).

## Comments
