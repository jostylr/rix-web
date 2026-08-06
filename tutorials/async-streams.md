---
number: 7g
title: Async streams
description: Build lazy pull pipelines, consume them explicitly, and project event streams into reactive state.
---

## Keep a stream lazy

An `async_stream` is a linear handle over a source, not a promise or a cached
collection. Creating, transforming, or displaying a stream does not pull it.
The `|>>`, `|>?`, and expected-value `|>!` pipes add lazy stages.

```rix edu
stream := .Stream([1, 2, 3, 4], :numbers)
    |>> ((x) -> x^2)
    |>? ((x) -> x > 4);
stream;
```

The displayed handle reports its status and pull count. Consumption starts at
an explicit terminal such as `Collect`, `ForEach`, `Reduce`, `First`, or
`Find`.

```rix edu
(.Stream([1, 2, 3, 4], :numbers)
    |>> ((x) -> x^2)
    |>? ((x) -> x > 4)
).Collect();
```

`|>_` is the consuming ForEach pipe. Unlike Map it does not build a result
collection: it drains with backpressure, awaits callbacks, discards their
return values, and returns null.

```rix edu
$$latestSquare := _;
(.Stream([1, 2, 3, 4], :numbers) |>> ((x) -> x^2))
    |>_ ((value) -> ($latestSquare := value));
$latestSquare;
```

Ordered Find and All are consuming stream terminals too. They keep bounded
lookahead inside a concurrency scope and close an unbounded source as soon as
the source-ordered result is fixed.

```rix edu
{$:2$
    .Stream([3, 5, 8, 10], :search)
        |>> ((x) -> x^2)
        |>|| ((x) -> x % 2 == 0)
};
```

## Process file or HTTP-style chunks

Hosts can adapt an HTTP response body, file reader, database cursor, or async
iterable to the same pull protocol. This finite example stands in for chunks
supplied by a file or response capability. Each pull provides backpressure.

```rix edu
chunks := .Stream(["header\n", "body one\n", "body two\n"], :file_chunks);
result := (chunks |>> ..Upper).Collect();
{= chunks=result, status=chunks.Status() };
```

`..Upper` is a method lift. It is equivalent to `(chunk) -> chunk.Upper()`.
Method lifts can capture arguments too, as in `..DecodeText("utf8")` when a
host chunk type provides that method.

## Bound work and close early

Inside `{$:L$ ... }`, safe Map and Filter stages use at most `L` executing
items and no more than `2L` admitted but unpublished items. Results still
publish in source order. `Take`, bounded `Collect`, `First`, and `Find` close
the source as soon as their ordered result is known.

```rix edu
{$jobs:limit=2,timeout=5$
    (.Stream([1, 2, 3, 4, 5, 6], :jobs)
        |>> ((x) -> x^2)
        |>? ((x) -> x > 8)
    ).Collect(3)
};
```

Timeouts and cancellation reach a pending pull and promise-aware host
transformation. Source and overflow failures are typed operational faults, so
`##!>` may recover them without swallowing language errors or cancellation.

## Project events into reactive state

A stream is an ordered history; a reactive binding is the current projection.
Use explicit supervised consumption for a long-lived projection. Formula
recomputation never silently reopens an external stream.

```rix edu
$$latest := :waiting;
{$$ <latest=latest>
    .Stream([:connecting, :ready, :complete], :connection_events)
        |>_ ((event) -> ($latest := event))
};
$latest;
```

The detached block owns and closes the stream when it finishes or when its
supervisor shuts down. Resetting or leaving a RiX Web session cancels a pending
pull, closes the task-owned source, and gives cleanup a bounded grace period.
The reactive alias is the explicit publication channel; ordinary hidden outer
variables remain inaccessible.

## Own custom stream cleanup

Terminals close their source automatically. A custom source can additionally
join the nearest code block's cleanup stack with `##_ ..Close`.

```rix edu
result := {;
    stream := .Stream([2, 3, 4], :owned) ##_ ..Close;
    stream.Reduce(1, (product, value) -> product * value)
};
result;
```

Cleanup runs exactly once on normal completion, early result, fault, timeout,
cancellation, and supervised background shutdown.

:::challenge Pull only what you need
Create a stream from `[1, 2, 3, 4, 5, 6]`, square values lazily, keep even
results, and collect only the first two matches.

    (.Stream([1, 2, 3, 4, 5, 6])
        |>> ((x) -> x^2)
        |>? ((x) -> x % 2 == 0)
    ).Collect(2)
:::

## Keep going

Return to Async and concurrency for scheduler limits, timeouts, named breaks,
and detached import rules. Use Diagnostics to recover only typed operational
stream faults.
