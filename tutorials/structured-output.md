---
number: 12
title: Structured output: algebra, layouts, and graphics
description: Build portable tables, mathematical layouts, document fragments, and SVG graphics.
---

# Structured output

RiX can return more than a number or a string. Its output values retain their
meaning: a table stays a table, a ruled layout stays a layout, and a graphic is
a small scene made of paths. The CLI shows a useful text form; RiX Web and the
notebook can render the same value as HTML and SVG.

## Synthetic division from algebra

`.Algebra.SyntheticDivision` is a presentation helper. It performs the exact
arithmetic and returns a `Grid` with the familiar vertical and horizontal rules.

~~~rix
.Algebra.SyntheticDivision(1, [2, -6, 2, -1])
~~~

The bottom row is the quotient coefficients `[2, -4, -2]` and remainder `-3`.
The value is still a portable `Grid`, not a special browser widget.

## The same layout from basic primitives

The helper is convenience, not a unique kind of output. Here is the same
synthetic-division layout built directly. `_` is an intentionally blank cell;
the rule maps say where the vertical divider and bottom rule belong.

~~~rix
manual := .Grid(
    [_, _, _, _, _],
    [
        [1, 2, -6, 2, -1],
        [_, _, 2, -4, -2],
        [_, 2, -4, -2, -3]
    ],
    [
        {= kind=:vertical, afterColumn=1 },
        {= kind=:horizontal, aboveRow=3 }
    ]
)
manual
~~~

This pattern works for long division, augmented matrices, determinant layouts,
and many textbook constructions. A domain plugin can produce the convenient
form, while the renderer only needs to understand `Grid`.

## Tables keep their data

Tables have labeled columns and rows. Their content can be displayed in the
web app, exported later, or included in a document without turning it into HTML
first.

~~~rix
values := .Table(
    ["x", "p(x)"],
    [[-1, 2], [0, -1], [1, -2], [2, -1], [3, 2]]
)
values
~~~

## Plot a polynomial as SVG

The standard `Plot` collection currently provides a small portable polynomial
plotter. It samples for rendering and returns a `Graphic` composed of `Path`
nodes. Exact coefficients and domain bounds remain the input; pixel coordinates
are an intentional rendering approximation.

~~~rix
plot := .Plot.Polynomial(
    [1, -2, -1],
    [-1, 4],
    {= size=[640, 360], stroke="#2563eb" }
)
plot
~~~

You can also construct a scene directly when a plugin would be excessive:

~~~rix
.Graphic(
    [240, 120],
    [
        .Path([[15, 105], [120, 15], [225, 105]],
              {= stroke="#dc2626", width=3 })
    ]
)
~~~

## Compose a scene from basic primitives

`Group` provides scene hierarchy and shared styling. `Transform2D` applies a
translation, rotation, and/or scale without changing its children. `Rectangle`,
`Circle`, and `TextMark` are portable shape nodes; `Clip` limits a subtree to
`[x, y, width, height]`. All coordinates are in the graphic’s own coordinate
space, with the origin at the upper-left in the SVG renderer.

~~~rix
.Graphic([360, 220], [
    .Rectangle([0, 0], [360, 220],
               {= fill="#f8fafc", stroke="#cbd5e1" }),
    .Clip([
        .Transform2D([
            .Group([
                .Circle([80, 80], 45,
                        {= fill="#bfdbfe", stroke="#2563eb", width=2 }),
                .Rectangle([60, 60], [80, 40],
                           {= fill="#fde68a", stroke="#d97706", width=2 }),
                .TextMark([100, 85], "RiX",
                          {= anchor=:middle, size=18, weight="bold" })
            ], {= opacity=1 })
        ], {= translate=[80, 15], rotate=18, origin=[100, 85] })
    ], [20, 20, 320, 160])
])
~~~

This small vocabulary is intended to be the common target for geometry,
diagram, and plotting plugins. A plugin can return a nested scene; hosts only
need to render the standardized nodes.

## Quick document templates

Use `@"..."` when you only need interpolated text. `@"""..."""` produces a
`Fragment`: blank lines separate blocks, `h1:` through `h6:` create headings,
and `fig:` or `table:` wrap a standalone `@{...}` value with a caption and
optional `#label`.

~~~rix
values := .Table(
    ["x", "p(x)"],
    [[-1, 2], [0, -1], [1, -2], [2, -1], [3, 2]]
)
plot := .Plot.Polynomial([1, -2, -1], [-1, 4])

report := @"""
h1: Polynomial report

The value at x = 3 is @{3^2 - 2*3 - 1}.

table: Selected values #tbl:values
    @{values}

fig: Graph of p(x) #fig:polynomial
    @{plot}
"""
report
~~~

`@{...}` inside a template evaluates now and inserts the resulting value. That
is distinct from the existing deferred-code form `@{; ...}`: templates insert
computed content, while deferred blocks retain code to run later.

## Slides are sequential fragments

`.Slide` attaches title and optional metadata to one output value; `.Slides`
holds an ordered deck. The current web and notebook renderers show the deck as
clearly separated slides, while the CLI prints each slide in order. Future
renderers can use this same structure for presenter navigation, animated GIFs,
or PowerPoint without asking an author to rewrite the content.

~~~rix
deck := .Slides(
    [
        .Slide(
            .Fragment([
                .Heading(1, "Synthetic division"),
                .Algebra.SyntheticDivision(1, [2, -6, 2, -1])
            ]),
            "Division"
        ),
        .Slide(
            .Fragment([
                .Heading(1, "Polynomial graph"),
                .Plot.Polynomial([1, -2, -1], [-1, 4])
            ]),
            "Graph"
        )
    ],
    "Output building blocks"
)
deck
~~~
