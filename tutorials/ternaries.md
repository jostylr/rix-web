---
number: 6a
title: Ternaries and cases
description: Choose values without losing expression flow.
---

## Orientation

The `??` and `?:` pair reads as condition, true branch, false branch. Each branch can be an expression or a code block.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix
x := 7
x % 2 == 0 ?? "even" ?: "odd"
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Case containers are useful when several guarded alternatives need to stay together.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Ternaries and cases practice
Return the larger of two values with a ternary.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
