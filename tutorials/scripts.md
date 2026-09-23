---
number: 10
title: Scripts and extensions
description: RiX modules, host boundaries, and language extension.
---

## Orientation

RiX scripts can declare interfaces, import other RiX files, and run inside capability frames. JavaScript modules and language extensions are host-level features with explicit trust boundaries.

Prerequisites: [Functions](functions.html), [Scope and imports](scope.html),
and [System capabilities](system-context.html). Start with [RiX scripts](rix-scripts.html)
for a program you want to reuse. Read [JavaScript modules](javascript-modules.html)
only when a host needs to provide behavior from JavaScript, and [Language
extensions](extensions.html) when changing parsing or dispatch. [JavaScript-to-RiX
gotchas](gotcha-tutorial.html) is optional early reading for experienced programmers.

The small runnable cell checks the language context; the following pages describe what a script host must provide.

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

Prototype a calculation in a browser cell, then record any file or capability requirement separately.

:::challenge Scripts and extensions practice
Describe the inputs and outputs your first RiX script would need, then prototype its core expression here.
:::

## Keep going

Continue with [RiX scripts](rix-scripts.html) for imports and interfaces.
