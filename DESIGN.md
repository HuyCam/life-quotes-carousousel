# Life Quotes - Visual Design Spec

Tokens live in `tokens.css` (merge into `styles.css`). All variable names below are defined there.

## 1. Concept
"Quiet editorial." A printed-page feel on a softly tinted gradient: one big serif sentence, lots of air, a single accent per theme. Each theme has its own hue so switching chips visibly changes the room, but saturation stays low so the quote is the hero. No text shadows, no borders except hairlines, no emoji. Set `data-theme="<slug>"` on `<html>` from the active chip, or (for All/Favorites) from the visible slide's quote theme. Manual dark mode: `data-color="dark|light"` on `<html>`.

## 2. Type
- Quote: `--font-quote` (Iowan Old Style, Palatino, Georgia). UI: `--font-ui` (system-ui). No webfonts.
- Quote weight 400, `letter-spacing:-0.005em`, `text-wrap:pretty`, `max-width:var(--measure)` (34ch phone, 38ch desktop).
- Size tier by word count; JS sets `data-len` on each slide: `words<=25 -> s`, `26-45 -> m`, `>45 -> l`. Real data is 7-68 words: 14 S, 16 M, 4 L.
  - s: `--fs-quote-s` 26px to 40px, line-height 1.42
  - m: `--fs-quote-m` 22px to 32px, line-height 1.42
  - l: `--fs-quote-l` 18px to 24px, line-height 1.5 (Quotes 02 and 20 must fit at 320px; the card may scroll internally)
  - Desktop (>=900px): raise the clamp maxima to s 3.25rem, m 2.5rem, l 1.75rem.
- Theme label: UI, `--fs-label` 13px, uppercase, `--ls-label`, weight 600, accent color. "Quote 07": UI 14px, `--ink-2`, tabular-nums. Counter "07 / 34": UI 14px, tabular-nums, `--ink`.
- Nothing below 13px; interactive text >=16px (chip text 15px is acceptable only because it is a button, not an input).

## 3. Spacing and radii
4px scale `--s1..--s8` (4,8,12,16,24,32,48,72). Gutter 16px plus safe-area. Card padding `--s6` phone, `--s8` x `--s7` desktop. Radii: chips and buttons pill, card 28px, toast 14px.

## 4. Theme palette (background is a 160deg gradient `--bg-from` to `--bg-to`)
| slug | hue | light bg | light accent | dark bg | dark accent |
|---|---|---|---|---|---|
| self | violet | #f3effb to #e4dcf5 | #5b3fb0 | #17132a to #241c46 | #b7a4ff |
| relationships | rose | #fbeff1 to #f6dde2 | #a62c52 | #2a121b to #43202d | #ff9fb8 |
| discipline | blue | #edf2fb to #d9e4f6 | #1f56a8 | #101a2c to #16294a | #8fbaff |
| health | green | #eef6ef to #d9ebdc | #1f6b3a | #0f1f15 to #173223 | #86d9a0 |
| money | bronze | #f8f3e4 to #efe4c3 | #7a5800 | #241c08 to #3b2d0c | #e6c25c |
| happiness | coral | #fff1e8 to #fde0cc | #a8480f | #2b160b to #47230f | #ffb27a |
| growth | teal | #ebf5f5 to #d5ebec | #0b6b72 | #0c1f22 to #12353a | #6fd8de |

Contrast, measured against each gradient's end stop (worst case): `--ink` 12.9-13.8:1 light (#1d1a24), 11.5-13.8:1 dark (#f1eef8); `--ink-2` 5.8-6.2:1 light, 6.2-7.5:1 dark; accent as text 4.6-5.7:1 light (lowest: happiness 4.6), 7.3-8.2:1 dark. Filled accent buttons use `--on-accent` (= bg-from) on `--accent`: 5.3:1 or better. `--accent-soft` (12-15% accent alpha) is a tint behind ink or accent text only. Default (no theme) = violet palette.

## 5. Layout
Phone (<900px): `height:100dvh`, flex column, safe-area padding on all sides.
1. Top (48px): counter "07 / 34" left, theme label right; a 3px progress bar under it (track `--line`, fill `--accent`, `transform:scaleX()` from left).
2. Middle: scroll-snap carousel. Card is borderless on phone (text straight on the gradient), vertically centered, 24px horizontal padding. Huge decorative opening quote mark (U+201C in `--font-quote`, `--fs-mark`, `--accent` at 14% opacity, `aria-hidden`) at `top:-0.15em; left:-0.05em` behind the text. "Quote 07" sits under the text.
3. Bottom bar (sticky, `--sh-bar`, bg `--surface`, `backdrop-filter:blur(14px)`, padding `--s3` plus `env(safe-area-inset-bottom)`): row 1 chips (horizontal scroll, hidden scrollbar, right-edge fade mask, 8px gap); row 2 four icon buttons spaced evenly: shuffle, heart (center, 52px), share, focus. No prev/next buttons on phone (swipe and tap zones).
Desktop (>=900px): gradient fills viewport; centered card `width:min(720px,calc(100vw - 200px))`, bg `--surface`, `--r-card`, `--sh-card`, 1px `--line` border. Chips row top-center above the card. Counter inside the card top-right; 2px progress line along the card's bottom edge. 52px round chevron buttons vertically centered, 24px outside each card side. Action row (shuffle, heart, share, focus) centered below the card. Footer hint, 13px `--ink-2`: `Left/Right navigate - S shuffle - F favorite - C copy - Esc exit`, keys in `<kbd>` (1px `--line` border, radius 6px, padding 2px 6px, 12px UI).
Landscape phone (max-height 480px): hide quote mark, bar collapses to one icon row, drop one size tier.

