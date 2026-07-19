---
number: 13a
title: Core operations
description: Use public PascalCase calls alongside expression syntax.
---

## Public names for expression operations

The core exposes public PascalCase calls for the operations that RiX syntax
lowers to. These calls are not intended to replace readable notation in every
day code. They provide a stable, inspectable surface when a program needs to
construct or name an operation directly.

```rix edu
{; sum = .Add(2, 3); product = .Mul(sum, 4); .Sub(product, 1) } ;
```

The same pattern covers comparison and common numeric forms. Here, `|x|` and
`.Abs(x)` are equivalent routes to absolute value; the explicit form is handy
inside code that is itself describing another RiX expression.

```rix edu
{; magnitude = .Abs(-7); .Greater(magnitude, 5) } ;
```

## Containers also have core forms

Core forms are not limited to arithmetic. Explicit constructor names make the
structure visible when literals would be inconvenient to generate.

```rix edu
.Tuple(.Add(1, 2), .Min(8, 3, 5), .Interval(1, 2)) ;
```

`Min`, `Max`, `Abs`, collection constructors, comparisons, set operations,
pipes, and control forms follow the same idea: syntax and the public core name
share the same evaluator implementation.

## Use the smallest clear spelling

Prefer ordinary syntax when it expresses the thought directly:

```text
width * height
| error |
{= total = 5 }
```

Use a core call when the operation itself is the subject, when a generated
program needs an unambiguous name, or when deliberately taking the
syntax-independent route:

```text
.Mul(width, height)
.Abs(error)
.Map(.Pair(:total, 5))
```

The distinction is surface spelling, not a difference in exact arithmetic or
type behavior.

:::challenge Translate an expression
Write `.Max` and `.Min` calls that reproduce `{>> 8, 3, 5 }` and `{<< 8, 3, 5 }`.
:::

## Next

The next page moves beyond eager arithmetic. Assignment targets, map entries,
and lambda bodies need structural information, so their public core forms are
intentionally lazy in selected positions.
