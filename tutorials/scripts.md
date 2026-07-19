---
number: 10
title: Scripts and extensions
description: RiX modules, host boundaries, and language extension.
---

## Orientation

RiX scripts can declare interfaces, import other RiX files, and run inside capability frames. JavaScript modules and language extensions are host-level features with explicit trust boundaries.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix edu
## This lesson discusses host-facing features
1 + 1 ;
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

RatCalc intentionally does not execute arbitrary local JavaScript modules in the browser.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Scripts and extensions practice
Describe the inputs and outputs your first RiX script would need, then prototype its core expression here.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
