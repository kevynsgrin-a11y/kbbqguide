# WCAG 2.2 AA Checklist

## Structure and reading

- [ ] One descriptive H1; logical heading levels; landmarks and skip link.
- [ ] Recipe title, yield, time, ingredients, instructions, and safety content remain readable without JavaScript.
- [ ] Language attributes, abbreviations, units, and Korean text are understandable.
- [ ] Alt text communicates purpose; decorative media uses empty alt; video has captions and transcript.
- [ ] Print view preserves recipe and safety content while removing navigation, ads, and motion.

## Interaction

- [ ] Every function works by keyboard with visible focus and no trap.
- [ ] Mobile menu/dialog announces name, state, and role; Escape closes and focus returns.
- [ ] Forms have persistent labels, instructions, programmatic errors, and a clear success state.
- [ ] Touch targets meet 24×24 CSS px minimum and generally target 44×44 px.
- [ ] Scalers and filters announce updated results without stealing focus.
- [ ] No status is communicated by color alone.

## Visual and motion

- [ ] Text contrast is at least 4.5:1; large text and component boundaries meet applicable AA ratios.
- [ ] Content reflows at 320 CSS px and survives 200% zoom without two-dimensional scrolling.
- [ ] Focus is not obscured by sticky UI.
- [ ] `prefers-reduced-motion` removes parallax, tilt, auto transitions, and nonessential animation.
- [ ] Video never autoplays with sound.

Automated checks support but do not replace manual keyboard, screen-reader landmark, zoom/reflow, print, and cognitive-load review.

## Phase 7 evidence

The final automated/headless pass completed 40 viewport-route checks and 20 WCAG rule runs with no remaining violation. It verified skip-link focus, 35 consecutive keyboard targets, Escape/focus return, named accessibility-tree landmarks, 320 CSS-pixel reflow, reduced motion, print safety content, three no-JavaScript scenarios, live-region updates, and the focusable shopping-list scroll region. Six responsive captures were visually inspected.

The checklist remains a release gate because a named human must still test representative pages with real screen-reader software, 200%/400% zoom, physical devices, and final media/fonts. Active forms also require error and success-state testing only after a provider and privacy workflow are approved; current forms are intentionally disabled.
