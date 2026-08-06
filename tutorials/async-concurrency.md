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
limit to four. Headers can also set a timeout in positive integer seconds:

```rix edu
{$jobs:limit=2,timeout=5$ [1^5, 2^5, 3^5] } ;
```

The shorter `{$jobs:2,5$ ... }` is equivalent. A timeout stops admission,
requests cooperative cancellation, drains admitted work, and then runs
guaranteed cleanup.

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

## Drain for effects and recover expected values

`|>_` is terminal ForEach syntax. It calls the callback with each value,
locator, and source, ignores the callback's return value, and returns null only
after the source is exhausted. Inside a limited scope the callbacks overlap up
to that limit without constructing an output collection.

```rix edu
$$latest := _;
{$:2$ <latest=latest>
    [2, 3, 4] |>_ ((value, locator) -> ($latest := {: value, locator }))
};
$latest;
```

Expected failures can instead be ordinary tuple values shaped
`{: :error, ...args }`. `|>!` calls its handler with the tail entries. Returning
null skips that collection item and prevents later stages from seeing it;
ordinary values pass through unchanged.

```rix edu
[1, {: :error, :missing, 2}, {: :error, :ignore, 9}, 4]
    |>! ((kind, fallback) -> kind == :missing ?? fallback ?: _)
    |>> ((value) -> value * 10);
```

This is deliberately not a thrown-error catch. Language failures,
cancellation, breaks, and typed operational faults still use their normal
control-flow and `##!>` rules.

## Cross ordered barriers

Reduce, sort, reverse, slice, split, and chunk need ordered input, so they end
the current concurrent region. Upstream work still overlaps. Reducer calls and
predicate-based structural barriers are awaited in traversal order; a map or
filter after the barrier starts a new concurrent region.

```rix edu
{$:3$
    [4, 1, 3, 2]
        |>> ((x) -> x^2)
        |<> ((a, b) -> a - b)
        |>/ 2:4
        |>> ((x) -> x + 1)
        |:> 0 >: ((sum, x) -> sum + x)
} ;
```

Sort uses a stable promise-aware comparator. Ordered reduce never invokes two
accumulator calls at once, even when the source and earlier elementwise stages
were concurrent.

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

Nested branches share the limit, preserve their final written shape, and use
hierarchical round-robin admission so a large early subtree cannot monopolize
every available slot.

Function fan-out is lexical. A function defined outside `{$ ... }` keeps its
ordinary sequential collection behavior when called inside. A function created
inside the scope retains parallel collection behavior if it escapes, while an
outside function can opt in with an explicit inner `{$ ... }`.

```rix edu
Sequential() -> [1^5, 2^5];
{$:2$ <Sequential> [Sequential()] } ;
```

This boundary prevents an ordinary function from changing scheduling semantics
just because one caller happens to be concurrent.

Nested async scopes share the ancestor scheduler while applying the stricter
limit. Here the inner scope can use at most two of the outer scope's four
slots:

```rix edu
{$outer:4$
    {$inner:2$ [1^5, 2^5, 3^5, 4^5] }
} ;
```

A break or failure cancels queued descendants of its owning group. A handled
break in `inner` does not cancel an independent sibling already admitted by
`outer`.

Tensor cells are finite source items too, and tensor map callbacks receive
index tuples while preserving the original shape.

```rix edu
{$:2$
    {:2x2: 1, 2; 3, 4}
        |>> ((x, index) -> x + index[1] + index[2])
} ;
```

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

Ordinary detached imports use `~` and are deep-copied when the task is spawned.
An ordinary `=` alias import is rejected; `=` is reserved here for explicitly
imported reactive graph identities. Unlisted values, reactive names, and user
functions are invisible inside the detached block.

Use detached work for host effects or literal reactive publication. It does
not return a promise or task handle, and ordinary unsynchronised outer-cell
writes are intentionally not a communication mechanism.

## Guarantee cleanup and recover operational faults

`##_` preserves an acquired value and registers cleanup with the nearest code
block. Cleanup runs in reverse registration order on success, errors, breaks,
timeouts, cancellation, and supervised background completion.

```rix edu
result := {;
    resource := 4 ##_ ((value) -> value);
    resource + 1
};
result;
```

Async cleanup is awaited, and an item's cleanup completes before its concurrency
permit is released. A body error remains primary if cleanup also fails.

`##!>` handles only typed operational faults. It leaves successful values
unchanged and invokes its handler for recoverable host failures or timeouts.
Language errors, `.Error`, breaks, and cancellation continue to propagate.

Use `.Retry` when deferred work reports an expected error tuple and trying it
again is meaningful. Attempts counts the first evaluation, and exhaustion
returns the final tuple so `|>!` can recover it.

```rix edu
.Retry(
    {= attempts=3, delay=0, backoff=2, kinds=[:timeout] },
    @{ {: :error, :timeout, :offline } }
) |>! ((kind, status) -> status);
```

Kinds outside the allow-list and thrown errors are not retried. Delay is in
seconds, uses cancellable backoff, and inherits the containing scope timeout.
All attempts for one collection item retain one concurrency permit, and each
attempt drains its own `##_` cleanup before the next begins.

## Remember that suspension is not atomic

Ordinary concurrent captures are snapshots, while reactive reads observe a
point in time. The owner runtime serializes reactive writes, but multiple
background writers are timing-dependent. Network requests, file writes,
plugin effects, and output that already occurred are not rolled back, and their
visible order may follow completion timing. Cancellation is cooperative, so
synchronous or non-cancellable host work may continue until it next yields.

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
