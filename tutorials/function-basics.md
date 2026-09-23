---
number: 5a
title: Define and call
description: Define, call, and pass a simple function.
---

## Define a reusable calculation

A function takes inputs called parameters and returns the value of its body. Uppercase names can name callables. `Add(3, 4)` passes two arguments and returns `7`.

```rix edu
Add(x, y) -> x + y;
Add(3, 4);
```

The same function also works with exact fractions.

```rix edu
Add(x, y) -> x + y;
Add(1 / 3, 1 / 6);
```

The result is `1/2`. Each level-two topic starts fresh, so this cell includes its own definition. Change either argument and rerun.

## Use a short anonymous function

`(x) -> x * 2` describes the same rule without naming it. A map pipe applies the rule once to each array item.

```rix edu
[1, 2, 3] |>> (x) -> x * 2;
```

The result is `[2, 4, 6]`. See [Pipes](pipes.html) for that traversal. [Scope and imports](scope.html) explains how nested functions see surrounding names; [Multifunctions](multifunctions.html) and [Partial application](partials.html) are later options.

:::challenge Define and call practice
Define `Scale(value, factor)` to multiply its arguments, then call it with `3/2` and `2/3`. The result should be 1.
:::
