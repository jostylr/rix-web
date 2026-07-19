---
number: 4
title: Binding and patterns
description: Cells, assignments, destructuring, and metadata.
---

## Orientation

A RiX binding names a cell. That makes aliasing and mutation explicit rather than accidental, and destructuring applies the same assignment choices to structured data.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix edu
x := 5;
y = x;
x += 1;
y ;
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

The next pages separate cell identity, patterns, and metadata so each rule stays visible.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Binding and patterns practice
Create one alias and one fresh copy of the same value, then update the original.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
