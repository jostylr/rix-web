---
number: 7d
title: Regexes and strings
description: Pattern literals and text transformation.
---

## Orientation

Regex literals support matching modes, while strings support indexes, slices, and methods. Keep matching and replacement logic as small testable expressions.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix edu
text := "RatCalc";
text[1:3];
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Regex match objects can be passed through a pipeline when a pattern needs more than a yes/no answer.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Regexes and strings practice
Create a string and retrieve its final character with a negative index.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
