---
number: 13e
title: Capstone: explicit core
description: Translate a compact RiX calculation into named core calls.
---

## Build a small exact summary

Suppose a calculation receives a subtotal of `2 + 3`, takes that from ten,
and wants to report both the signed change and its magnitude. Here is an
explicit-core version. It uses named assignment, arithmetic, map pairs, and
absolute value without relying on operator or map-literal syntax.

```rix
{;
  .Assign(:subtotal, .Add(2, 3));
  .Assign(:change, .Sub(10, subtotal));
  .Map(
    .Pair(:subtotal, subtotal),
    .Pair(:change, change),
    .Pair(:magnitude, .Abs(change))
  )
}
```

Every operation above is exact and uses the same core implementation as the
more compact spelling below.

```text
{;
  subtotal := 2 + 3;
  change := 10 - subtotal;
  {= subtotal = subtotal, change = change, magnitude = | change | }
}
```

The explicit version is not a recommendation to avoid syntax. It demonstrates
that syntax can be treated as a convenient front end to ordinary named
operations—a useful property for code generators, alternative editors,
explainers, and experiments with new notation.

## Check the boundary

This capstone uses only `.PascalCase` core entries. If it needed an optional
rendering, numerical approximation, file, or host integration capability, the
program would name a `.camelCase` root and the embedding host would decide
whether to grant it.

:::challenge Write your own translation
Choose a short expression that uses two arithmetic operations and one
comparison. Write it once with ordinary RiX syntax and once with `.Add`,
`.Mul`, `.Less`, or related core calls. Make the final line compare the two
results.
:::

## Where to go next

Return to the system and extension chapters when you want to design a
capability, and to the function and control chapters when you want to see more
of the lazy forms that lowering preserves.
