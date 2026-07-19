---
number: 7c
title: Lazy generators
description: Contrast eager arrays with cached sequences that produce values on demand.
---

## Eager and lazy answer different questions

Use `|;` when you want a finished array now. Its number counts values that
actually reach the output, including accepted seeds.

```rix edu
[2 |+ 3 |; 5] ;
```

Use `|^` when you want a lazy sequence with a known ceiling. RiX creates the
sequence immediately but waits to calculate its values until something asks
for them.

```rix edu
powers := [1 |* 2 |^ 20];
powers[12] ;
```

A chain with a source and no terminator is lazy and unbounded. Positive
indexing remains safe because it only advances far enough to answer the
request.

```rix edu
naturals := [1 |+ 1];
naturals[100] ;
```

## Inspect a bounded part

Lazy sequences are one-based, like ordinary RiX arrays. A positive bounded
slice generates through its far endpoint and returns an ordinary finite array.

```rix edu
squares := [|: (i) -> i^2];
squares[5:10] ;
```

The index passed to `|:` is also one-based. The first square is therefore
`1^2`, not `0^2`.

When the lazy limit is numeric, RiX knows the eventual length without
materializing every value.

```rix edu
bounded := [10 |+ 10 |^ 8];
[bounded.Len(), bounded.First(), bounded.Get(6)] ;
```

## Map and filter without becoming eager

Map and filter pipes preserve laziness. In this example the filter examines
natural numbers until it has found six even values; the map only doubles the
values demanded downstream.

```rix edu
evens := [1 |+ 1] |>? (x) -> x % 2 == 0;
doubled := evens |>> (x) -> 2 * x;
doubled[6] ;
```

Filtering does not spend an output slot. Compare that behavior with this eager
chain: candidates that fail `|?` still advance the arithmetic source, but only
successful values count toward `|; 5`.

```rix edu
[2 |+ 3 |> (x) -> x^2 |? (x) -> x % 2 == 0 |; 5] ;
```

## Generate from recent history

When `|>` is the primary source, `_1` means the most recent source value, `_2`
the second most recent, and so on. RiX passes only the requested history slots;
it does not construct a growing history array for every call.

```rix edu
Next(a, b) -> a + b;
fibonacci := [1, 1, |> Next(_2, _1)];
fibonacci[12] ;
```

The explicit `1, 1` values initialize the history source. If a requested
placeholder has no seed behind it, RiX reports the missing history instead of
inventing a value.

## Predicate bounds

A predicate can bound either eager or lazy work. The triggering value is part
of the result.

```rix edu
[2 |+ 2 |; (x) -> x > 10] ;
```

The lazy form evaluates the same rule only as values are requested.

```rix edu
doublings := [2 |* 2 |^ (x) -> x > 1000];
doublings[1:10] ;
```

Because a predicate-bound sequence has no known length until it finishes,
operations such as negative indexing, reverse, sort, and `Last` should be used
only after a finite sequence has been materialized.

## Snapshot or restart lazy state

A shallow copy receives its own producer and cache at the current point. A
deep copy restarts from the generator definition and its original seeds.

```rix edu
source := [1 |+ 1];
source[5];
snapshot := source;
restarted ::= source;
[snapshot[7], restarted[2]] ;
```

Aliases made with `=` still share one lazy value. Lazy sequences themselves
are structurally immutable; materialize a bounded sequence before using array
mutation methods.

```rix edu
finite := [3 |+ 3 |^ 6];
finite.Materialize() ;
```

## Walk with an iterator

An iterator adds a traversal cursor without putting cursor state on the lazy
sequence itself. A new iterator starts at index `0`, before the first item.
`Next` moves first and then returns, so its argument controls how far the
cursor moves.

```rix edu
naturals := [1 |+ 1];
walker := naturals.Iterator();
[walker.Index(), walker.Next(2), walker.Peek(3), walker.Index(), walker.Next(-1), walker.Next(0)] ;
```

Here `Next(2)` skips the first item and returns item 2. `Peek(3)` reads item 5
without moving from index 2. Negative steps move backward, while `Next(0)`
returns the current item without moving. Lazy reads share the source cache, so
looking ahead calculates only the values needed to reach that position.

`Reset(index)` positions an indexable iterator at an item; `Peek()` reads that
item and the next `Next()` moves onward. An empty reset returns to cursor `0`.

```rix edu
steps := [10 |+ 10 |^ 4].Iterator();
steps.Reset(3);
atThree := steps.Peek();
afterThree := steps.Next();
steps.Reset();
[atThree, afterThree, steps.Next()] ;
```

Crossing the end with `Next` puts the cursor in its done state. `Done()` uses
the usual RiX truth convention: `1` means done and `null` means not done.
Being on the final item is not done until another advancing read crosses the
end.

```rix edu
short := [10, 20].Iterator();
[short.Next(), short.Done(), short.Next(), short.Done(), short.Next(), short.Done()] ;
```

Iterators also work over eager arrays, tuples, strings, tensors, maps, and
sets. A shallow copy gets an independent cursor at the same position while
continuing to read from the same source.

## Safety is separate from meaning

`|; 5` means five successful outputs, not five attempts. RiX also maintains an
operational iteration limit so a filter that can never succeed raises a clear
error rather than hanging or silently returning a truncated array.

:::challenge Build a lazy recurrence
Create an unbounded lazy sequence beginning with `2, 3` where each new value is
the product of the two most recent values. Read its sixth value, then map the
sequence to values increased by one and read the fourth mapped value.

    Product(a, b) -> a * b
    values := [2, 3, |> Product(_2, _1)]
    increased := values |>> (x) -> x + 1
    [values[6], increased[4]]
:::

## Keep going

Use the interval generation lesson to create lazy ranges with exact endpoints,
then compare deterministic ranges with seeded rational sampling.
