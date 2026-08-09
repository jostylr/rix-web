---
number: 3b
title: Number notation
description: Every built-in exact, certified, interval, base, and output notation.
---

## Orientation

RiX distinguishes exact values, certified uncertain scalars, and interval
collections. Its number syntax covers integers, rational division, finite and
repeating decimals, mixed numbers, radix shifts, continued fractions, exact
intervals, certified prefixes, and bases without passing through floating
point.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix edu
values := [
    1000,
    -3 / 4,
    0.125,
    0.1#6,
    -2..1/4,
    3.~7~15,
    1.25_^3
];
values;
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Exact scalar input forms

Integer and finite-decimal input is exact. `/` is the exact division operator,
so `3 / 4` evaluates to a Rational rather than a floating value. A repeating
marker describes an infinite rational pattern exactly:

```rix edu
values := [
    0.#3,
    1.23#45,
    5#3,
    1.~2,
    ~-1.~2,
    -~1.~2
];
values;
```

`#` begins the repeating digits. Continued fractions use `.~`; a leading `~`
makes a signed first coefficient explicit, while unary `-` negates the entire
continued fraction. `_^` is RiX's exact radix-shift notation: `1.25_^3` means
`1.25 * 10^3`, not an inexact scientific-number literal.

## Exact interval input forms

A colon constructs an exact closed interval. Decimal brackets provide compact
suffix and last-place-offset forms, including exact repeating endpoints:

```rix edu
intervals := [
    1/3:2/3,
    1.23[56:67],
    1.23[+5:-6],
    1.2[+-1],
    1.2[+-0.1],
    0.[#3:#6]
];
intervals;
```

Unsigned bracket entries append digits. Signed entries are offsets measured in
units of the last visible place; `1.2[+-0.1]` is therefore `1.2 +/- 0.01`.
Intervals are collections of possible values, unlike the uncertain scalars in
the next section.

## Certified finite approximations

Inside a number, `?` marks the end of the certified prefix. Digits or continued
fraction coefficients after it remain useful candidate data, but do not narrow
the authoritative enclosure:

```rix edu
decimal := 23.456?789;
continued := 3.~7~15?;
hexadecimal := 0xA.B?C;
[
    decimal,
    decimal.Candidate(),
    decimal.Enclosure(),
    continued,
    continued.Enclosure(),
    hexadecimal
];
```

`23.456?789` has candidate `23.456789` and certified enclosure
`23.456:23.457`. A bracket may certify a compatible tighter bound, as in
`23.456?789[+-12]`. Derived and provider values use a parseable explicit form
such as `23.556?[=5889/250:23557/1000]` when no honest shared digit prefix
describes the full enclosure.

Arithmetic preserves the uncertain scalar and its exact enclosure. A
comparison produces true, false, or standalone undecided `?`:

```rix edu
x := 23.456?789;
decision := x < 23.4565;
[
    x + 1,
    decision,
    decision
        ?: "certainly less"
        ?_ "certainly not less"
        ?? "certified enclosure overlaps the boundary"
];
```

## Every built-in base prefix

The built-in prefixes are binary `0b`, ternary `0t`, quaternary `0q`, base 5
`0f`, base 7 `0s`, octal `0o`, duodecimal `0d`, hexadecimal `0x`, base 20
`0v`, base 36 `0u`, base 60 `0m`, and base 64 `0y`. `0z[N]` selects a base from
2 through 64 directly:

```rix edu
[
    0b10, 0t10, 0q10, 0f10,
    0s10, 0o10, 0d10, 0x10,
    0v10, 0u10, 0m10, 0y10,
    0z[6]15
];
```

Lowercase prefixes are built in. An uppercase prefix can be registered once
with syntax such as `0A = "0123456789ABCDEF"`. For local conversion without a
global prefix, use a digit-alphabet string or `{: radix, digits }` tuple:

```rix edu
digits := "0123456789ABCDEF";
formatted := 1199/16 _> digits;
[formatted, formatted <_ digits];
```

Prefixed values may be ordinary radix values, fractions, mixed numbers,
continued fractions, or certified prefixes. Uppercase custom prefixes also
support quoted streams such as `0A"4A.F"` when the alphabet contains characters
that would otherwise end a token.

## Exact and display output styles

Receiver methods expose the common base-10 Core representations. `_>` exposes
the formatting modes uniformly and returns a string:

```rix edu
q := -9/4;
[
    q.ToString(),
    q.ToMixedString(),
    q.ToDecimal(),
    q.ToContinuedFraction(),
    q.ToContinuedFractionString(),
    q _> "/",
    q _> "..",
    q _> ".",
    q _> ".~",
    q _> "~",
    q _> "^"
];
```

The mode aliases are `/` or `fraction`, `..` or `mixed`, `.`/`#`/`repeat`,
`.~` or `cf`, `~` or `cf_explicit`, and `^`/`_^`/`shifted`. A numeric base or
named/custom base can be paired with a mode. `<_` reverses parseable base
output:

```rix edu
q := 1/3;
binary := q _> (0b, ".");
[
    binary,
    binary <_ 0b,
    q _> (0x, "."),
    q _> (0b, ".."),
    q _> (0b, "/"),
    q _> (0b, ".~"),
    q _> (0b, "^")
];
```

## Limits: display truncation versus certification

A limit appended to radix or shifted mode, such as `.12` or `^12`, may end in
`...`. That is deliberately display-only and does not describe a new numeric
value. Ask for a certified approximation when the limited result must remain
parseable and safe for arithmetic:

```rix edu
[
    (1/97) _> ".12",
    (1/7).ToDecimalApproximation(5),
    (103993/33102).ToContinuedFractionApproximation(3)
];
```

`ToDecimal()` is also a display string when the decimal does not terminate;
use `ToDecimalApproximation(digits)` when omitted digits must carry a guarantee.

## Current Core input boundary

The runnable cells above cover every current RiX number family. Core's
standalone number-only parser additionally accepts leading-dot decimals such as
`.125`, grouped integer digits such as `1_000`, and compressed decimal digit
runs such as `{0~8}`. Those lexical conveniences are not currently RiX source
forms: write `0.125`, use ungrouped integer digits, and expand compressed input
digits in RiX. This difference concerns source spelling, not the exact values
Core can represent.

## Current Core formatting boundary

Most Core number output is available through the methods and `_>` modes above,
but RiX does not yet expose every Core formatter option. The missing surfaces
are scientific `E` strings and period annotations, repeating-decimal
`error`/`null`/`trunc` policies and period metadata, the alternate finite
continued fraction ending in `1`, and the interval-specific repeating,
relative, midpoint-relative, and compact decimal strings. `_^` shifted output
is exact and useful, but it is not identical to Core's scientific formatter.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Number notation practice
Create one exact repeating decimal and one certified decimal prefix. Compare
each with a nearby rational, then handle the certified comparison's undecided
case explicitly.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
