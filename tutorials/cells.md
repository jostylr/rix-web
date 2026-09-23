---
number: 7a
title: Cells and assignment
description: Aliases, copies, updates, and identity.
---

## See aliasing and copying

Use `=` to alias a cell, `:=` to create a fresh copy, and `~=` to replace a cell's value in place. `===` asks whether two names still share a cell.

```rix edu
x := 5;
alias = x;
copy := x;
x ~= 9;
[x, alias, copy, x === alias, x === copy];
```

The first three values are 9, 9 and 5. The identity checks are true and false: `alias` shares `x`'s cell, while `copy` does not. Change the replacement to 12 and check the same pattern.

## When copying nested data

For ordinary scalar calculations, `:=` and `=` are enough. Deep-copy forms (`::=` and `~~=`) matter when nested collections must not share children. Learn them when a concrete nested update requires that distinction.

An in-place update inside a nested function may need an explicit outer reference such as `@balance`. [Scope and imports](scope.html) explains the boundary; [Bounded simulation](capstone-simulation.html) uses one.

:::challenge Cells and assignment practice
Bind `a`, alias it as `b`, copy it as `c`, update `a`, and inspect both names.
:::

Continue with [Destructuring](destructuring.html) when an array or tuple should supply several names.
