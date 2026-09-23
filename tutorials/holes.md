---
number: 2e
title: Nulls and holes
description: Undefined values, defaults, and coalescing.
---

## Distinguish an unfilled slot from null

A hole means a missing value; it is distinct from the explicit null value `_`. Hole coalescing gives a fallback without treating every false-like value as absent.

An empty position inside an array is a hole. `?|` supplies a value only for a hole. The first result below is 99, while an explicit `_` stays `_`.

```rix edu
values := [1,,3];
[values[2] ?| 99, _ ?| 99];
```

Do not confuse an unfilled existing slot with an out-of-range lookup: `values[4]` evaluates to `_`, so hole coalescing does not replace it. Compare the two yourself before relying on a default.

## Use a fallback deliberately

Holes are useful in partially filled data, optional call arguments and soft matching. A fallback should mean “no value was supplied,” not “the supplied value looks false.” [Capstone: bounds check](capstone-bounds.html) applies that rule to a sensor reading.

:::challenge Nulls and holes practice
Create an array with an unfilled second slot and use `?|` to replace that slot with 42. Check that an explicit `_` is left alone.
:::

Continue with [Capstone: bounds check](capstone-bounds.html) or return to [Collections](collections.html).
