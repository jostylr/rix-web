---
number: 2e
title: Shaped values
description: Structured multidimensional exact data.
---

## Orientation

Shaped values store rectangular data without implying matrix or tensor algebra. The shape comes after `{:` and semicolons separate rows; shaped locators are one-based tuples.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix edu
grid := {:2x2: 1, 2; 3, 4 };
grid[2, 1] ;
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Try a slice such as `grid[1:2, 2]`; shaped views retain their selected axes. Matrix algebra requires an explicit `/Matrix/` header or `grid ~!: :Matrix`; mathematical vectors and tensors additionally need Frames from the linalg plugin.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Shaped values practice
Create a 2x2 identity-shaped value and retrieve its lower-right entry.
:::

## Choose the numerical representation deliberately

Prerequisites for the following examples: Arrays and exact fractions. Loading a
bundled plugin is supported in this browser; these examples need no files,
network access, or worker. A shaped value describes storage axes. Coordinate
Frames, tensor contractions, and sparse coordinate algebra are taught in the
[linear algebra plugin tutorial](plugin-linalg.html).

An exact sparse matrix stores only its nonzero entries. Here a thousand-coordinate
matrix applied to a thousand-coordinate vector produces one nonzero value, 2:

```rix edu
.Plugin.Load("linalg");
matrix = .linalg.SparseCoordinates([{= indices=[1,2], value=1/3 }], [1000,1000]);
vector = .linalg.SparseCoordinates([{= indices=[2], value=6 }], [1000]);
image = matrix.Apply(vector);
[image.Get([1]), image.SupportSize(), image.Verify()];
```

This does not allocate a million dense cells. `.Apply` and `.MatMul` require
finite, compatible axes and bounded support-pair work. Use sparse output directly;
dense expansion is a separate choice with its own size cost.

Float tensors instead use binary32 or binary64 approximate arithmetic. Every
multiply and accumulation is rounded to the selected format. Even an exactly
representable result retains the approximate label:

```rix edu
.Plugin.Load("float");
left = .float.Tensor([1,2,3,4], [2,2], :binary32);
right = .float.Tensor([5,6], [2], :binary32);
.float.ToShaped(.float.MatMul(left, right));
```

The displayed cells are Float values 17 and 39, not exact Integer cells. The
adapter limits tensors to 262144 cells, rank 16, and multiplication to 4194304
scalar products. Shapes and formats must agree. An oversized request fails;
it does not silently truncate or produce a certificate. See the
[Float tutorial](plugin-float.html) for rounding and diagnostics.

Private typed storage cannot be sent directly through the worker value protocol.
Convert it with `.float.ToShaped` before transfer and reconstruct it in the
receiving runtime. An ordinary shaped table is also a useful static alternative
when an interactive sheet host is unavailable.
