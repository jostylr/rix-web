---
number: 4b
title: Destructuring
description: Pull structured values into named bindings.
---

## Orientation

Destructuring reads a structured source once and binds selected pieces outward. Arrays, tuples, maps, and tensors can all be patterns.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix
[first, second, ...rest] := [1, 2, 3, 4]
rest
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

A map pattern can rename a source key, and missing simple entries become holes.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Destructuring practice
Destructure a map with keys `x` and `y` into two differently named variables.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
