---
number: 02
title: Shape a collection
description: Keep a handful of exact values together, select one, and turn a small data set into an answer.
---

## Put values in a row

Square brackets make an array. RiX uses one-based indexes, so the first item is at position `1`.

```rix
measurements := [3 / 2, 7 / 4, 2]
measurements[2]
```

That second measurement remains the exact rational `1 3/4`. Arrays can hold any RiX values, including other arrays and functions.

## Build a small table

A map holds named entries. It is a useful shape for a compact record or a group of related constants.

```rix
recipe := {= flour=3 / 2, water=1, salt=1 / 40 }
recipe
```

The output trail renders the map in the same readable RiX notation you typed.

:::challenge Find the middle value
Make an array called `scores` containing 4, 9, and 16. Return the middle item using RiX's one-based index.
:::

## Keep an interval in view

An interval is as concise as its endpoints. Use a colon to place both bounds in a value you can name, pass around, and inspect.

```rix
safeTemperature := 18:24
safeTemperature
```

Try changing either endpoint, then return to the reference when you want to explore tuples, sets, slices, and tensors.
