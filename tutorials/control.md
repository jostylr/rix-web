---
number: 4
title: Decisions and blocks
description: Choose a value, then group a few calculations in a block.
---

## Choose between two values

`?:` selects the first result when its condition succeeds; `?_` selects the other result when it fails. This returns 4.

```rix edu
x := -4;
x > 0 ?: x ?_ -x;
```

Test `x := 4` as well. The [Ternaries and cases](ternaries.html) lesson covers several branches and the distinct undecided `?` result.

## Group calculations

`{; ... }` groups statements and returns its final value. The following block returns 6.

```rix edu
{; width := 2; height := 3; width * height };
```

[Brace containers](brace-containers.html) explains the other sigils and later loop mechanics. Loops that update state are best read after [Cells and assignment](cells.html); [Bounded simulation](capstone-simulation.html) uses both. [Deferred execution](deferred.html) is an advanced continuation.

:::challenge Choose a label
Bind `value` to -2 and return `"positive"` if it is above zero, or `"non-positive"` otherwise. Change it to 3 and check the other branch.
:::

Continue with [Functions and scope](functions.html) to reuse a decision.
