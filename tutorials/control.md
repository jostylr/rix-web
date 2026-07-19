---
number: 6
title: Control and deferred work
description: Ternaries, braces, loops, and deferred execution.
---

## Orientation

Control in RiX remains expression-oriented. Ternaries choose values, brace sigils organize blocks and containers, and deferred forms postpone work.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix edu
x := -4;
x > 0 ?? x ?: -x ;
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Use the detail pages before relying on loop headers or caller-scope dynamic evaluation.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Control and deferred work practice
Write a ternary that labels a value as positive or non-positive.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
