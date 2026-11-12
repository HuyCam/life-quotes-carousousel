# Life Quotes Carousel - Product/UX Plan

Source: `sample/life-quotes.md` (34 quotes, 7 themes). Output: static page in `web/`, plain HTML/CSS/JS, no build, works via `file://` double-click.

## 1. Core experience (decision)
**One-quote-at-a-time horizontal swipe carousel** (not a scroll feed). Rationale: repo is "quote carousels"; the source numbers quotes by original carousel order; one idea per screen gives focus, large type, and a natural swipe gesture on phones. Quotes vary 10-70 words, so each card is vertically centered and scrolls internally only if text overflows (never clipped).
- Default order: original quote number (01..34). Shuffle is an option, not the default.
- Each card shows: a small theme label, the quote text (large serif), and "Quote NN" (original number). No author exists in the source; do not invent one.
- Wrap-around: after 34 comes 01 (and back).

## 2. Navigation & features
- **Swipe**: horizontal swipe changes quote. Implement with CSS scroll-snap (`scroll-snap-type: x mandatory`, one slide per viewport width, native momentum, no gesture library). Vertical swipe on a long card scrolls that card only.
- **Tap zones** (desktop/tablet and phone): left 25% = previous, right 25% = next; center does nothing (avoids accidents while reading). Visible prev/next buttons on desktop only.
- **Keyboard**: Left/Right (and PageUp/Down) navigate; Home/End = first/last; `S` shuffle; `F` favorite; `C` copy; `Esc` exits focus mode/closes sheet; `/` or `T` opens themes.
- **Theme filtering**: a horizontally scrollable chip row ("All" + 7 themes with counts) at the bottom on phone (thumb zone), top on desktop. Selecting a theme restricts the carousel to that theme's quotes (in original order); active chip highlighted; remembered in localStorage.
- **Progress**: "07 / 34" style counter (position within the current filtered set) plus a thin progress bar. No dots (34 is too many).
- **Deep link**: URL hash `#q12` opens Quote 12 (by original number); optional `#theme=slug&q12`. Hash updates with `history.replaceState` on every change; `hashchange` is respected; invalid hash falls back to first quote.
- **Shuffle**: toggle button; shuffled order is a random permutation of the current set with no repeats until exhausted; toggling off restores original order and stays on the current quote.
- **Favorites**: heart button (and double-tap on the card) toggles; stored in `localStorage` as array of ids; a "Favorites" chip appears in the chip row (with count) and filters to them. Empty state message when none.
- **Copy/Share**: share button uses `navigator.share` with `{text: '"quote" - Life Quotes', url}` when available; otherwise copies to clipboard (`navigator.clipboard`, fallback to `execCommand`) and shows a small toast "Copied". Under `file://` the share/copy must degrade gracefully (clipboard fallback).
- **Focus mode**: a toggle that hides all chrome (chips, buttons, counter) leaving only the quote; tap center toggles it back. Also use the Fullscreen API where supported (desktop; skip silently on iOS).
- **Theme (light/dark)**: follow `prefers-color-scheme`; manual toggle optional, persisted.
- All localStorage access wrapped in try/catch; the app must work with storage blocked.

## 3. Phone-first requirements
- Primary controls (chips, favorite, share, shuffle, focus) live in a bottom bar within thumb reach; top area holds only counter/progress.
- `viewport-fit=cover`; padding with `env(safe-area-inset-*)`; layout height `100dvh` (with `100vh` fallback).
- No accidental zoom: `<meta viewport width=device-width, initial-scale=1>`, inputs/buttons font-size >= 16px, `touch-action: manipulation`, no double-tap-to-zoom interference (double-tap is favorite). Do not disable user pinch zoom (accessibility).
- Type: quote text `clamp(1.375rem, 5.5vw, 2rem)` on phone, line-height ~1.45, max measure ~34ch on phone; no text below 14px anywhere; tap targets >= 44x44px.
- Optional haptics: `navigator.vibrate(10)` on favorite/shuffle where supported; never required.
- `prefers-reduced-motion`: disable slide animation/smooth scroll (instant snaps), no parallax/fades.
- `overscroll-behavior: contain` on the carousel to prevent pull-to-refresh/back-swipe conflicts; `-webkit-tap-highlight-color: transparent`.
- Accessibility: semantic landmarks (`main`, `nav`), carousel `role="region"` + `aria-roledescription="carousel"`, each slide `role="group"` `aria-label="Quote 12 of 34"`, off-screen slides `aria-hidden`/`inert`; buttons are real `<button>` with `aria-label`, toggles use `aria-pressed`; chips are `role="tablist"`-free simple buttons with `aria-pressed`; `aria-live="polite"` region announces the new position and toasts; visible `:focus-visible` rings; contrast >= 4.5:1 body text in both themes; works with VoiceOver/TalkBack and keyboard-only.

