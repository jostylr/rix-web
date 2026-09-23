---
number: 7c
title: Properties and metadata
description: Receiver-first methods and value annotations.
---

## Call a method on its receiver

Indexes select stored values; metadata and methods describe how a value behaves. Receiver-first method syntax keeps the subject of an operation visible.

```rix edu
values := [1, 2];
newValues := values.Push(3);
{: values, newValues };
```

The receiver `values` remains `[1, 2]`; `Push` returns `[1, 2, 3]` as a new value. The dot keeps the subject of the operation visible. See [Arrays](arrays.html) for more collection methods.

## Know what a property means

Properties carry information about a value; methods compute or update from a receiver. Use `.key` when a stable object identity is needed. A method ending in `!` signals a deliberate mutable operation; choose it only when shared state is part of the model. [Cells and assignment](cells.html) explains that shared state.

Change the pushed value and confirm that the original array still has two items.

:::challenge Properties and metadata practice
Create an array, make a pushed copy, and confirm the original remains unchanged.
:::

Continue with [Shared ledger](capstone-ledger.html) for a task involving values and aliases.
