---
number: 4b
title: Brace containers
description: Start with value-producing blocks; revisit bounded loops after cells and scope.
---

## Return a value from a block

`{; ... }` groups statements and returns its last value. The result below is 6. A space after the sigil keeps the form clear.

```rix edu
{; x := 2; y := 3; x * y };
```

Maps (`{=`), sets (`{|`) and tuples (`{:`) have different meanings. Their focused [collection lessons](collections.html) explain how to choose one.

:::challenge Return a product
Make a block that binds two exact fractions and returns their product. Use `1/2` and `3/4`; expect `3/8`.
:::

## Revisit for loops

The `{@ ... }` form repeats work. Read [Cells and assignment](cells.html) and [Scope and imports](scope.html) before using it to update state. The [Bounded simulation](capstone-simulation.html) lesson then shows an explicit stopping condition, a body and an update in one example.

Continue the short route with [Functions and scope](functions.html).
