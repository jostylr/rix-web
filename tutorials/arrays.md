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

## Return an updated array

Array methods without an exclamation point return a changed copy. This makes intermediate calculations easy to inspect.

```rix
scores := [4, 9, 16]
nextScores := scores.Push(25)
nextScores
```

:::challenge Add then select
Create an array called `measurements` with 1/2 and 3/4. Use `Push` to add 5/4, then return the third item.
:::
