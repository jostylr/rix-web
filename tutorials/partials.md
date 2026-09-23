---
number: 5e
title: Partial application
description: Placeholders and arity-capped callables.
---

## Leave an argument open

Partial functions leave a callable shape behind. Operator aliases and numbered placeholders make small callbacks readable, especially inside collection pipelines.

```rix edu
Double := @*(_1, 2);
Double(9);
```

`_1` stands for the argument supplied later; the result is 18. Compare this with the ordinary `Double(x) -> x * 2` in [Define and call](function-basics.html). Use the version that makes the calculation easier to read.

## Use a partial as a callback

Pipes can pass a value, locator and source. A partial that needs only its first argument can cap its arity so the extra context does not change its meaning; see [Pipes](pipes.html) for the basic callback form. Keep the first callback simple before using placeholders in a pipeline.

Use a second input with `Double` and check that the placeholder receives the call argument each time.

:::challenge Partial application practice
Create a partial that subtracts its input from 10.
:::

Continue with [Rule dispatcher](capstone-dispatch.html) if your program needs several input families rather than one open argument.
