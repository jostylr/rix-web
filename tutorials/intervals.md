---
number: 2c
title: Intervals
description: Exact bounds, uncertainty, and betweenness.
---

## Keep exact bounds

An interval keeps both endpoints in a single value, so uncertainty travels with the calculation. Interval arithmetic returns bounds rather than silently selecting one point.

```rix edu
a := 2:3;
b := 4:5;
a * b;
```

The product spans 8 through 15. These are exact endpoints; the value does not choose one number inside the range. Change an endpoint and predict how the bound changes.

## Test betweenness

Three colon-separated values ask whether the middle one lies between the outer two. The first comparison is true and the second is false.

```rix edu
[2:7:10, 2:12:10];
```

See [Number notation](number-notation.html) for more interval spellings and [Recipe scaling](capstone-exact-recipe.html) for a calculation that carries a bound through a product.

:::challenge Intervals practice
Test whether 7 lies between 2 and 10, then whether 12 does. Expect `[1, _]`.
:::
