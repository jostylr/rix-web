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
    {= samples=41, title="Cubic inspection", xLabel="x", yLabel="y" }
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
- The inspector reports approximate pointer coordinates but exact retained
  coordinates for a selected object or stored plot sample.

The selected identity, zoom, pan, object filter, and exact inspector survive a
reactive redraw. The SVG is linked to its inspector and live status so a screen
reader receives selection and viewport changes without hearing every hover.

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
.scene3d.Scene([axes,cloud], {= camera=camera }) ;
```

- Drag to orbit. Shift-drag or right-drag to truck the camera. With touch, move
  two fingers together to truck and change their spacing to dolly. The wheel
  dollies; double-click resets.
- Arrow keys orbit; Shift-arrow keys truck. Plus and minus dolly, P changes
  projection, Home resets, and brackets select retained objects.
- The toolbar exposes the same operations. Use **Object type** to restrict
  traversal and **3D object** to go directly to any retained `pickid`; its
  option text and inspector report retained exact world coordinates.
- Projected annotation buttons are displaced deterministically when possible
  instead of stacking at the same screen position. A dashed border identifies
  a displaced label; a highlighted crowded label means no free nearby slot was
  available.

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
        .plot.Implicit((x,y) -> x^2+y^2-1, [-2,2], [-2,2], {= grid=[12,8] }),
        "Implicit boundary"
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
coordinates.

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
    duration=4,
    entries=[{: Frame, [-2,-1,0,1,2]}]
}) ;
```

- Play or pause, step, scrub, change speed, loop, and restrict playback with
  the start and end fields.
- **Compare previous** displays the prior frame beside the current one.
- Focus the timeline: Space plays or pauses, arrows step, Home and End seek to
  the active range, and L toggles looping.
- The exact-state inspector and full text track remain discrete even when a
  safe visual crossfade is declared. Reduced-motion preference disables that
  crossfade without disabling stepping or playback.

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

:::challenge Build an accessible trace
Plot `x^2 - 2` on `[-2,2]` with at least 33 samples and a title. Navigate its
objects, open its text alternative, and use both stepping and playback in the
audio trace.

    .Plugin.Load("plot");
    .plot.Function(x -> x^2 - 2, [-2,2], {=
        samples=33, title="Square root evidence", xLabel="x", yLabel="x squared minus 2"
    }) ;
:::
