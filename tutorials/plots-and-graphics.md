---
number: 12c
title: Plots and graphics
description: Plot exact polynomials and understand portable SVG scenes.
---

# Plots and graphics

A `.Graphic` is a portable two-dimensional scene. Its size and scene nodes are
part of the value; RiX Web turns that value into SVG. The plotting helper is
deliberately small: it produces an ordinary graphic made of paths, so it works
wherever the base graphic vocabulary works.

## Plot an exact polynomial

`.Plot.Polynomial` takes coefficients in descending-power order and a domain.
The coefficients and domain stay exact. Sampling to pixel coordinates happens
only when the plot is constructed for rendering.

~~~rix
plot := .Plot.Polynomial(
    [1, -2, -1],
    [-1, 4],
    {= size=[640, 360], stroke="#2563eb", width=3 }
)
plot
~~~

The helper chooses a useful vertical range and draws axes when zero is visible.
Change the domain first to see how the same polynomial gains a different view.

## A graphic has a coordinate space

`.Graphic([width, height], children)` establishes its own coordinate space.
In the SVG renderer the origin is at the upper-left: x increases to the right
and y increases downward. This small scene has one red path.

~~~rix
.Graphic(
    [240, 120],
    [
        .Draw.Path(
            [[15, 105], [120, 15], [225, 105]],
            {= stroke="#dc2626", width=3 }
        )
    ]
)
~~~

`.Draw.Path` connects points in order. It is a scene leaf, so it must appear
inside a `.Graphic` before a host has the size and coordinate system needed to
render it.

## Combine a plot with document output

The output constructors compose. A graphic can be the content of a figure, a
fragment, or a slide. The calculation remains separate from the document
structure around it.

~~~rix
parabola := .Plot.Polynomial([1, 0, -1], [-2, 2])

.Fragment([
    .Heading(2, "A portable plot"),
    .Figure(parabola, "The curve y = x squared minus 1", "fig:parabola")
])
~~~

For diagrams and custom illustrations, move on to **Drawing with .Draw**. It
introduces rectangles, circles, text, groups, transforms, and clipping.

:::challenge Change the view
Plot `x squared - 4` over the domain `[-3, 3]`. Give the curve a different
stroke color and set a size that is wider than it is tall.
:::
