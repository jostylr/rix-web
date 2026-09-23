---
number: 6b
title: Generators
description: Build a finite array from a starting value, step, and count.
---

## Make a finite array

`[1 |+ 2 |; 5]` begins at 1, adds 2 each time, and returns five values. The starting value counts. `|;` produces the finished array immediately.

```rix edu
[1 |+ 2 |; 5];
```

The result is `[1, 3, 5, 7, 9]`. Change the step to 3, then predict all five values before running it.

## Use a named count

You can choose the count elsewhere in a program. An array is one-based, so the fourth item of this four-value result is 7.

```rix edu
count := 4;
values := [1 |+ 2 |; count];
values[4];
```

Set a finite count deliberately: a generator without a bound may continue producing values until the caller stops asking for them. For mapping or filtering an array, see [Pipes](pipes.html).

:::challenge Generators practice
Generate five values beginning at 2 and increasing by 3. Return the fifth item. It should be 14.
:::

## When values should be lazy

Replacing `|;` with `|^` creates a lazy sequence with a known length. It shows a sequence description until you ask for an item.

```rix edu
later := [1 |+ 2 |^ 5];
later[5];
```

The requested fifth value is still 9. [Lazy generators](lazy-generators.html) explains when and how to inspect them safely. Continue to [Pipes](pipes.html) to transform a finite result.
