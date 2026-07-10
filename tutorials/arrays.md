---
number: 2a
title: Arrays
description: Work with ordered values using RiX's exact, one-based arrays.
---

## Make an ordered list

Square brackets create an array. An array remembers order, and its first position is `1`.

```rix
scores := [4, 9, 16]
scores[2]
```

The result is `9`. Negative indexes count from the end, so `scores[-1]` is the final value.

One-based indexing is deliberate: positions in RiX line up with the way a mathematician labels terms in a sequence. A missing position and a value that happens to be zero are different facts. Methods such as `HasAt` let code make that distinction when an array contains holes.

```rix
samples := [10, 20, 30, 40]
{: samples.First(), samples.Get(-1), samples[2:3] }
```

Bracket slicing is inclusive at both ends. The tuple above therefore contains the first value, the last value, and a two-value middle slice. Run each expression separately if the combined output feels too dense.

## Return an updated array

Array methods without an exclamation point return a changed copy. This makes intermediate calculations easy to inspect.

```rix
scores := [4, 9, 16]
nextScores := scores.Push(25)
nextScores
```

The original `scores` is still `[4, 9, 16]`. This non-mutating style is a strong default because every name remains an inspectable step in the calculation. Bang methods such as `Push!` deliberately update their receiver; reserve them for code where shared changing state is actually part of the model.

## Transform the elements

Arrays participate in RiX's collection pipes. Mapping changes every element, while filtering keeps only elements that satisfy a predicate.

```rix
values := [1, 2, 3, 4, 5]
squares := values |>> (value) -> value ^ 2
evenSquares := squares |>? (value) -> value % 2 == 0
evenSquares
```

The callback can also receive a one-based locator and the source collection. That makes position-aware transformations possible without manually maintaining a counter. Use the function chips below as the compact API index; each opens help with a signature and runnable example.

:::challenge Add then select
Create an array called `measurements` with 1/2 and 3/4. Use `Push` to add 5/4, then return the third item.
:::
