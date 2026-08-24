# RiX graphics roadmap

RiX should compete as a semantic mathematical graphics system rather than as a
clone of a single graphing calculator. A `Graphic` or `Scene3D` remains the
source of truth; SVG, Canvas, WebGL, TikZ, text, and audio are projections of
that retained mathematical object.

## 1. Shared 2D navigation and inspection — baseline implemented

Ship one `rix.viewport@1` / `rix.selection@1` interaction layer for every SVG
`Graphic` mounted in RiX Web.

- Pointer and touch: drag the scene to pan, wheel/trackpad zoom at the pointer,
  click/tap without dragging to select, and double-click to reset.
- Keyboard: arrows pan, `+`/`-` zoom, `Home` resets, and toolbar controls cycle
  through the same semantic identities selected by pointer input.
- Inspection: continuous hover reports approximate lowered coordinates without
  live-region noise; committed selection reports the original exact coordinates
  and dimensions retained by the RiX scene node.
- Plot inspection: plot metadata retains its frame and original source samples,
  so the host can distinguish approximate cursor coordinates from stored sample
  spellings, including data displayed on logarithmic axes.
- Reactive behavior: viewport and selection state survive a mounted reactive
  rerender; existing `DragPoint` and `Graphics.Action` interactions retain
  priority over scene panning.

Follow-up QA remains: browser automation for multitouch gestures, screen-reader
passes, and usability tuning for very dense plots.

## 2. Real Scene3D viewport — baseline implemented

Mount the existing WebGL plan as an actual orbitable, zoomable, selectable
viewport instead of rebuilding only a 2D snapshot.

- Reuse the shared selection identities and event records from priority 1.
- Add orbit, truck, dolly, reset-camera, projection switching, and keyboard
  equivalents with bounded camera policies.
- Connect WebGL picking to `Scene3D` `pickid` records and exact world-coordinate
  inspection; retain the portable SVG snapshot as a fallback and export.
- Test context loss, reduced motion, high-DPI rendering, and deterministic
  snapshot parity.

The baseline now mounts a returned `.scene3d.Scene` directly through the shared
output widget host. It provides pointer and keyboard orbit/truck/dolly, bounded
camera distances, reset and projection switching, stable `pickid` selection,
DOM annotation overlays, exact retained world-coordinate inspection, high-DPI
canvas sizing, and persistent camera/selection state across reactive rerenders.
Missing and lost WebGL contexts display a deterministic SVG projection derived
from the same `rix.webgl-plan@1` camera and draw calls.

Follow-up QA remains: multitouch camera gestures, GPU color-buffer picking for
very dense scenes, deeper annotation collision/occlusion policy, screen-reader
passes, and pixel-level parity fixtures across browser WebGL implementations.

## 3. Broader plot families — baseline implemented

Add polar, implicit, inequality, contour, heat-map, and vector-field plots as
semantic plot schemas that lower through `Graphics`, not host-only drawing code.

- Define domain, sampling/refinement budgets, unresolved-region records, exact
  versus approximate status, legends, color scales, and hit-test identities.
- Prefer certified subdivision for implicit boundaries and discontinuities.
- Make every family render through SVG/Canvas/TikZ where meaningful and expose a
  deterministic textual alternative.

The baseline now provides `.plot.Polar`, `.plot.Implicit`, `.plot.Inequality`,
`.plot.Contour`, `.plot.HeatMap`, and `.plot.VectorField`. Scalar-field families
share a bounded exact-domain grid sampler and retain sampling policy,
exact/enclosed/approximate/unresolved evidence counts, unresolved and ambiguous
cell records, legends, discrete color scales, and stable `hitId` values in
`rix.plot@1` metadata. They lower to ordinary Graphics paths and rectangles, so
SVG, Canvas, and TikZ consume the same retained scene. Plot-aware deterministic
text summaries now supply kind, domain, grid, uncertainty, and evidence status
and are included in SVG accessible names.

Follow-up work remains: adaptive/certified interval subdivision for implicit
and inequality boundaries, discontinuity-aware cell refinement, continuous
color interpolation, contour-label placement, dense-field performance policy,
and browser-level visual/accessibility QA.

## 4. Visual geometry workbench — baseline implemented

Build a construction environment over retained geometry constraints.

- Directly create and manipulate points, lines, circles, intersections,
  measurements, loci, and transformations.
- Keep construction dependencies explicit, with exact/certified values and
  readable degeneracy diagnostics.
