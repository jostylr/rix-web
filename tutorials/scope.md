---
number: 5b
title: Scope and imports
description: Closures, outer names, and block headers.
---

## Read an outer name

RiX resolves names lexically. Inside a nested callable, `@name` accesses an outer binding, while block import headers make copying and aliasing explicit.

```rix edu
x := 10;
ReadOuter() -> @x;
ReadOuter();
```

The result is 10. The `@` makes the outer read explicit. Change `x` to 4 and rerun the cell; the function sees the revised surrounding value.

## Keep updates clear

Closures retain the scopes they need. When a nested body needs to change an outer cell, make that intention explicit with `@name`. [Cells and assignment](cells.html) explains shared identity and updates; [Bounded simulation](capstone-simulation.html) shows `@balance` in a loop.

Change the outer binding and rerun the cell to verify what `@x` reads.

:::challenge Scope and imports practice
Define a function that reads an outer value and combines it with its argument.
:::

Continue with [Multifunctions](multifunctions.html) to combine guarded function variants, or [Transforming data](transformations.html) for simple callbacks.
