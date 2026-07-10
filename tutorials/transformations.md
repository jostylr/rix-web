---
number: 7
title: Transforming data
description: Pipes, generators, regexes, and embedded values.
---

## Orientation

Pipes transform a value through a readable series of operations. Generators create sequences, while regexes and strings add pattern-based transformation.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix
[1, 2, 3] |>> (x) -> x ^ 2
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Details cover callback locator/source parameters and the difference between mapping, filtering, and reducing.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Transforming data practice
Map an array of three values to their doubles.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
