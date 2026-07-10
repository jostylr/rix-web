---
number: 3c
title: Intervals
description: Exact bounds, uncertainty, and betweenness.
---

## Orientation

An interval keeps both endpoints in a single value, so uncertainty travels with the calculation. Interval arithmetic returns bounds rather than silently selecting one point.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix
a := 2:3
b := 4:5
a * b
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Use a three-part colon expression to ask whether a value lies between two bounds.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Intervals practice
Test whether 7 lies between 2 and 10, then test a value outside the interval.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
