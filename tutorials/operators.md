---
number: 3a
title: Operators and precedence
description: Arithmetic, comparisons, and implicit application.
---

## Orientation

Precedence follows the usual mathematical order, while adjacent terms can mean multiplication or callable application. Parentheses are the clearest way to state a grouping.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix edu
2 + 3 * 4 ^ 2 ;
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Try `3(2 + 1)` for implicit multiplication and define an uppercase function to see adjacent application.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Operators and precedence practice
Define `Double(x)` and compare `Double 3 + 1` with `Double(3 + 1)`.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
