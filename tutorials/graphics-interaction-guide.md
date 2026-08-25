---
number: 12i
title: Graphics interaction guide
description: Use every 2D, 3D, geometry, timeline, text, and audio control in RiX Web.
---

RiX graphics stay as retained mathematical values. RiX Web projects those
values into visual, interactive, textual, and audio views. This guide collects
the controls added across the graphics roadmap in one place.

## Navigate and inspect every 2D Graphic

Run this plot, then interact with the Graphic rather than the source cell.

```rix edu
.Plugin.Load("plot");
.plot.Function(
    x -> x^3 - x,
    [-3,3],
    {=
      samples=41, title="Cubic inspection", xLabel="x", yLabel="y",
      preferencesKey="cubic-inspection",
      audio={= tempo=14,frequency=[180,1200],cuePalette={= exact=1400,approximate=700 } }
    }
) ;
```

Pointer and touch controls:

- Drag empty graph space with one pointer to pan.
- Pinch with two fingers to zoom around the gesture midpoint. Moving both
  fingers together pans during the same gesture.
- Use the mouse wheel or trackpad to zoom at the pointer.
- Click or tap a mathematical object to select it. Double-click empty space to
  reset the view.
- A `DragPoint` or scene action takes priority over panning when the gesture
  starts on its handle.

Keyboard and toolbar controls:

- Focus the plot. Arrow keys pan; hold Shift for a larger step. Plus and minus
  zoom, and Home resets pan and zoom.
- Left bracket and right bracket select the previous or next mathematical
  object. Hold Shift to jump by ten objects.
- **Object type** filters navigation to paths, rectangles, circles, text, or
  interactive handles. **Mathematical object** jumps directly to an exact
  semantic object, which is especially useful for dense field plots.
- **Find object**, or `/` from the focused SVG, searches exact identities,
  roles, and descriptions. Alt-arrow selects the nearest retained object in a
  spatial direction. **Hit area** changes empty-space near-hit tolerance without
  changing the underlying geometry.
- The inspector reports approximate pointer coordinates but exact retained
  coordinates for a selected object or stored plot sample.

The selected identity, zoom, pan, object filter, and exact inspector survive a
reactive redraw. With `preferencesKey`, the viewport, selection, search, filter,
and hit area also survive a later browser session. The SVG is linked to its
inspector and live status so a screen reader receives selection and viewport
changes without hearing every hover.

## Explore retained Scene3D views

A returned Scene3D value mounts an interactive WebGL viewport. If WebGL is
missing or lost, the same retained plan supplies a deterministic SVG fallback.

```rix edu
.Plugin.Load("scene3d");
axes := .scene3d.Axes({= length=2, id="basis" });
cloud := .scene3d.PointCloud(
    [[0,0,0],[1,0,1],[0,1,1],[-1,0,1],[0,-1,1]],
    {= radius=1/12, color="#7c3aed", id="samples", label="exact samples" }
);
camera := .scene3d.OrbitCamera([0,0,1/2], {= radius=5, height=2, turn=1/3 });
.scene3d.Scene([axes,cloud], {=
  camera=camera, metadata={= preferencesKey="exact-camera-guide" }
}) ;
```

- Drag to orbit. Shift-drag or right-drag to truck the camera. With touch, move
  two fingers together to truck and change their spacing to dolly. The wheel
  dollies; double-click resets.
- Arrow keys orbit; Shift-arrow keys truck. Plus and minus dolly, P changes
  projection, Home resets, and brackets select retained objects.
- The toolbar exposes the same operations. Use **Object type** to restrict
  traversal and **3D object** to go directly to any retained `pickid`; its
  option text and inspector report retained exact world coordinates.
- **Find object** searches retained IDs and descriptions; **Pick area** adjusts
  CPU hit tolerance. The scene `preferencesKey` persists camera, projection,
  selection, filter, search, and tolerance.
- Projected annotation buttons are displaced deterministically when possible
  instead of stacking at the same screen position. A dashed border identifies
  a displaced label; a highlighted crowded label means no free nearby slot was
  available. An annotation policy with `occlusion="hide"` or `"fade"` compares
  the retained anchor with projected mesh depth; `"show"` remains the default.

## Try the broader plot families

Every plot family lowers to ordinary Graphics and therefore receives the same
navigation, exact inspection, text alternative, and renderer choices.

