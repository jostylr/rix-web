---
title: Core mathematical expressions
---

## Expressions without a plugin

Expression construction is part of RiX. Calculus and CAS supply algorithms
over the expression; they are not needed to construct it.

```rix edu
x := .ExpressionVariable(:x);
expression := x^2 + 3*x + 1;
{: .IsExpression(expression), expression.Kind(), x.Record()[:name] };
```

Exact scalar operands become constant nodes when combined with expressions.
Ordinary numerical arithmetic remains numerical.

```rix edu
{: 2+3, .ExpressionConstant(5).Kind() };
```

## Algorithms remain plugins

```rix edu
.Plugin.Load("cas");
t := .ExpressionVariable(:t);
integral := .cas.Integrate(t^2,:t);
.cas.CheckIntegral(integral)[:accepted];
```

The constructors do not automatically simplify, integrate, or approximate.
Scoped symbol notation and mathematical-context blocks are subsequent stages
of this work; the examples here use the implemented core constructor surface.

:::challenge Build and inspect
Construct `(x+1)^3` without loading a plugin, then inspect its operands.
:::