## 6. Components
- Chip: 44px tall hit area, padding 0 16px, UI 15px/500, `--ink` on `--accent-soft`, 1px `--line`. Count in `--ink-2` after a 6px gap. Active (`aria-pressed=true`): bg `--accent`, text `--on-accent`, no border, count 80% opacity. Favorites chip carries a 14px filled heart.
- Icon button: 44x44 (desktop arrows 52), pill, transparent, 24px icon in `--ink`; hover bg `--accent-soft`; press scale .94. Pressed toggles (shuffle, focus): bg `--accent-soft`, icon `--accent`. Focus-visible on everything: 2px solid `--accent`, offset 3px.
- Heart: outline `--ink`; on = fill and stroke `--accent`. 52px hit area.
- Toast: fixed, centered, bottom `calc(96px + env(safe-area-inset-bottom))` phone / 32px desktop; bg `--ink`, text `--bg-from` (>=11:1), UI 14px/500, padding 10px 18px, `--r-toast`, `--sh-toast`; shown 1.6s; mirrored into the aria-live region.
- Focus mode: chips, bar, counter, arrows, hint fade out; card surface/border/shadow dropped on desktop; quote may step up one size tier (cap 3.5rem). Tap center to exit.

## 7. Motion
- Slide: native scroll-snap. When a slide settles add `.is-active`: text goes from `opacity:0; translateY(10px)` to rest over `--dur` `--ease-out`; quote mark drifts `translateX(-8px)` to 0 over `--dur-slow`.
- Theme change: two stacked fixed gradient layers crossfade with opacity (`--dur-slow`, `--ease-inout`; gradients cannot interpolate); accent colors transition 240ms.
- Heart pop: icon scale 1 -> 1.35 -> 1 over 360ms `--ease-pop`, fill 140ms. Double-tap on card spawns a 96px heart at the tap point: scale .6 -> 1.1 and fade out over 600ms, `pointer-events:none`.
- Focus mode: chrome to `opacity:0; translateY(8px)` over `--dur` `--ease-inout`, then `visibility:hidden`.
- Toast: in and out 200ms (translateY 12px, opacity).
- `prefers-reduced-motion: reduce`: duration tokens become 0; no translate, scale or pop; `scroll-behavior:auto`; gradient swaps instantly; heart just swaps fill; double-tap heart shows static for 400ms.
- Animate only transform and opacity.

## 8. Icons (inline SVG, viewBox 0 0 24 24, `fill="none"`, `stroke="currentColor"`, stroke-width 1.75, round caps and joins, `aria-hidden="true"`, `focusable="false"`; the label lives on the button)
- Heart: `M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z`; active: `fill="currentColor"`.
- Share: circles r=2.5 at (6,12), (18,6), (18,18); lines `M8.2 10.8L15.8 7.2` and `M8.2 13.2L15.8 16.8`.
- Copy: `<rect x=9 y=9 width=11 height=11 rx=2.5>` plus `M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9`.
- Shuffle: `M3 7h3.5c2 0 3.2 1 4.3 2.7l2.4 3.6c1.1 1.7 2.3 2.7 4.3 2.7H21`; `M3 17h3.5c2 0 3.2-1 4.3-2.7`; `M13.2 9.7C14.3 8 15.5 7 17.5 7H21`; arrowheads `M18.5 4.5L21 7l-2.5 2.5` and `M18.5 14.5L21 17l-2.5 2.5`.
- Fullscreen enter: `M4 9V5h4`, `M16 5h4v4`, `M20 15v4h-4`, `M8 19H4v-4`. Exit: `M9 4v5H4`, `M15 4v5h5`, `M20 15h-5v5`, `M4 15h5v5`.
- Chevrons (stroke-width 2): left `M14.5 5.5L8 12l6.5 6.5`; right `M9.5 5.5L16 12l-6.5 6.5`.
- Check (optional, "copied"): `M5 12.5l4.5 4.5L19 7.5`.

## 9. Do / don't
Do show one accent at a time; keep 24px minimum side padding; use soft tinted surfaces. Don't use pure black or white backgrounds, italic quotes, or animate layout properties.