```rix edu
.Plugin.Load("plot");
.Fragment([
    .Figure(
        .plot.Polar(t -> 2, [0,6], {= samples=41 }),
        "Polar curve"
    ),
    .Figure(
        .plot.Implicit((x,y) -> x^2+y^2-1, [-2,2], [-2,2], {=
            grid=[6,4], refineDepth=2, refinementBudget=2000, certifyIntervals=1
        }),
        "Adaptively refined implicit boundary"
    ),
    .Figure(
        .plot.Inequality((x,y) -> x+y, [-2,2], [-2,2], {=
            grid=[6,4], relation=:le, refineDepth=2,
            refinementBudget=2000, certifyIntervals=1
        }),
        "Certified whole-cell inequality classification"
    ),
    .Figure(
        .plot.HeatMap((x,y) -> x-y, [-2,2], [-2,2], {= grid=[10,6] }),
        "Heat map"
    ),
    .Figure(
        .plot.VectorField((x,y) -> [-y,x], [-2,2], [-2,2], {= grid=[8,6] }),
        "Vector field"
    )
]) ;
```

`Inequality` adds `relation=:le`, `:lt`, `:ge`, or `:gt`. `Contour` accepts
one or more `levels`. Scalar-field metadata records the exact domain, bounded
sampling grid, evidence status, stable hit identities, ambiguous cells, and
unresolved regions. A visible sampled boundary is never silently presented as
a proof.

For `Implicit`, `Contour`, and `Inequality`, `refineDepth` requests zero to six
quadtree levels and `refinementBudget` limits total processed cells to at most
50,000; an explicit budget must at least cover the base grid. Refinement
concentrates rational samples around mixed cells and
also detects a center whose classification differs from all four corners.
`certifyIntervals=1` additionally evaluates each cell as an exact rational box;
the function must support interval inputs. This can certify that an implicit
level is excluded from a whole cell, or that an entire inequality cell is
inside or outside. Interpolated boundary segments remain explicitly sampled.
Open **Text alternative** to read processed/leaf/subdivision counts, maximum
depth, budget stops, point evaluations, shared-cache hits, unique points, and
certified interval evaluations. `continuity=:continuous` lets an exact sampled
sign change prove boundary existence on an edge by the intermediate value
theorem, but the interpolated point and drawn segment remain sampled.
`discontinuityThreshold` adds a heuristic steep-cell warning and refinement
trigger; it is not a discontinuity proof. Contours accept `labelContours=1`
and `contourLabelLimit`. Heat maps accept `colorMode=:continuous` and
`hueRange=[240,0]` for value-driven HSL color.

Proof-bearing field records appear in the same text projection. For example,
an exact sign change plus `continuity=:continuous` is described as proof that a
level exists on the relevant edges while still labeling the drawn segment as a
sampled location.

## Work with a geometry construction

The geometry workbench is a Graphic plus a retained construction graph.

```rix edu
.Plugin.Load("geometry");
a := .geometry.Point(0,0);
b := .geometry.Point(6,0);
c := .geometry.Point(2,4);
circle := .geometry.Circumcircle(a,b,c);
bisector := .geometry.PerpendicularBisector(a,b);
.geometry.Draw([circle,bisector,a,b,c], {= view=[-1,-2,7,6], size=[560,480] }) ;
```

For `.geometry.Workbench(graph, options)`, RiX Web adds an object tree and
exact property inspector. Select tree entries with pointer or keyboard, move
declared free-point handles, undo and redo session moves, and export the
portable `rix.geometry.construction-record@1` JSON. Dependencies and unresolved
or degenerate constructions remain visible rather than becoming guessed
coordinates. The text alternative includes an ordered construction-dependency
section with each node's retained status.

The first canvas-authoring tool creates exact free points. Its positioned
action receives a rational mathematical coordinate, not a browser pixel. The
undo and redo actions operate on the same retained graph history.

```rix edu
.Plugin.Load("geometry");
view := [-4,-3,4,3]; size := [640,480];
$$graph := .geometry.ConstructionGraph([]);
actions := [
  .Graphics.Action({=
    id="geometry-author-point",target=$$graph,
    action=(current,position)->.geometry.AddPoint(
      current,.geometry.Point(position[1],position[2]),{= snap=1/4,maxNodes=32 }
    ),
    label="Add an exact free point",coordinateSystem={= view=view,size=size },
    children=[.Graphics.Rectangle([0,0],size,{= fill="transparent",stroke="none" })]
  }),
  .Graphics.Action({= id="geometry-author-undo",target=$$graph,
    action=current->.geometry.Undo(current),children=[] }),
  .Graphics.Action({= id="geometry-author-redo",target=$$graph,
    action=current->.geometry.Redo(current),children=[] })
];
$$authoring := .geometry.AuthoringWorkbench($graph,actions,{=
  view=view,size=size,snap=1/4,maxNodes=32
});
$authoring;
```

Click empty canvas space to add stable `p1`, `p2`, ... construction nodes. The
exact `snap` is applied after pixel-to-view conversion, `maxNodes` bounds the
construction, and a new placement clears the redo branch. Choose **Point
tool** to focus the surface; arrows move its cursor, Shift-arrows move by ten
pixels, and Enter or Space places a point. The workbench Undo/Redo controls
replay the retained `:create` events, so export contains the same history.

