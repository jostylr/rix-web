---
number: 2e
title: Tensors
description: Structured multidimensional exact data.
---

## Orientation

Tensors describe rectangular data. The shape comes after `{:` and semicolons separate rows; tensor locators are one-based tuples.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix
grid := {:2x2: 1, 2; 3, 4 }
grid[2, 1]
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Try a slice such as `grid[1:2, 2]`; tensor views preserve their shape.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Tensors practice
Create a 2x2 identity tensor and retrieve its lower-right entry.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
