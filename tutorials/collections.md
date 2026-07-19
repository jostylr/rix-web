---
number: 2
title: Shape a collection
description: Keep a handful of exact values together, select one, and turn a small data set into an answer.
---

## Three useful shapes

Collections let a formula keep several values together. RiX gives you a few compact shapes with different jobs:

```rix edu
array := [3 / 2, 7 / 4, 2];
record := {= flour=3 / 2, water=1 };
choices := {| 1, 2, 2 |} ;
```

- An **array** keeps order and supports one-based indexes.
- A **map** labels each entry with a key.
- A **set** keeps only unique members.

Use the Details button below to move into a focused page for each shape. Those pages have runnable examples and a complete object-method reference.

## Read one value

Arrays are a useful first collection because their indexes are explicit and exact.

```rix edu
measurements := [3 / 2, 7 / 4, 2];
measurements[2] ;
```

That second measurement is still the exact rational `1 3/4`.

:::challenge Find the middle value
Make an array called `scores` containing 4, 9, and 16. Return the middle item using RiX's one-based index.
:::

## Keep an interval in view

An interval is as concise as its endpoints. Use a colon to place both bounds in a value you can name, pass around, and inspect.

```rix edu
safeTemperature := 18:24;
safeTemperature ;
```

Try changing either endpoint, then return to the reference when you want to explore tuples, sets, slices, and tensors.
