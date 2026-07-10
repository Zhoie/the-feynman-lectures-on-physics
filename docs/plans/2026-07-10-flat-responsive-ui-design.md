# Flat Responsive Interface Cleanup

## Scope

Refine the complete website experience without changing its content model,
routes, scientific calculations, or existing experiment coverage. Preserve the
current uncommitted implementation baseline.

## Current Evidence

The complete 163-test suite passes. Browser inspection at 390 and 1280 pixels
shows that the remaining problems are presentational:

- shadows repeat at the shell, card, chart, canvas, control, and button levels
- nested depth makes related content appear more fragmented than necessary
- chapter experiment tabs consume too much vertical space on narrow screens
- laboratory action buttons wrap inconsistently inside mobile cards
- metric cards leave an isolated final card at common desktop widths
- a single chart occupies half of the available desktop row
- several mobile sections use more padding and vertical space than their
  information hierarchy requires

## Selected Approach

Use a systematic flat-surface hierarchy rather than a shadow-only search and
replace or a complete redesign.

Static surfaces use borders and small background-tone differences with no box
shadow. Clickable cards may gain one restrained shadow while hovered; keyboard
selection remains a clear outline, not a shadow. Canvas frames, result cards,
charts, content cards, and laboratory shells stay flat. Slider-thumb outlines
remain because they communicate control position rather than surface depth.

## Responsive Adjustments

- Keep chapter experiment tabs in one horizontally scrollable row on phones.
- Use stable grid placement for laboratory titles and action buttons.
- Reflow metric cards with an automatic minimum width.
- Let a single chart use the full result width.
- Reduce narrow-screen card padding while retaining 44-pixel controls.
- Stack navigation actions in reading order on the smallest screens.
- Preserve existing desktop content widths and experiment-to-control ratios.

## Interaction Logic

No new application state is required. Existing local URL updates, experiment
selection, parameter changes, default restoration, disclosure controls, and
navigation remain the source of truth.

Browser verification will cover:

- selecting every chapter-one experiment and confirming URL state
- changing a parameter and restoring its exact default
- opening a quantitative laboratory from the chapter
- changing and resetting range and select controls
- opening model-confidence details
- using chapter panel and previous/next navigation controls
- confirming zero browser-console errors

## Verification

Run the full tests, lint, type checking, and production build. Inspect chapter
and laboratory pages at 390, 768, and 1280 pixels. Compare screenshots after
the changes, search for unintended shadow utilities, confirm important routes
return 200, and inspect the final diff for preservation of prior work.
