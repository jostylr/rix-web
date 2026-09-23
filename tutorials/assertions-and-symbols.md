---
number: 9b
title: Assertions and symbolic specs
description: Constraints and symbolic construction.
---

## Orientation

Assertions state conditions that must hold now; symbolic specs preserve
definitions and constraints for a later consumer. Keep runtime assertions
small and diagnostic, and use `{#}` when a plugin should interpret a system.

Start with one small relation, then inspect how the symbolic form differs from evaluating a numeric expression.

## Assertions

```rix edu
3 < 5 ;
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

Assertion operators such as `:<:` abort when their relation does not hold:

```rix edu
3 :<: 5 ;
```

## Three useful spec forms

```rix edu
{: {#x}, {#x# x^2 + 1 }, {#x:p# p = x^2 + 1 } } ;
```

`{#x}` is the identity symbol used for explicit substitution and variable
selection. `{#x# expression }` implies a single output. The named form keeps
`p` as an explicit defined output. These are first-class symbolic values; their
bodies do not assign runtime variables.

A system may use relations instead of a solved output:

```rix edu
S := {#x:y# y^2 == x; y >= 0 };
{: S, .InspectSpec(S), .SpecRoles(S) } ;
```

The constraints are not tested or solved when `S` is created. A plugin may use
all symbols, or use attached/overridden input and output roles when direction
matters.

Calling a spec substitutes positionally and still returns a spec:

```rix edu
G := {#t# t^2 - 4 };
G({#x}) ;
```

Continue to **Exact symbolic calculus** for arithmetic, `.Poly`, `.Deriv`,
`.Integrate`, `.Transform`, and pure-function specs.

## Read the result

Runtime assertions and symbolic construction are separate ideas. A spec records
a reusable symbolic description; solving it is explicit plugin functionality.
The former `:=:` solve operator has been removed because it could not express
algorithm, precision, branch, or certification tradeoffs.

Change one relation in the examples and check whether the resulting specification still expresses what you intended.

:::challenge Assertions and symbolic specs practice
Write a comparison that should pass, then change it to one that should fail and inspect the diagnostic.
:::

## Keep going

Continue with [Exact symbolic calculus](symbolic-calculus.html) once the spec forms are familiar.
