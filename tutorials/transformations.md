---
number: 6
title: Transforming data
description: Build finite inputs, then map and filter their values.
---

## Make and transform an array

At this point you know arrays and functions. A generator can make a finite input array; a map pipe transforms each item. This returns `[1, 4, 9, 16]`.

```rix edu
numbers := [1 |+ 1 |; 4];
numbers |>> (x) -> x ^ 2;
```

## Keep only useful results

Filter runs a predicate for each value. The cell below returns `[3, 4]`.

```rix edu
[1 |+ 1 |; 4] |>? (x) -> x > 2;
```

See [Pipes](pipes.html) for mapping, filtering and reducing, then [Generators](generators.html) for finite patterns. Regex and strings, lazy generators, async concurrency and streams are optional continuations once ordinary finite transformations are comfortable.

:::challenge Transforming data practice
Generate the numbers 1 through 5, filter to keep those greater than 2, then double them. Expect `[6, 8, 10]`.
:::

Continue with [Cells, shared state and patterns](binding.html) to learn when values should be updated deliberately, or practice [Transform a report](capstone-report.html).