- Provide object tree, property inspector, undo/redo, semantic keyboard
  navigation, and import/export of a portable construction record.

The baseline now exposes `.geometry.Workbench` over the retained
`rix.geometry.construction-graph@1` model. Construction nodes render with stable
semantic identities, while the web host adds a dependency tree, exact property
inspection, keyboard object traversal, session undo/redo for direct movement,
and deterministic JSON export. `DragPoint` now supports an explicit mathematical
view-to-frame transform, so a reactive free-point tuple can move in mathematical
coordinates while the scene remains renderer-neutral. At the kernel level,
`ConstructionRecord` strips executable constructors into a portable record,
`ImportConstruction` restores it with an explicit derived-constructor map, and
`Undo`/`Redo` reversibly replay exact graph drag events.

Follow-up work remains: authoring tools for creating objects from the canvas,
constraint-solving drag modes, labels and measurements, locus animation,
degeneracy repair suggestions, multi-object edits, persistent workbench history,
and direct import of exported JSON in the browser host.

## 5. Timeline playback and transitions — baseline implemented

Turn retained `Timeline` values into playback, scrubbing, and comparison tools.

- Add play/pause, step, speed, loop, range, and keyboard controls.
- Match objects across frames by semantic identity; interpolate only properties
  whose schema declares a safe transition and otherwise use discrete changes.
- Preserve exact frame values in the inspector and text track even when pixels
  are interpolated. Honor reduced-motion preferences.

The baseline now renders retained `.Timeline.Sequence` values directly as an
interactive web transport with play/pause, stepping, scrubbing, speed, loop,
playback-range, comparison, and keyboard controls. All materialized frame DOM
remains available to the host, while the current-frame inspector and complete
text track expose exact states, provenance, and semantic output. Adjacent
frames are matched through stable `data-rix-semantic-id` values. The portable
`rix.timeline-transition@1` policy is discrete by default and currently
declares only frame opacity safe for an explicit crossfade; unsupported
property declarations fail instead of silently interpolating mathematical
values. Reduced-motion preference suppresses crossfades without removing
user-directed discrete playback.

Follow-up work remains: schema-declared interpolation for individual geometry,
plot, camera, and annotation properties; onion-skin and arbitrary-frame
comparison; variable per-frame timing; named timeline markers; recording and
export controls; persistent transport preferences; and richer transition
diagnostics when a semantic object changes kind or disappears.

## 6. Sonification and comprehensive textual alternatives

Make audio and structured language first-class projections of the same semantic
scene, not captions generated from final pixels.

### Audio trace baseline

- Map horizontal traversal to time and vertical value to pitch, with configurable
  range, tempo, waveform, direction, and stereo position.
- Provide play/pause, step, seek, series selection, domain selection, and speed
  controls with a complete keyboard path.
- Emit restrained event cues for axis crossings, discontinuities, extrema,
  intersections, selected marks, and domain boundaries.

### Semantic and exactness cues

- Generate events from plot/geometry meaning rather than sampled pixels.
- Use distinct, user-configurable cues for exact, certified-enclosure,
  approximate, unresolved, and conjectural results. Never imply proof solely
  because a sampled trace appears to cross an axis.
- For multiple series, support solo/mute, timbre assignment, sequential playback,
  and an overview mode that avoids an unintelligible audio mixture.

### Deterministic text projection

- Define `rix.graphics.text@1` descriptions with title, domain/range, axes,
  series, exact/certified points of interest, uncertainty, and unresolved areas.
- Add semantic object navigation: next/previous object, group, relation,
  coordinate, construction dependency, and selected-object detail.
- Provide table alternatives for finite data and concise summaries plus
  drill-down for dense sampled functions, geometry, 3D scenes, and timelines.

### Architecture and delivery

1. Specify renderer-neutral `rix.audio-trace@1` and `rix.graphics.text@1` plans.
2. Implement text plans first; use them for accessible names, help, and audio
   event labels.
3. Add a Web Audio host that consumes the audio plan without evaluator I/O.
4. Start with single-series 2D functions, then multiple series and geometry;
   research 3D/nD mappings only after the core interaction is usable.
5. Test with blind and low-vision users, screen readers, keyboard-only input,
   hearing differences, reduced motion, and muted/unsupported audio contexts.

The success criterion is equivalent mathematical access across visual, textual,
and audio views—not identical sensory output.
