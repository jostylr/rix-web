---
number: 6b
title: Brace containers
description: Blocks, sigils, loops, and break blocks.
---

## Orientation

Braces create blocks and sigilled containers: `{=`, `{|`, `{:`, `{;`, `{@`, and others. Spaces after a sigil are significant in RiX syntax.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix
{; x := 2; y := 3; x * y }
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Loop headers separate initialization, condition, body, update, and after slots with semicolons.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Brace containers practice
Make a block that binds two values and returns their product.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
