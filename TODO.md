# RiX Web product TODO

This is the host-facing roadmap for interactive experiences that compose RiX
semantic values, plugins, portable `Graphic` scenes, and renderer services. The
mathematics and reusable scene values belong in RiX; browser controls, layout,
and accessibility behavior belong here. Generated files under `docs/` and
`tmp/` are not roadmap sources.

## Numeral-system playground

- [ ] Build the interactive playground specified by the RiX `.radix` roadmap.
  Users should be able to construct ordinary, multi-token, balanced, and
  negative-base systems; select locale/symbol profiles; parse the complete
  exact numeral grammar; and copy canonical labeled-backtick RiX source.
- [ ] Explain digit values, place weights, normalization/carry behavior,
  terminating and repeating expansions, and why balanced and negative systems
  represent signs differently from an ordinary positive base.
- [ ] Keep every calculation exact and make work limits or truncated repeating
  expansions visible.

## Exact-number visualization playgrounds

- [ ] Add a number-line view for exact rational points and closed, oriented
  rational intervals. Preserve exact values and interval orientation in the
  semantic model even when the viewport uses approximate pixels.
- [ ] Add interval-arithmetic provenance diagrams that connect operand
  intervals and operations to their result intervals, including widening,
  reversed presentation, undefined regions, and unresolved/certified states.
- [ ] Add linked views for mediants, Farey neighbors, Stern-Brocot paths,
  continued-fraction convergents, and exact convergent-error values. Reuse RiX
  methods and plugin results rather than reimplementing the mathematics in the
  browser.
- [ ] Ensure every view has a useful static `Graphic`/SVG snapshot with labels
  and alternative text so the mathematical result remains portable outside
  RiX Web.

## Mathematical graphic interaction and accessibility

- [ ] Implement the shared RiX viewport/selection protocol with pan, zoom,
  reset, focus, and semantic selection. Pointer, touch, and keyboard paths must
  operate on the same selected mathematical identities.
- [ ] Provide stable accessible names, descriptions, reading order, focus
  indication, and a screen-reader-friendly textual/table alternative for every
  interactive mathematical graphic.
- [ ] Announce exact selected values and meaningful state changes without
  flooding assistive technology during continuous pan, zoom, or drag updates.
- [ ] Test keyboard-only and screen-reader workflows, reduced motion, high
  zoom, responsive layouts, and selection persistence across reactive rerenders.

## Exact-coordinate approximation and visual QA

- [ ] Display when exact mathematical coordinates were rounded, clipped,
  merged, or otherwise approximated for SVG/Canvas pixels. Let users inspect
  the original exact value and the active lowering precision.
- [ ] Consume renderer diagnostics/metadata rather than reproducing rounding
  decisions in host code; exported static artifacts should carry the same
  approximation disclosure where the target supports it.
- [ ] Add regression cases for huge numerators, extremely narrow intervals,
  reversed interval presentation, overlapping labels, coordinates that become
  equal only after rounding, and dense convergent/Farey views.
- [ ] Add property tests for mathematical-to-viewport transforms and visual
  regression tests for representative SVG and Canvas snapshots.
