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
model := .FormulaSheet({:2x2:
    @{1}, @{ grid[1,1] + 1 };
    @{ grid[1,2] * 2 }, @{ grid[2,1] + 1 }
}, {= id="tutorial-model" });
formulaView := .Sheet(model, {= title="Formula results" });
formulaView ;
```

The lower-right result is `5`. The FormulaSheet context is isolated from
unrelated tutorial variables and also provides `row`, `col`, and `index`.
Select a formula cell and press Enter to edit its RiX body. The editor shows
`grid[1,1] + 1`, without the surrounding deferred wrapper. Committing it starts
a new atomic evaluation epoch and refreshes every dependent result.

The same source-backed update is available programmatically:

```rix edu
model.SetSource(1, 1, "10", ":=");
.Sheet(model, {= title="Recalculated results" }) ;
```

The sheet recompiles the stored source into its own deferred formula; the
browser does not own that compiler step. `model.Slot(1,1)` retains the stable
ID `tutorial-model:slot:1:1`, authoritative source `"10"`, and assignment mode
`":="`. The lower-right result is now `23`. A self-reference such as
`@{ grid[1,1] + 1 }` reports a cycle instead of reading the previously
committed value. Assignment-mode execution semantics remain a later milestone;
the source and selected mode are already stored separately.

## Save and rebuild a RiXCel document

`.RiXCelExport` produces versioned JSON from authoritative formula source.
`.RiXCelImport` validates that JSON, recompiles every formula in a fresh
FormulaSheet context, and rebuilds values and dependencies through an initial
epoch:

```rix edu
book := .FormulaSheet({:2x2:
    @{10}, @{ grid[1,1] * 2 };
    @{3}, @{ grid[1,2] + grid[2,1] }
}, {= id="tutorial-budget" });

saved := .RiXCelExport(book);
loaded := .RiXCelImport(saved);

.Sheet(loaded, {= title="Restored from RiXCel JSON" }) ;
```

The restored lower-right value is `23`. The file stores the dense rank-N
shape, stable IDs, formula bodies, assignment modes, and JSON-safe view
metadata. It does not trust or persist compiled IR, values, dependencies, or
diagnostics. A standalone host can save the `saved` string with a `.rixcel`
extension; browser file-open/save controls remain a later editor milestone.

## Define reactive bindings

`.ReactiveGraph`, `Source`, and `Derive` remain the foundational API. Ordinary
RiX uses adjacent dollar signs as its concise interface: `$$name := ...`
declares a reactive cell, `$name` records a dependency, and plain `name` reads
the current value without recording one. `${ ... }` installs the declarations
as one atomic transaction:

```rix edu
${
    $$source1 := 2;
    $$source2 := 3;
    $$target1 := $source1 + $source2;
    $$target2 := $target1 * 4;
    $$target3 := $target2 + $source1
};
[target1, target2] ;
```

`$name := ...` replaces that cell's deferred definition while preserving its
identity. A transaction stages every change, recomputes the affected closure
once, and rolls everything back if it finds a cycle:

```rix edu
${
    $source1 := 10;
    $source2 := 3
};
[target1, target2, target3] ;
```

The result is `[13, 52, 62]`. `$$alias := $$source1` would bind another name to
the same reactive cell. Redeclaring an existing `$$name` is an error. Bare `$`
and `$$` keep their callable-self meanings; adjacency to any identifier selects
the reactive forms. An uppercase callable declaration is a reactive function:

```rix edu
$$Scale := x -> x * $source1;
[Scale(3), $Scale(3)] ;
```

`Scale(3)` calls the current definition without tracking its identity;
`$Scale(3)` is a tracked call. `$Scale := x -> ...` replaces the reactive
function definition while preserving its identity and downstream dependents.

## Observe a reactive document

Every FormulaSheet has a reactive graph. `$values[1,2]` selects and tracks that
exact cell, so named computations can depend on sheet coordinates without
exposing internal graph-node names. Reads made while a deferred computation
runs become graph edges; changing an input recomputes only its transitive
dependents in one atomic epoch.

This example uses three editable formulas. The first two determine a point and
their average. The third is both the point radius and a coefficient captured by
a locally defined `Scale` function. `$$frag` makes the complete Fragment a
reactive value, and the final `$frag` tells RiX Web to observe and render it:

```rix edu
values := .FormulaSheet({:1x3: @{120}, @{40}, @{8}});

$$average := ($values[1,1] + $values[1,2]) / 2;
$$functionvalue := {;
    Scale(x) -> x * $values[1,3];
    Scale($values[1,1])
};

$$frag := .Fragment([
    .Heading(2, "Reactive point report"),
    .Sheet($values, {= title="Editable inputs", axes=["point", "value"] }),
    .Table(
        ["quantity", "value"],
        [
            ["Average of first and second", $average],
            ["Scale(first), where Scale(x) = x * third", $functionvalue]
        ]
    ),
    .Graphics.Graphic([260, 140], [
        .Graphics.Path(
            [[20, 120], [$values[1,1], $values[1,2]]],
            {= stroke="#4f46e5", width=3 }
        ),
        .Graphics.Circle(
            [$values[1,1], $values[1,2]],
            $values[1,3],
            {= fill="#f97316" }
        )
    ])
]);

$frag ;
```

Edit any formula in the embedded grid. The sheet commit propagates through the
named graph nodes before RiX Web redraws the observed Fragment. Changing the
first value moves the point and refreshes both displayed calculations; changing
the third changes the radius and the function result without recomputing the
average.

`values` is already a FormulaSheet entity. In `.Sheet($values, ...)`, the dollar
does not convert it into a different object: it records a dependency on every
slot so the enclosing `$$frag` is rebuilt after any sheet edit. Plain
`.Sheet(values, ...)` uses the same current sheet but adds no whole-sheet edge.
Use `$values[1,2]` when a dependent needs only one coordinate.

This is also the intended foundation for direct manipulation: a future
draggable point can publish a semantic position event into a Binding or graph
source and use the same propagation path.
