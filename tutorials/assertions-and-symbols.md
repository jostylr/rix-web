---
number: 9b
title: Assertions and symbolic specs
description: Constraints and symbolic construction.
---

## Orientation

Assertions state conditions that must hold; symbolic specs preserve an expression structure for consumers such as polynomial tooling. Keep assertions small and diagnostic.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix
3 < 5
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Symbolic specification and solver forms are advanced features; use them after functions and types feel familiar.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Assertions and symbolic specs practice
Write a comparison that should pass, then change it to one that should fail and inspect the diagnostic.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
