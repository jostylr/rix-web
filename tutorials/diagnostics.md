---
number: 9f
title: Diagnostics and tests
description: Warnings, tracing, and test helpers.
---

## Orientation

Diagnostics turn warnings, stops, traces, and tests into structured values. Start with small test cases before adding tracing to a larger calculation.

Start with a small diagnostic so you can see its result before adding tracing to a larger program.

## A worked example

```rix edu
.Info("lesson", 1) ;
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Some diagnostic capabilities are best viewed in a script or CLI host; RatCalc keeps their invocation explicit.

Change the diagnostic message and compare its displayed value with an ordinary calculation.

:::challenge Diagnostics and tests practice
Use `.Help("diagnostic")` to inspect available related guidance.
:::

## Keep going

Continue with [Verified rule](capstone-verified-rule.html) for a task that uses diagnostic helpers.
