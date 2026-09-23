---
number: 9
title: System and symbolic work
description: Capabilities, assertions, and diagnostics.
---

## Orientation

The dot system object exposes deliberately granted capabilities. Assertions, symbolic specifications, diagnostics, and tests use that same explicit system boundary.

Prerequisites: [Functions](functions.html) and [Decisions](control.html).
For a program-checking route, start with [System capabilities](system-context.html)
and [Diagnostics and tests](diagnostics.html). For symbolic mathematics, start
with [Assertions and symbolic specs](assertions-and-symbols.html), then
[Exact symbolic calculus](symbolic-calculus.html). The advanced notation pages
can be read as references when a task needs them.

Compare the dot call with ordinary arithmetic so the capability boundary has a concrete example.

## A worked example

```rix edu
.ADD(3, 4) ;
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

The advanced pages show how to ask the runtime for more without making hidden global functions.

Change the two input numbers and verify the result before moving to symbolic or diagnostic work.

:::challenge System and symbolic work practice
Use a dot capability to compute an arithmetic result.
:::

## Keep going

Continue with [System capabilities](system-context.html) and then choose a diagnostic or symbolic route.