For programmatic or host-bound tools, the same graph supports `AddLine`,
`AddCircle`, `AddIntersection`, `AddTransform`, and `AddMeasurement`.
`ConstrainedDrag` projects exactly onto a retained line (or rejects invalid
motion), `DragMany` makes one atomic multi-point history event, and
`RepairSuggestions` reports non-destructive advice for degenerate intersections.
The web toolbar currently binds point placement; these additional kernel tools
are ready for selection-driven host controls. Imported derived records still
require the explicit constructor map listed by `replayRequires`.

## Play and compare a Timeline

Return the Timeline itself to get the browser transport.

```rix edu
Frame(x, origin) -> .Graphics.Graphic([300,120], [
    .Graphics.Path([[20,60],[280,60]], {= stroke="#cbd5e1" }),
    .Graphics.Circle([150+40*x,60], 10, {= fill="#7c3aed", hitId="moving-point" }),
    .Graphics.Text([15,20], @"exact state @{x}", {= size=13 })
]);

.Timeline.Sequence({=
    title="Exact motion",
    frameDurations=[1/2,1/2,1,1/2,1/2],
    markers=[{= frame=1,label="start" },{= frame=3,label="center" },{= frame=5,label="finish" }],
    preferencesKey="exact-motion-guide",
    transition={= mode=:crossfade,duration=1/5,properties=[:opacity,:position,:fill,:stroke] },
    entries=[{: Frame, [-2,-1,0,1,2]}]
}) ;
```

- Play or pause, step, scrub, change speed, loop, and restrict playback with
  the start and end fields.
- **Compare** can show the previous frame, any chosen frame, or onion-skin
  neighbors. Named markers provide direct navigation.
- Exact per-frame durations may replace a single total `duration`. A
  `preferencesKey` persists speed, loop, range, and comparison choices.
- **Record frame** collects exact retained snapshots; **Export recording**
  emits deterministic `rix.timeline-recording@1` JSON, and Clear resets it.
- Focus the timeline: Space plays or pauses, arrows step, Home and End seek to
  the active range, L toggles looping, M advances to the next marker, and R
  records the current exact frame.
- The exact-state inspector and full text track remain discrete even when a
  safe opacity, position, fill, or stroke presentation transition is declared.
  Diagnostics report appeared, disappeared, and kind-changed semantic objects.
  Reduced-motion preference disables animation without disabling stepping or
  playback.

## Read or hear the mathematical alternative

Every 2D Graphic includes a closed **Text alternative** disclosure. Open it for
the title, axes, domain and range, series summaries, exactness labels, concise
sample tables, semantic objects, marks, uncertainty, and unresolved regions.
Dense series show representative rows while retaining their complete semantic
plan. Finite data stays tabular.

Plots with retained two-dimensional series also show an **Audio trace**:

- Play or pause, step to previous or next sample, or drag Seek.
- Choose a single series or **Overview (sequential)**. RiX never mixes all
  series into an unintelligible chord.
- Restrict the sample domain, choose forward or reverse direction, and select
  0.5, 1, 2, or 4 times speed.
- Set trace tempo and low/high pitch directly. **Cues** chooses detailed,
  minimal boundary/crossing cues, or no event tones while leaving speech and
  text intact.
- Choose per-series timbres or sine, triangle, square, or sawtooth. Stereo
  position may be disabled, and Mute keeps every textual control usable.
- Focus the audio panel: Space plays or pauses, arrows step, Home and End seek,
  and M toggles mute.

Horizontal traversal controls time, vertical value controls pitch, and stereo
position follows the series. Restrained cues announce domain boundaries,
retained marks, intersections, axis crossings, and sampled extrema. Labels say
whether evidence is exact, a certified enclosure, approximate, unresolved, or
conjectural. A sampled sign change explicitly says that it is not a certified
root. Audio never starts automatically, and unsupported audio leaves the full
text alternative intact.

Plot option `audio={= tempo=..., frequency=[low,high], cuePalette={= ... } }`
sets renderer-neutral defaults. Cue palette keys are `exact`,
`certifiedEnclosure`, `approximate`, `unresolved`, `conjectural`, and `general`.
When `preferencesKey` is present, RiX Web separately persists the audio series,
range, speed, tempo, pitch, cues, timbre, direction, stereo, and mute choices.

:::challenge Build an accessible trace
Plot `x^2 - 2` on `[-2,2]` with at least 33 samples and a title. Navigate its
objects, open its text alternative, and use both stepping and playback in the
audio trace.

    .Plugin.Load("plot");
    .plot.Function(x -> x^2 - 2, [-2,2], {=
        samples=33, title="Square root evidence", xLabel="x", yLabel="x squared minus 2"
    }) ;
:::
