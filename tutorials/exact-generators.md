---
number: 8d
title: Exact generators
description: Keep pi and algebraic roots exact, define relations, and combine them with units.
---

## The Exact collection

`.Exact` is an ordinary RiX map containing canonical symbolic generators:

```rix
pi := .Exact[:pi];
sqrt2 := .Exact[:sqrt2];
{: 3*pi, 1 + 2*sqrt2 }
```

The concise form again means lookup and multiplication:

```rix
explicit := 3/2 * .Exact[:pi];
concise := 3/2~{pi};
explicit == concise
```

Unlike a floating approximation, these remain exact expressions.

## Algebraic relations

Algebraic generators carry a monic minimal polynomial. RiX reduces powers by
that relation:

```rix
iSquared := .Exact[:i]^2;
rootSquared := .Exact[:sqrt2]^2;
{: iSquared, rootSquared }
```

The results are exactly `-1` and `2`.

## Exact algebraic division

RiX can invert an expression in one algebraic extension:

```rix
a := 1 / .Exact[:i];
b := 1 / (1 + .Exact[:sqrt2]);
{: a, b }
```

This produces `-i` and `-1 + sqrt2`. A sum involving a transcendental
generator, such as `1 + pi`, is not currently inverted automatically.

## Exact physical magnitudes

Exact expressions can be quantity magnitudes:

```rix
halfTurn := 1/2~{pi}~[rad];
diameter := 2~[m];
halfTurn * diameter
```

The π factor and the physical dimensions remain distinct layers.

## Define an algebraic generator

Polynomial coefficients are listed from constant term upward:

```rix
sqrt3 := .DefineExactGenerator(:sqrt3, [-3, 0, 1]);
Exact := .Exact.Merge({= sqrt3=sqrt3 });
1~{sqrt3}^2
```

:::challenge Exact generator practice
Use `.Exact[:sqrt2]` to simplify `(1 + sqrt2) * (1 - sqrt2)` exactly.
:::

## Next

Complex numbers use the same exact-expression engine. The `.Complex` map adds
conjugation and component operations without introducing approximate trig.
