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

The first post-baseline interaction pass now adds two-pointer pinch zoom and
simultaneous centroid panning through the same bounded `rix.viewport@1` state.
Every enhanced Graphic exposes a direct semantic-object picker plus a retained
object-type filter, making dense plots navigable without cycling through every
unrelated mark. Bracket shortcuts provide object traversal and Shift-brackets
jump by ten. The SVG now explicitly references its exact inspector and polite
live status, while the static text-object list tracks the current semantic
selection. These controls and all six graphics baselines are documented in the
RiX Web **Graphics interaction guide**.

Further Priority 1 work remains: automated real-device gesture matrices,
screen-reader testing with blind users, and usability measurement on very large
semantic catalogs.

The consolidated post-baseline pass adds retained-anchor spatial navigation
with Alt-arrow keys, `/` focus for semantic-object search, live filtered direct
selection, four pointer hit-area policies, and optional per-user persistence of
viewport, selection, filter, search, and tolerance under `preferencesKey`.
Search and spatial traversal operate on exact semantic identities rather than
SVG paint order.

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

The first post-baseline interaction pass adds two-pointer camera gestures:
pinch distance controls bounded dolly while centroid movement trucks through
the camera plane. Dense scenes now expose a direct exact-object picker and a
retained primitive-type filter; previous/next traversal respects the filter.
The canvas explicitly references its inspector and polite status, publishes its
keyboard shortcuts, and announces committed exact selection without making the
passive inspector noisy. Projected labels use deterministic nearby placements,
with visible displaced and crowded states when annotations collide.

Further Priority 2 work remains: GPU color-buffer picking for very dense
scenes, real-device gesture matrices, screen-reader testing with blind users,
and pixel-level parity fixtures across browser WebGL implementations.

The consolidated post-baseline pass makes retained annotation `occlusion`
policies operational: mesh depth can show, fade, or hide a projected label
without discarding its exact semantic record. The 3D toolbar now searches the
semantic catalog and offers four CPU pick-area tolerances. Scene metadata may
set `preferencesKey` to persist camera, projection, selection, type filter,
search, and pick tolerance.

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

The first post-baseline field pass adds bounded adaptive quadtree refinement to
implicit, contour, and inequality plots. `refineDepth` and
`refinementBudget` bound the work, while retained
`rix.plot.refinement-policy@1` records expose processed cells, leaves,
subdivisions, depth reached, point and interval evaluations, and budget stops.
Center samples detect features missed by four same-sign corners. For
interval-compatible functions, `certifyIntervals=1` proves whole-cell implicit
exclusion and inequality inside/outside classification. Sampled edge
interpolation remains labeled as sample evidence rather than being promoted to
a certified crossing. Text and accessible HTML projections report the same
distinction and work record.

The consolidated post-baseline pass adds a shared exact-point cache across
sibling cells and contour levels, caller-declared continuity with separate IVT
edge-existence proof, heuristic steep-cell/discontinuity warnings, bounded
deterministic contour labels, and value-driven HSL heat-map color. The metadata
keeps existence proof, sampled segment location, and heuristic warnings as
different evidence fields. Remaining work is chiefly host-level scale testing:
broader dense-field policy and expanded browser visual/accessibility fixtures.

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

The first post-baseline authoring pass adds exact free-point creation from the
canvas. A positioned `Graphics.Action` maps pointer or keyboard cursor positions
through `rix.graphics.coordinate-system@1`, converts them to exact rational RiX
tuples, and invokes the same retained callback protocol as other scene actions.
`geometry.AddPoint` allocates stable ids, applies an exact snap grid, enforces a
node budget, and records reversible `:create` events. The authoring workbench
exposes a keyboard-focusable Point tool and routes Undo/Redo through that kernel
history, so the dependency tree, inspector, export, and static Graphic all see
the newly created construction nodes rather than host-only marks.

The consolidated post-baseline kernel adds stable dependency-bearing line,
circle, intersection, transformation, and measurement tools; exact line
projection/rejection drag; atomic multi-point edits with undo/redo; and
structured non-mutating degeneracy repair suggestions. Construction records
retain history while imports continue to require explicit derived constructors,
avoiding unsafe callback serialization. Remaining host work is a selection UI
for those tools, locus animation, persistent browser storage, and a direct JSON
import flow that obtains the required constructor map explicitly.

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
`rix.timeline-transition@1` policy is discrete by default and declares opacity,
position, fill, and stroke safe as presentation-only transitions; unsupported
property declarations fail instead of silently interpolating mathematical
values. Reduced-motion preference suppresses crossfades without removing
user-directed discrete playback.

The post-baseline pass adds onion-skin and arbitrary-frame comparison, exact
per-frame timing, named markers, deterministic exact-frame recording/export,
keyed transport preferences, and diagnostics for semantic objects that appear,
disappear, or change kind. Exact retained values always change discretely;
position/fill/stroke interpolation is computed only between matching semantic
DOM objects. Remaining research is schema coverage for richer plot, camera, and
annotation properties plus real media capture beyond deterministic JSON.

## 6. Sonification and comprehensive textual alternatives — baseline implemented

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

The baseline now derives deterministic `rix.graphics.text@1` and
`rix.audio-trace@1` plans from retained plot and scene metadata. Every 2D
Graphic has a structured text disclosure with axes, exactness status, concise
sample tables, semantic objects, points of interest, and unresolved regions.
Sampled sign changes and extrema are explicitly described as non-certified.
For retained 2D series, RiX Web adds a no-autoplay Web Audio trace with
play/pause, stepping, seek, domain range, direction, speed, waveform, stereo,
mute, series solo, and sequential overview controls, all reachable by keyboard.
The audio host performs no evaluator I/O and leaves the full text alternative
available when Web Audio is absent or muted.

Follow-up work remains: certified discontinuity/intersection/extremum event
records from additional math plugins; richer geometry audio mappings; 3D and
nD research; screen-reader/browser matrices; and moderated testing with blind,
low-vision, and hearing-diverse users.

The consolidated post-baseline pass consumes proof-bearing scalar-field
records without overstating sampled segment locations, and adds construction
dependency relations to `rix.graphics.text@1`. Plot `audio` options can declare
tempo, pitch range, and an exactness cue palette. The browser exposes detailed,
minimal, or disabled cues plus live tempo and pitch controls, while
`preferencesKey` persists transport, timbre, stereo, mute, cue, range, and
frequency choices. These preferences remain a host projection and never cause
evaluator I/O.

The success criterion is equivalent mathematical access across visual, textual,
and audio views—not identical sensory output.
