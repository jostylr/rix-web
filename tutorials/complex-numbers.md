---
number: 8e
title: Exact complex numbers
description: Divide by i, conjugate exact expressions, and inspect real and imaginary parts.
---

## Construct complex values

The canonical imaginary generator is available from `.Exact` and `.Complex`:

```rix
z := 3 + 4~{i};
w := .Complex.FromParts(1, -2);
{: z, w }
```

Complex numbers are exact expressions in `i`, whose relation is `i^2 + 1 = 0`.

## Division by complex expressions

Division uses algebraic inversion rather than floating approximation:

```rix
inverseI := 1 / .Exact[:i];
quotient := (1 + .Exact[:i]) / (1 - .Exact[:i]);
{: inverseI, quotient }
```

The results are `-i` and `i`.

## Conjugation

Use the namespace operation or the receiver method:

```rix
z := 3 + 4~{i};
byNamespace := .Complex.Conjugate(z);
byMethod := z.Conjugate();
{: byNamespace, byMethod }
```

Conjugating twice returns the original exact value.

## Real and imaginary parts

`Re` and `Im` preserve exact coefficients, including other real generators:

```rix
z := .Exact[:pi] + .Exact[:sqrt2] * .Exact[:i];
{: .Complex.Re(z), .Complex.Im(z) }
```

The result is `(pi, sqrt2)`, still exact.

## Norm squared

Magnitude would require a square root. `NormSquared` avoids that decision:

```rix
z := 3 + 4~{i};
{: z.NormSquared(), .Complex.NormSquared(z) }
```

Both entries are exactly `25`. The next lesson introduces an exact magnitude
through Cayley polar form. `Arg` remains deferred until RiX's real-number and
trigonometric policies are ready.

:::challenge Complex arithmetic practice
Divide `3 + 4i` by `1 - i`, then verify the result by multiplying it by `1 - i`.
:::

## Current boundary

RiX supports division in a single registered algebraic extension. A denominator
mixing independent generators, or a multi-term transcendental denominator such
as `1 + pi`, is not automatically inverted.
