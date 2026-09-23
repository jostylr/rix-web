---
number: 10a
title: RiX scripts
description: Imports, interface bindings, and capability frames.
---

## Orientation

A RiX script can bind inputs, export outputs, and import another script through an explicit interface. Capability modifiers narrow what an imported script can do.

The browser cell can illustrate RiX evaluation, while imports require a host-visible script file.

## A worked example

```rix edu
## Script imports need a host-visible .rix file
1 + 1 ;
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Use the command-line runner for real file imports; RatCalc can still prototype the script body.

Sketch an interface with explicit inputs and outputs before adding file or capability dependencies.

:::challenge RiX scripts practice
Write a function that could be the body of a small reusable script.
:::

## Keep going

Continue with [JavaScript modules](javascript-modules.html) only when a host needs JavaScript behavior.
