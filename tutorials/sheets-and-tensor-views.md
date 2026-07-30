---
number: 12e
title: Sheets and tensor views
description: Navigate exact grids, canonical RiX addresses, and higher-dimensional planes.
---

# Sheets and tensor views

`.Sheet` stages an exact RiX value for spreadsheet-like display. It is a
portable output object, like a table or graphic, rather than a new expression
language. The familiar `C2` label belongs to the display; the corresponding RiX
expression remains `grid[2,3]`.

## Give the source a usable name

The default address base is the text `grid`. It does not create a variable and
it is not a property of the Sheet. Name the source `grid` when you want an
address copied from the view to evaluate directly:

```rix edu
grid := {:2x3: 1, 2, 3; 4, 5, 6};
gridView := .Sheet(.Bind(grid), {=
    title = "Exact matrix",
    address = "grid",
    axes = ["row", "column"]
});
gridView ;
```

Click a cell to select it. Arrow keys, Home, and End move the selection. The
location indicator combines a familiar display label with executable RiX
source—for example `C2 · grid[2,3]`. Enter edits the selected value; Enter
again commits it and returns focus to the grid.

The canonical address indexes the original tensor, not the Sheet output:

```rix edu
grid[2,3] ;
```

If the tensor is named `rates`, use `address="rates"`. The address base is
deliberately explicit because `.Sheet` receives a value and cannot reliably
recover the source-code name that produced it.

## Select a plane of a tensor

A sheet shows two tensor axes at once. Rank-three and higher values get a
selector for every hidden axis. This example starts on depth 2; change the
depth control above the grid to switch planes without changing the tensor:

```rix edu
cube := {:2x3x2:
    1, 2, 3; 4, 5, 6 ;;
    7, 8, 9; 10, 11, 12
};
cubeView := .Sheet(.Bind(cube), {=
    title = "Two matrix planes",
    address = "cube",
    axes = ["row", "column", "depth"],
    slice = [_, _, 2]
});
cubeView ;
```

Plane selection changes only the rendered snapshot. Every cell still carries
its full tensor index, so the top-right cell on depth 2 is `cube[1,3,2]`.

## Put different axes on the grid

`viewAxes` chooses the two visible axes. Hidden axes must have a fixed entry in
`slice`, while visible axes use `_`.

```rix edu
cube := {:2x3x2:
    1, 2, 3; 4, 5, 6 ;;
    7, 8, 9; 10, 11, 12
};
rowByDepth := .Sheet(.Bind(cube), {=
    title = "Column 2 across depths",
    address = "cube",
    axes = ["row", "column", "depth"],
    viewAxes = [1, 3],
    slice = [_, 2, _],
    columnLabels = :numbers
});
rowByDepth ;
```

Numeric column labels use `R2C2` as their unambiguous display address, while
the RiX address still contains the full tensor location.

## Choose snapshot or live editing

An ordinary Sheet records exact values and all selectable planes when it is
created. Selecting cells or planes does not mutate `grid` or `cube`:

```rix edu
grid := {:2x3: 1, 2, 3; 4, 5, 6};
snapshotGrid := .Sheet(grid);
snapshotGrid ;
```

Wrap a variable in `.Bind` to opt into a bidirectional widget:

```rix edu
editableGrid := .Sheet(.Bind(grid), {=
    title = "Editable exact matrix",
    axes = ["row", "column"]
});
editableGrid ;
```

Select a cell in the live view and press Enter to edit it. Press Enter again to
commit and return keyboard focus to the same highlighted cell, so the arrow
keys can continue from there. Double-click and F2 also begin editing. Values
remain exact, so `5 / 7`, `2:3`, and quoted strings are stored as RiX values
rather than browser text. The Binding captures the RiX cell behind `grid`; it
does not expose a DOM node or make spreadsheet display labels part of RiX.

:::challenge Make an address-aware sheet
Create a 2 by 2 tensor named `prices`, then display it as an editable Sheet with
the title `Exact prices`. Because `.Bind(prices)` knows the source name, its
canonical addresses use `prices[...]` by default.

    prices := {:2x2: 3 / 2, 2; 5 / 4, 7 / 3};
    .Sheet(.Bind(prices), {= title="Exact prices" })
:::

## Give every slot a formula

A FormulaSheet is a different entity from a live Binding view. Each coordinate
owns a deferred RiX formula, and `grid[...]` reads are evaluated together as a
dependency graph:

```rix edu
model := .FormulaSheet([
    [@{1}, @{ grid[1,1] + 1 }],
    [@{ grid[1,2] * 2 }, @{ grid[2,1] + 1 }]
]);
formulaView := .Sheet(model, {= title="Formula results" });
formulaView ;
```

The lower-right result is `5`. The FormulaSheet context is isolated from
unrelated tutorial variables and also provides `row`, `col`, and `index`.
Select a formula cell and press Enter to edit its RiX body. The editor shows
`grid[1,1] + 1`, without the surrounding deferred wrapper. Committing it starts
a new atomic evaluation epoch and refreshes every dependent result.

The same update is available programmatically:

```rix edu
model.SetFormula(1, 1, @{10});
.Sheet(model, {= title="Recalculated results" }) ;
```

The lower-right result is now `23`. A self-reference such as
`@{ grid[1,1] + 1 }` reports a cycle instead of reading the previously
committed value. Persistent `.rixcel` documents and assignment modes are the
next storage layer.

## Drive another live object

Every FormulaSheet has a reactive graph. `values.Graph()` exposes it so named
computations can depend on sheet coordinates and on one another. Reads made
while a deferred computation runs become graph edges; changing an input
recomputes only its transitive dependents in one atomic epoch.

This example uses three editable formulas. The first two determine a point and
their average. The third is both the point radius and a coefficient captured by
a locally defined `Scale` function:

```rix edu
values := .FormulaSheet([[@{120}, @{40}, @{8}]]);
graph := values.Graph();

average := graph.Derive("average", @{
    (grid[1,1] + grid[1,2]) / 2
});

functionvalue := graph.Derive("functionvalue", @{
    Scale(x) -> x * grid[1,3];
    Scale(grid[1,1])
});

.LiveView(values, @{
    .Fragment([
        .Heading(2, "Reactive point report"),
        .Sheet(source, {= title="Editable inputs", axes=["point", "value"] }),
        .Table(
            ["quantity", "value"],
            [
                ["Average of first and second", average],
                ["Scale(first), where Scale(x) = x * third", functionvalue]
            ]
        ),
        .Graphics.Graphic([260, 140], [
            .Graphics.Path(
                [[20, 120], [source[1,1], source[1,2]]],
                {= stroke="#4f46e5", width=3 }
            ),
            .Graphics.Circle(
                [source[1,1], source[1,2]],
                source[1,3],
                {= fill="#f97316" }
            )
        ])
    ])
}) ;
```

Edit any formula in the embedded grid. The sheet commit propagates through the
named graph nodes before LiveView redraws the whole document. Changing the
first value moves the point and refreshes both displayed calculations; changing
the third changes the radius and the function result without recomputing the
average.

This is also the intended foundation for direct manipulation: a future
draggable point can publish a semantic position event into a Binding or graph
source and use the same propagation path.
