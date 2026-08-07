---
number: 3e
title: Scoped reproducible randomness
description: Reset, inherit, and locally replace deterministic random streams.
---

## Reproduce a stream exactly

Every fresh RiX runtime starts with the same simple default random stream. Call
`.RNG` when the stream itself is part of the calculation. An explicit seed
makes the choice visible and reproducible:

```rix edu
.RNG(:default, {= seed=77 });
first := .RAND_NAME(12);
.RNG(:default, {= seed=77 });
{: first, .RAND_NAME(12) };
```

The two strings match because each `.RNG` call constructs a fresh generator.
Calling `.RNG()` with no arguments also constructs a fresh default generator
with RiX's fixed startup seed.

## Keep a local experiment local

A nested scope initially uses its parent's generator. Installing another one
inside that scope changes the default there and in its subscopes, without
advancing or replacing the outer generator:

```rix edu
OuterRun := () -> {;
    .RNG(:default, {= seed=41 });
    first := .RAND_NAME(8);
    Local := () -> {;
        .RNG(:default, {= seed=99 });
        .RAND_NAME(8)
    };
    Local();
    {: first, .RAND_NAME(8) }
};
Baseline := () -> {;
    .RNG(:default, {= seed=41 });
    {: .RAND_NAME(8), .RAND_NAME(8) }
};
{: OuterRun(), Baseline() };
```

The two result tuples match. `Local` draws from its own stream, so it does not
consume a value from the stream selected by `OuterRun`.

## Let closures retain their stream

A closure keeps the RNG selected in the lexical scope where the closure was
created. That makes independent, repeatable simulation components possible:

```rix edu
Maker := (seed) -> {;
    .RNG(:default, {= seed=seed });
    () -> .RAND_NAME(10)
};
Left := Maker(5);
Right := Maker(5);
{: Left(), Left(), Right(), Right() };
```

The first and third strings match, as do the second and fourth. Each closure
has independent state even though both began from seed `5`.

## Draw exact rationals from an interval

`RationalInterval.Random` and `RandomPartition` consume the currently selected
stream. Their parameter tuple contains a count, an optional fixed denominator,
and an optional tolerance:

```rix edu
.RNG(:default, {= seed=456 });
point := (0:1).Random({: 1, 1000 });
parts := (0:1).RandomPartition({: 4, 1000 });
{= point=point, partitions=parts };
```

A count of one returns one rational. `RandomPartition` returns the requested
number of touching subintervals, including the original endpoints. The `:%`
and `:/%` interval operators use the same scoped stream.

## Ask the host for an unpredictable seed

Use `seed=:random` only when reproducibility is not wanted:

```rix edu
info := .RNG(:default, {= seed=:random });
info.Get("seed");
```

RiX asks the host for entropy—Web Crypto in a browser host—and reports the
chosen seed. It raises an error if the host has no entropy service. This option
randomizes the seed; the bundled default generator remains a small,
non-cryptographic reproducible generator. Approved hosts can also provide a
different RNG implementation.

:::challenge Build two matching samples
Create a function that installs seed `2026` and draws three rationals from
`-1:1` on a denominator-100 grid. Create two independent calls and confirm by
inspection that their returned samples match.

    Sample := () -> {;
        .RNG(:default, {= seed=2026 });
        -1:1 :% (3, 100)
    };
    {: Sample(), Sample() };
:::

## Keep going

Return to interval generation for exact grids and partitions, or continue to
holes and defaults for calculations where a value may be absent.
