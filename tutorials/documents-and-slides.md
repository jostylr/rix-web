---
number: 12b
title: Documents and slides
description: Compose report fragments, captions, and portable slide decks.
---

# Documents and slides

Document output lets a calculation return a report-like structure instead of a
single final value. The same building blocks can form a notebook result, a
generated handout, or the content of a presentation slide.

## Compose a fragment explicitly

`.Fragment` holds an ordered sequence of output values. `.Heading` and
`.Paragraph` establish document structure; `.Figure` adds a caption and label
around any output value.

~~~rix
summary := .Table(
    ["quantity", "value"],
    [["side", 7], ["area", 49]]
)

.Fragment([
    .Heading(1, "Square report"),
    .Paragraph("All values in this report are exact."),
    .Figure(summary, "Measurements for one square", "fig:square")
])
~~~

The label is useful to a renderer or exporter even though RiX Web simply shows
the figure in place. Keep labels stable when you expect a document to grow.

## Write a compact document template

For text-heavy reports, `@"""..."""` makes a `Fragment` directly. Blank lines
separate document blocks. Prefix a block with `h1:` through `h6:` for a heading
or `fig:` / `table:` for a captioned standalone value. `@{...}` evaluates now
and inserts the resulting value.

~~~rix
values := .Table(
    ["x", "x squared"],
    [[1, 1], [2, 4], [3, 9]]
)

@"""
h1: Exact square values

The square of 3 is @{3 ^ 2}.

table: Selected values #tbl:squares
    @{values}
"""
~~~

Interpolation here is different from a deferred block such as `@{; ...}`.
The template evaluates the interpolation immediately and stores the resulting
text or output value in the document.

## Wrap a graphic as a figure

Figures are not limited to tables. This creates a small plot, then gives it a
caption and a stable label that a future document renderer can use for cross
references.

~~~rix
curve := .Plot.Polynomial([1, -2, -1], [-1, 4])
.Figure(curve, "Graph of x squared minus 2x minus 1", "fig:curve")
~~~

## Build a deck one slide at a time

`.Slide` attaches a title and optional metadata to one output value. `.Slides`
preserves the order of those slides. RiX Web renders the current deck as a
series of clearly separated slide sections; other hosts can add navigation or
export without changing the RiX source.

~~~rix
deck := .Slides(
    [
        .Slide(
            .Fragment([
                .Heading(1, "Exact data"),
                .Paragraph("A table remains structured data.")
            ]),
            "Data"
        ),
        .Slide(
            .Fragment([
                .Heading(1, "Exact graph"),
                .Plot.Polynomial([1, -2, -1], [-1, 4])
            ]),
            "Graph"
        )
    ],
    "Output building blocks"
)
deck
~~~

:::challenge A two-part note
Create a `.Fragment` with a level-one heading and a paragraph. Then add a
small table as its third child.
:::
