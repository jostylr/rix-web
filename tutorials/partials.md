---
number: 5d
title: Partial application
description: Placeholders and arity-capped callables.
---

## Orientation

Partial functions leave a callable shape behind. Operator aliases and numbered placeholders make small callbacks readable, especially inside collection pipelines.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix edu
Double := @*(_1, 2);
Double(9) ;
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Arity caps control how much callback context a partial accepts when a pipe supplies locator and source values.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Partial application practice
Create a partial that subtracts its input from 10.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
