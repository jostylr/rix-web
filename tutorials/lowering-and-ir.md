---
number: 13c
title: Lowering syntax
description: Trace source syntax through IR operations and evaluator dispatch.
---

## Lowering keeps meaning while changing shape

The parser first recognizes source constructs. Lowering then turns those
constructs into a compact IR tree whose operation names are understood by the
evaluator. Evaluation dispatches that tree through the core registry.

The key point is that lowering preserves semantics, not punctuation. An
absolute-value delimiter and an explicit core call both end up at `ABS`.

```rix
| -7 |
```

```rix
.Abs(-7)
```

## Esoteric syntax still has an operation

RiX offers notation that can be excellent for mathematics but awkward to emit
from a tool. The core name gives that tool an ordinary call-shaped alternative.

```rix
{; least = {<< 8, 3, 5 }; explicit = .Min(8, 3, 5); least == explicit }
```

This is also why public names are useful for teaching: one can identify the
operation without first explaining every precedence or delimiter rule.

## Lazy IR preserves evaluation rules

Lowering does not eagerly run every child expression. A lambda body is stored
as IR so its parameter has a meaning later; the same idea applies to branches,
blocks, loop pieces, assignment targets, and other structural forms.

```rix
{; .Assign(:F, .Lambda(.Params(:x), .Add(x, 1))); F(9) }
```

When the lambda is created, its `.Add(x, 1)` body is captured. Only `F(9)`
evaluates it with a binding for `x`. If it had been evaluated during lambda
creation, `x` would not yet have a value.

## A useful debugging question

When a construct feels surprising, ask two questions:

- What core operation does this syntax lower to?
- Which of that operation's arguments are values now, and which are structure
  to evaluate later?

That distinction explains assignment, control flow, function bodies, and many
of RiX's compact container forms better than a list of punctuation rules does.

:::challenge Trace a form
Write one block that compares `2 + 3 * 4` with `.Add(2, .Mul(3, 4))`.
:::

## Next

The core is intentionally small and globally named. The host boundary lets an
embedding environment add optional capabilities without making them core
language requirements.
