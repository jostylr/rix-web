---
number: 6a
title: Pipes
description: Map, filter, and combine values with short callbacks.
---

## Map every item

`|>>` applies a function to each array value and returns an array of results. The callback's first parameter receives one value at a time.

```rix edu
[1, 2, 3] |>> (x) -> x * 2;
```

The result is `[2, 4, 6]`. Try `x ^ 2` instead and predict the new array.

## Filter by a condition

`|>?` keeps values whose predicate succeeds. This example keeps 2 and 4. Write `% 2 == 0` explicitly: zero alone is truthy in RiX.

```rix edu
[1, 2, 3, 4] |>? (x) -> x % 2 == 0;
```

## Combine a finite array

`|>:` reduces the array with a function of the accumulated value and the next value. It starts with the first item, so the sum below is 10.

```rix edu
[1, 2, 3, 4] |>: (total, value) -> total + value;
```

For an empty collection, use an explicit initial value or choose another operation. Callback forms can also receive a one-based index and the original source when needed; [Arrays](arrays.html) provides a position-aware example. Start with one value parameter until the other context has a purpose.

:::challenge Pipes practice
Filter `[1, 2, 3, 4]` to retain values greater than 2, then map those values to their doubles. Expect `[6, 8]`.
:::

## Keep going

Use [Generators](generators.html) to make a finite input array and [Transform a report](capstone-report.html) to combine map and filter in a task. Lazy and async pipelines have separate advanced lessons.
