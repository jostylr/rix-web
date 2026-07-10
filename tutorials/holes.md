---
number: 3d
title: Nulls and holes
description: Undefined values, defaults, and coalescing.
---

## Orientation

A hole means a missing value; it is distinct from the explicit null value `_`. Hole coalescing gives a fallback without treating every false-like value as absent.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix
values := [1]
values[2] ?| 99
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Holes are useful in partial collections, optional call arguments, and soft matching.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Nulls and holes practice
Use `?|` to supply a default for a missing map or array lookup.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
