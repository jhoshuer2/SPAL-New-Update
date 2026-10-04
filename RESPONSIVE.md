# Responsive Design Requirements (Mandatory)

This project is a mobile-first Progressive Web App (PWA).

For every screen, component, feature, and future update, responsiveness is a non-negotiable requirement.

## Core Rules

1. Design and develop mobile-first.

2. Every UI element must adapt gracefully to different screen sizes and aspect ratios.

3. Never use fixed widths, heights, margins, paddings, or positioning unless absolutely necessary.

4. Prefer flexible layouts using:

   * Flexbox
   * CSS Grid
   * Relative units (%, rem, em, vw, vh)
   * Auto-layout principles

5. All screens must work correctly on:

   * Small Android devices (320px–360px width)
   * Standard Android devices (375px–412px width)
   * Large phones (430px+ width)
   * Tablets
   * Desktop browsers

6. No content should:

   * Overflow horizontally
   * Be clipped
   * Be hidden behind other elements
   * Require zooming
   * Break layout alignment

7. Text must scale appropriately:

   * Avoid fixed font sizes where possible
   * Maintain readability on small screens
   * Prevent text truncation

8. Images, avatars, illustrations, cards, and charts must:

   * Scale proportionally
   * Remain fully visible
   * Maintain aspect ratio

9. Bottom navigation, headers, floating buttons, modals, sheets, and dialogs must remain usable on all screen sizes.

10. Respect device safe areas:

    * iPhone notch
    * Dynamic Island
    * Android gesture navigation
    * Bottom home indicators

## Testing Requirements

Before marking any feature complete, test at:

* 320px
* 360px
* 375px
* 390px
* 414px
* 430px
* Tablet width
* Desktop width

Any visual issue found at any breakpoint must be fixed before completion.

## Future Updates

For every future feature, bug fix, redesign, or component update:

* Responsiveness must be evaluated first.
* Existing responsive behavior must never regress.
* New code must not introduce layout shifts or overflow.
* Any UI change must be tested across multiple viewport sizes.

## App shell & bottom app bar (standard, mandatory)

The bottom app bar must be visible and fixed in place on every phone, browser and
screen size, and the page must never be pannable or draggable. This is the
standard app-shell layout, and it is how SPAL is built:

1. **The document is locked.** `html` and `body` are `overflow: hidden` with
   `overscroll-behavior: none` (`app/globals.css`). Never set only `overflow-x:
   hidden` on them: that silently turns them into vertical scroll boxes and lets
   the whole app be dragged around, which pushes the bar off screen.
2. **The app frame is pinned to the viewport.** `#app-root` (`app/layout.tsx`) is
   `position: fixed; top: 0; bottom: 0`, centred, `max-width` = shell. Its height is
   exactly what is visible. Do **not** size the frame with `100vh` / `100dvh` /
   `100svh` (or `min-height` of them): those disagree with the visible height in
   URL-bar and in-app browsers (WhatsApp, Instagram) and leave the bar below the fold.
3. **The bottom bar is the last row of the frame, in flow.** `(main)/layout.tsx` is a
   flex column: `<main class="flex-1 overflow-y-auto">` then `<BottomNav />`
   (`shrink-0`). Pages scroll inside `<main>`; the bar never floats over content and
   can never be pushed off screen. **Never make the bottom bar `position: fixed`.**
4. **Every screen scrolls inside `<main>`**, never on the document. Full-screen
   flows that hide the bar (`HIDDEN` in `BottomNav.tsx`) still live in the same frame.
5. `viewport.interactiveWidget = "resizes-content"` so the frame (and any fixed save
   bar) shrinks above the on-screen keyboard instead of being covered by it.

`BottomNav` also publishes its real height as **`--bottom-nav-h`** on `<html>` (`0px`
whenever it is hidden or a text field is focused). Rules, never hard-code a pixel
offset for the bar:

* Anything that floats above the bar (FABs, CTA bars, toasts) uses the
  `.cta-bottom` utility, or `bottom: calc(var(--bottom-nav-h) + <gap>)`. It falls
  back to the home-indicator inset when the bar is hidden.
* Page content needs no extra bottom padding for the bar (it is in flow). Use
  `.pb-nav` (1rem) for breathing room, or `.pb-nav-fab` (6rem) when a floating
  button sits over the content, not a guessed `pb-28`.
* The bar keeps `env(safe-area-inset-bottom)` padding, tap targets of at least
  48px (`min-h-[52px]`), and clamped label sizes so all tabs fit at 320px.
* On very small phones (<= 374px) headings clamp via the `h1/h2` rules; keep long
  values on `truncate` so they never push the layout wider than the viewport.

Extra rules learned from small-phone testing:

* `.cta-bottom` also covers screens where the bar is hidden (full-screen flows):
  it falls back to the home-indicator inset, so a floating button never touches
  the screen edge. Use `.pb-nav-fab` when a floating button sits over scrolling content.
* The bar steps aside while a text field is focused (on-screen keyboard) and
  returns on blur; `--bottom-nav-h` drops to `0px` at the same time, so buttons that
  follow it move with it.
* Keep 48px tap targets on small phones by **reflowing**, not shrinking: put a
  stepper on its own row, let chips wrap, or drop a label. Never go below 48px.
* Headers use `min-w-0` + `truncate` or `clamp()` font sizes, never a fixed
  `max-w-[190px]` on the name. Restaurant/bar tab screens share `components/home/AppHeader.tsx`.
* Check these viewports before shipping, including **short** ones: 320×568,
  360×640, 375×667, 390×844, 430×932, 768×1024, desktop. For each screen (and each
  open drawer/sheet) confirm: no horizontal scroll, the bar is fully on screen with
  every label visible, nothing floats over the bar, no content ends underneath it,
  and every button/link is at least 48×48.

## Definition of Done

A task is NOT complete unless:

✓ Works on Android and iPhone sizes

✓ No horizontal scrolling

✓ No overlapping elements

✓ No clipped content

✓ No broken layouts

✓ Consistent spacing and alignment

✓ Responsive across all supported viewports

Responsiveness is a permanent project requirement and must be considered for every implementation without exception.
