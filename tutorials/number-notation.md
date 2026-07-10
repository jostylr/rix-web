---
number: 3b
title: Number notation
description: Repeating decimals, bases, and continued fractions.
---

## Orientation

RiX has exact syntaxes for forms that are often approximate elsewhere: repeating decimals, mixed numbers, continued fractions, and alternate bases.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix
a := 0.#3
b := 1..2/3
a + b
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

A repeating marker describes a rational pattern, not a floating-point approximation.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Number notation practice
Evaluate `3.~7~15~1` and compare it with `355 / 113`.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
