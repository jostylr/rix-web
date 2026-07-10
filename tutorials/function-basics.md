---
number: 5a
title: Define and call
description: Functions, lambdas, rest parameters, and spread.
---

## Orientation

A function definition names parameters and an expression body. Lambdas use the same arrow form without a name; rest parameters and spreads handle variable arity.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix
Add(x, y) -> x + y
Add(3, 4)
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Lowercase names are values, while uppercase names can consume adjacent arguments as callable application.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Define and call practice
Define `Scale(value, factor)` and call it with two exact fractions.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
