---
number: 8f
title: Exact Cayley polar form
description: Store complex magnitude and direction exactly without a transcendental angle.
---

## Polar form without an angle

Ordinary polar form stores a magnitude and an angle. RiX's Cayley form instead
stores `Cayley(r, t)`, where `r` is the exact nonnegative magnitude and
`t = tan(theta/2)` is the stereographic half-angle coordinate.

For `1 + i`, both coordinates stay algebraic:

```rix
z := 1 + 1~{i};
c := .Complex.Cayley(z);
{: c, c.Magnitude(), c.Direction() }
```

The result is `Cayley(sqrt2, sqrt2 - 1)`. The positive `sqrt2` generator is
adjoined exactly; no decimal approximation or symbolic angle is introduced.

## Exact conversion in both directions

For Cartesian `x + iy`, RiX computes `r = sqrt(x^2 + y^2)` and
`t = (r - x)/y`. Conversion back uses only field arithmetic:

`x = r(1 - t^2)/(1 + t^2)` and `y = r(2t)/(1 + t^2)`.

```rix
c := .Complex.Cayley(5, 1/2);
z := c.Cartesian();
roundTrip := .Complex.Cayley(z);
{: z, roundTrip }
```

This reconstructs `3 + 4i`, and the round trip returns `Cayley(5, 1/2)`.
The namespace spelling `.Complex.Cartesian(c)` is equivalent to the receiver
method.

## Multiplication is direction composition

If directions are `t1` and `t2`, the product direction is
`(t1 + t2)/(1 - t1*t2)`. This is the tangent half-angle addition law.
Magnitudes simply multiply.

```rix
a := .Complex.Cayley(3 + 4~{i});
b := .Complex.Cayley(1 + 1~{i});
product := a * b;
quotient := a / b;
cube := b^3;
{: product.Cartesian(), quotient.Cartesian(), cube.Cartesian() }
```

Multiplication, division, integer powers, reciprocal, negation, and conjugation
all stay in Cayley coordinates.

If two directions use independent square-root generators and the exact
inverter cannot simplify the Möbius denominator directly, RiX takes an exact
Cartesian bridge and returns the canonical Cayley result. This remains exact:

```rix
a := (5 + 3~{i}).Cayley();
b := 1/2 - 1/2~{i};
product := a * b;
{: product, product.Cartesian() }
```

The result is `Cayley(sqrt17, 4 - sqrt17)` and `4 - i`, with no floating
approximation.

## Addition takes the Cartesian bridge

Complex addition is simplest in Cartesian coordinates. RiX converts exactly,
adds there, and converts the result back. The operator still returns a Cayley
value.

```rix
a := .Complex.Cayley(3 + 4~{i});
b := .Complex.Cayley(1 + 2~{i});
sum := a + b;
difference := a - b;
{: sum, sum.Cartesian(), difference.Cartesian() }
```

## Conjugation and inspection

Conjugation keeps the magnitude and negates the finite direction. Component
methods reconstruct exact values only when requested.

```rix
c := .Complex.Cayley(3 + 4~{i});
{: c.Conjugate(), c.Re(), c.Im(), c.NormSquared(), c.Inverse().Cartesian() }
```

`Direction` is deliberately not called `Arg`: it is `tan(Arg/2)`, not an angle
measured in radians.

## The projective infinity direction

The negative real axis corresponds to `t = Infinity`. This is one projective
direction, not floating-point infinity. RiX branches on it algebraically:

```rix
negative := .Complex.Cayley(-1);
positiveAgain := negative * negative;
rotated := negative * .Complex.Cayley(1 + 1~{i});
{: negative, positiveAgain, rotated.Cartesian() }
```

Here `Infinity` composed with itself gives direction zero, matching
`(-1)(-1) = 1`.

:::challenge Compose exact directions
Create Cayley forms for `1 + i` and `1 - i`. Multiply them and confirm through
`Cartesian()` that the result is the exact real number `2`.

    a := .Complex.Cayley(1 + 1~{i});
    b := .Complex.Cayley(1 - 1~{i});
    (a * b).Cartesian()
:::

## Current boundary

The first implementation adjoins a magnitude root when the Cartesian norm
squared is rational. That covers Gaussian rational values. General
real-algebraic root isolation is future work; RiX reports this boundary instead
of approximating silently.
