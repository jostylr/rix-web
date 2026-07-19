---
number: 9b
title: Assertions and symbolic specs
description: Constraints and symbolic construction.
---

## Orientation

Assertions state conditions that must hold; symbolic specs preserve expression
structure for later composition and exact calculus. Keep assertions small and
diagnostic, and keep symbolic construction separate from numerical evaluation.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

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
`p` as an explicit solved output. These are first-class symbolic values; their
bodies do not assign runtime variables.

Calling a spec substitutes positionally and still returns a spec:

```rix edu
G := {#t# t^2 - 4 };
G({#x}) ;
```

Continue to **Exact symbolic calculus** for arithmetic, `.Poly`, `.Deriv`,
`.Integrate`, `.Transform`, and pure-function specs.

## Read the result

Solver-style assertions and symbolic construction are separate ideas. A spec
records a definite expression transformation; it does not ask RiX to solve an
equation.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Assertions and symbolic specs practice
Write a comparison that should pass, then change it to one that should fail and inspect the diagnostic.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
