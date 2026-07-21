---
number: 12
title: Structured output
description: Keep tables, documents, slides, and graphics meaningful across RiX hosts.
---

# Structured output

Most expressions return a number, string, array, or map. An output value carries
an additional promise about how it should be presented. A table remains a table,
a plotted curve remains a graphic, and a report remains a sequence of document
parts. That lets the CLI, RiX Web, and a notebook choose an appropriate renderer
without asking your calculation to produce HTML or SVG itself.

## Output is still a value

Create an output value with a system constructor, bind it like any other value,
then return it. RiX Web renders this small table as a table; a text-only host can
still show the same headers and rows faithfully.

```rix edu
results := .Table(
    ["measurement", "exact value"],
    [["width", 3 / 2], ["height", 7 / 4], ["area", 21 / 8]]
);
results ;
```

The value is portable data, not a browser widget. Keep the calculation that
produces it separate from the choice to show it here, in a report, or in a
future export.

## Choose the shape that matches the meaning

- Use `.Table` for labeled rows and columns of data.
- Use `.Grid` when spacing and rules are part of mathematical notation.
- Use `.Fragment`, `.Heading`, `.Paragraph`, and `.Figure` for documents.
- Use `.Slide` and `.Slides` for an ordered presentation.
- Use core `.Graphics` plus optional `.plot` and `.draw` plugins for portable two-dimensional scenes.

The following lessons give each of these forms enough room to explore. Start
with tables and grids if your output is primarily data; go straight to
**Drawing with .Graphics and .draw** when you want to construct a diagram from shapes.

## One calculation, several destinations

This polynomial is ordinary exact RiX data. The next lessons will use the same
coefficient array both in a table and in a graphic.

```rix edu
coefficients := [1, -2, -1];
valueAtThree := 3 ^ 2 - 2 * 3 - 1;
[coefficients, valueAtThree] ;
```

:::challenge Pick an output form
Create a small `.Table` with two columns: a label and an exact value. Use any
three values from an earlier tutorial.
:::
