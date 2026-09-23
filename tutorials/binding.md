---
number: 7
title: Cells, shared state and patterns
description: Compare a fresh value with an alias, then update deliberately.
---

## Share or copy a value

A RiX binding names a cell. `:=` makes a fresh value; `=` aliases the existing cell. Both names can initially display the same number, but only the alias sees an in-place update.

```rix edu
x := 5;
alias = x;
copy := x;
x ~= 6;
[x, alias, copy];
```

Expect `[6, 6, 5]`. Use [Cells and assignment](cells.html) for identity and deep copying. [Destructuring](destructuring.html) pulls multiple values into names; [Properties and metadata](properties.html) covers value annotations.

## State in a larger program

An update should be visible at the point where state changes. [Bounded simulation](capstone-simulation.html) uses an explicit loop bound and updates a running balance; read [Brace containers](brace-containers.html) first for the loop form. [Shared ledger](capstone-ledger.html) combines cells and structured data.

:::challenge Binding and patterns practice
Create `value := 4`, make an alias and a fresh copy, then update `value` to 9. Return the alias and copy; expect `[9, 4]`.
:::

Continue with [Semantics, types and units](semantics.html) for values with richer meaning.
