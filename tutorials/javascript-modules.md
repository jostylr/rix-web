---
number: 10b
title: JavaScript modules
description: Host modules and the browser trust boundary.
---

## Orientation

JavaScript imports cross a host trust boundary. RiX can model module values and calls, but RatCalc deliberately previews rather than executes selected browser modules.

JavaScript module execution depends on a trusted host; the browser examples here illustrate the boundary rather than loading a local file.

## A worked example

```rix edu
## JavaScript module execution is intentionally disabled in RatCalc
1 + 1 ;
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

This protects a calculator page from silently running code selected from a local file.

Use the source shape to plan a module interface, then run it only in a host that grants that capability.

:::challenge JavaScript modules practice
Use a RiX map to sketch the data a future JavaScript module would return.
:::

## Keep going

Continue with [RiX scripts](rix-scripts.html) for language-native reusable code.
