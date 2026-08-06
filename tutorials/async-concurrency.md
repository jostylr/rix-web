---
number: 7f
title: Async and concurrency
description: Await bounded collection work, stream pipe stages, and start supervised background effects.
---

## Await a concurrency scope

`{$ ... }` is a code block whose final value is awaited. It never exposes a
promise as a RiX value. Explicit collection entries inside the block are the
places where independent work may overlap.

```rix edu
Square(x) -> x^2;
{$ <Square> [Square(2), Square(3), Square(4)] } ;
```

The result remains in source order even if host capabilities finish in a
different order. A limit in the header bounds the number of items in flight.

```rix edu
{$:2$ [1 + 1, 2 + 2, 3 + 3, 4 + 4] } ;
```

The default limit is 10. `{$jobs:4$ ... }` gives the scope a name and sets its
limit to four.

## Use imports like any other code block

Async and detached blocks accept the same import header as ordinary code
blocks. Statements still run in order; concurrency occurs only at explicit
fan-out points.

```rix edu
offset := 10;
{$jobs:2$ <base~offset>
    values := [base + 1, base + 2, base + 3];
    values |>> ((x) -> x^2)
} ;
```

The first statement completes its array before the second statement begins.
Within each statement, independent items use the scope scheduler.

## Stream elementwise pipes

Consecutive map and filter stages form one concurrent region. As soon as one
source item resolves, it can continue through later stages without waiting for
a slower sibling. The published collection still preserves source order.

```rix edu
{$:2$
    [1, 2, 3, 4]
        |>> ((x) -> x^2)
        |>? ((x) -> x > 4)
} ;
```

`|>||` is ordered Find: predicates may overlap, but the result is the first
passing item in traversal order, not the first one to finish.

```rix edu
{$:3$ [7, 4, 10, 2] |>|| ((x) -> x % 2 == 0) } ;
```

## Nest collections without spending parent permits

Nested collection containers share the scheduler. Structural parents do not
occupy a slot while their children are waiting.

```rix edu
{$:2$
    {=
        left=[1^5, 2^5],
        right=3^5
    }
} ;
```

Admission follows written depth-first order: the two entries under `left`
come before `right`.

## Completion races and background work

A named async break, `{!$name! value }`, races by completion. The first task to
reach it supplies the scope result and prevents queued siblings from starting.
Already-running host effects receive cooperative cancellation only when their
capability supports it.

`{$$ ... }` is a different tool: it starts one supervised background code
block, immediately returns `null`, and discards the block's final value. Its
statements are sequential, though it may contain `{$ ... }` for bounded
fan-out.

```rix edu
$$status := :starting;
{$$ <status=status>
    $status := :finished
};
$status;
```

The alias import makes the publication channel explicit. A background task
cannot use a hidden ordinary outer binding as shared mutable state.

Use detached work for host effects or literal reactive publication. It does
not return a promise or task handle, and ordinary unsynchronised outer-cell
writes are intentionally not a communication mechanism.

:::challenge Bound a transformation
Use a concurrency limit of two to square `[1, 2, 3, 4, 5]`, keep values greater
than 5, and return the ordered result.

    {$:2$
        [1, 2, 3, 4, 5]
            |>> ((x) -> x^2)
            |>? ((x) -> x > 5)
    }
:::

## Keep going

Concurrency changes scheduling, not value semantics. Revisit Pipes for each
operator's ordinary result, and Scope and imports for code-block capture rules.
