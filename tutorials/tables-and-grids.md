---
number: 12a
title: Tables and mathematical grids
description: Present labeled data and textbook-style ruled layouts.
---

# Tables and mathematical grids

Tables and grids both arrange values in rows and columns, but they communicate
different things. A table describes labeled data. A grid describes a piece of
mathematical notation where blank cells and dividing rules matter.

## Start with a table

Give `.Table` an array of column labels, then an array of rows. Every row must
have one cell for each column. The cells stay as RiX values, so fractions remain
exact instead of being preformatted strings.

```rix edu
samples := .Table(
    ["x", "p(x)"],
    [[-1, 2], [0, -1], [1, -2], [2, -1], [3, 2]]
);
samples ;
```

The web renderer supplies the visual table. The semantic data is the labels and
rows you passed in, which makes it possible for another host to display, export,
or inspect it differently.

## Make the columns self-describing

A column may also be a map. `id` is a stable machine-oriented name while
`label` is the text shown to a reader. This is useful when an output will later
be collected by another tool.

```rix edu
ledger := .Table(
    [
        {= id="item", label="Item" },
        {= id="amount", label="Exact amount" }
    ],
    [["flour", 3 / 2], ["water", 5 / 4], ["yeast", 1 / 16]]
);
ledger ;
```

## Use a grid when the rules mean something

`.Grid` accepts column placeholders, rows, and a list of rules. `_` is an
intentionally blank cell. A `vertical` rule after column one and a `horizontal`
rule above row three form the familiar synthetic-division layout.

```rix edu
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
);
manual ;
```

The renderer only needs to understand a general grid and its rules. The
mathematical convention belongs in the data, rather than in a special browser
component.

## Prefer a domain helper when one exists

The same layout is available as `.Algebra.SyntheticDivision`. It performs the
exact arithmetic as well as constructing the grid. The bottom row contains the
quotient coefficients followed by the remainder.

```rix edu
.Algebra.SyntheticDivision(1, [2, -6, 2, -1]) ;
```

Helpers and primitives work together: use a helper for a well-known notation,
and use `.Grid` when your layout is novel or needs a different arrangement.

:::challenge A small value table
Create a table with columns `n` and `n squared`. Include rows for 1, 2, 3, and
4. Keep the numeric cells as numbers rather than quoted strings.
:::
