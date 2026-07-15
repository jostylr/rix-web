---
number: 9c
title: Exact symbolic calculus
description: Compose, differentiate, integrate, and simplify symbolic specs.
---

## Specs are symbolic functions

RiX symbolic work is exact and structural. It does not choose a floating-point
or real-number approximation. The shortest spec names one symbolic input:

```rix
{: {#x}, {#t# t^2 - 4 }, {#x:p# p = 2*x } }
```

`{#x}` is the identity symbol. `{#t# t^2 - 4 }` has an implied output, while
the longer form explicitly names output `p`. RiX normally displays the compact
source-like form. Use `.InspectSpec` when you want its structural fields.

```rix
.InspectSpec({#x:p# p = x^2 + 1 })
```

## Substitute and compose

Calling a spec performs positional symbolic substitution and returns another
spec. It does not numerically evaluate the expression.

```rix
G := {#t# t^2 - 4 }
{: G({#x}), G({#x# x + 1 }), G(3) }
```

This makes renaming explicit: `G({#x})` replaces `t` with `x`. An expression
spec composes expressions, and an exact number produces a zero-input constant
spec. Compile a single-output spec with `.Poly` when it is time to evaluate.

```rix
P := .Poly({#x# x^2 - 4 })
{: P, P(3) }
```

## Arithmetic keeps names

Arithmetic combines inputs by symbolic name. Different names create a
multi-input result; the same name refers to the same input. Operations preserve
the written form and do not simplify automatically.

```rix
A := {#x# 2*x }
B := {#t# t^2 - 4 }
C := {#x# x + 1 }
{: A*B, A*C, A*1 }
```

Pure exact-arithmetic functions receive attached specs automatically. Arithmetic
between two such functions therefore produces another spec-backed callable.

```rix
F := x -> 2*x
G := t -> t^2 - 4
H := F*G
{: H(2, 3), .Spec(H) }
```

## Differentiate and integrate

Use an identity spec as the variable selector. Named-output specs retain their
header and output name through a transform.

```rix
Source := {#x:p# p = x^3 + 4*x }
Derivative := .Deriv(Source, {#x})
Antiderivative := .Integrate(Derivative, {#x})
{: Source, Derivative, Antiderivative }
```

`.Deriv` and `.Integrate` also accept spec-backed functions and return
executable functions. The quote forms connect to the same exact engine:

```rix
F := x -> x^3
G := x -> 2*x
{: .Deriv(F, {#x})(4), F'(4), 'G(3) }
```

Captured coefficients stay linked to the same cell. A derived function sees a
later in-place update just as its source function does.

```rix
a := 2
F := x -> a*x^2
D := .Deriv(F, {#x})
a ~= 3
{: F(2), D(2) }
```

## Transformations are deliberate

Calculus removes only artifacts required by its rules. Ordinary symbolic
arithmetic preserves what you wrote. `.Transform` returns a new symbolic value;
the original is unchanged. Pass `:expand` to request distributive expansion
in addition to exact constants, identities, and powers.

```rix
A := {#x# x*1 + 0 }
B := {#x# x*(x + 1) }
{: A, .Transform(A), .Transform(B, :expand) }
```

Direction names may be colon-strings or quoted strings and ignore case, so
`:expand`, `"expand"`, and `:Expand` are equivalent. Use `:center` for the
stronger polynomial form: it expands products, collects powers, and combines
exact coefficients.

```rix
P := {#x# (x - 1) * (x + 2) }
{: .Transform(P, :center), .Transform(P, :Center, 3) }
```

The optional exact center writes the complete polynomial in powers of
`(x - center)`; it does not truncate or numerically approximate.

`:decompose` records ordered polynomial divisions by roots or polynomial factors
that you provide. A number `a` denotes `(x - a)`.

```rix
P := {#x# x^4 }
Q := {#x# x^2 + 1 }
{: .Transform(P, :decompose, 4, Q),
   .Transform(P, {: :identities, [:decompose, 4, Q] }) }
```

In a transformation tuple, a bare direction takes no arguments and an array
holds one parameterized operation. Operations run left to right.

`:gadic` repeatedly divides by one polynomial and returns the flattened sum in
powers of that polynomial. `:distribute` expands only a selected factor, unlike
the global `:expand` direction.

```rix
P := {#x# x^4 }
Q := {#x# x^2 + 1 }
G := .Transform(P, :gadic, Q)
H := .Transform(P, :decompose, 5, 5, 5, 5)
{: G, .Transform(H, :distribute, 5), .Transform(H, :center, 5) }
```

The complete list of rewrites and non-rewrites is in the [symbolic transformation
reference](https://jostylr.github.io/rix/design/eval/transformation-reference.html).

## Speccability

Automatic specs intentionally cover a safe pure subset: positional functions
built from exact constants, identifiers, negation, arithmetic, division, and
exact powers. `.Speccability` explains whether a function fits that profile;
`.Spec` attaches and returns the spec when analysis succeeds.

```rix
F := x -> x^2 + 1
G := x -> { x ~= 2; x }
{: .Speccability(F), .Speccability(G), .Spec(F) }
```

The current calculus rules cover exact polynomial and rational differentiation,
and structural polynomial integration. Unsupported forms fail rather than
silently switching to numerical calculus.

:::challenge Compose before differentiating
Create `G := {#t# t^2 - 4 }`, substitute `{#x# x + 1}`, differentiate the
result with respect to `{#x}`, compile it, and evaluate at `x = 2`.
:::
