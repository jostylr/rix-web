---
number: 4c
title: Properties and metadata
description: Receiver-first methods and value annotations.
---

## Orientation

Indexes select stored values; metadata and methods describe how a value behaves. Receiver-first method syntax keeps the subject of an operation visible.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix edu
values := [1, 2];
values.Push(3) ;
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Use `.key` for stable object identity and reserve bang methods for deliberately mutable operations.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Properties and metadata practice
Create an array, make a pushed copy, and confirm the original remains unchanged.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
