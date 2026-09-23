---
number: 5
title: Functions and scope
description: Define and call a function, then explore scope and reusable rules.
---

## Name a rule

An uppercase name can define a callable. The function below takes `x` and returns its square; the call returns 144.

```rix edu
Square(x) -> x ^ 2;
Square(12);
```

Change 12 to 7. A call can be part of a larger expression too: `Square(7) + 1` returns 50.

## Choose a route

Start with [Define and call](function-basics.html), then [Scope and imports](scope.html) for surrounding names. [Multifunctions](multifunctions.html) combines guarded variants and assumes you already know ordinary decisions. [Partial application](partials.html) is an optional way to prefill arguments.

The [Rule dispatcher](capstone-dispatch.html) capstone belongs after multifunctions. Keep [Cells and assignment](cells.html) nearby when a function needs shared state.

:::challenge Functions and scope practice
Define `Area(width, height)` to return their product, then call it with 7 and 11. The answer should be 77.
:::

Continue with [Transforming data](transformations.html) to use functions on finite arrays.
