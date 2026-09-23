---
number: 4c
title: Deferred execution
description: Delay and evaluate code deliberately.
---

## Keep code for later

Prerequisites: [Blocks](brace-containers.html) and [Scope and imports](scope.html). A deferred value keeps code as a value until something asks to evaluate it. Use an ordinary function when the only goal is to reuse a calculation; deferral is for code that must be inspected or evaluated at a chosen time.

`@{; ... }` holds a block; `.Eval()` runs it. The output is 5.

```rix edu
later := @{; 2 + 3 };
later.Eval();
```

Change the addition to multiplication and predict the result. The block is not evaluated merely by binding `later`.

## Choose the evaluation boundary

`.Eval` can also evaluate a source string. `@@later` evaluates a deferred value directly in the caller's scope, so caller-visible names and updates require care. Keep ordinary functions and blocks for everyday calculations; use dynamic evaluation only when the scope is intentional.

```rix edu
later := @{; 2 + 3 };
@@later;
```

:::challenge Deferred execution practice
Create a deferred block that multiplies 3 and 4, then evaluate it. Expect 12.
:::

Continue with [RiX scripts](rix-scripts.html) for reusable programs with explicit capability boundaries.