## 4. Desktop adaptation
- Same carousel, centered card with max-width ~720px and larger type (`clamp` up to ~2.5rem); generous whitespace, subtle theme-tinted background.
- Visible prev/next arrow buttons at the sides; chips along the top; keyboard shortcuts hint (small "?" popover or footer line).
- Mouse: click side zones, drag-to-scroll is optional; trackpad horizontal swipe works natively via scroll-snap.
- Window resize must keep the current quote aligned (re-snap on resize/orientation change; landscape phones: reduce type, keep bar compact).

## 5. Data model
`quotes.js` defines `window.QUOTES` (plain global script, not an ES module, because `file://` blocks module imports in some browsers):
```
window.THEMES = [{ id: "self", name: "Self-Awareness & Self-Respect" }, ... 7 total, in source order];
window.QUOTES = [{ id: 1, theme: "self", text: "..." }, ... 34 total];
```
- `id` = the original quote number (1-34, not file order); array stored sorted by `id`.
- `text` copied **verbatim** from the source (typos like "May be", "you life", "a lack of self awareness" preserved; straight quotes/apostrophes as in source; escape properly in JS strings). Do not edit, trim words, or fix grammar. Strip only the leading `> `.
- Theme ids (slugs): `self`, `relationships`, `discipline`, `health`, `money`, `happiness`, `growth`. Theme counts: 4, 4, 8, 4, 2, 5, 7 = 34.
- Display number is zero-padded (`Quote 07`).

## 6. File structure
```
web/
  index.html   markup, meta, a11y landmarks, loads css/js (classic scripts, defer)
  styles.css   tokens (CSS variables), light/dark, layout, responsive, reduced-motion
  quotes.js    THEMES + QUOTES data only
  app.js       rendering, navigation, filter, favorites, hash, share, focus mode
  PLAN.md
```
No fonts/CDN/network: use a system serif stack (e.g. `"Iowan Old Style", Georgia, serif`) for quotes and system sans for UI; no external requests; no images required (icons are inline SVG).

## Acceptance checklist (developer + verifier)
Data
- [ ] Exactly 34 quotes, ids 1-34 each present once, text byte-identical to the source (verifier diffs programmatically); 7 themes with counts 4/4/8/4/2/5/7.
Opening / structure
- [ ] Opens by double-click (`file://`), zero console errors, zero network requests.
- [ ] Initial view shows Quote 01 (or hash quote) with theme label, number, and counter "01 / 34".
Navigation
- [ ] Swipe left/right on a 375x812 viewport moves exactly one quote and snaps; wrap-around works.
- [ ] Tap zones (left/right quarters) and buttons navigate; center tap toggles focus mode.
- [ ] Arrow keys, Home/End, S, F, C, Esc work; focus is never trapped.
- [ ] Theme chip filters the set; counter reflects filtered length; "All" restores; chip row scrolls horizontally without page scroll.
- [ ] `#q12` loads Quote 12; hash updates on navigation; browser back/forward and manual hash edits stay consistent; bad hash is harmless.
- [ ] Shuffle visits all quotes with no repeat before exhaustion; unshuffle restores order.
- [ ] Favorites persist across reload; Favorites chip with count; empty state; app works if localStorage throws.
- [ ] Share uses Web Share when present, otherwise copies and shows toast; copied text is the quote verbatim plus attribution line.
Phone
- [ ] No horizontal page scroll or bounce at 320, 375, 390, 430 px widths; no content under notch/home indicator (safe-area padding present).
- [ ] Layout uses `100dvh`; address-bar collapse does not cut off controls.
- [ ] Longest quote (Quote 02, Quote 20) fits readably at 320px width without clipping (internal scroll allowed).
- [ ] All tap targets >= 44px; body/quote text >= 16px; inputs/buttons do not trigger iOS zoom; pinch zoom not disabled.
- [ ] Primary actions are in the bottom half of the screen.
A11y / polish
- [ ] Reduced-motion removes animations; dark and light schemes both legible (contrast >= 4.5:1).
- [ ] Screen-reader labels/roles as specified; focus-visible rings; `aria-live` announces position.
- [ ] Desktop (>=1024px): centered card, side arrows, shortcuts hint, window resize keeps alignment; no layout break at 1920px or in landscape phone (812x375).
- [ ] Total payload small (<100 KB), no dependencies.
