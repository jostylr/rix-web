---
number: 7b
title: Destructuring
description: Pull structured values into named bindings.
---

## Read several values at once

Destructuring reads a structured source once and binds selected pieces outward. Arrays, tuples, maps, and tensors can all be patterns.

```rix edu
[first, second, ...rest] := [1, 2, 3, 4];
[first, second, rest];
```

The first two names receive 1 and 2; `rest` receives `[3, 4]`. The source is read once. Remove one item from the right and predict the new rest array.

## Pull named entries from a map

Map patterns name the entries to extract. This result shows `cash` and the exact amount `7/2`.

```rix edu
entry := {= account="cash", amount=7/2 };
{= account, amount } := entry;
[account, amount];
```

More advanced patterns can rename keys or pull values from tuples and shaped data. [Shared ledger](capstone-ledger.html) uses this map form together with cell updates.

:::challenge Destructuring practice
Make `{= x=3, y=5 }`, destructure it into `x` and `y`, then return their sum. Expect 8.
:::

Continue with [Properties and metadata](properties.html) or [Shared ledger](capstone-ledger.html).
