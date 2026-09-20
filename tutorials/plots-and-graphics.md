---
number: 12c
title: Plots and graphics
description: Plot exact polynomials and understand portable SVG scenes.
---

A `.Graphics.Graphic` is a portable two-dimensional scene. Its size and scene nodes are
part of the value; RiX Web turns that value into SVG. The plotting helper is
deliberately small: it produces an ordinary graphic made of paths, so it works
wherever the base graphic vocabulary works.

## Plot an exact polynomial

Load the optional plot plugin once with `.Plugin.Load("plot")`. Its
`.plot.Polynomial` helper takes coefficients in descending-power order and a domain.
The coefficients and domain stay exact. Sampling to pixel coordinates happens
only when the plot is constructed for rendering.

```rix edu
.Plugin.Load("plot");
plot := .plot.Polynomial(
    [1, -2, -1],
    [-1, 4],
    {= size=[640, 360], stroke="#2563eb", width=3 }
);
plot ;
```

The helper chooses a useful vertical range and draws axes when zero is visible.
Change the domain first to see how the same polynomial gains a different view.

## A graphic has a coordinate space

`.Graphics.Graphic([width, height], children)` establishes its own coordinate space.
In the SVG renderer the origin is at the upper-left: x increases to the right
and y increases downward. This small scene has one red path.

```rix edu
.Graphics.Graphic(
    [240, 120],
    [
        .Graphics.Path(
            [[15, 105], [120, 15], [225, 105]],
            {= stroke="#dc2626", width=3 }
        )
    ]
) ;
```

`.Graphics.Path` connects points in order. It is a scene leaf, so it must appear
inside a `.Graphics.Graphic` before a host has the size and coordinate system needed to
render it.

## Combine a plot with document output

The output constructors compose. A graphic can be the content of a figure, a
fragment, or a slide. The calculation remains separate from the document
structure around it.

```rix edu
.Plugin.Load("plot");
parabola := .plot.Polynomial([1, 0, -1], [-2, 2]);

.Fragment([
    .Heading(2, "A portable plot"),
    .Figure(parabola, "The curve y = x squared minus 1", "fig:parabola")
]) ;
```

For diagrams and custom illustrations, move on to **Drawing with .Graphics**. It
introduces rectangles, circles, text, groups, transforms, and clipping.

:::challenge Change the view
Plot `x squared - 4` over the domain `[-3, 3]`. Give the curve a different
stroke color and set a size that is wider than it is tall.
:::

## Bound a data view without hiding what was omitted

Prerequisites: Arrays and exact fractions. This example runs entirely in the
browser and produces ordinary static SVG; it does not start a live data source.
Append batches explicitly, retaining a bounded tail with original sample IDs:

```rix edu
.Plugin.Load("plot");
state := .plot.Stream(4);
state := .plot.StreamAppend(state, [[1,1/3],[2,2/3],[3,1]]);
state := .plot.StreamAppend(state, [[4,4/3],[5,5/3],[6,2]]);
.Fragment([
  .plot.StreamLine(state, {= maxPoints=4,title="Last four exact samples" }),
  .plot.HeatMapData([[1,2,3],[4,5,6]], [0,3], [0,2],
    {= maxCells=2,title="Two exact mean blocks" })
]);
```

The line keeps samples 3–6 and discloses the two dropped samples. Heat-map
blocks retain exact means (3 and 9/2 here), minimum, maximum, count and source
bounds. Exact means do not reconstruct the individual cells. Likewise,
downsampling retains selected samples and extrema, not a proof about the
unsampled curve. The text alternative preserves these disclosures and IDs.

Input rows/cells are limited to 4096. Stream capacity is 2–4096;
`maxPoints` is 4–1024 and `maxCells` is 1–1024. Points must have exact numeric
coordinates with strictly increasing x; grids must be rectangular. For example,
`maxPoints=3` is rejected rather than silently enlarged. If a view is too large,
choose explicit smaller batches or a coarser bounded view.

The [plot tutorial](plugin-plot.html) continues with certified trajectories and
linked panels. The [Canvas tutorial](plugin-canvas.html) explains host-managed
render plans. Canvas caching and OffscreenCanvas workers are host integrations;
loading the plugin alone does not create a worker. Static SVG and text remain
available when those browser facilities are absent.
