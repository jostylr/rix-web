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

```rix edu
summary := .Table(
    ["quantity", "value"],
    [["side", 7], ["area", 49]]
);

.Fragment([
    .Heading(1, "Square report"),
    .Paragraph("All values in this report are exact."),
    .Figure(summary, "Measurements for one square", "fig:square")
]) ;
```

The label is useful to a renderer or exporter even though RiX Web simply shows
the figure in place. Keep labels stable when you expect a document to grow.

## Write a compact document template

For text-heavy reports, `@"""..."""` makes a `Fragment` directly. Blank lines
separate document blocks. Prefix a block with `h1:` through `h6:` for a heading
or `fig:` / `table:` for a captioned standalone value. `@{...}` evaluates now
and inserts the resulting value.

```rix edu
values := .Table(
    ["x", "x squared"],
    [[1, 1], [2, 4], [3, 9]]
);

@"""
h1: Exact square values

The square of 3 is @{3 ^ 2}.

table: Selected values #tbl:squares
    @{values}
""" ;
```

Interpolation here is different from a deferred block such as `@{; ...}`.
The template evaluates the interpolation immediately and stores the resulting
text or output value in the document.

## Keep inline meaning and document blocks

Paragraph children can now be semantic inline values rather than values that a
renderer flattens to text. Sections, quotations, callouts, code blocks, display
math, and nested lists are all portable records. The browser chooses HTML
elements; a terminal keeps an honest text fallback.

```rix edu
.Section({=
    level=1,
    id="exactness",
    title=[.Text("Exact "), .Math({= source="x^2 = 2" })],
    children=[
        .Paragraph([
            .Text("Use "), .Emphasis("exact"), .Text(" values and "),
            .Strong("keep the proof"), .Text(" in "), .Code(".Math"),
            .Text("."), .LineBreak(), .Text("The source remains portable.")
        ]),
        .Callout({=
            variant=:note,
            title="Renderer policy",
            children=[.Paragraph("The record chooses meaning; the host chooses presentation.")]
        }),
        .Quote({=
            children=[.Paragraph("Truth is ever to be found in simplicity.")],
            attribution="Isaac Newton"
        }),
        .CodeBlock({= language="rix", code="next := (x + 2 / x) / 2;" }),
        .MathBlock({= source="x_{n+1} = (x_n + 2/x_n) / 2", alt="Newton update" }),
        .List({=
            ordered=1,
            items=[
                .ListItem(.Paragraph("Start with a certified interval.")),
                .ListItem(.Paragraph("Record the exact refinement."))
            ]
        })
    ]
}) ;
```

`Image`, `Audio`, and `Video` wrap an `.Asset` reference rather than pretending
that a vector `.Graphic` is a photograph or media file. Image alternative text
is required; audio and video retain an optional transcript that export hosts
can require. Asset resolution stays with the host, so a RiX record never opens
a file or fetches a URL by itself.

## Wrap a graphic as a figure

Figures are not limited to tables. This creates a small plot, then gives it a
caption and a stable label that a future document renderer can use for cross
references.

```rix edu
.Plugin.Load("plot");
curve := .plot.Polynomial([1, -2, -1], [-1, 4]);
.Figure(curve, "Graph of x squared minus 2x minus 1", "fig:curve") ;
```

## Build a deck one slide at a time

`.Slide` attaches a title and optional metadata to one output value. `.Slides`
preserves the order of those slides. RiX Web renders the current deck as a
series of clearly separated slide sections; other hosts can add navigation or
export without changing the RiX source.

```rix edu
.Plugin.Load("plot");
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
                .plot.Polynomial([1, -2, -1], [-1, 4])
            ]),
            "Graph"
        )
    ],
    "Output building blocks"
);
deck ;
```

:::challenge A two-part note
Create a `.Fragment` with a level-one heading and a paragraph. Then add a
small table as its third child.
:::
