---
number: 6c
title: Deferred execution
description: Delay and evaluate code deliberately.
---

## Orientation

Deferred values keep code for later. Dynamic evaluation and `@@` can intentionally use the caller's scope, so they should be introduced only when ordinary functions are not enough.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix
{; value := 3; value + 1 }
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

RatCalc can evaluate ordinary blocks; script-level dynamic evaluation is best explored after learning scope.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Deferred execution practice
Write a block whose final expression uses a name bound earlier in the block.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
