---
number: 7a
title: Pipes
description: Map, filter, reduce, and callback context.
---

## Orientation

A plain pipe feeds a value into a callable. Collection pipes map, filter, reduce, reverse, sort, and quantify while preserving the collection shape when possible.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix
[1, 2, 3] |>> (x) -> x * 2
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Callback parameters can receive the value, its locator, and its source collection.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Pipes practice
Filter an array to retain values greater than 2.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
