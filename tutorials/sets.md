---
number: 2c
title: Sets
description: Keep unique values and combine groups with precise set operations.
---

## Keep only one of each value

Sets use the `{|` sigil. Repeated entries collapse to one member.

```rix
choices := {| 1, 2, 2, 3 |}
choices
```

The result contains each value once. That makes sets a strong fit for membership and combination questions.

## Combine two sets

`Union` returns all unique values from both inputs.

```rix
warm := {| 1, 2 |}
cool := {| 2, 3 |}
warm.Union(cool)
```

:::challenge Test membership
Create a set called `primes` containing 2, 3, and 5. Use `Has` to test whether 3 is present.
:::
