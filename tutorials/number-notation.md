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
    1_000,
    .125,
    0.{0~7}1,
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

RiX deliberately does not accept `E`/`e` exponent input. Use `_^`. Underscores
group digits without changing the value, and `{digits~count}` compresses a long
run, so `0.{0~7}1` is exactly `0.00000001`.

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

## Halo neighborhoods

A halo requests bounded refinement around an exact comparison target. It does
not enlarge that target or define approximate equality:

```rix edu
x := 0.549?;
[
    x < {~ 0.55, 0.001 },
    0.551? ? {~ 0.55:0.56, 0.001 },
    0.5495 ? {~ 0.55:0.56, 0.001 },
    x ? {~ 0.55:0.56, 0.001 }
];
```

Membership is true when `x`'s enclosure fits in the target interval, false
when disjoint, and `?` only for overlap. The disjoint `0.5495` example is false
even though it lies within epsilon of the interval. Optional limits are a map:
`{~ target, epsilon, {= timeout=2, memory=64_000_000, maxWork=5000 } }`.
Requester and provider limits combine by taking the more restrictive bound.

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

The first result is `24.456?789`: candidate digits participate in arithmetic
and remain visible when that spelling reconstructs exactly the derived
enclosure. When it cannot, RiX uses `candidate?[=low:high]`; the `=` labels the
following interval as authoritative and is not an arithmetic operation.

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

`.~` is the ordinary continued-fraction spelling; `~` adds an explicit leading
marker for contexts where the start could be ambiguous.

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

## Session input and display settings

The compact `*>` directive selects one or more presentation views. Commas mean
“show all of these,” not “choose one”:

```rix edu
*> ".[12],b,..";
7/4;
```

That displays a decimal with at most twelve fractional places, binary, and a
mixed fraction. The exact Rational underneath those views is still `7/4`.

`<*` selects the base of strict `#` input. Ordinary literals stay decimal, so a
script can be explicit about which notation it is using and can change that
notation midway through:

```rix edu
<* "b";
five := #101;
decimal_one_hundred_one := 101;
<* "x";
hexadecimal := #face;
{: five, decimal_one_hundred_one, hexadecimal };
```

The long equivalents are `.Config.NumInput("b")` and
`.Config.NumDisplay(".[12],b,..")`. `.Config.Number` accepts both in a map.
RatCalc's **Numbers** panel controls the same session values and can optionally
remember them in this browser.

## Strict `#` forms and exact reinsertion

The tokenizer treats each strict numeral as one unit. A repeat marker is an
internal second `#`; mixed and continued-fraction modes propagate the initial
base marker through their components:

```rix edu
<* "b";
values := [
    #101,
    #101.1#10,
    #101..11/1100,
    #101.~11~10,
    #~-1.~10,
    #101 / #10
];
values;
```

Space or an operator ends an ordinary strict literal. A dot remains part of the
literal, which makes a possibly ambiguous method spelling fail. Write
`(#101).ToString()`, not `#101.ToString()`.

The last fraction is an ordinary division expression, so each operand needs
its own `#`; `#101/10` intentionally mixes active-base and decimal operands and
receives a lint warning. The same warning catches redundant or partial inner
markers such as `#101..#11/1110`.

Presentation is not serialization. `_>!` asks for lossless, parseable RiX
source and fails when that guarantee cannot be met:

```rix edu
source := (7/4) _>! 0b;
recreated := @@source;
{: source, recreated };
```

RatCalc follows the same rule when you click an output to put it back into the
input: a displayed `0.142…` injects the exact `1/7`.

## Generalized positional systems

Custom definitions use `{: radix, digits, offset }`. The offset is the value
of the first digit, so the same codec covers balanced, negative-radix, and
bijective writing systems:

```rix edu
0T = {: 3, "T01", -1 };
0N = {: -2, "01", 0 };
0K = {: 26, "ABCDEFGHIJKLMNOPQRSTUVWXYZ", 1 };

<* "T";
balanced := #1T;
<* "N";
negabinary := #1111;
<* "K";
bijective := #AA;

{: balanced, negabinary, bijective, (5/2) _> (0T, "/") };
```

The values are `2`, `-5`, and `27`; the last item is a balanced-ternary
fraction string. Generalized systems support integer components, fractions,
and mixed fractions. Conventional radix points and repeating-place expansions
are intentionally rejected for these systems until a system-specific
fractional-place rule is supplied.

Operator characters can be digits too, but their input must be quoted so the
token boundary is unambiguous:

```rix edu
0P = {: 2, "0+", 0 };
<* "P";
value := #`++`;
mixed := #`++`..#`+`/#`+0`;
continued := #`++`.~#`+0`;
source := (3/2) _>! 0P;
{: value, mixed, continued, source, @@source };
```

Here `#` selects the active `P` system and the backticks make `++` one digit
stream, whose value is three. Each mixed-number or continued-fraction
component is isolated because punctuation digits could otherwise hide the
structural separators. Exact output adds quoted `0P` prefixes to both fraction
components, so evaluating `source` recreates `3/2`.

## Limits: display truncation versus certification

A limit appended to radix or shifted mode, such as `.12` or `^12`, may end in
`...`. That is deliberately display-only and does not describe a new numeric
value. Ask for a certified approximation when the limited result must remain
parseable and safe for arithmetic:

```rix edu
[
    (1/97) _> ".12",
    (1/7).ToDecimalApproximation({= fractionalDigits=5 }),
    (103993/33102).ToContinuedFractionApproximation({= maxTerms=3 }),
    (1/97) ~> ".12",
    (103993/33102) ~> ".~3"
];
```

`ToDecimal()` is also a display string when the decimal does not terminate;
use `ToDecimalApproximation` or certified-conversion operator `~>` when omitted
digits must carry a guarantee. Unlike `_>`, `~>` returns a numeric exact value
or `CertifiedApproximation`, never a mere display string.

## Receiver option maps and locale display

Complicated formatting options use maps. `long=1` chooses the alternate finite
continued fraction ending in `1`. Locale is display-only—RiX source remains
locale-independent:

```rix edu
q := 3/2;
interval := 1.2356:1.2367;
[
    q.ToContinuedFractionString({= long=1 }),
    (1234567/100).ToLocaleString({= decimal=",", group=".", groupSize=3 }),
    (1/97).ToRepeatingDecimal({= limit=12, onLimit=:trunc }),
    (1/97).ToRepeatingDecimalInfo({= limit=12, onLimit=:trunc }),
    interval.ToRepeatingDecimal(),
    interval.ToCompactDecimal(),
    interval.ToRelativeMidDecimal(),
    interval.ToRelativeDecimal()
];
```

All Core exact, repeating-period, continued-fraction, and interval display
families now have RiX receiver methods. Core's `E` scientific string is the one
intentional exception: RiX uses `_>` mode `"_^"` because `E` notation is not a
RiX number syntax. `_>` covers the common parseable styles; receiver maps cover
period metadata, alternate continued fractions, interval spellings, and locale.

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
