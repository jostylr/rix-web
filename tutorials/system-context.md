---
number: 9a
title: System capabilities
description: The dot object, aliases, and permissions.
---

## Orientation

System calls use `.Name(args)` or an `@_` form. The system context can expose aliases while a sandbox withholds capabilities that a script should not receive.

A dot-prefixed capability is supplied through the current system context; inspect one call before depending on a larger plugin surface.

## A worked example

```rix edu
.MUL(6, 7) ;
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Use the reference to distinguish system functions from user-defined uppercase callables.

Compare a direct arithmetic expression with its dot-capability form.

:::challenge System capabilities practice
Call `.ADD` and compare it with an ordinary `+` expression.
:::

## Keep going

Continue with [Diagnostics and tests](diagnostics.html) or [Assertions and symbolic specs](assertions-and-symbols.html).
